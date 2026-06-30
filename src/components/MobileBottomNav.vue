<template>
  <nav class="mobile-bottom-nav lg:hidden" aria-label="Быстрая навигация">
    <div class="mobile-bottom-nav__glow" aria-hidden="true"></div>

    <router-link
      v-for="item in navItems"
      :key="item.label"
      :to="item.to"
      class="mobile-bottom-nav__item"
      :class="{ 'is-active': isActive(item), 'is-primary': item.primary }"
      :aria-current="isActive(item) ? 'page' : undefined"
    >
      <span class="mobile-bottom-nav__icon" aria-hidden="true">
        <svg v-if="item.icon === 'home'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 10.75 12 4l8.25 6.75" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M5.75 9.5v9.25h4.5v-5h3.5v5h4.5V9.5" />
        </svg>
        <svg v-else-if="item.icon === 'catalog'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.75 5.75h14.5M4.75 12h14.5M4.75 18.25h14.5" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 4.5v15M16 4.5v15" opacity=".65" />
        </svg>
        <svg v-else-if="item.icon === 'lead'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
          <path stroke-linecap="round" stroke-linejoin="round" d="M7.25 6.75h9.5v10.5h-9.5z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.25 9.75h5.5M9.25 12h5.5M9.25 14.25h3" />
          <path stroke-linecap="round" stroke-linejoin="round" d="m6.5 18.25-2 2M17.5 18.25l2 2" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 7.25h10.75v9.5H4.5z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.25 10h2.85l1.4 2.25v4.5h-4.25z" />
          <circle cx="8" cy="18" r="1.5" />
          <circle cx="17" cy="18" r="1.5" />
        </svg>
      </span>
      <span class="mobile-bottom-nav__label">{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const activePath = computed(() => route.path)

const navItems = [
  {
    to: '/',
    label: 'Главная',
    icon: 'home',
    match: (path) => path === '/',
  },
  {
    to: '/catalog',
    label: 'Каталог',
    icon: 'catalog',
    match: (path) => path.startsWith('/catalog') || path.startsWith('/product'),
  },
  {
    to: '/contacts',
    label: 'Заявка',
    icon: 'lead',
    primary: true,
    match: (path) => path === '/contacts',
  },
  {
    to: '/delivery',
    label: 'Доставка',
    icon: 'delivery',
    match: (path) => path === '/delivery',
  },
]

function isActive(item) {
  return item.match(activePath.value)
}
</script>

<style scoped>
.mobile-bottom-nav {
  position: fixed;
  right: 0.75rem;
  bottom: calc(0.75rem + env(safe-area-inset-bottom));
  left: 0.75rem;
  z-index: 50;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.35rem;
  padding: 0.42rem;
  border: 1px solid rgba(201, 150, 59, 0.18);
  border-radius: 1.65rem;
  background:
    linear-gradient(180deg, rgba(20, 18, 16, 0.88), rgba(6, 5, 4, 0.94)),
    radial-gradient(circle at 50% -20%, rgba(201, 150, 59, 0.28), transparent 58%);
  box-shadow:
    0 22px 70px rgba(0, 0, 0, 0.54),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(20px);
}

.mobile-bottom-nav__glow {
  position: absolute;
  inset: -1px;
  z-index: -1;
  border-radius: inherit;
  background: linear-gradient(90deg, transparent, rgba(201, 150, 59, 0.32), transparent);
  opacity: 0.34;
  pointer-events: none;
}

.mobile-bottom-nav__item {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 3.55rem;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 0.24rem;
  border-radius: 1.2rem;
  color: rgba(245, 240, 232, 0.66);
  transition:
    transform 0.22s ease,
    color 0.22s ease,
    background-color 0.22s ease,
    box-shadow 0.22s ease;
}

.mobile-bottom-nav__item:active {
  transform: scale(0.96);
}

.mobile-bottom-nav__item.is-active {
  color: rgba(244, 201, 112, 1);
  background: rgba(201, 150, 59, 0.1);
}

.mobile-bottom-nav__item.is-primary {
  min-height: 3.85rem;
  transform: translateY(-0.38rem);
  color: #080706;
  background: linear-gradient(135deg, #c9963b, #e4b96d 52%, #b7763e);
  box-shadow: 0 12px 26px rgba(201, 150, 59, 0.25);
}

.mobile-bottom-nav__item.is-primary:active {
  transform: translateY(-0.38rem) scale(0.96);
}

.mobile-bottom-nav__item.is-primary.is-active {
  color: #060504;
  box-shadow: 0 16px 34px rgba(201, 150, 59, 0.34);
}

.mobile-bottom-nav__icon {
  display: grid;
  width: 1.35rem;
  height: 1.35rem;
  place-items: center;
}

.mobile-bottom-nav__icon svg {
  width: 100%;
  height: 100%;
}

.mobile-bottom-nav__label {
  max-width: 100%;
  overflow: hidden;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@supports not (backdrop-filter: blur(20px)) {
  .mobile-bottom-nav {
    background: rgba(6, 5, 4, 0.98);
  }
}

@media (min-width: 1024px) {
  .mobile-bottom-nav {
    display: none;
  }
}
</style>
