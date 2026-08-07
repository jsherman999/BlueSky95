import { useCallback, useEffect, useState } from 'react'
import type { AppBskyFeedDefs, AppBskyUnspeccedGetTrendingTopics } from '@atproto/api'
import {
  DISCOVER_FEED,
  POPULAR_FEED,
  getFeed,
  getNotifications,
  getPopularFeeds,
  getTimeline,
  getTrendingTopics,
  publishPost,
  relTime,
  searchPosts,
} from '../lib/bsky'
import type { FeedPage, NotificationsPage, ReplyRef } from '../lib/bsky'
import PostCard from '../components/PostCard'

type OnReply = (ref: ReplyRef) => void

/* ---------- generic paged feed ---------- */

function FeedView({ load, onReply }: { load: (cursor?: string) => Promise<FeedPage>; onReply: OnReply }) {
  const [items, setItems] = useState<AppBskyFeedDefs.FeedViewPost[]>([])
  const [cursor, setCursor] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadMore = useCallback(
    async (c?: string) => {
      setLoading(true)
      setError('')
      try {
        const page = await load(c)
        setItems((prev) => (c ? [...prev, ...page.feed] : page.feed))
        setCursor(page.cursor)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load feed')
      } finally {
        setLoading(false)
      }
    },
    [load],
  )

  useEffect(() => {
    loadMore()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      {items.map((item, i) => (
        <PostCard key={`${item.post.uri}-${i}`} item={item} onReply={onReply} />
      ))}
      {loading && <div className="msg95">⏳ Loading…</div>}
      {error && <div className="err95">{error}</div>}
      {!loading && !error && items.length === 0 && <div className="msg95">Nothing here yet.</div>}
      {!loading && cursor && (
        <div className="msg95">
          <button className="btn95" onClick={() => loadMore(cursor)}>
            ▼ Load more
          </button>
        </div>
      )}
    </div>
  )
}

export const TimelineView = ({ onReply }: { onReply: OnReply }) => (
  <FeedView load={(c) => getTimeline(c)} onReply={onReply} />
)
export const DiscoverView = ({ onReply }: { onReply: OnReply }) => (
  <FeedView load={(c) => getFeed(DISCOVER_FEED, c)} onReply={onReply} />
)
export const PopularView = ({ onReply }: { onReply: OnReply }) => (
  <FeedView load={(c) => getFeed(POPULAR_FEED, c)} onReply={onReply} />
)
export const CustomFeedView = ({ uri, onReply }: { uri: string; onReply: OnReply }) => (
  <FeedView load={(c) => getFeed(uri, c)} onReply={onReply} />
)

/* ---------- search ---------- */

export function SearchView({ initialQuery, onReply }: { initialQuery?: string; onReply: OnReply }) {
  const [q, setQ] = useState(initialQuery ?? '')
  const [posts, setPosts] = useState<AppBskyFeedDefs.PostView[]>([])
  const [cursor, setCursor] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  async function run(c?: string, query = q) {
    if (!query.trim()) return
    setLoading(true)
    setError('')
    try {
      const page = await searchPosts(query.trim(), c)
      setPosts((prev) => (c ? [...prev, ...page.posts] : page.posts))
      setCursor(page.cursor)
      setSearched(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialQuery) run(undefined, initialQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      <form
        className="panel95-toolbar"
        onSubmit={(e) => {
          e.preventDefault()
          run()
        }}
      >
        <input
          className="in95"
          style={{ maxWidth: 320 }}
          placeholder="Search Bluesky…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn95 primary" type="submit" disabled={loading}>
          🔍 Search
        </button>
      </form>
      {loading && <div className="msg95">⏳ Searching…</div>}
      {error && <div className="err95">{error}</div>}
      {searched && !loading && posts.length === 0 && <div className="msg95">No results.</div>}
      {posts.map((p) => (
        <PostCard key={p.uri} item={{ post: p } as AppBskyFeedDefs.FeedViewPost} onReply={onReply} />
      ))}
      {!loading && cursor && posts.length > 0 && (
        <div className="msg95">
          <button className="btn95" onClick={() => run(cursor)}>
            ▼ Load more
          </button>
        </div>
      )}
    </div>
  )
}

/* ---------- custom feeds ---------- */

export function FeedsView({ onOpen }: { onOpen: (uri: string, name: string) => void }) {
  const [feeds, setFeeds] = useState<AppBskyFeedDefs.GeneratorView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getPopularFeeds()
      .then(setFeeds)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load feeds'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="list95">
      {loading && <div className="msg95">⏳ Loading feed generators…</div>}
      {error && <div className="err95">{error}</div>}
      {feeds.map((f) => (
        <div className="item95" key={f.uri}>
          <div className="grow">
            <div className="title">{f.displayName}</div>
            <div className="sub">by @{f.creator.handle} · ❤️ {f.likeCount ?? 0}</div>
          </div>
          <button className="btn95" onClick={() => onOpen(f.uri, f.displayName)}>
            Open ▶
          </button>
        </div>
      ))}
    </div>
  )
}

/* ---------- trending ---------- */

export function TrendingView({ onSearch }: { onSearch: (topic: string) => void }) {
  const [topics, setTopics] = useState<AppBskyUnspeccedGetTrendingTopics.OutputSchema['topics']>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getTrendingTopics()
      .then(setTopics)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load trends'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="list95">
      {loading && <div className="msg95">⏳ Loading trends…</div>}
      {error && <div className="err95">{error}</div>}
      {topics.map((t, i) => (
        <div className="item95" key={t.topic}>
          <div style={{ fontWeight: 800, fontSize: 18, width: 28, textAlign: 'center' }}>{i + 1}</div>
          <div className="grow">
            <div className="title">{t.topic}</div>
            <div className="sub">{t.displayName ?? t.link ?? ''}</div>
          </div>
          <button className="btn95" onClick={() => onSearch(t.topic)}>
            🔍 Search
          </button>
        </div>
      ))}
    </div>
  )
}

/* ---------- notifications ---------- */

const NOTIF_ICON: Record<string, string> = {
  like: '❤️',
  repost: '🔁',
  follow: '➕',
  mention: '💬',
  reply: '💬',
  quote: '🔁',
  starterpackjoined: '📦',
}

export function NotificationsView({ mentionsOnly }: { mentionsOnly: boolean }) {
  const [page, setPage] = useState<NotificationsPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(
    async (cursor?: string) => {
      setLoading(true)
      setError('')
      try {
        const p = await getNotifications(cursor)
        setPage((prev) =>
          cursor && prev
            ? { ...p, notifications: [...prev.notifications, ...p.notifications] }
            : p,
        )
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load notifications')
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    load()
  }, [load])

  const filtered = (page?.notifications ?? []).filter((n) =>
    mentionsOnly ? ['mention', 'reply', 'quote'].includes(n.reason) : true,
  )

  return (
    <div className="list95">
      {loading && !page && <div className="msg95">⏳ Loading notifications…</div>}
      {error && <div className="err95">{error}</div>}
      {!loading && filtered.length === 0 && <div className="msg95">No notifications.</div>}
      {filtered.map((n, i) => (
        <div className="item95" key={`${n.uri}-${i}`}>
          <div className="notif95">
            <span className="notif-icon">{NOTIF_ICON[n.reason] ?? '🔔'}</span>
            <div className="grow">
              <span className="title">{n.author.displayName ?? n.author.handle}</span>{' '}
              <span className="sub">
                @{n.author.handle} · {n.reason} · {relTime(n.indexedAt)}
              </span>
              {n.reason !== 'follow' && (
                <div className="sub" style={{ whiteSpace: 'normal' }}>
                  {(n.record as { text?: string }).text ?? ''}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      {!loading && page?.cursor && (
        <div className="msg95">
          <button className="btn95" onClick={() => load(page.cursor)}>
            ▼ Load more
          </button>
        </div>
      )}
    </div>
  )
}

/* ---------- composer ---------- */

export function Composer({
  replyTo,
  onDone,
  onCancel,
}: {
  replyTo: ReplyRef | null
  onDone: () => void
  onCancel?: () => void
}) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const max = 300

  async function send() {
    if (!text.trim() || busy) return
    setBusy(true)
    setError('')
    try {
      await publishPost(text.trim(), replyTo)
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Post failed')
      setBusy(false)
    }
  }

  return (
    <div>
      {replyTo && (
        <div className="note95">
          Replying to <code>{replyTo.parent.uri.split('/').pop()}</code>
          {onCancel && (
            <button className="btn95" style={{ marginLeft: 10 }} onClick={onCancel}>
              ✕ Cancel reply
            </button>
          )}
        </div>
      )}
      <textarea
        className="in95"
        rows={5}
        placeholder={replyTo ? 'Write your reply…' : "What's up?"}
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, max))}
      />
      <div className="panel95-toolbar" style={{ marginTop: 10 }}>
        <span style={{ fontSize: 12, color: '#4d4a44' }}>
          {text.length} / {max}
        </span>
        <span className="spacer" />
        <button className="btn95 primary" disabled={busy || !text.trim()} onClick={send}>
          {busy ? '⏳ Posting…' : replyTo ? '📮 Reply' : '📮 Post'}
        </button>
      </div>
      {error && <div className="err95">{error}</div>}
    </div>
  )
}
