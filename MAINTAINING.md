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

## Contribution snake

The official Platane/snk SVG-only action bundle is pinned by revision and four
SHA-256 checksums in vendor/snake-source.json. It downloads to ignored .cache
on demand; no upstream bundle is redistributed. GITHUB_TOKEN reads the real
contribution calendar. Both themes use the profile accent. Static alternatives
are selected when the visitor prefers reduced motion. The local style-snake adapter removes
the accumulation bar, adds six tail segments as meals are collected, and briefly
highlights the head on a bite. The original route and contribution data stay intact.
Outside travel lanes are folded onto the calendar edges for the entire body,
including the growing tail. Asset checks reject any segment leaving the grid.
The head has small blinking eyes and eaten cells briefly show an outline.
The calendar uses the same terminal frame as the other panels. Keep the README
free of repeated introductory text and external section headings; panel chrome
provides the hierarchy, with recent work followed by the contribution calendar.

## Visual checks

Open the local preview using `node scripts/preview.mjs`. Check desktop/mobile,
light/dark, the resident sequence, ordinary project links, and reduced motion.
README layout is also checked on GitHub before publishing. The local preview
approximates GitHub's layout and does not replace its sanitizer/theme rendering.

Image URLs point directly to raw.githubusercontent.com and carry content hashes.
GitHub raw redirects discard arbitrary query strings, so relative raw links
cannot reliably invalidate cached artwork after a design update.

Selected work is one neofetch terminal with all four projects, a CC ASCII mark
and their stacks. A mobile variant keeps the project list readable. Six aligned
SVG strips form one terminal: header, four linked project rows, and footer. Each
row is wrapped in an ordinary HTML link because SVG image internals cannot open links.
Recent work remains a terminal timeline of actual repository push dates.
