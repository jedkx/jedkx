import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { SiteRift } from './SiteRift';
import { FragmentSonar, type SonarContact } from './FragmentSonar';
import '@/styles/secret-game.css';

const alphabet = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const random = (max: number) => crypto.getRandomValues(new Uint32Array(1))[0] % max;
const shuffle = <T,>(items: T[]) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = random(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
const createFragments = () =>
  Array.from({ length: 5 }, (_, index) => ({
    id: index + 1,
    key: `${index + 1}-${Array.from({ length: 7 }, () => alphabet[random(alphabet.length)]).join('')}`,
  }));
type Fragment = ReturnType<typeof createFragments>[number];
type Target = { text: string; start: number; end: number; fragment: Fragment };
type Game = {
  fragments: Fragment[];
  found: number[];
  showHint: () => void;
  openResident: () => void;
  openResidentWithPassphrase: () => void;
  residentOpen: boolean;
  unlockRadar: () => void;
};
const Context = createContext<Game | null>(null);
export const useSecretGame = () => {
  const game = useContext(Context);
  if (!game) throw new Error('Secret game provider is missing');
  return game;
};
const excluded =
  'a, button, input, textarea, select, summary, nav, pre, svg, script, style, [data-secret-ui], .ascii-initial, .initial-flight-layer, .site-boot, dialog';

const discoverySound = () => {
  try {
    const audio = new AudioContext();
    void audio
      .resume()
      .then(() => {
        const oscillator = audio.createOscillator();
        const volume = audio.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(740, audio.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1040, audio.currentTime + 0.09);
        volume.gain.setValueAtTime(0.0001, audio.currentTime);
        volume.gain.exponentialRampToValueAtTime(0.035, audio.currentTime + 0.01);
        volume.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.2);
        oscillator.connect(volume).connect(audio.destination);
        oscillator.start();
        oscillator.stop(audio.currentTime + 0.22);
        oscillator.onended = () => {
          void audio.close();
        };
      })
      .catch(() => {
        void audio.close();
      });
  } catch {
    /* Discovery remains usable when audio is unavailable. */
  }
};

export const SecretGameProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [fragments] = useState(createFragments);
  const [found, setFound] = useState<number[]>([]);
  const [hint, setHint] = useState(false);
  const [rift, setRift] = useState(false);
  const [residentVisits, setResidentVisits] = useState(0);
  const [viaPassphrase, setViaPassphrase] = useState(false);
  const [radarUnlocked, setRadarUnlocked] = useState(false);
  const unlockRadar = useCallback(() => setRadarUnlocked(true), []);
  const openResident = useCallback(() => {
    setResidentVisits((visits) => visits + 1);
    setRift(true);
  }, []);
  const closeResident = useCallback(() => setRift(false), []);
  const openResidentWithPassphrase = useCallback(() => {
    setViaPassphrase(true);
    openResident();
  }, [openResident]);
  const targets = useRef<Target[]>([]);
  const dialog = useRef<HTMLDialogElement>(null);
  const locateFragments = useCallback((): SonarContact[] => {
    const surface = document.querySelector('[data-secret-surface]');
    if (!surface || document.querySelector('dialog[open], .site-boot')) return [];
    const pending = targets.current.filter((target) => !found.includes(target.fragment.id));
    const contacts: SonarContact[] = [];
    const walker = document.createTreeWalker(surface, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      if (!parent || parent.closest(excluded) || parent.closest('[inert]')) continue;
      for (const target of pending) {
        if (node.textContent !== target.text) continue;
        const range = document.createRange();
        range.setStart(node, target.start);
        range.setEnd(node, target.end);
        for (const rect of range.getClientRects()) {
          const x = rect.left + rect.width / 2,
            y = rect.top + rect.height / 2;
          if (x < 0 || x > innerWidth || y < 0 || y > innerHeight) continue;
          let visible = true;
          for (
            let element: Element | null = parent;
            element && element !== surface;
            element = element.parentElement
          ) {
            const style = getComputedStyle(element);
            if (
              style.visibility === 'hidden' ||
              style.display === 'none' ||
              Number(style.opacity) <= 0.05
            ) {
              visible = false;
              break;
            }
          }
          if (!visible) continue;
          const hit = document.elementFromPoint(x, y);
          if (!hit || !parent.contains(hit) || getComputedStyle(parent).visibility === 'hidden')
            continue;
          contacts.push({ id: target.fragment.id, x: x / innerWidth, y: y / innerHeight });
          break;
        }
      }
    }
    return contacts;
  }, [found]);

  useEffect(() => {
    let timer = 0;
    const surface = document.querySelector('[data-secret-surface]');
    if (!surface) return;
    const assign = () => {
      if (targets.current.length === 5 || document.querySelector('.site-boot')) return;
      const groups = new Map<string, Omit<Target, 'fragment'>[]>();
      const walker = document.createTreeWalker(surface, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const element = node.parentElement;
        const text = node.textContent ?? '';
        if (
          !element ||
          element.closest(excluded) ||
          element.closest(
            '.profile-github, .terminal-original-github, .experience-empty, .contact-tuner, .window-chrome, .work-kicker'
          )
        )
          continue;
        const group = [
          '.experience-name',
          '.neofetch-shell',
          '.work-copy',
          '.reference-ribbon',
          '.experience-resume',
          '.contact-dock',
        ].find((selector) => element.closest(selector));
        // Decorative/transition text must never receive an unreachable key.
        // Every key belongs to a readable content section, even when that
        // section is temporarily hidden by the scroll scene.
        if (!group) continue;
        const candidates = groups.get(group) ?? [];
        for (const match of text.matchAll(/[\p{L}\p{N}][\p{L}\p{N}'’.-]{2,}/gu)) {
          candidates.push({ text, start: match.index!, end: match.index! + match[0].length });
        }
        groups.set(group, candidates);
      }
      const pools = shuffle([...groups.values()].filter((pool) => pool.length));
      if (pools.length < 5) return;
      targets.current = fragments.map((fragment, index) => ({
        ...pools[index][random(pools[index].length)],
        fragment,
      }));
      observer.disconnect();
      bootObserver.disconnect();
    };
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(assign, 250);
    };
    const observer = new MutationObserver(schedule);
    observer.observe(surface, { childList: true, subtree: true, characterData: true });
    // The boot scene is outside the surface.
    const bootObserver = new MutationObserver(schedule);
    bootObserver.observe(document.body, { childList: true, subtree: true });
    const bootTimer = window.setTimeout(assign, 2800);
    schedule();
    const hitFragment = (element: Element | null, x: number, y: number): Target | null => {
      if (!element || element.closest(excluded) || element.closest('[inert]')) return null;
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const parent = node.parentElement;
        if (
          !parent ||
          (parent !== element && !parent.contains(element)) ||
          parent.closest(excluded) ||
          parent.closest('[inert]') ||
          getComputedStyle(parent).visibility === 'hidden'
        )
          continue;
        for (const target of targets.current) {
          if (node.textContent !== target.text) continue;
          const range = document.createRange();
          range.setStart(node, target.start);
          range.setEnd(node, target.end);
          if (
            [...range.getClientRects()].some(
              (rect) => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
            )
          )
            return target;
        }
      }
      return null;
    };
    let hoverFrame = 0;
    const setWordHover = (active: boolean) => {
      const value = active ? 'true' : 'false';
      if (document.body.dataset.secretWordHover !== value)
        document.body.dataset.secretWordHover = value;
    };
    const hover = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      cancelAnimationFrame(hoverFrame);
      const element = event.target instanceof Element ? event.target : null;
      hoverFrame = requestAnimationFrame(() =>
        setWordHover(!!hitFragment(element, event.clientX, event.clientY))
      );
    };
    const leave = () => {
      cancelAnimationFrame(hoverFrame);
      setWordHover(false);
    };
    const inspect = (event: MouseEvent) => {
      const element = event.target instanceof Element ? event.target : null;
      const target = hitFragment(element, event.clientX, event.clientY);
      if (!target || !element) return;
      setFound((previous) =>
        previous.includes(target.fragment.id) ? previous : [...previous, target.fragment.id]
      );
      discoverySound();
    };
    document.addEventListener('click', inspect);
    document.addEventListener('pointermove', hover, { passive: true });
    document.addEventListener('pointerleave', leave);
    window.addEventListener('blur', leave);
    return () => {
      observer.disconnect();
      bootObserver.disconnect();
      window.clearTimeout(timer);
      window.clearTimeout(bootTimer);
      document.removeEventListener('click', inspect);
      document.removeEventListener('pointermove', hover);
      document.removeEventListener('pointerleave', leave);
      window.removeEventListener('blur', leave);
      cancelAnimationFrame(hoverFrame);
      delete document.body.dataset.secretWordHover;
    };
  }, [fragments]);
  useEffect(() => {
    const element = dialog.current;
    if (hint && !element?.open) element?.showModal();
    if (!hint && element?.open) element.close();
  }, [hint]);
  return (
    <Context.Provider
      value={{
        fragments,
        found,
        showHint: () => setHint(true),
        openResident,
        openResidentWithPassphrase,
        residentOpen: rift,
        unlockRadar,
      }}
    >
      {children}
      {radarUnlocked && found.length < 5 && !rift && <FragmentSonar locate={locateFragments} />}
      <span className="sr-only" aria-live="polite">
        {found.length
          ? `${found.length} of 5 fragments discovered. Automatically saved in Who’s there?`
          : ''}
      </span>
      <dialog
        ref={dialog}
        className="secret-dialog"
        data-secret-ui
        aria-labelledby="secret-dialog-title"
        onClose={() => setHint(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setHint(false);
        }}
      >
        <div className="secret-dialog-content">
          <button
            type="button"
            className="secret-close hoverable"
            onClick={() => setHint(false)}
            aria-label="Close"
          >
            <X size={18} />
          </button>
          <span className="secret-eyebrow">A HIDDEN GAME</span>
          <h2 id="secret-dialog-title">How to play</h2>
          <p>Find 5 hidden keys and connect the signal.</p>
          <ol>
            <li>
              Go to Who’s there? Play Signal Run. Reach 100 points to open the radar; keep playing
              as long as you like.
            </li>
            <li>
              A small radar will appear at the bottom-right. Its dots point to keys on your screen.
              Scroll around to find more.
            </li>
            <li>
              Keys hide in normal words. Click a word where the radar points, or tap it on your
              phone. On a computer, your mouse pointer turns rainbow over the right word.
            </li>
            <li>Keys are saved for you. Find all 5, go back to Who’s there? and press Decrypt.</li>
            <li>
              After completing the game, you’ll get a password to skip the key search next time.
            </li>
          </ol>
          <p className="secret-small">
            Refreshing the page starts a new game. You don’t need sound to play.
          </p>
          <span className="secret-small">{found.length} / 5 keys found</span>
        </div>
      </dialog>
      {rift && (
        <SiteRift onClose={closeResident} visit={residentVisits} viaPassphrase={viaPassphrase} />
      )}
    </Context.Provider>
  );
};
export const SecretHintButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { showHint } = useSecretGame();
  const [calling, setCalling] = useState(false);
  useEffect(() => {
    let end = 0;
    let started = false;
    const begin = () => {
      if (started || document.querySelector('.site-boot')) return;
      started = true;
      observer.disconnect();
      setCalling(true);
      end = window.setTimeout(() => setCalling(false), 5400);
    };
    const observer = new MutationObserver(begin);
    observer.observe(document.body, { childList: true, subtree: true });
    begin();
    return () => {
      observer.disconnect();
      window.clearTimeout(end);
    };
  }, []);
  return (
    <button
      type="button"
      className={`secret-hint hoverable ${calling ? 'is-calling' : ''} ${className}`}
      onClick={() => {
        setCalling(false);
        showHint();
      }}
      aria-label="A hidden signal: open puzzle hint"
    >
      ?
    </button>
  );
};
// Keep existing text call sites, without marked words or special click targets.
export const SecretWords: React.FC<{ id: string; text: string }> = ({ text }) => <>{text}</>;
