# Maintaining this profile

The profile is `README.md`; its wording and projects come from `data/profile.json`.
Generated SVGs live in `assets`. No third-party image service is needed to display
the profile. All links remain ordinary GitHub Markdown/HTML links.

Requires Node 24, with no npm install:

```sh
node scripts/sync-github.mjs
node scripts/generate-snake.mjs
node scripts/render-assets.mjs
node scripts/check.mjs
```

Set `GITHUB_TOKEN` in the environment for the real GitHub contribution calendar.
The snake generator requires it; the scheduled workflow uses the built-in token.
Never save a token in a file or SVG.

The daily workflow uses the repository's built-in token. Outputs are committed
only after every generator and asset check succeeds. Failed runs keep the last
working assets. Scheduled GitHub workflows can be delayed or disabled after
repository inactivity; manual dispatch is available.

## Resident

Approved atlas and timings were copied from `jedkx/J-Portfolio/art/resident`.
The 68×40 geometry and transparent pupils are preserved. The SVG converts opaque
pixel runs into paths; it does not embed externally loaded images. Chewing uses
neutral eyes, matching the website fix. Edit the original Aseprite source in
J-Portfolio, export there, then copy the approved atlas and metadata here.

## Animation library

`animations/` holds every jedkx animation — used in this profile or not — so other
apps (J-Portfolio, jedkx-cli, …) pick from one catalogue. `catalog.json` is the
registry (id, technique, files, keyframes, where it can run, where it is used);
`animations/README.md` is generated from it. Code is mirrored verbatim from
J-Portfolio into `animations/vendor/J-Portfolio` with hashes in `lock.json`.

```sh
node scripts/sync-animations.mjs ../J-Portfolio   # copy + hash + completeness + README
node scripts/check-animations.mjs                 # offline verification
```

The sync fails when J-Portfolio has a `@keyframes` or an animated module
(RAF / GSAP / Motion / canvas) that is not catalogued. Never edit `vendor/`;
change the animation in J-Portfolio and re-sync. The profile build and
`check.mjs` do not depend on this folder.

## Contribution snake

The official Platane/snk SVG-only action bundle is pinned by revision and four
SHA-256 checksums in vendor/snake-source.json. It downloads to ignored .cache
on demand; no upstream bundle is redistributed. GITHUB_TOKEN reads the real
contribution calendar. Both themes use the profile accent. Static alternatives
are selected when the visitor prefers reduced motion.

snake-route.mjs plans shortest paths toward uneaten contribution cells while
reserving a ten-segment moving body. Cells behind the tail may be revisited.
Candidate turns must leave maneuvering room, or contain all remaining food
when entering the final corridor. Every food cell is consumed once. At the end,
the snake fades before resetting. It never visibly jumps back across cells.
Cell disappearance, bite highlights and outlines use the new arrival times.
The style adapter retains the blinking eyes, bounded growth and terminal frame.
Checks inspect the emitted SVG route for adjacency, bounds, moving-body collisions and
complete food coverage. The collection bar remains removed.

## Visual checks

Open the local preview using `node scripts/preview.mjs`. Check desktop/mobile,
light/dark, the resident sequence, ordinary project links, and reduced motion.
README layout is also checked on GitHub before publishing. The local preview
approximates GitHub's layout and does not replace its sanitizer/theme rendering.

Image URLs point directly to raw.githubusercontent.com and carry content hashes.
GitHub raw redirects discard arbitrary query strings, so relative raw links
cannot reliably invalidate cached artwork after a design update.

Selected work is one neofetch terminal with all four projects, recent repository
push dates, a CC ASCII mark
and their stacks. A mobile variant keeps the project list readable. Six aligned
SVG strips form one terminal: header, four linked project rows, and footer. Each
row is wrapped in an ordinary HTML link because SVG image internals cannot open links.
Recent work sits below the CC mark in the left column on desktop, alongside
the project list. On mobile it stays below the projects with readable name/date
rows. There is no separate activity panel or activity asset. Desktop hero and
neofetch are 174px and 440px in SVG coordinates; mobile remains a stacked layout.
The snake keeps its existing 900×214 viewport, geometry and animation. Resident
poses retain integer pixel scaling; only placement and snack coordinates change.
