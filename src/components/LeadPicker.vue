<template>
  <section class="section-shell py-20 lg:py-28">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="project-picker rounded-[2rem] p-6 sm:p-8 lg:p-10" v-reveal>
        <div class="project-picker-layout">
          <div class="project-picker-copy">
            <div class="eyebrow project-picker-eyebrow mb-5">Быстрый подбор</div>
            <h2 class="section-title text-3xl sm:text-4xl leading-tight">
              Не знаете, с чего начать? Выберите задачу, а сообщение соберётся само.
            </h2>
            <p class="section-lead mt-4 text-sm sm:text-base">
              Без корзины и оплаты: просто короткий запрос в мессенджер. Мы уточним размеры, количество, город и подскажем подходящие элементы.
            </p>

            <div class="selected-scenario-card rounded-[1.5rem] border border-gold-400/12 bg-obsidian-950/46 p-5">
              <div class="text-xs uppercase tracking-[0.2em] text-gold-300/76">{{ selectedScenario ? 'Вы выбрали' : 'Начните с выбора' }}</div>
              <h3 class="mt-2 font-heading text-2xl text-cream-100">{{ selectedScenarioTitle }}</h3>
              <p class="mt-3 text-sm leading-relaxed text-cream-100/58">{{ selectedScenarioPrompt }}</p>
            </div>
          </div>

          <div class="project-picker-panel">
            <div class="scenario-grid">
              <button
                v-for="scenario in projectScenarios"
                :key="scenario.id"
                type="button"
                class="scenario-card"
                :class="{ 'scenario-card-active': scenario.id === selectedId }"
                :aria-pressed="scenario.id === selectedId"
                @click="selectedId = scenario.id"
              >
                <span class="scenario-card-icon">{{ scenario.icon }}</span>
                <span class="scenario-card-content">
                  <span class="scenario-card-title">{{ scenario.title }}</span>
                  <span class="scenario-card-desc">{{ scenario.desc }}</span>
                </span>
              </button>
            </div>

            <div class="picker-actions">
              <a
                :href="getScenarioWhatsAppLink(selectedScenario)"
                target="_blank"
                rel="noopener noreferrer"
                class="picker-action metal-button justify-center"
              >
                Написать в WhatsApp
              </a>
              <a
                :href="getScenarioTelegramLink(selectedScenario)"
                target="_blank"
                rel="noopener noreferrer"
                class="picker-action metal-button-ghost justify-center"
              >
                Telegram
              </a>
              <router-link
                :to="selectedContactRoute"
                class="picker-action inline-flex items-center justify-center rounded-xl border border-cream-100/10 bg-cream-100/5 px-5 py-3 text-sm font-medium text-cream-100/72 transition-all duration-300 hover:border-gold-300/30 hover:bg-gold-400/8 hover:text-gold-300"
              >
                Заполнить форму
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { buildTelegramLink, buildWhatsAppLink } from '../composables/messengerConfig.js'
import { buildScenarioContactMessage, contactScenarios } from '../composables/useContactPrefill.js'

const projectScenarios = contactScenarios

const defaultPickerMessage = [
  'Здравствуйте! Нужен подбор кованых элементов.',
  'Пока не выбрал точную задачу, хочу понять, какие позиции из каталога подойдут под мой проект.',
  '',
  'Подскажите, что нужно уточнить для расчёта.',
].join('\n')

const selectedId = ref(null)
const selectedScenario = computed(
  () => projectScenarios.find((scenario) => scenario.id === selectedId.value) || null
)
const selectedScenarioTitle = computed(() => selectedScenario.value?.title || 'Выберите задачу справа')
const selectedScenarioPrompt = computed(() => (
  selectedScenario.value?.prompt
  || 'Нажмите на подходящий сценарий, и мы подставим его в сообщение для заявки.'
))
const selectedContactRoute = computed(() => (
  selectedScenario.value
    ? { path: '/contacts', query: { task: selectedScenario.value.id } }
    : { path: '/contacts' }
))

function buildScenarioMessage(scenario) {
  return scenario ? buildScenarioContactMessage(scenario) : defaultPickerMessage
}

function getScenarioWhatsAppLink(scenario) {
  return buildWhatsAppLink(buildScenarioMessage(scenario))
}

function getScenarioTelegramLink(scenario) {
  return buildTelegramLink(buildScenarioMessage(scenario))
}
</script>

<style scoped>
.project-picker {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(201, 150, 59, 0.12);
  background:
    radial-gradient(circle at 16% 12%, rgba(201, 150, 59, 0.16), transparent 34%),
    radial-gradient(circle at 86% 16%, rgba(255, 255, 255, 0.06), transparent 28%),
    linear-gradient(135deg, rgba(20, 18, 16, 0.98), rgba(8, 7, 6, 0.98));
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.36);
}

.project-picker::after {
  content: '';
  position: absolute;
  inset: auto -12% -48% 24%;
  height: 13rem;
  border-radius: 999px;
  background: rgba(201, 150, 59, 0.1);
  filter: blur(42px);
  pointer-events: none;
}

.project-picker > * {
  position: relative;
  z-index: 1;
}

.project-picker-layout {
  display: grid;
  gap: 2rem;
  align-items: stretch;
}

.project-picker-copy,
.project-picker-panel {
  min-width: 0;
}

.project-picker-copy {
  display: flex;
  flex-direction: column;
}

.project-picker-eyebrow {
  align-self: flex-start;
  inline-size: fit-content;
  max-inline-size: 100%;
}

.selected-scenario-card {
  margin-top: 2rem;
}

.project-picker-panel {
  display: grid;
  gap: 1.5rem;
  align-content: start;
}

.scenario-grid {
  display: grid;
  grid-auto-rows: 1fr;
  gap: 0.85rem;
}

.scenario-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  width: 100%;
  min-height: 8.25rem;
  height: 100%;
  padding: 1.1rem;
  text-align: left;
  border-radius: 1.35rem;
  border: 1px solid rgba(201, 150, 59, 0.1);
  background: rgba(10, 9, 8, 0.54);
  transition: transform 0.25s ease, border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;
}

.scenario-card:hover,
.scenario-card:focus-visible {
  transform: translateY(-2px);
  border-color: rgba(201, 150, 59, 0.28);
  background: rgba(201, 150, 59, 0.08);
  box-shadow: 0 18px 38px rgba(0, 0, 0, 0.28);
  outline: none;
}

.scenario-card-active {
  border-color: rgba(212, 175, 55, 0.58);
  background: linear-gradient(135deg, rgba(201, 150, 59, 0.16), rgba(10, 9, 8, 0.66));
}

.scenario-card-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  flex: 0 0 auto;
  border-radius: 1rem;
  border: 1px solid rgba(201, 150, 59, 0.2);
  color: rgb(212, 175, 55);
  font-family: var(--font-heading);
  background: rgba(201, 150, 59, 0.08);
}

.scenario-card-content {
  display: grid;
  gap: 0.45rem;
  min-width: 0;
  align-content: start;
}

.scenario-card-title {
  font-family: var(--font-heading);
  font-size: 1.35rem;
  line-height: 1.1;
  color: rgb(248, 241, 224);
}

.scenario-card-desc {
  font-size: 0.86rem;
  line-height: 1.55;
  color: rgba(248, 241, 224, 0.56);
}

.picker-actions {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

.picker-action {
  width: 100%;
  min-height: 3.25rem;
  white-space: nowrap;
}

@media (min-width: 640px) {
  .scenario-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .picker-actions {
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.82fr) minmax(0, 0.95fr);
  }
}

@media (min-width: 1280px) {
  .project-picker-layout {
    grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
  }

  .selected-scenario-card {
    margin-top: auto;
  }

  .project-picker-panel {
    grid-template-rows: 1fr auto;
  }
}

@media (max-width: 420px) {
  .scenario-card {
    min-height: auto;
  }

  .picker-action {
    white-space: normal;
  }
}
</style>
