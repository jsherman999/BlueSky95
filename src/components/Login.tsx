import { useState } from 'react'
import { login } from '../lib/bsky'

export default function Login({ onSuccess }: { onSuccess: () => void }) {
  const [handle, setHandle] = useState('')
  const [password, setPassword] = useState('')
  const [pds, setPds] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy || !handle.trim() || !password) return
    setBusy(true)
    setError('')
    try {
      await login(handle, password, pds)
      onSuccess()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed'
      setError(
        /unauthorized|invalid|credentials/i.test(msg)
          ? 'Sign-in failed. Check your handle and app password (Settings → App Passwords on bsky.app).'
          : msg,
      )
      setBusy(false)
    }
  }

  return (
    <div className="login95">
      <h1>
        <span style={{ fontStyle: 'normal' }}>•</span> Sign in to Bluesky
      </h1>
      <div className="tagline">
        Enter your handle and an <strong>app password</strong> to start exploring.
      </div>

      <form onSubmit={submit}>
        <div className="field95">
          <label htmlFor="handle">Bluesky handle</label>
          <input
            id="handle"
            className="in95"
            placeholder="you.bsky.social"
            autoComplete="username"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
          />
        </div>
        <div className="field95">
          <label htmlFor="apppw">App password</label>
          <input
            id="apppw"
            className="in95"
            type="password"
            placeholder="xxxx-xxxx-xxxx-xxxx"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="hint">
            Create one at bsky.app → Settings → App Passwords. Safer than your main password.
          </div>
        </div>

        {showAdvanced && (
          <div className="field95">
            <label htmlFor="pds">Custom PDS (optional)</label>
            <input
              id="pds"
              className="in95"
              placeholder="https://bsky.social"
              value={pds}
              onChange={(e) => setPds(e.target.value)}
            />
            <div className="hint">Leave blank to auto-detect your server from your handle.</div>
          </div>
        )}

        {error && <div className="err95">{error}</div>}

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn95 primary" type="submit" disabled={busy || !handle.trim() || !password}>
            {busy ? '⏳ Signing in…' : 'Sign in ▶'}
          </button>
          <button
            className="btn95"
            type="button"
            onClick={() => setShowAdvanced((s) => !s)}
          >
            {showAdvanced ? 'Less ▲' : 'Advanced ▼'}
          </button>
        </div>
      </form>

      <div className="note95">
        🔒 <strong>Your credentials never touch GitHub.</strong> This is a 100% static site —
        there is no server. Your handle and app password go directly from your browser to your
        own PDS over HTTPS, are used once to create a session, and are never stored. Only the
        session token lives in this tab's session storage, and it's wiped when you sign out or
        close the tab.
      </div>
    </div>
  )
}
