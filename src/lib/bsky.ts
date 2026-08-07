import { AtpAgent, RichText } from '@atproto/api'
import type {
  AtpSessionData,
  AtpSessionEvent,
} from '@atproto/api'
import type { AppBskyFeedDefs } from '@atproto/api'

/**
 * Browser-only Bluesky/atproto client.
 *
 * Privacy model:
 * - This app is a fully static site (GitHub Pages). There is no server.
 * - Handle + app password are typed into the page and sent ONCE, directly
 *   from the browser to the user's own PDS over HTTPS (createSession).
 * - Nothing is ever sent to GitHub, to any third party, or logged anywhere.
 * - The returned session token is kept only in sessionStorage (this tab,
 *   cleared when the tab closes or on sign out). Passwords are never stored.
 */

const SESSION_KEY = 'bsky95.session'

type Stored = { service: string; session: AtpSessionData }

function persist(_evt: AtpSessionEvent, session?: AtpSessionData) {
  if (!session) {
    sessionStorage.removeItem(SESSION_KEY)
    return
  }
  const service = agent?.session ? (agent as unknown as { pdsUrl?: URL }).pdsUrl?.origin : undefined
  const prev = readStored()
  const stored: Stored = { service: service ?? prev?.service ?? 'https://bsky.social', session }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(stored))
}

function readStored(): Stored | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as Stored) : null
  } catch {
    return null
  }
}

let agent: AtpAgent | null = null

function newAgent(service: string): AtpAgent {
  return new AtpAgent({ service, persistSession: persist })
}

/** Resolve a handle -> DID -> PDS endpoint so login works for any PDS, not just bsky.social. */
async function resolvePds(handle: string): Promise<string> {
  try {
    const r = await fetch(
      `https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(handle)}`,
    )
    if (!r.ok) throw new Error('handle lookup failed')
    const { did } = (await r.json()) as { did: string }
    const docRes = await fetch(`https://plc.directory/${encodeURIComponent(did)}`)
    if (!docRes.ok) throw new Error('did lookup failed')
    const doc = (await docRes.json()) as {
      service?: { id: string; serviceEndpoint: string }[]
    }
    const pds = doc.service?.find((s) => s.id === '#atproto_pds')?.serviceEndpoint
    if (pds) return pds
  } catch {
    /* fall through to default */
  }
  return 'https://bsky.social'
}

export async function login(handle: string, appPassword: string, pdsOverride?: string) {
  const service = pdsOverride?.trim() || (await resolvePds(handle.trim()))
  const a = newAgent(service)
  await a.login({ identifier: handle.trim(), password: appPassword })
  agent = a
  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ service, session: a.session! } satisfies Stored),
  )
  return a
}

export async function resume(): Promise<AtpAgent | null> {
  const stored = readStored()
  if (!stored) return null
  try {
    const a = newAgent(stored.service)
    await a.resumeSession(stored.session)
    agent = a
    return a
  } catch {
    sessionStorage.removeItem(SESSION_KEY)
    return null
  }
}

export async function logout() {
  try {
    await agent?.logout()
  } catch {
    /* ignore */
  }
  agent = null
  sessionStorage.removeItem(SESSION_KEY)
}

export function getAgent(): AtpAgent {
  if (!agent) throw new Error('Not signed in')
  return agent
}

export function myHandle(): string {
  return agent?.session?.handle ?? ''
}

/* ---------- feeds ---------- */

export const DISCOVER_FEED =
  'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot'
export const POPULAR_FEED =
  'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/with-friends'

export type FeedPage = { feed: AppBskyFeedDefs.FeedViewPost[]; cursor?: string }

export async function getTimeline(cursor?: string): Promise<FeedPage> {
  const res = await getAgent().getTimeline({ limit: 30, cursor })
  return { feed: res.data.feed, cursor: res.data.cursor }
}

export async function getFeed(feedUri: string, cursor?: string): Promise<FeedPage> {
  const res = await getAgent().app.bsky.feed.getFeed({ feed: feedUri, limit: 30, cursor })
  return { feed: res.data.feed, cursor: res.data.cursor }
}

export async function getPopularFeeds() {
  const res = await getAgent().app.bsky.unspecced.getPopularFeedGenerators({ limit: 30 })
  return res.data.feeds
}

export async function getTrendingTopics() {
  const res = await getAgent().app.bsky.unspecced.getTrendingTopics({ limit: 14 })
  return res.data.topics
}

export async function searchPosts(q: string, cursor?: string): Promise<{ posts: AppBskyFeedDefs.PostView[]; cursor?: string }> {
  const res = await getAgent().app.bsky.feed.searchPosts({ q, limit: 25, cursor })
  return { posts: res.data.posts, cursor: res.data.cursor }
}

export type NotificationsPage = Awaited<ReturnType<AtpAgent['listNotifications']>>['data']

export async function getNotifications(cursor?: string): Promise<NotificationsPage> {
  const res = await getAgent().listNotifications({ limit: 30, cursor })
  return res.data
}

/* ---------- posting & actions ---------- */

export type ReplyRef = {
  root: { uri: string; cid: string }
  parent: { uri: string; cid: string }
}

export async function publishPost(text: string, reply?: ReplyRef | null) {
  const a = getAgent()
  const rt = new RichText({ text })
  await rt.detectFacets(a)
  return a.post({
    text: rt.text,
    facets: rt.facets,
    reply: reply ?? undefined,
    createdAt: new Date().toISOString(),
  })
}

export async function toggleLike(post: AppBskyFeedDefs.PostView): Promise<boolean> {
  const a = getAgent()
  if (post.viewer?.like) {
    await a.deleteLike(post.viewer.like)
    return false
  }
  await a.like(post.uri, post.cid)
  return true
}

export async function toggleRepost(post: AppBskyFeedDefs.PostView): Promise<boolean> {
  const a = getAgent()
  if (post.viewer?.repost) {
    await a.deleteRepost(post.viewer.repost)
    return false
  }
  await a.repost(post.uri, post.cid)
  return true
}

export async function toggleBookmark(post: AppBskyFeedDefs.PostView): Promise<boolean> {
  const a = getAgent()
  const bookmarked = (post.viewer as { bookmarked?: boolean } | undefined)?.bookmarked
  if (bookmarked) {
    await a.app.bsky.bookmark.deleteBookmark({ uri: post.uri })
    return false
  }
  await a.app.bsky.bookmark.createBookmark({ uri: post.uri, cid: post.cid })
  return true
}

export function postUrl(post: AppBskyFeedDefs.PostView): string {
  const rkey = post.uri.split('/').pop()
  return `https://bsky.app/profile/${post.author.handle}/post/${rkey}`
}

export function replyRefFrom(item: AppBskyFeedDefs.FeedViewPost): ReplyRef {
  const parent = { uri: item.post.uri, cid: item.post.cid }
  const root = (item.reply?.root as { uri?: string; cid?: string } | undefined)
  return {
    root: root?.uri && root?.cid ? { uri: root.uri, cid: root.cid } : parent,
    parent,
  }
}

export function relTime(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d`
  return new Date(iso).toLocaleDateString()
}
