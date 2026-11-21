import { describe, expect, it } from 'vitest'
import { isAllowedFeedUrl, isPrivateAddress } from './validate'

describe('isAllowedFeedUrl', () => {
  it.each([
    'https://canvas.school.edu/feeds/calendars/user_abc123.ics',
    'https://school.instructure.com/feeds/calendars/user_XyZ.ics',
  ])('allows %s', (url) => {
    expect(isAllowedFeedUrl(url)).toBe(true)
  })

  it.each([
    ['plain http', 'http://canvas.school.edu/feeds/calendars/user_abc.ics'],
    ['wrong path', 'https://canvas.school.edu/api/v1/users/self'],
    ['nested path', 'https://canvas.school.edu/feeds/calendars/a/b.ics'],
    ['localhost', 'https://localhost/feeds/calendars/x.ics'],
    ['private IP literal', 'https://10.0.0.5/feeds/calendars/x.ics'],
    ['IPv6 loopback', 'https://[::1]/feeds/calendars/x.ics'],
    ['credentials', 'https://user:pw@canvas.school.edu/feeds/calendars/x.ics'],
    ['odd port', 'https://canvas.school.edu:8443/feeds/calendars/x.ics'],
    ['not a url', 'hello'],
  ])('rejects %s', (_label, url) => {
    expect(isAllowedFeedUrl(url)).toBe(false)
  })
})

describe('isPrivateAddress', () => {
  it.each([
    '127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1',
    '169.254.169.254', '0.0.0.0', '100.64.0.1', '::1', '::', 'fe80::1', 'fd00::1', '::ffff:10.0.0.1',
  ])('%s is private', (ip) => {
    expect(isPrivateAddress(ip)).toBe(true)
  })

  it.each(['8.8.8.8', '172.32.0.1', '151.101.1.1', '2606:4700::1111'])('%s is public', (ip) => {
    expect(isPrivateAddress(ip)).toBe(false)
  })
})
