import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '@/hooks';
import './fragment-sonar.css';
export interface SonarContact {
  id: number;
  x: number;
  y: number;
}
export const FragmentSonar = ({ locate }: { locate: () => SonarContact[] }) => {
  const [contacts, setContacts] = useState<SonarContact[]>([]);
  const [minimized, setMinimized] = useState(false);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (minimized) return;
    const scan = () => {
      if (!document.hidden) setContacts(locate());
    };
    scan();
    const timer = window.setInterval(scan, 250);
    return () => window.clearInterval(timer);
  }, [locate, minimized]);
  return (
    <aside
      className={`fragment-sonar${reduced ? ' is-still' : ''}`}
      aria-label="Fragment radar"
      data-secret-ui
    >
      <button
        className="sonar-header hoverable"
        onClick={() => setMinimized(!minimized)}
        aria-expanded={!minimized}
        aria-label={minimized ? 'Expand fragment radar' : 'Minimize fragment radar'}
      >
        <span>
          SONAR / {minimized ? 'ONLINE' : `${new Set(contacts.map((c) => c.id)).size} IN VIEW`}
        </span>
        <span aria-hidden="true">{minimized ? '+' : '−'}</span>
      </button>
      {!minimized && (
        <>
          <div className="sonar-display" aria-hidden="true">
            <div className="sonar-sweep" />
            <svg viewBox="0 0 200 200" fill="none">
              {[30, 60, 90].map((r) => (
                <circle key={r} cx="100" cy="100" r={r} />
              ))}
              <path d="M10 100H190M100 10V190" />
              <rect x="40" y="40" width="120" height="120" strokeDasharray="2 5" />
              <circle cx="100" cy="100" r="2" className="sonar-origin" />
              {contacts.map((c, i) => (
                <g
                  key={`${c.id}-${i}`}
                  className="sonar-contact"
                  transform={`translate(${40 + c.x * 120} ${40 + c.y * 120})`}
                >
                  <circle r="8" className="sonar-echo" />
                  <circle r="3" />
                </g>
              ))}
            </svg>
            <span className="sonar-north">TOP</span>
          </div>
          <p>{contacts.length ? 'FRAGMENT DETECTED' : 'NO FRAGMENTS IN VIEW'}</p>
        </>
      )}
    </aside>
  );
};
