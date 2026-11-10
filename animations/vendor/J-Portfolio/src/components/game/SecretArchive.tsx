import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useSecretGame } from './SecretGame';
import { usePrefersReducedMotion } from '@/hooks';
import { ARCHIVE_PASSPHRASE_HASHES } from '@/constants/secret';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import './receiver-guide.css';
const FuzzyText = lazy(() => import('@/components/react-bits/FuzzyText'));
function ArchiveTitle() {
  const title = useRef<HTMLSpanElement>(null);
  const [near, setNear] = useState(false);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (!title.current || reduced) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNear(true);
        observer.disconnect();
      },
      { rootMargin: '200px' }
    );
    observer.observe(title.current);
    return () => observer.disconnect();
  }, [reduced]);
  return (
    <span ref={title}>
      {near && !reduced ? (
        <ErrorBoundary fallback={<span>Who’s There?</span>}>
          <Suspense fallback="Who’s There?">
            <FuzzyText
              fontSize="clamp(36px, 5vw, 64px)"
              fontWeight={600}
              baseIntensity={0.12}
              hoverIntensity={0.55}
              fuzzRange={12}
              fps={30}
              transitionDuration={12}
              clickEffect
              className="run-fuzzy-title"
            >
              Who’s There?
            </FuzzyText>
          </Suspense>
        </ErrorBoundary>
      ) : (
        'Who’s There?'
      )}
    </span>
  );
}
const SignalPaddle = lazy(() =>
  import('@/components/sections/SignalPaddle').then((module) => ({ default: module.SignalPaddle }))
);
function DeferredRun({
  connected,
  reduced,
  onUnlock,
}: {
  connected: boolean;
  reduced: boolean;
  onUnlock: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    if (!root.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  const placeholder = (
    <div className="run-game-placeholder" aria-label="Signal Run loading">
      SIGNAL RUN
    </div>
  );
  return (
    <div ref={root} className="run-stage">
      {near ? (
        <ErrorBoundary
          fallback={
            <div className="run-game-placeholder">
              <p>The game couldn’t start.</p>
              <button type="button" onClick={onUnlock}>
                Open radar ↗
              </button>
            </div>
          }
        >
          <Suspense fallback={placeholder}>
            <SignalPaddle connected={connected} reduced={reduced} onUnlock={onUnlock} />
          </Suspense>
        </ErrorBoundary>
      ) : (
        placeholder
      )}
    </div>
  );
}

export const SecretArchive: React.FC = () => {
  const { fragments, found, openResident, openResidentWithPassphrase, residentOpen, unlockRadar } =
    useSecretGame();
  const [input, setInput] = useState('');
  const [signalLocked, setSignalLocked] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'decrypting' | 'revealing' | 'open'>('idle');
  const [overrideAccepted, setOverrideAccepted] = useState(false);
  const title = useRef<HTMLHeadingElement>(null);
  const reduced = usePrefersReducedMotion();
  const accepted = fragments.filter((fragment) => found.includes(fragment.id));
  const ready = accepted.length === 5 && signalLocked;
  useEffect(() => {
    if (phase !== 'idle' || !input.trim()) return;
    let live = true;
    const timer = window.setTimeout(() => {
      const normalized = input
        .normalize('NFKC')
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]/gu, '');
      if (!globalThis.crypto?.subtle) return;
      void crypto.subtle
        .digest('SHA-256', new TextEncoder().encode(normalized))
        .then((buffer) => {
          const hash = [...new Uint8Array(buffer)]
            .map((byte) => byte.toString(16).padStart(2, '0'))
            .join('');
          if (live && ARCHIVE_PASSPHRASE_HASHES.includes(hash)) {
            setOverrideAccepted(true);
            setPhase('decrypting');
          }
        })
        .catch(() => {
          /* The regular five-key route remains available. */
        });
    }, 180);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [input, phase]);
  useEffect(() => {
    if (phase !== 'decrypting') return;
    const timer = window.setTimeout(
      () => {
        setPhase('revealing');
        if (overrideAccepted) openResidentWithPassphrase();
        else openResident();
      },
      reduced ? 0 : 2200
    );
    return () => window.clearTimeout(timer);
  }, [phase, reduced, openResident, openResidentWithPassphrase, overrideAccepted]);
  useEffect(() => {
    if (phase === 'revealing' && !residentOpen) setPhase('open');
  }, [phase, residentOpen]);
  useEffect(() => {
    if (phase === 'open') {
      title.current?.focus({ preventScroll: true });
    }
  }, [phase, openResident]);
  return (
    <section
      id="whos-there"
      className={`secret-archive archive-${phase}`}
      aria-labelledby="secret-archive-title"
      data-secret-ui
    >
      <div className="secret-archive-heading">
        <h2 id="secret-archive-title">WHO’S THERE?</h2>
        <span>{phase === 'open' ? 'RESIDENT FOUND' : `${found.length} / 5 FOUND`}</span>
      </div>
      {phase === 'open' ? (
        <div className="secret-room resident-result">
          <div className="resident-result-copy">
            <span className="secret-eyebrow">OUR LITTLE SECRET</span>
            <h3 ref={title} tabIndex={-1}>
              {overrideAccepted ? 'You knew the words.' : 'You found me.'}
            </h3>
            <p>
              {overrideAccepted
                ? 'A familiar voice on a private channel.'
                : 'You followed every trace. I wasn’t expecting that.'}
              <br />
              You can visit. Just keep it between us.
            </p>
            <div className="resident-return-passphrase">
              <span>YOUR WAY BACK</span>
              <code>who’s there?</code>
              <p>Use this in the passphrase field next time.</p>
            </div>
            <button type="button" className="secret-action hoverable" onClick={openResident}>
              SAY HELLO AGAIN <span aria-hidden="true">↗</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="secret-run-layout">
          <div className="run-story">
            <h3 className="run-story-title">
              <ArchiveTitle />
            </h3>
            <p className="run-story-intro">
              A small challenge across this site. Unlock the radar, collect five hidden keys, then
              see what they open.
            </p>
            <aside className="receiver-guide run-guide" aria-labelledby="receiver-guide-title">
              <h3 id="receiver-guide-title">How to play</h3>
              <ol>
                <li>
                  <span aria-hidden="true">1</span>
                  <p>
                    <strong>Keep the signal alive.</strong> Move the paddle. Reach 100 points to
                    unlock the radar. You can keep playing.
                  </p>
                </li>
                <li>
                  <span aria-hidden="true">2</span>
                  <p>
                    <strong>Follow the radar.</strong> Tap the words it points to. Keys collect
                    automatically.
                  </p>
                </li>
                <li>
                  <span aria-hidden="true">3</span>
                  <p>
                    <strong>Find all five keys.</strong> Come back and Decrypt.
                  </p>
                </li>
              </ol>
            </aside>
          </div>
          <div className="run-console">
            <DeferredRun
              connected={signalLocked}
              reduced={reduced}
              onUnlock={() => {
                setSignalLocked(true);
                unlockRadar();
              }}
            />
            <div className="run-unlock">
              <ol
                className="run-keys"
                aria-label="Automatically collected keys"
                aria-live="polite"
                aria-relevant="text additions"
              >
                {fragments.map((fragment) => (
                  <li
                    key={fragment.id}
                    className={found.includes(fragment.id) ? 'is-received' : ''}
                    aria-label={`Key ${fragment.id}${found.includes(fragment.id) ? ', found' : ', not found'}`}
                    title={found.includes(fragment.id) ? fragment.key : undefined}
                  >
                    <span aria-hidden="true">
                      {found.includes(fragment.id) ? '✓' : `0${fragment.id}`}
                    </span>
                  </li>
                ))}
              </ol>
              <button
                type="button"
                className="secret-action run-decrypt hoverable"
                disabled={!ready || phase !== 'idle'}
                aria-describedby="secret-receiver-status"
                onClick={() => {
                  if (ready) setPhase('decrypting');
                }}
              >
                {phase === 'decrypting' ? 'DECRYPTING…' : 'Decrypt ↗'}
              </button>
              <p id="secret-receiver-status" className="run-status" role="status">
                {phase === 'decrypting'
                  ? 'Opening…'
                  : !signalLocked
                    ? 'Reach 100 points to open the radar.'
                    : accepted.length < 5
                      ? `${5 - accepted.length} keys left to find.`
                      : 'Ready to decrypt.'}
              </p>
              <label className="sr-only" htmlFor="secret-override-input">
                Passphrase
              </label>
              <input
                id="secret-override-input"
                className="run-passphrase"
                type="password"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                autoComplete="off"
                spellCheck={false}
                placeholder="Passphrase"
                disabled={phase !== 'idle'}
              />
            </div>
            {phase === 'decrypting' && (
              <div className="secret-decrypt-progress" aria-hidden="true">
                <span />
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
