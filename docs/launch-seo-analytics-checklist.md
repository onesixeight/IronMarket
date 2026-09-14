# Launch SEO + Analytics Checklist

## Search Console / Вебмастер

- Google Search Console: добавить доменное свойство `etalon-kovka.kz`, подтвердить через DNS TXT в Cloudflare.
- Google Search Console: отправить `https://etalon-kovka.kz/sitemap.xml` в Sitemaps.
- Google Search Console: проверить URL Inspection для `/`, `/catalog`, 2-3 товарных страниц.
- Яндекс.Вебмастер: добавить `https://etalon-kovka.kz`, подтвердить владение через DNS или HTML/meta-метод.
- Яндекс.Вебмастер: отправить `https://etalon-kovka.kz/sitemap.xml` в Indexing -> Sitemap files.
- После подтверждения: проверить, что `robots.txt` доступен по `https://etalon-kovka.kz/robots.txt`.

## Analytics Goals

Завести цели без персональных данных:

| Goal / event | Где срабатывает | Зачем |
| --- | --- | --- |
| `catalog_open` | переходы в каталог из hero, шапки, подборок | интерес к ассортименту |
| `product_open` | переход к карточке товара | интерес к конкретной позиции |
| `contact_form_open` | переход к форме заявки | намерение оставить заявку |
| `lead_scenario_select` | выбор сценария в LeadPicker | интерес к типу проекта |
| `lead_whatsapp` | клик WhatsApp | лид в WhatsApp |
| `lead_telegram` | клик Telegram | лид в Telegram |

Google Analytics получает:

- `generate_lead` для заявок в WhatsApp/Telegram.
- `select_item` для перехода к товару.
- custom events: `catalog_open`, `contact_form_open`, `lead_scenario_select`.

Yandex Metrika получает JavaScript event goals через `reachGoal`.

## Content Next

- Проверить 10-15 самых важных товаров: название, материал, описание, изображение, `hidePrice`.
- Добавить реальные фото объектов, если появятся.
- Для популярных товаров держать 4 позиции, которые чаще всего спрашивают в мессенджерах.
- Если появятся цены: обновить каталог и пересобрать `npm run build`, чтобы sitemap lastmod обновился.

## Cloudflare / Prerender

- На проверенном production-сайте `/`, `/catalog` и `/product/6149` отдают готовый HTML с собственными title, canonical и JSON-LD. 14 сентября 2026 года в Cloudflare Workers Builds команда `npm run build:static` заменена на полную `npm run build`, чтобы автоматические выпуски сохраняли этот HTML.
- `npm run build` сохраняет prerender всех индексируемых маршрутов в `dist`. `npm run build:static` остаётся упрощённой сборкой без prerender и не эквивалентен production-сборке для SEO.
- GitHub Actions использует Node 24 LTS и полную историю Git (`fetch-depth: 0`): lint, unit/regression tests, проверку зависимостей, одну полную сборку, затем `verify:seo`, `verify:perf` и E2E. Успешный `dist` сохраняется в артефакт `site-dist-<commit SHA>` на 7 дней; при сбое сохраняются Playwright-отчёт, screenshots, traces и videos.
- Публикацию до проверок блокирует `scripts/verify-github-ci.mjs`. Он читает публичный GitHub API без токена, требует точный `WORKERS_CI_COMMIT_SHA`, ветку `main` и успешный push-запуск `.github/workflows/test.yml`, затем сверяет commit с текущим `main`. Проверка ждёт не более 12 минут с интервалом 60 секунд, учитывает rate-limit headers и прекращает публикацию при ошибках CI/API или смене commit.
- В Cloudflare сохранены Build command `npm run build`, production Deploy command `node scripts/verify-github-ci.mjs && npx wrangler deploy` и preview Version command `npx wrangler versions upload`. Linux-сборка использует закреплённый portable Chromium без системного `apt`/`su`.
- Перед генерацией sitemap в Workers Builds неполная история Git загружается с сохранением текущего commit. Это позволяет брать `lastmod` из изменений файлов каждой страницы, а не присваивать всему каталогу дату сборки.
- Ветка `main` защищена обязательной проверкой `test` от GitHub Actions и актуальностью относительно `main`; правило действует и для администратора. Force push и удаление ветки запрещены.
