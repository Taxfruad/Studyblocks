import { BlockList, isIP } from 'node:net'

/** Canvas calendar feeds look like https://<school>/feeds/calendars/user_<token>.ics */
const FEED_PATH = /^\/feeds\/calendars\/[A-Za-z0-9_.-]+\.ics$/

const blocked = new BlockList()
for (const [net, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10], // carrier-grade NAT
  ['127.0.0.0', 8],
  ['169.254.0.0', 16], // link-local, cloud metadata
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['224.0.0.0', 3], // multicast + reserved
] as const) {
  blocked.addSubnet(net, prefix, 'ipv4')
}
for (const [net, prefix] of [
  ['::', 128],
  ['::1', 128],
  ['fc00::', 7], // unique local
  ['fe80::', 10], // link-local
  ['ff00::', 8], // multicast
] as const) {
  blocked.addSubnet(net, prefix, 'ipv6')
}

export function isPrivateAddress(ip: string): boolean {
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(ip)
  if (mapped) return isPrivateAddress(mapped[1])
  const family = isIP(ip)
  if (family === 4) return blocked.check(ip, 'ipv4')
  if (family === 6) return blocked.check(ip, 'ipv6')
  return true // not an IP at all: refuse rather than guess
}

export function hostOf(url: URL): string {
  return url.hostname.replace(/^\[|\]$/g, '')
}

/** Shape check only. DNS is checked separately, right before fetching. */
export function isAllowedFeedUrl(raw: string): boolean {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return false
  }
  if (url.protocol !== 'https:') return false
  if (url.username || url.password) return false
  if (url.port && url.port !== '443') return false
  if (!FEED_PATH.test(url.pathname)) return false
  const host = hostOf(url)
  if (host === 'localhost' || host.endsWith('.localhost')) return false
  if (isIP(host) && isPrivateAddress(host)) return false
  return true
}
