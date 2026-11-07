# Maintaining this profile

The profile is `README.md`; its wording and projects come from `data/profile.json`.
Generated SVGs live in `assets`. No third-party image service is needed to display
the profile. All links remain ordinary GitHub Markdown/HTML links.

Requires Node 24, with no npm install:

```sh
node scripts/sync-github.mjs
node scripts/generate-arcade.mjs
node scripts/render-assets.mjs
node scripts/check.mjs
```

Set `GITHUB_TOKEN` in the environment for exact GraphQL contribution-calendar
data. Without it the upstream library uses public commit search, which is not
the full GitHub contribution calendar. Never save a token in a file or SVG.

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

## Arcade source

`vendor/arcade-source.json` pins the official rendering bundle and SHA-256.
The library is downloaded to ignored `.cache` on demand; it is not redistributed
in this repository. The upstream Action's analytics/leaderboard wrapper is not
used. Generated SVGs retain their upstream attribution.

## Visual checks

Open the local preview using `node scripts/preview.mjs`. Check desktop/mobile,
light/dark, the resident sequence, ordinary project links, and reduced motion.
README layout is also checked on GitHub before publishing. The local preview
approximates GitHub's layout and does not replace its sanitizer/theme rendering.

Image URLs point directly to raw.githubusercontent.com and carry content hashes.
GitHub raw redirects discard arbitrary query strings, so relative raw links
cannot reliably invalidate cached artwork after a design update.

Selected work uses self-contained terminal cards with inline wrapping, so cards
wrap to a single column on narrow screens. Project descriptions stay inside each
terminal; mobile SVG variants increase text size. Recent work is a visible
terminal timeline of repository push dates, not a commit-frequency statistic.
