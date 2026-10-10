# Project requirements

Before changing artwork, read and follow `SPRITE_STANDARDS.md` completely.
Keep the native pixel grid: 16 px per world tile, aristocrat homes 48 × 48 px,
and every goods icon at most 16 × 15 px including transparent margins.
Register goods through `publishPixel`; do not bypass its size check.
Run the native-art and applicable gameplay/browser regression tests.

UI text must never be smaller than 0.875rem (14 px at a 16 px root).
Meet WCAG 2.2 AA: sufficient contrast, visible keyboard focus, full keyboard
operation, semantic labels, states distinguishable without color alone,
resizing/reflow, reduced motion and accessible target sizes.
Report remaining accessibility limitations explicitly before delivery.
