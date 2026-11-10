# React Bits integration

Vendored from https://github.com/DavidHDev/react-bits/tree/4dc7b5b7772e1217c8fb8d2a7aa074302180e5b4/src/ts-default on 2026-11-07.
Original license: LICENSE.md (MIT + Commons Clause); retained with these sources.

Components: Magnet, TargetCursor, ScrollVelocity, SpotlightCard, FuzzyText.
FuzzyText uses the same pinned upstream revision and retained license. Who’s There loads it near view, uses subtle idle distortion with stronger hover/tap feedback at 30 FPS, and renders plain text for reduced motion. Local adaptations cap DPR and pause its frame loop in hidden tabs; upstream offscreen gating is retained.
Cursor presentation: idleRing keeps the original trailing circle/dot while idle; the same spring geometry crossfades to corner brackets on interactive targets. Rainbow key treatment applies to both presentations. Idle spinning is disabled in the site adapter.
Performance adaptations: ScrollVelocity is loaded near the ribbon and uses a visibility-gated RAF subscription. TargetCursor stops after settling on a target, observes target size/style movement and wakes on pointer/scroll/resize; hidden tabs cancel its loop. Upstream source is preserved in Git history only once committed; these local adaptations are maintained here.
Local adaptations: ScrollVelocity imports the existing framer-motion package; unused frame timestamp renamed for strict TypeScript. Reference typography/hidden-word DOM is retained by Marquee. Contact layout is preserved by react-bits-integration.css; selected theme color feeds spotlight and cursor. CustomCursor retains delegated rainbow key detection. No Pro sources included.

Magnet is used on wordmark, hero CV and Contact copy/CV controls; the previous global magnetic initializer is no longer mounted. Reduced motion and touch behavior are handled by the components; TargetCursor mounts only on the existing desktop fine-pointer path. Native modal dialogs retain the system pointer.
