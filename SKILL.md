# SKILL.md — Кованые изделия: Интернет-магазин

## Проект
Полноценный интернет-магазин кованых изделий, элементов и узоров.
Статический фронтенд на Vue.js 3 с каталогом товаров, корзиной и оформлением заказа.

## Технологический стек
- **Vue.js 3** (Composition API + `<script setup>`)
- **Vite** — сборщик
- **Tailwind CSS v4** — стилизация (через `@tailwindcss/vite`)
- **Pinia** — стейт-менеджмент (корзина, каталог)
- **Vue Router 4** — маршрутизация (history mode)

## Команды
```bash
npm run dev      # Запуск dev-сервера (http://localhost:5173)
npm run build    # Сборка для продакшена (→ dist/)
npm run preview  # Превью собранной сборки
```

## Структура
```
src/
├── assets/main.css      # Tailwind + кастомные стили + тема
├── components/           # Переиспользуемые компоненты
│   ├── AppHeader.vue     # Шапка с навигацией и корзиной
│   ├── AppFooter.vue     # Подвал
│   ├── CartDrawer.vue    # Боковая панель корзины
│   ├── ContactForm.vue   # Форма обратной связи
│   ├── HeroSlider.vue    # Слайдер на главной
│   └── ProductCard.vue   # Карточка товара
├── data/
│   └── catalog.json      # Весь каталог товаров (10 категорий, ~80+ товаров)
├── router/index.js       # Маршруты
├── stores/
│   ├── cart.js            # Pinia store корзины (localStorage persistence)
│   └── products.js        # Pinia store каталога (фильтры, поиск, сортировка)
├── views/                 # Страницы
│   ├── HomeView.vue       # Главная
│   ├── CatalogView.vue    # Каталог (все товары + фильтры)
│   ├── CategoryView.vue   # Категория товаров
│   ├── ProductView.vue    # Карточка товара
│   ├── CartView.vue       # Корзина
│   ├── CheckoutView.vue   # Оформление заказа
│   ├── AboutView.vue      # О компании
│   ├── ContactsView.vue   # Контакты
│   └── DeliveryView.vue   # Доставка и оплата
├── App.vue                # Root компонент
└── main.js                # Entry point
```

## Дизайн-система
- **Цвета**: gold-* (золотые акценты), iron-* (тёмно-серые), forge-* (оранжевые)
- **Шрифты**: Playfair Display (заголовки), Inter (основной текст)
- **Все кастомные цвета определены через `@theme` в `src/assets/main.css`**

## Данные каталога
Каталог хранится в `src/data/catalog.json`. Формат:
```json
{
  "categories": [{ "id", "slug", "name", "description", "image" }],
  "products": [{ "id", "categorySlug", "slug", "name", "price", "image", "material", "description", "badge?" }]
}
```

## Что нужно настроить перед запуском
1. **Контакты** — заменить плейсхолдеры в `AppFooter.vue` и `ContactsView.vue` (телефон, email, адрес)
2. **Изображения** — товары используют изображения с bizzon.pro (внешние URL). Для продакшена скачайте их в `public/images/products/`
3. **Формы** — формы (ContactForm, Checkout) показывают успех локально. Для продакшена подключите бэкенд/API
4. **Мета-теги** — обновите в `index.html`

## Маршруты
| Путь | Страница |
|------|----------|
| `/` | Главная |
| `/catalog` | Каталог (все товары + фильтры) |
| `/catalog/:slug` | Категория товаров |
| `/product/:id` | Карточка товара |
| `/cart` | Корзина |
| `/checkout` | Оформление заказа |
| `/about` | О компании |
| `/contacts` | Контакты |
| `/delivery` | Доставка и оплата |

## Ключевые особенности
- Полностью статический — не нужен бэкенд для каталога
- Корзина сохраняется в localStorage
- Адаптивная мобильная версия
- Поиск и фильтрация по каталогу
- Сортировка по названию и цене
- Lazy-loading изображений
- Плавные анимации переходов
