import { useState } from 'react'
import type { AppBskyFeedDefs } from '@atproto/api'
import {
  postUrl,
  relTime,
  replyRefFrom,
  toggleBookmark,
  toggleLike,
  toggleRepost,
} from '../lib/bsky'
import type { ReplyRef } from '../lib/bsky'

type Props = {
  item: AppBskyFeedDefs.FeedViewPost
  onReply: (ref: ReplyRef) => void
}

export default function PostCard({ item, onReply }: Props) {
  const post = item.post
  const [liked, setLiked] = useState(!!post.viewer?.like)
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0)
  const [reposted, setReposted] = useState(!!post.viewer?.repost)
  const [repostCount, setRepostCount] = useState(post.repostCount ?? 0)
  const [saved, setSaved] = useState(
    !!(post.viewer as { bookmarked?: boolean } | undefined)?.bookmarked,
  )
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  async function run(fn: () => Promise<void>) {
    if (busy) return
    setBusy(true)
    try {
      await fn()
    } catch {
      /* demo: ignore action errors */
    } finally {
      setBusy(false)
    }
  }

  const record = post.record as { text?: string }
  const repostedBy =
    item.reason?.$type === 'app.bsky.feed.defs#reasonRepost'
      ? (item.reason as { by?: { displayName?: string; handle: string } }).by
      : undefined

  return (
    <div className="postcard95">
      {repostedBy && (
        <div className="post-reason">🔁 Reposted by {repostedBy.displayName ?? repostedBy.handle}</div>
      )}
      <div className="post-head">
        <span className="post-name">{post.author.displayName ?? post.author.handle}</span>
        <span className="post-handle">@{post.author.handle}</span>
        <span className="post-time">{relTime(post.indexedAt)}</span>
      </div>
      <p className="post-text">{record.text ?? ''}</p>
      <div className="post-actions">
        <button className="btn95" disabled={busy} onClick={() => onReply(replyRefFrom(item))}>
          💬 {post.replyCount ?? 0}
        </button>
        <button
          className={`btn95 ${reposted ? 'on' : ''}`}
          disabled={busy}
          onClick={() =>
            run(async () => {
              const on = await toggleRepost(post)
              setReposted(on)
              setRepostCount((c) => c + (on ? 1 : -1))
            })
          }
        >
          🔁 {repostCount}
        </button>
        <button
          className={`btn95 ${liked ? 'on' : ''}`}
          disabled={busy}
          onClick={() =>
            run(async () => {
              const on = await toggleLike(post)
              setLiked(on)
              setLikeCount((c) => c + (on ? 1 : -1))
            })
          }
        >
          ❤️ {likeCount}
        </button>
        <button
          className={`btn95 ${saved ? 'on' : ''}`}
          disabled={busy}
          title="Save (bookmark)"
          onClick={() =>
            run(async () => {
              const on = await toggleBookmark(post)
              setSaved(on)
            })
          }
        >
          {saved ? '🔖 Saved' : '🔖 Save'}
        </button>
        <button
          className="btn95"
          onClick={() => {
            navigator.clipboard?.writeText(postUrl(post)).catch(() => {})
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          }}
        >
          {copied ? '✅ Copied!' : '🔗 Share'}
        </button>
      </div>
    </div>
  )
}
