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

- Текущий Cloudflare build использует `npm run build:static`, потому что Cloudflare Workers Builds не устанавливает системные зависимости Playwright.
- Полный `npm run build` сохраняет prerender 187 индексируемых маршрутов для локальной/CI-проверки.
- Если нужен максимум SEO на Cloudflare, следующий шаг: отдельный GitHub Actions deploy с prerendered `dist`.
