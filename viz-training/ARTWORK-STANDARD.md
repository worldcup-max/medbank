# MedBank · viz-training · ARTWORK STANDARD

How a plate for the diagram engine is drawn, and how it is checked before anyone believes it.

Written 2026-09-09, after the first plate ever drawn for this corpus went through the process below and
came back with nineteen defects.

---

## 1 · What a plate is

A **plate** is one SVG file: a single anatomical picture, in one section plane, from one viewpoint.
Inside it, every drawable thing is a `<g data-key="…">` whose key matches a `structures[].key` in the
scene it serves. The engine shows, hides, highlights and isolates those groups. That is the whole
contract, and it is deliberately the same shape as the 3D one: a scene names a structure, the adapter
resolves it to something drawable, and the scene never knows how.

A scene may need more than one plate — a median section and a transverse section are different plates,
and `ROTATE_TO_VIEW` / `CROSS_SECTION` select between them.

## 2 · Three rules that came out of drawing the first one

**THE SUBJECT FILLS THE FRAME.** The first version of the notochord plate drew the three germ layers as
a 20-pixel band in a 520-pixel figure. Every fact in the scene lives in that band. The layers were
invisible, three of the four stages were indistinguishable purple bars, and the drawing was worthless
despite being broadly accurate. Anatomical correctness at an unreadable scale is not correctness.

**PLATES CARRY GEOMETRY, NOT TEXT.** The second version baked the teaching sentences into the SVG. The
moment two groups appeared together the labels collided into mush. All naming comes from the scene —
`structure.label`, drawn by the player as pins — exactly as the 3D engine already does it. The only text
allowed on a plate is unchanging structural context: layer names, cavity names, an orientation mark.
Even those must sit clear of the region where overlays land.

**A KEY THAT CANNOT HONESTLY BE DRAWN IN THIS PLANE DOES NOT GO ON THIS PLATE.** The first version drew
the sclerotome in the yolk sac, because that was where there was room. Somites are paramedian: in a true
median section they are not in the plane at all. Put the key on the plate whose plane contains it, and
record in the scene's `gaps[]` that it lives there.

## 3 · Two reviews, and they must be different in kind

Two identical reviews catch the same things twice. These two are built to fail differently.

### Review 1 — mechanical, automated, run on every save

`tools/check-artwork.mjs`. Machine-checkable relationships only, stated per plate as assertions:

- every `data-key` in the plate exists in the scene, and every scene key resolves to a plate or is
  declared in `gaps[]` as undrawable
- containment: a structure declared as part of a layer has its bounding box inside that layer's band
- coincidence: structures that are the same thing seen twice share a coordinate. The neurenteric canal's
  x MUST equal the primitive pit's x — they are one continuous channel, and the first draft drew them
  49 units apart
- contact: an arrow that claims a source must start on that source's edge, not near it
- `marker-end` on a path with multiple subpaths draws ONE arrowhead. Multi-subpath arrow paths are an
  error; each arrow is its own `<path>`
- no `<text>` outside the plate's declared structural-context group

### Review 2 — anatomical, by a reader who did not draw it

A fresh reader with no memory of drawing the plate, told to assume it contains errors. Order matters:

1. **the rendered picture first** — every beat state, as a student sees it
2. **then the scene** — does what is drawn match what the narration says is on screen
3. **the SVG source last**, and only to locate what the picture already showed

Reading the source first is how you end up checking your intent instead of your output. The reader
judges what a student would MEMORISE, and the standard is an examiner's: would this be marked wrong.

**The drawer never performs review 2 on their own plate in the same pass.** This is not a courtesy rule.
On the first plate, the author reviewed carefully and found three errors and pronounced the result "a
teaching figure". An independent reader found sixteen more, including a notochord drawn as five separate
beads — teaching a segmented notochord, which is the one thing the structure is famous for not being —
and a stage drawn solid in a panel whose own narration warns students not to learn it as solid.
Three versus sixteen, on the same file, on the same day. That ratio is the reason this section exists.

## 4 · What the first plate cost, honestly

One plate. Ten structures. Three drafts.

- draft 1 — wrong scale, unusable
- draft 2 — legible; author's own review found 3 errors and called it good
- independent review — 16 further defects, several of them teaching errors a student would be marked
  wrong for

Budget the review as heavily as the drawing. On this evidence the review is where the quality is, and
first-draft artwork should never be treated as shippable, however careful the drawer was being.

## 5 · Log

Every plate carries, at the top of its file, a comment recording: what it was drawn from, the date of
its last independent review, and who did it. A plate with no recorded review has not been reviewed —
the same rule the scenes carry with `audited_at`, and for the same reason.
