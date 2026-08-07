import { useEffect, useState } from 'react'
import './App.css'
import Desktop from './components/Desktop'
import Login from './components/Login'
import { logout, myHandle, resume } from './lib/bsky'
import type { ReplyRef } from './lib/bsky'
import type { ViewId } from './types/view'
import {
  Composer,
  CustomFeedView,
  DiscoverView,
  FeedsView,
  NotificationsView,
  PopularView,
  SearchView,
  TimelineView,
  TrendingView,
} from './views/Views'

const VIEW_TITLES: Record<ViewId, string> = {
  home: 'Home Feed',
  search: 'Search Bluesky',
  following: 'Following Feed',
  discover: 'Discover Posts',
  feeds: 'Custom Feeds',
  feed: 'Feed',
  newpost: 'New Post',
  trending: 'Trending Topics',
  popular: 'Popular Posts',
  'notif-all': 'Notifications — All',
  'notif-mentions': 'Notifications — Mentions',
}

export default function App() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [view, setView] = useState<ViewId | null>(null)
  const [feedUri, setFeedUri] = useState('')
  const [feedName, setFeedName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchNonce, setSearchNonce] = useState(0)
  const [replyTo, setReplyTo] = useState<ReplyRef | null>(null)
  const [status, setStatus] = useState('')
  const [refreshNonce, setRefreshNonce] = useState(0)
  const [minimized, setMinimized] = useState(false)
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    resume().then((a) => setAuthed(!!a))
  }, [])

  function open(v: ViewId) {
    setReplyTo(null)
    setStatus('')
    setView(v)
  }

  function handleReply(ref: ReplyRef) {
    setReplyTo(ref)
    setView('newpost')
  }

  async function signOut() {
    await logout()
    setAuthed(false)
    setView(null)
  }

  const title =
    authed && view
      ? `Bluesky Social — ${view === 'feed' ? feedName : VIEW_TITLES[view]}`
      : 'Bluesky Social'

  return (
    <div className="app95">
      <div className={`win95 ${maximized ? 'maximized' : ''}`}>
        <div className="win95-titlebar">
          <span className="butterfly">🦋</span>
          <span>{title}</span>
          <span className="spacer" />
          <button
            className="tbtn"
            title={minimized ? 'Restore' : 'Minimize'}
            onClick={() => setMinimized((m) => !m)}
          >
            ─
          </button>
          <button
            className="tbtn"
            title="Maximize"
            onClick={() => setMaximized((m) => !m)}
          >
            □
          </button>
          <button
            className="tbtn close"
            title={authed ? 'Sign out' : 'Close'}
            onClick={() => (authed ? signOut() : setMinimized(true))}
          >
            ✕
          </button>
        </div>

        {!minimized && (
          <div className="win95-body">
            {authed === null && <div className="msg95">⏳ Restoring session…</div>}

            {authed === false && <Login onSuccess={() => setAuthed(true)} />}

            {authed && view === null && <Desktop onOpen={open} />}

            {authed && view !== null && (
              <div className="panel95">
                <div className="panel95-toolbar">
                  <button className="btn95" onClick={() => setView(null)}>
                    ◀ Back to Desktop
                  </button>
                  <h3>• {view === 'feed' ? feedName : VIEW_TITLES[view]}</h3>
                  <span className="spacer" />
                  <button className="btn95" onClick={() => setRefreshNonce((n) => n + 1)}>
                    ↻ Refresh
                  </button>
                </div>

                <div key={`${view}-${refreshNonce}`}>
                {view === 'home' && <TimelineView onReply={handleReply} />}
                {view === 'following' && <TimelineView onReply={handleReply} />}
                {view === 'discover' && <DiscoverView onReply={handleReply} />}
                {view === 'popular' && <PopularView onReply={handleReply} />}
                {view === 'feed' && <CustomFeedView uri={feedUri} onReply={handleReply} />}
                {view === 'search' && (
                  <SearchView key={searchNonce} initialQuery={searchQuery} onReply={handleReply} />
                )}
                {view === 'feeds' && (
                  <FeedsView
                    onOpen={(uri, name) => {
                      setFeedUri(uri)
                      setFeedName(name)
                      setView('feed')
                    }}
                  />
                )}
                {view === 'trending' && (
                  <TrendingView
                    onSearch={(topic) => {
                      setSearchQuery(topic)
                      setSearchNonce((n) => n + 1)
                      setView('search')
                    }}
                  />
                )}
                {view === 'notif-all' && <NotificationsView mentionsOnly={false} />}
                {view === 'notif-mentions' && <NotificationsView mentionsOnly />}
                {view === 'newpost' && (
                  <Composer
                    replyTo={replyTo}
                    onCancel={() => setReplyTo(null)}
                    onDone={() => {
                      setReplyTo(null)
                      setStatus('✅ Posted!')
                      setView(null)
                    }}
                  />
                )}
                </div>
              </div>
            )}

            {authed && (
              <div className="statusbar95">
                <span>👤 @{myHandle()}</span>
                <span className="grow">{status}</span>
                <span>🔒 session in this tab only</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
