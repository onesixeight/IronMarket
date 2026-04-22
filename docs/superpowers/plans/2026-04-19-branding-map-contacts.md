# Branding, Contacts Map, and Schedule Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the compact site mark, unify the public work schedule, and add an embedded contact map without changing the broader frontend structure.

**Architecture:** Keep this as a narrow UI/content pass. Generate one new compact branding asset, wire it into the existing header/favicon/preloader touchpoints, then update only the contact-facing schedule blocks and add one styled map card to the contacts page.

**Tech Stack:** Vue 3, Vite, Tailwind utility classes, static public assets, lightweight Node assert regression tests, Playwright browser verification, built-in `image_gen`.

---

## File Structure

- Modify: `D:\Сайт для продаж\src\components\AppHeader.vue`
  Responsibility: swap the current inline icon for the new compact branding asset while preserving the existing header layout.
- Modify: `D:\Сайт для продаж\src\components\AppFooter.vue`
  Responsibility: unify the public schedule copy and keep footer content aligned with the approved wording.
- Modify: `D:\Сайт для продаж\src\views\ContactsView.vue`
  Responsibility: unify the schedule copy and add the styled embedded map block for the Astana address.
- Modify: `D:\Сайт для продаж\index.html`
  Responsibility: point favicon/preloader to the new branding mark and keep metadata intact.
- Create: `D:\Сайт для продаж\public\images\branding\brand-mark-ornament.png`
  Responsibility: final compact ornamental mark used by the header and preloader.
- Create: `D:\Сайт для продаж\public\icons\favicon-brand-mark.png`
  Responsibility: favicon-sized export derived from the same compact mark.
- Create: `D:\Сайт для продаж\tests\branding-contacts-regression.test.js`
  Responsibility: assert the new asset wiring, updated schedule wording, and map embed presence.

### Task 1: Create and wire the compact brand mark

**Files:**
- Create: `D:\Сайт для продаж\public\images\branding\brand-mark-ornament.png`
- Create: `D:\Сайт для продаж\public\icons\favicon-brand-mark.png`
- Modify: `D:\Сайт для продаж\src\components\AppHeader.vue`
- Modify: `D:\Сайт для продаж\index.html`

- [ ] **Step 1: Write the failing regression test**

```js
import assert from 'node:assert/strict'
import fs from 'node:fs'

const header = fs.readFileSync(new URL('../src/components/AppHeader.vue', import.meta.url), 'utf8')
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8')

assert.match(header, /brand-mark-ornament\.png/, 'Header should use the new compact branding asset')
assert.match(html, /favicon-brand-mark\.png/, 'Index HTML should point favicon to the new brand mark export')
assert.doesNotMatch(header, /M12 2L2 7l10 5 10-5/, 'Header should no longer use the old layered inline mark')
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests\branding-contacts-regression.test.js`

Expected: FAIL because the test file does not exist yet or because the old inline mark is still present.

- [ ] **Step 3: Generate the new mark asset**

Use built-in `image_gen` with a prompt in this shape:

```text
Use case: logo-brand
Asset type: website brand mark
Primary request: a compact ornamental wrought-iron swirl emblem for a premium forged-elements seller
Style/medium: vector-friendly luxury emblem, centered symbol, dark square background, warm brass-gold mark
Composition/framing: single strong swirl, minimal detail overload, readable at favicon size
Constraints: no text, no watermark, no extra objects, premium and clean
Avoid: hammers, anvils, shields, generic construction branding
```

Save the selected final into:

```text
public/images/branding/brand-mark-ornament.png
public/icons/favicon-brand-mark.png
```

- [ ] **Step 4: Replace the header mark with the new asset**

Update the header mark block in `src/components/AppHeader.vue` to use an image instead of the current inline SVG:

```vue
<div class="flex h-11 w-11 items-center justify-center rounded-2xl border border-gold-400/20 bg-gold-400/8">
  <img
    src="/images/branding/brand-mark-ornament.png"
    alt="Эталон Ковка"
    class="h-7 w-7 object-contain"
  />
</div>
```

Keep the surrounding header structure unchanged.

- [ ] **Step 5: Point favicon and preloader to the new mark**

Update `index.html` so the favicon uses the new export and the preloader mark uses the same image:

```html
<link rel="icon" type="image/png" href="/icons/favicon-brand-mark.png" />
```

```html
<div class="preloader-mark">
  <img src="/images/branding/brand-mark-ornament.png" alt="" width="34" height="34" />
</div>
```

Add supporting CSS only if needed to preserve the existing loader sizing:

```css
#preloader img {
  width: 34px;
  height: 34px;
  object-fit: contain;
}
```

- [ ] **Step 6: Re-run the regression test**

Run: `node tests\branding-contacts-regression.test.js`

Expected: PASS for the branding assertions.

- [ ] **Step 7: Commit**

```bash
git add public/images/branding/brand-mark-ornament.png public/icons/favicon-brand-mark.png src/components/AppHeader.vue index.html tests/branding-contacts-regression.test.js
git commit -m "feat: replace compact brand mark"
```

### Task 2: Unify the public schedule wording

**Files:**
- Modify: `D:\Сайт для продаж\src\components\AppFooter.vue`
- Modify: `D:\Сайт для продаж\src\views\ContactsView.vue`
- Modify: `D:\Сайт для продаж\tests\branding-contacts-regression.test.js`

- [ ] **Step 1: Extend the regression test with schedule assertions**

Append assertions to `tests/branding-contacts-regression.test.js`:

```js
const footer = fs.readFileSync(new URL('../src/components/AppFooter.vue', import.meta.url), 'utf8')
const contacts = fs.readFileSync(new URL('../src/views/ContactsView.vue', import.meta.url), 'utf8')

assert.match(footer, /Пн-Вс: 9:00-18:00/, 'Footer should show the unified weekly schedule')
assert.match(footer, /Без выходных/, 'Footer should show the no-days-off note')
assert.match(contacts, /Пн-Вс: 9:00-18:00/, 'Contacts view should show the unified weekly schedule')
assert.match(contacts, /Без выходных/, 'Contacts view should show the no-days-off note')
```

- [ ] **Step 2: Run the regression test to verify it fails**

Run: `node tests\branding-contacts-regression.test.js`

Expected: FAIL because the footer and contacts view still contain the older split schedule wording.

- [ ] **Step 3: Update the footer schedule copy**

Replace the old schedule block in `src/components/AppFooter.vue` with:

```vue
<div class="space-y-4 text-sm text-cream-100/70">
  <a href="mailto:info@example.com" class="footer-link block">info@example.com</a>
  <div>Пн-Вс: 9:00-18:00</div>
  <div class="text-cream-100/42">Без выходных</div>
</div>
```

Remove the old weekday/weekend split lines.

- [ ] **Step 4: Update the contacts page schedule copy**

Replace the schedule lines in `src/views/ContactsView.vue` with:

```vue
<div class="grid gap-1 text-sm text-cream-100/62">
  <div>Пн-Вс: 9:00-18:00</div>
  <div>Без выходных</div>
</div>
```

- [ ] **Step 5: Re-run the regression test**

Run: `node tests\branding-contacts-regression.test.js`

Expected: PASS for the schedule assertions.

- [ ] **Step 6: Commit**

```bash
git add src/components/AppFooter.vue src/views/ContactsView.vue tests/branding-contacts-regression.test.js
git commit -m "feat: unify public work schedule"
```

### Task 3: Add the embedded map to contacts

**Files:**
- Modify: `D:\Сайт для продаж\src\views\ContactsView.vue`
- Modify: `D:\Сайт для продаж\tests\branding-contacts-regression.test.js`

- [ ] **Step 1: Extend the regression test with map assertions**

Append assertions to `tests/branding-contacts-regression.test.js`:

```js
assert.match(contacts, /Астана, просп\\. Богенбай Батыра, 6\\/4/, 'Contacts page should show the Astana address above the map')
assert.match(contacts, /iframe/, 'Contacts page should embed a map iframe')
assert.match(contacts, /yandex/i, 'Contacts page should use a Yandex map embed')
```

- [ ] **Step 2: Run the regression test to verify it fails**

Run: `node tests\branding-contacts-regression.test.js`

Expected: FAIL because the contacts page does not yet include the approved map block.

- [ ] **Step 3: Add the map card to the contacts layout**

Insert a new map panel below the form/support content in `src/views/ContactsView.vue`:

```vue
<div class="surface-panel rounded-[2rem] p-6 sm:p-8" v-reveal="0.16">
  <div class="text-xs uppercase tracking-[0.18em] text-gold-300 mb-3">Адрес</div>
  <h3 class="font-heading text-2xl text-cream-100">Астана, просп. Богенбай Батыра, 6/4</h3>
  <p class="text-sm text-cream-100/58 leading-relaxed mt-4">
    Приезжайте по адресу или заранее напишите, чтобы мы подготовили подборку позиций под ваш проект.
  </p>
  <div class="mt-6 overflow-hidden rounded-[1.5rem] border border-gold-400/12 bg-obsidian-950/72">
    <iframe
      src="YANDEX_EMBED_URL"
      title="Карта: Астана, просп. Богенбай Батыра, 6/4"
      class="h-[320px] w-full border-0 sm:h-[380px]"
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
      allowfullscreen
    ></iframe>
  </div>
</div>
```

Replace `YANDEX_EMBED_URL` with the final embed URL for the approved address.

- [ ] **Step 4: Re-run the regression test**

Run: `node tests\branding-contacts-regression.test.js`

Expected: PASS for the map assertions.

- [ ] **Step 5: Run existing verification commands**

Run:

```bash
node tests\branding-contacts-regression.test.js
node tests\mobile-menu-regression.test.js
node tests\product-navigation-regression.test.js
node tests\messenger-links.test.js
npm.cmd run build
```

Expected:
- all Node regression tests PASS
- Vite build completes successfully

- [ ] **Step 6: Browser verification**

Open the local site and verify:

```text
1. Header shows the new compact ornamental mark.
2. Favicon updates in the tab.
3. Contacts page shows the new schedule wording.
4. Contacts page renders the embedded map card cleanly on desktop and mobile.
```

- [ ] **Step 7: Commit**

```bash
git add src/views/ContactsView.vue tests/branding-contacts-regression.test.js
git commit -m "feat: add Astana map to contacts"
```

## Self-Review

- Spec coverage: covered all three approved items: compact mark, unified schedule, embedded map.
- Placeholder scan: the only intentional placeholder is `YANDEX_EMBED_URL`, which must be replaced during implementation with the concrete embed URL for the approved address.
- Type consistency: all tasks keep the existing Vue single-file component structure and reuse the current Node assert regression pattern already present in `tests/`.
