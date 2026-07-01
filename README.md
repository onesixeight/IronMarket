# Эталон Ковка — витрина кованых изделий

Премиальная витрина декоративных кованых изделий с тёмным люкс-дизайном. Сайт работает как **витрина-лидогенератор**: пользователь подбирает элементы в каталоге и отправляет заявку напрямую в WhatsApp/Telegram, оплата — через Kaspi после согласования.

**Сайт:** [etalon-kovka.kz](https://etalon-kovka.kz)

## Стек

- **Vue 3** (Composition API, `<script setup>`)
- **Pinia** (state management)
- **Vue Router 4** (history mode, lazy-загрузка роутов)
- **Tailwind CSS 4** (utility-first + `@theme` переменные)
- **Vite 6** (сборка)
- **PWA** — `manifest.webmanifest` + service worker

## Установка и запуск

```bash
npm install
npm run dev      # dev-сервер на localhost:5173
npm run build    # production-сборка в dist/ (перед сборкой генерируется sitemap.xml)
npm run build:static # static-сборка для Cloudflare Workers Builds без Playwright-prerender
npm run preview  # предпросмотр production-сборки
npm run lint     # ESLint
npm test         # регрессионные тесты (node --test)
npm run test:e2e # Playwright E2E по критическим сценариям
npm run format   # Prettier
```

## Функционал

### Каталог
- **10 категорий**, **172 товара** с фото, ценой, материалом, описанием, размерами и весом
- Фильтрация по категории, цене, названию
- Поиск по каталогу (в шапке + на странице каталога)
- Пагинация (20 товаров на страницу)
- Часть позиций — «Цена по запросу» (`hidePrice`)

### Заявки и оплата
Сайт НЕ содержит онлайн-корзины и онлайн-оплаты — всё через мессенджеры:
- **Заявка по товару** → WhatsApp / Telegram с предзаполненным сообщением
- **Форма на странице контактов** → предзаполняется из `?product=<id>`
- **Оплата через Kaspi** — после подтверждения наличия, количества и доставки
- `/cart`, `/checkout`, `/wishlist` редиректят на каталог/контакты (сохранили SEO-чистоту и внешние ссылки)

### Прочее
- Блок «Способы применения» — 5 фото-примеров с hover-эффектами
- Недавно просмотренные товары (`localStorage`)
- SEO: динамические `<title>`/`description`, canonical, JSON-LD (Product/Organization/ItemList), prerender indexable-страниц, `sitemap.xml`, `robots.txt`
- Доступность: skip-link, ARIA-атрибуты, `prefers-reduced-motion`
- PWA/service worker: hashed JS/CSS чанки Vite добавляются в precache при build
- Плавающий блок мессенджеров + нижняя мобильная навигация

### Дизайн
- Тёмный люкс: угольный фон + золотые акценты
- Shimmer-эффекты на CTA и бейджах
- Cinzel (заголовки) + Manrope (текст)
- Ornamental dividers, glassmorphism, scroll-анимации (`v-reveal`)

## Структура

```
src/
├── assets/main.css            # Дизайн-система
├── components/                # Vue-компоненты
├── composables/               # Composables (SEO, messenger, phone mask, schema, fallback images)
├── config/
│   ├── contacts.js            # телефон, email, адрес, часы, мессенджеры
│   └── site.js                # SITE_ORIGIN, хелперы URL, дефолтные изображения
├── data/catalog.json          # Каталог товаров (единственный источник данных)
├── router/index.js            # Маршруты
├── stores/                    # Pinia stores (products, toast)
└── views/                     # Страницы
public/
├── images/                    # Изображения (products, hero, branding, examples)
├── icons/                     # PWA-иконки, favicon
├── manifest.webmanifest       # PWA-манифест
├── sw.js                      # Service worker
├── sitemap.xml / robots.txt   # Генерируются скриптом при build
└── _headers                   # security/cache headers для статического хостинга
scripts/
├── generate-sitemap.mjs       # prebuild: sitemap.xml + robots.txt с source-based lastmod
├── inject-sw-precache.mjs     # добавляет JS/CSS чанки Vite в service worker precache
├── prerender-routes.mjs       # prerender indexable-страниц в dist/
├── site-routes.mjs            # общий список индексируемых маршрутов
└── import-bizzon-catalog.mjs  # импорт каталога из источника bizzon
```

## Настройка

### Контакты и мессенджеры
Контакты заданы централизованно и должны совпадать во всех местах:
- `src/config/contacts.js` — телефон, email, адрес, часы, WhatsApp и Telegram
- `src/composables/messengerConfig.js` — строит ссылки WhatsApp/Telegram из `contacts.js`
- `src/config/site.js` — `SITE_ORIGIN` (для canonical/sitemap/OG)

Текущие значения: телефон `+7 775 853 70 92`, email `etalonkovka@mail.ru`, адрес `Астана, просп. Богенбай Батыра, 6/4, 16 ряд 14 место`, Telegram `@etalonkovka`.

### Аналитика
Переменные окружения описаны в `.env.example`:
- `VITE_YANDEX_METRIKA_ID`
- `VITE_GOOGLE_ANALYTICS_ID`

Счётчики запускаются только после согласия пользователя на cookies/аналитику.
Основные события без персональных данных: `catalog_open`, `product_open`, `contact_form_open`, `lead_scenario_select`, `lead_whatsapp`, `lead_telegram`. Для Google Analytics заявка также уходит как `generate_lead`, а открытие товара — как `select_item`.

## Проверки качества

Основной набор перед пушем:

```bash
npm test
npm run lint
npm run build
npm run test:e2e
git diff --check
```

E2E покрывает критические сценарии: переход в каталог, поиск, карточку товара с SEO/inquiry-ссылками, закрытие поиска по клику вне панели, форму контактов и плавающие мессенджеры.

### Каталог товаров
Единственный источник — `src/data/catalog.json`. После правок запустите `npm run build` (prebuild перегенерирует `sitemap.xml`).

> ⚠️ У админ-панели на сайте **нет**. Не существует пароля по умолчанию. Все упоминания админки/`admin123` в старых материалах устарели и удалены.
