import { db, type Feed, type StudyBlocksDB } from '../db/db'
import { importFeed, type ImportResult } from '../db/importFeed'
import { parseIcs } from './parseIcs'
import { buildSampleIcs } from './sample'

export const SAMPLE_FEED_ID = 'sample'

/** Small stable hash so the same link or file name maps to the same feed. */
function hash(text: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36)
}

export function feedIdForUrl(url: string): string {
  return `url-${hash(url.trim())}`
}

function labelForUrl(url: string): string {
  try {
    return `Canvas · ${new URL(url).hostname}`
  } catch {
    return 'Canvas calendar'
  }
}

/** Parses first, so a bad file or response never touches saved data. */
async function importText(feed: Feed, text: string): Promise<ImportResult> {
  const parsed = parseIcs(text)
  const result = await importFeed(db, feed.id, parsed)
  await db.feeds.put({ ...feed, lastSyncedAt: new Date().toISOString(), lastError: undefined })
  return result
}

async function recordError(feedId: string, err: unknown) {
  const message = err instanceof Error ? err.message : String(err)
  await db.feeds.update(feedId, { lastError: message })
}

export async function syncFeedFromUrl(url: string, label?: string): Promise<ImportResult> {
  const trimmed = url.trim().replace(/^webcal:\/\//i, 'https://')
  const id = feedIdForUrl(trimmed)
  const existing = await db.feeds.get(id)
  try {
    const res = await fetch(`/api/feed?url=${encodeURIComponent(trimmed)}`)
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      throw new Error(body?.error ?? `The feed helper answered with ${res.status}.`)
    }
    const text = await res.text()
    return await importText(
      { id, url: trimmed, label: existing?.label ?? label ?? labelForUrl(trimmed) },
      text,
    )
  } catch (err) {
    if (existing) await recordError(id, err)
    if (err instanceof TypeError) {
      throw new Error("Couldn't reach the feed helper. Is `npm run dev` running?")
    }
    throw err
  }
}

export async function importFile(file: File): Promise<ImportResult> {
  const id = `file-${hash(file.name)}`
  const text = await file.text()
  return importText({ id, label: file.name }, text)
}

export async function loadSample(): Promise<ImportResult> {
  return importText({ id: SAMPLE_FEED_ID, label: 'Sample data' }, buildSampleIcs(new Date()))
}

export async function resyncFeed(feed: Feed): Promise<ImportResult> {
  if (feed.id === SAMPLE_FEED_ID) return loadSample()
  if (!feed.url) throw new Error('Uploaded files can’t re-sync. Upload the new file instead.')
  return syncFeedFromUrl(feed.url)
}

/** Removes a feed, its items and their study blocks, and any course that no longer has items. */
export async function removeFeed(feedId: string, database: StudyBlocksDB = db): Promise<void> {
  const d = database
  await d.transaction('rw', [d.feeds, d.items, d.courses, d.studyBlocks], async () => {
    const itemIds = await d.items.where('feedId').equals(feedId).primaryKeys()
    await d.studyBlocks.where('itemId').anyOf(itemIds).delete()
    await d.items.bulkDelete(itemIds)
    await d.feeds.delete(feedId)
    const used = new Set((await d.items.toArray()).map((i) => i.courseId))
    const unused = (await d.courses.toArray()).filter((c) => !used.has(c.id)).map((c) => c.id)
    await d.courses.bulkDelete(unused)
  })
}
