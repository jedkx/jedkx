# Resident

Approved face: two eyes and a mouth, white pixel art on a transparent canvas.
This is the symmetric, transparency-corrected version, not the frog-inspired
Butcher experiment.

## Files

| File | Purpose |
| --- | --- |
| `resident.aseprite` | Authoritative editable source |
| `sheet.png` + `sheet.json` | Complete animation atlas, frame timings and tags |
| `eye-left.png` + `eye-left.json` | Independent left-eye animation atlas |
| `eye-right.png` + `eye-right.json` | Independent right-eye animation atlas |
| `mouth.png` + `mouth.json` | Independent mouth animation atlas |
| `animation.json` | Named clips and per-eye pointer-tracking eligibility |

Keep each PNG together with its corresponding JSON. These are usable exports,
not test outputs. GIF previews and previous versions are intentionally excluded.

## Geometry and display

- Canvas: 68×40 pixels, RGBA, transparent background.
- Display ratio: 1.7:1; scale both axes uniformly.
- Fixed anchor: (34,20). Eye centers approximately (14,17) and (54,17).
- Color: #f4f4f4. Empty pixels, including pupil holes, are transparent.
- Use nearest-neighbor sampling / CSS `image-rendering: pixelated`.
- Do not stretch to the old 68×24 SVG viewBox or trim individual frames.

## Animations

103 frames, 13 tags. The following frame numbers are **1-based Aseprite numbers**;
the JSON tag ranges are zero-based. Use exported per-frame durations, not a fixed FPS.

| Tag | Frames | Intended use |
| --- | --- | --- |
| idle | 1–11 | Resting face with staggered blinks |
| shy | 12–20 | Shy response, then idle |
| surprised | 21–26 | Surprise, then idle |
| eat | 27–39 | Anticipation, bite, chewing, recovery |
| curious | 40–46 | Left/right glance |
| wink | 47–51 | Deliberate wink |
| talk | 52–61 | Mouth shapes for speaking |
| sleepy | 62–72 | Droop, doze, wake |
| notice | 73–76 | Notice the visitor |
| search | 77–81 | Look for the pointer |
| startle | 82–87 | Brief startled response |
| goodbye | 88–94 | Farewell |
| blink-soft | 95–103 | Multi-stage blink with delayed right eye |

## Editing and exporting

Visible source layers are `eye-left`, `eye-right`, and `mouth`. The four original
pupil/eyelid mask layers are retained **hidden** as authoring references. Enabling
them during export reintroduces opaque black areas; leave them hidden.

Visible eye layers are precomposited shapes with transparent pupil openings.
The two eyes and mouth play independently. On eligible open-eye frames the runtime
reconstructs the approved solid eye silhouette and alpha-cuts a moving pupil.
Closed/expressive lids retain the exported artwork. No black rectangles are drawn.

Rebuild all exports using the installed official Aseprite executable:

```powershell
node scripts/export-resident.mjs "C:/Program Files (x86)/Steam/steamapps/common/Aseprite/Aseprite.exe"
```

This exports visible face parts to PNG+JSON, includes frame tags/durations,
uses a 16-column atlas and keeps the full 68×40 frame. If frames are inserted or
reordered, review the per-eye tracking indices in `animation.json` before shipping.
After editing, check opening/closing lids and first/last poses on both a checkerboard
and a colored background. Preserve the intentional asynchronous acting.

## Integration status

`src/assets/ResidentMotionExport.tsx` loads the three part atlases once and draws
them on a transparent Canvas. The 4× backing resolution allows quarter-pixel pupil
positions without blurring authored pixels. Native frame durations control clips;
GSAP handles only surrounding movement and eased gaze, not redrawing artwork.

`HiddenResident.tsx` chooses idle/blink, shy, greeting, eating and farewell clips.
Speech drives the mouth independently from eye motion; punctuation pauses it.
The active controller suppresses speech during shy/eating/greeting/departure
actions. During idle speech, a complete word selects a stable stylized mouth pose
while letters print; this is not phoneme-accurate lip-sync. Idle eye layers blink
with a frog-like overlapping offset, using the original simpler lid poses.
The loading cameo never tracks the pointer and only blinks after the seam opens.
Reduced motion uses static expressions. This is text-driven acting, not audio lip-sync.
Only context-appropriate clips play; the thirteen clips are not cycled constantly.
The revealed character notices/wakes, looks for an idle pointer, grows sleepy,
glances toward an edge, startles at a sudden nearby movement and reacts to a
face click. Automatic reactions have a cooldown and do not start during speech.
The loading cameo excludes these ambient triggers and uses slower chewing plus
an extended shutter hold so recovery is not cut short.
For the intro only, `residentIntro.ts` schedules explicit frame/eye overrides on
the same GSAP clock as the letter and shutters; no independent clip timer runs.
Contextual reactions have short alternating English lines. Sleep holds frame 65
(zero-based) with closed eyes until meaningful input; it does not auto-play the
waking tail. After a minimum rest, movement/tap triggers frames 68–71 for gradual
waking. These behavioral choices are in site code; the Aseprite source is unchanged.

This integration is local until explicitly published. The PNG+JSON pipeline follows
[Aseprite's export workflow](https://www.aseprite.org/docs/cli/) and the
[frame-duration atlas pattern](https://github.com/pixijs/pixijs-skills/blob/main/skills/pixijs-scene-sprite/references/animated-sprite.md).
Canvas uses [drawImage](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage)
with [smoothing disabled](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/imageSmoothingEnabled).
