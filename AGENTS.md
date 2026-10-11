# Project requirements

Before changing artwork, read and follow `SPRITE_STANDARDS.md` completely.
Keep the native pixel grid: 16 px per world tile, aristocrat homes 48 × 48 px,
and every goods icon at most 16 × 16 px including transparent margins.
Register goods through `publishPixel`; do not bypass its size check.
Run the native-art and applicable gameplay/browser regression tests.

UI text must never be smaller than 0.875rem (14 px at a 16 px root).
Meet WCAG 2.2 AA: sufficient contrast, visible keyboard focus, full keyboard
operation, semantic labels, states distinguishable without color alone,
resizing/reflow, reduced motion and accessible target sizes.
Report remaining accessibility limitations explicitly before delivery.

## Target platform

Pixxo is exclusively a desktop game. Design and validate the interface for
desktop browsers with mouse and keyboard, primarily at Full HD (1920 × 1080).
Do not create mobile UI variants, introduce mobile-specific layouts, or spend
design/verification effort on phone or tablet viewports unless the user
explicitly changes this scope. Existing mobile rules need not be removed
unless they interfere with a requested desktop change.
Desktop-only does not waive accessibility requirements: retain readable text,
keyboard operation, visible focus, text resizing/reflow, and reduced motion.

## UI frames

Use the approved frame style from assets/css/pixxo_frames.css only on windows:
a single 1 px line in #b3a789 and identical 12 × 12 px corner caps.
Buttons, toolbars, cards, goods slots, map markers and embedded inputs keep
their original frames and styling, without corner caps. Do not override their
borders or shadows in the window-frame stylesheet. Keep keyboard focus and
meaningful selection indicators distinct and visible.
