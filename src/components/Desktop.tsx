import type { ViewId } from '../types/view'

function Tile({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button className="tile95" onClick={onClick}>
      <span className="tile-icon">{icon}</span>
      <span className="tile-label">{label}</span>
    </button>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="sect95">
      <h2>
        <span className="dot">•</span>
        {title}
      </h2>
      {children}
    </div>
  )
}

/**
 * Icon desktop matching the reference: left column (Explore),
 * center column (Your Timeline / Post & Connect / Discover),
 * right column (Notifications).
 */
export default function Desktop({ onOpen }: { onOpen: (view: ViewId) => void }) {
  return (
    <div className="desk95">
      <div className="col-left">
        <Section title="Explore">
          <div className="tiles95 vertical">
            <Tile icon="💿" label="Home Feed" onClick={() => onOpen('home')} />
            <Tile icon="🔍" label="Search Bluesky" onClick={() => onOpen('search')} />
          </div>
        </Section>
      </div>

      <div className="col-center">
        <Section title="Your Timeline">
          <div className="tiles95">
            <Tile icon="🧑‍💼" label="Following Feed" onClick={() => onOpen('following')} />
            <Tile icon="🦞" label="Discover Posts" onClick={() => onOpen('discover')} />
            <Tile icon="🐄" label="Custom Feeds" onClick={() => onOpen('feeds')} />
          </div>
        </Section>

        <hr className="groove95" />

        <Section title="Post & Connect">
          <div className="tiles95">
            <Tile icon="🐙" label="New Post" onClick={() => onOpen('newpost')} />
            <Tile icon="👩‍💼" label="Reply" onClick={() => onOpen('following')} />
            <Tile icon="🛋️" label="Repost" onClick={() => onOpen('following')} />
            <Tile icon="🍅" label="Save Post" onClick={() => onOpen('following')} />
            <Tile icon="🐟" label="Share Post" onClick={() => onOpen('following')} />
          </div>
        </Section>

        <hr className="groove95" />

        <Section title="Discover">
          <div className="tiles95">
            <Tile icon="⚡" label="Trending Topics" onClick={() => onOpen('trending')} />
            <Tile icon="👨‍💼" label="Popular Posts" onClick={() => onOpen('popular')} />
          </div>
        </Section>
      </div>

      <div className="col-right">
        <Section title="Notifications">
          <div className="tiles95 vertical">
            <Tile icon="🧑‍🔬" label="All" onClick={() => onOpen('notif-all')} />
            <Tile icon="🚙" label="Mentions" onClick={() => onOpen('notif-mentions')} />
          </div>
        </Section>
      </div>
    </div>
  )
}
