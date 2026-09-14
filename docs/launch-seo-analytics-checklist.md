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

- На проверенном production-сайте `/`, `/catalog` и `/product/6149` уже отдают готовый HTML с собственными title, canonical и JSON-LD. При этом в Cloudflare Workers Builds обнаружена отдельная настройка `npm run build:static`: следующий автоматический deploy с такой командой может заменить готовый HTML на SPA.
- `npm run build` сохраняет prerender всех индексируемых маршрутов в `dist`. `npm run build:static` остаётся упрощённой сборкой без prerender и не эквивалентен production-сборке для SEO.
- GitHub Actions использует Node 24 LTS: lint, unit/regression tests, проверку зависимостей, одну полную сборку, затем `verify:seo`, `verify:perf` и E2E. Успешный `dist` сохраняется в артефакт `site-dist-<commit SHA>` на 7 дней; при сбое сохраняются Playwright-отчёт, screenshots, traces и videos.
- Для блокировки публикации до проверок подготовлен `scripts/verify-github-ci.mjs`. Он читает публичный GitHub API без токена, требует точный `WORKERS_CI_COMMIT_SHA`, ветку `main` и успешный push-запуск `.github/workflows/test.yml`, затем сверяет commit с текущим `main`. Проверка ждёт не более 12 минут с интервалом 60 секунд, учитывает rate-limit headers и прекращает публикацию при ошибках CI/API или смене commit.
- Подключение в Cloudflare: production Deploy command `node scripts/verify-github-ci.mjs && npx wrangler deploy`. Build command должна сохранять prerender; `build:static` для публикации применять нельзя. Изменение этих настроек выполняется отдельно после проверки полной сборки на хосте. Version command для preview-веток остаётся отдельной от production-проверки.
