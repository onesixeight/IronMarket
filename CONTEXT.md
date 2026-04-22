# CONTEXT — Эталон Ковка

## Проект
**Название:** Эталон Ковка — интернет-магазин кованых изделий
**Стек:** Vue 3 (Composition API) + Pinia + Tailwind CSS 4 + Vite
**Дизайн:** Тёмный люкс — угольный фон + золотые акценты + shimmer-эффекты

---

## Структура проекта

```
src/
├── App.vue                    # Корневой компонент (layout: header + main + footer)
├── main.js                    # Точка входа (Pinia, Router, директива v-reveal)
├── assets/
│   └── main.css               # Дизайн-система, CSS-переменные, анимации, scrollbar
├── components/
│   ├── AppHeader.vue           # Фиксированная навбар (тёмная, с blur)
│   ├── AppFooter.vue           # Футер с брендом и контактами
│   ├── HeroSlider.vue          # Hero-карусель на главной
│   ├── ProductCard.vue         # Карточка товара (каталог, поиск)
│   ├── CartDrawer.vue          # Выдвижная корзина (справа)
│   ├── ContactForm.vue         # Форма заявки (используется на главной и контактах)
│   ├── ApplicationExamples.vue # Блок «Способы применения» (фото из /images/examples/)
│   ├── CustomSelect.vue        # Кастомный select
│   ├── ImageLightbox.vue       # Модальное увеличенное фото
│   ├── Pagination.vue          # Пагинация
│   ├── PriceRange.vue          # Фильтр по цене (слайдер)
│   ├── ProductSkeleton.vue     # Скелетон загрузки
│   ├── ScrollTop.vue           # Кнопка «наверх»
│   └── ToastContainer.vue      # Контейнер уведомлений
├── composables/
│   ├── useSeo.js               # SEO-мета (title, description)
│   ├── useScrollReveal.js      # IntersectionObserver анимация появления
│   ├── usePhoneMask.js         # Маска телефона +7
│   ├── useBreadcrumbs.js       # Хлебные крошки
│   ├── useMessengerOrder.js    # Генерация ссылок WhatsApp/Telegram для заказа
│   └── useAdminGuard.js        # Guard для админ-маршрутов
├── data/
│   └── catalog.json            # Каталог: categories[] + products[]
├── router/
│   └── index.js                # Маршруты (+ /admin/* маршруты)
├── stores/
│   ├── cart.js                 # Корзина (items, addItem, removeItem, totalPrice)
│   ├── products.js             # Товары (фильтрация, поиск, пагинация)
│   ├── wishlist.js             # Избранное
│   ├── toast.js                # Уведомления
│   ├── theme.js                # Тёмная/светлая тема
│   └── admin.js                # Админ: авторизация, CRUD товаров, hidePrice
├── views/
│   ├── HomeView.vue            # Главная (Hero, каталог, популярные, применение, почему мы, дилер)
│   ├── CatalogView.vue         # Каталог (категории + товары + фильтры)
│   ├── CategoryView.vue        # Категория (товары одной категории)
│   ├── ProductView.vue         # Карточка товара (фото, цена, корзина, похожие)
│   ├── CartView.vue            # Корзина (список + сумма)
│   ├── CheckoutView.vue        # Оформление (контакты, доставка, оплата, WhatsApp/Telegram)
│   ├── AboutView.vue           # О компании
│   ├── ContactsView.vue        # Контакты
│   ├── DeliveryView.vue        # Доставка и оплата
│   ├── WishlistView.vue        # Избранное
│   ├── NotFoundView.vue        # 404
│   └── admin/
│       ├── AdminLogin.vue      # Форма авторизации
│       ├── AdminDashboard.vue  # Дашборд
│       ├── AdminProducts.vue   # Список товаров (CRUD)
│       └── AdminProductEdit.vue# Редактирование/создание товара
public/
├── images/
│   ├── products/               # Фото товаров
│   └── examples/               # Фото способов применения
│       ├── app-railings.jpg    # Перила и ограждения
│       ├── app-fences.jpg      # Заборы
│       ├── app-balcony.jpg     # Балконы
│       ├── app-grilles.jpg     # Решётки
│       └── app-gates.jpg       # Ворота
├── icons/
│   └── favicon.svg
```

---

## Дизайн-система «Тёмный Люкс»

### Цветовая палитра (CSS-переменные в @theme):
```
--color-obsidian-950: #060504;   (самый тёмный)
--color-obsidian-900: #0A0908;   (фон body)
--color-obsidian-800: #141210;   (cards, sections)
--color-obsidian-700: #1E1B18;   (elevated elements)
--color-obsidian-600: #2A2622;   (inputs, hover bg)
--color-obsidian-500: #3A3530;   (borders)

--color-gold-50:  #fdf8ef;
--color-gold-100: #f9edda;
--color-gold-200: #f0d5a8;
--color-gold-300: #e4b96d;
--color-gold-400: #c9963b;       (основное золото)
--color-gold-500: #b8860b;       (тёмное золото)
--color-gold-600: #9a6f09;
--color-gold-700: #7d5907;

--color-cream-50:  #faf6ef;
--color-cream-100: #f5f0e8;

--font-heading: 'Cinzel', Georgia, serif;    (заголовки, лого, цены)
--font-body: 'Manrope', system-ui, sans-serif; (основной текст)
```

### Shimmer-эффект:
Анимация золотого блика на: кнопках CTA, бейджах, лого, декоративных элементах.
CSS-класс: `.shimmer` — ключевые кадры двигают золотой gradient.

### Карточки товаров:
- Без рамок (разделение через whitespace)
- Hover: золотая рамка `rgba(201,150,59,0.3)` + lift `-4px` + углубление тени
- 3 колонки на десктопе (люкс-паттерн)

### Кнопки:
- Primary: `border: 1px solid gold; color: gold; bg: transparent` → hover заполняется gold
- CTA: `bg: linear-gradient(135deg, #C9A96E, #D4AF37)` с shimmer

### Ornamental Divider:
`.ornament-line` — горизонтальная золотая линия по бокам заголовка

---

## Данные каталога (catalog.json)

### Категории (10 штук):
categories[] — { id, slug, name, description, image }

### Товары (~60+ штук):
products[] — { id, categorySlug, slug, name, price, image, material, description, badge?, hidePrice? }

### hidePrice:
- Если `hidePrice: true` → клиент видит «Цена по запросу»
- Управляется через админ-панель
- Корзина и чекаут также учитывают скрытые цены

---

## Маршруты

```
/                           → HomeView
/catalog                    → CatalogView
/catalog/:slug              → CategoryView
/product/:id                → ProductView
/cart                       → CartView
/checkout                   → CheckoutView
/about                      → AboutView
/contacts                   → ContactsView
/delivery                   → DeliveryView
/wishlist                   → WishlistView
/admin/login                → AdminLogin
/admin                      → AdminDashboard (защищён)
/admin/products             → AdminProducts (защищён)
/admin/products/new         → AdminProductEdit (защищён)
/admin/products/:id         → AdminProductEdit (защищён)
```

---

## Stores (Pinia)

### cart.js
- items[] (localStorage), addItem(), removeItem(), updateQuantity(), clearCart()
- totalItems, totalPrice (computed)

### products.js
- categories[], allProducts[] (из catalog.json)
- Фильтрация: searchQuery, selectedCategory, sortBy, priceMin, priceMax
- Пагинация: currentPage, perPage (20), totalPages, paginatedProducts
- Методы: getCategoryBySlug, getProductsByCategory, getProductById, getRelatedProducts, searchProducts

### wishlist.js
- items[] (localStorage), toggle(), isWished()

### toast.js
- notifications[], success(), error(), info(), remove()

### theme.js
- dark (boolean), toggle() — сохраняет в localStorage

### admin.js
- isAuthenticated, login(password), logout()
- CRUD: addProduct(), updateProduct(), deleteProduct()
- Данные синхронизируются с localStorage

---

## Оформление через мессенджеры

### useMessengerOrder.js:
Генерирует ссылки:
- WhatsApp: `https://wa.me/{PHONE}?text={encoded_message}`
- Telegram: `https://t.me/{USERNAME}?text={encoded_message}`

Сообщение включает: имя, телефон, состав корзины, сумму заказа, способ доставки.

Плейсхолдеры: WHATSAPP_PHONE и TELEGRAM_USERNAME — заменить на реальные.

---

## Админ-панель

### Авторизация:
- Форма логина с паролем
- Пароль: «admin123» (по умолчанию, хешируется SHA-256)
- Сессия: токен в localStorage
- Guard: редирект на /admin/login если не авторизован

### CRUD:
- Список товаров с фильтрацией по категории
- Добавление нового товара
- Редактирование: название, цена, описание, материал, категория, изображение, badge, hidePrice
- Удаление с подтверждением
- Все изменения сохраняются в localStorage и синхронизируются с products store

---

## Бренд
**Название:** Эталон Ковка
**Логотип:** Текст «ЭТАЛОН» (Cinzel, bold) + «КОВКА» (Cinzel, lighter, letter-spacing)
**Цвет логотипа:** Золотой (#C9A96E)
**Tagline:** «Кованые изделия от производителя»

---

## Паттерны кода
- Composition API (setup script)
- Pinia stores (composition style — defineStore с функцией)
- v-reveal директива для scroll-анимаций
- Tailwind CSS утилиты + @theme переменные
- CSS-классы для форм: .form-input, .form-input-dark
- Анимации: .animate-fade-up, .animate-fade-in, .animate-scale-in
- localStorage для персистентности (корзина, избранное, тема, админ)
