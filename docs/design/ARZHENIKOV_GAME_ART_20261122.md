# Game art production brief — 22 November 2026

The owner explicitly requested higher-quality graphics resembling contemporary children's games. The selected direction is a cohesive sculpted 3D toy world with teal, coral and gold, clear silhouettes, rounded controls and a compact phone entrance. Generated illustration is decorative; mathematical quantities are individual DOM tokens and capacity slots.

## Selected assets and provenance

All three images were generated with the built-in image generation tool, not a separately configured API or paid external review. They are original project assets with RGBA transparency. The selected originals were copied unchanged into the project.

| File under trainers/oge-basics/multiplication-division/ | Purpose |
|---|---|
| arzhenikov-world-atlas.png | Nine decorative location dioramas, a 3×3 atlas |
| arzhenikov-object-atlas.png | One atlas with a 6×8 layout of countable inventory objects and the fox companion |
| arzhenikov-peach.png | A separately generated, inspected single peach |

The object atlas's peach cell depicts a pair, so that cell is deliberately excluded from the renderer. The separate image preserves one visible fruit per countable token. All other token silhouettes were inspected. The atlas order and aliases are explicit in arzhenikov-art.js. If an image fails to load, the original readable symbol remains visible.

## Final prompt set

### World atlas

Use case: stylized-concept. Asset type: ONE production game-art sprite atlas for a modern children's mathematics adventure, square 1536x1536 canvas, genuinely transparent background. Create a cohesive, exceptionally polished 3D toy-world atlas, exactly 3 columns x 3 rows of equal square cells. Each cell holds one centered miniature diorama, with generous transparent margin and no overlap into neighboring cells; each diorama uses at most 75 percent of its cell. Soft sculpted shapes, high quality ambient occlusion, lovely material shading, tactile clay and painted wood, sophisticated vivid teal, coral, golden yellow and fresh mint accents. A contemporary premium cozy videogame aesthetic for children aged 7–11, charming but not babyish. Identical isometric three-quarter camera and light direction in every cell. Top row left to right: (1) picnic basket and red checked picnic blanket beneath a little leafy tree, (2) a playful park slide with a small climbing frame, (3) cheerful small schoolhouse with a bell and teal roof. Middle row left to right: (4) colorful artist's workshop with easel and wooden toy wheel, (5) cozy bakery kitchen with a golden oven and mixing bowl, (6) lush tiny garden with flowers and raised plant bed. Bottom row left to right: (7) small theatre with rich coral curtains and a gold star, (8) adventurous camping tent with backpack and pine tree, (9) a turquoise harbor with a small ferry, wooden dock and shipping crate. Each scene sits on its own small rounded floating grassy or wooden island base. No text, no letters, no numbers, no interface, no badges, no people, no watermark, no white background, no shared landscape between cells. This is decorative game art; do not attempt a mathematical diagram. Crisp small-scale readability, delightful silhouettes, professional mobile game production art, each cell centered and clearly separated.

### Object atlas

Use case: stylized-concept. Asset type: ONE production sprite-atlas image for the countable objects of a premium children's mathematics game. Portrait canvas in a 3:4 ratio, 1536x2048 preferred, exactly 6 columns by 8 rows of equal cells. Genuine transparent background, no lines or colored cell backgrounds. Exactly ONE distinct centered object in each cell, occupying about 60% of its cell with generous completely transparent gutters, no object crossing a cell edge. Art style: exceptionally polished modern 3D toy-game inventory, clean readable silhouettes, rounded geometry, tactile smooth clay and wood, sophisticated teal/coral/gold accents, soft dimensional shading and subtle ambient occlusion. Consistent front three-quarter view, same light direction, attractive and coherent rather than miscellaneous emoji. No typography, no numbers, no logos, no watermark, no shadows extending beyond cells. Every subject is one individual countable item; no piles or duplicates.

Cell subjects, in reading order, strictly six per row:

- Row1: one red apple with leaf; one sandwich; one cream-and-teal drinking mug; one orange tangerine; one strawberry; one silver spoon.
- Row2: one coral drawing crayon; one small orange sports cone; one blue throwing hoop; one soccer ball; one golden five-point star; one turquoise sand bucket.
- Row3: one yellow pencil; one small framed landscape drawing; one closed green book; one single blank sheet of paper; one red horseshoe magnet; one teal playing card with a simple star emblem.
- Row4: one round glossy blue bead with a small threading hole; one black toy wheel; one softly shining golden star ornament; one tied coral ribbon bow; one candle; one small red triangular flag on its short stick.
- Row5: one golden small pancake; one potato; one round chocolate-chip cookie; one green pear; one slice of bread; one sunflower on a short green stem.
- Row6: one white daisy with a yellow center; one coral tulip on a short stem; one peach; one carrot; one tiny two-leaf sprout; one golden blank admission ticket.
- Row7: one round teal sewing button; one small wooden chair; one coral rose; one cute teddy-bear toy; one coral balloon with a short string; one small teal flashlight.
- Row8: one teal-and-gold battery; one landscape postcard; one sealed food tin; one folded adventure map; one small wooden shipping crate; one charming fox courier character holding a little letter, mint cap and small satchel, friendly face.

Keep all 48 cells present, precisely regular, separated and visually consistent. The fox is one character, and every other cell is exactly one item. No UI mockup, no scene, no text, no extra decorative sparkles or confetti.

### Correct single-peach asset

Use case: stylized-concept. Asset type: one countable inventory icon in a modern children's mathematics game. A SINGLE whole peach, and only ONE peach, with one small green leaf and short stem, isolated on a genuinely transparent square canvas. No second peach, no cut half, no fruit in background, no grouping, no repeated objects, no base. Exceptionally polished premium 3D toy-game style, rounded recognizable peach shape with a delicate center crease, warm coral-orange blushing skin, subtle velvety material, gentle studio highlights and soft dimensional shading. Consistent front three-quarter view, upper-left light, clean crisp silhouette. Centered object occupies about70 percent of canvas, generous transparent margins. Friendly contemporary cozy videogame aesthetic, not flat emoji or watercolor. No letters, numbers, UI, watermark or decorations. Mathematical requirement: the illustration must unambiguously depict exactly ONE fruit.

## UI integration constraints

- No generated number labels or mathematical diagrams; the game renders exact counts and equations.
- One short arrival animation is applied only to the item just moved. Reduced-motion preference disables it.
- Phone controls stay at least 44px; task text remains readable. The city map collapses before gameplay on narrow screens.
- Postcards mark completed places, not independently measured mastery. The city counter, port missions and garden evidence remain distinct.
