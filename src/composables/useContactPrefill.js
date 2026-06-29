import { getProductUrl } from './useProductInquiry.js'

export const contactScenarios = [
  {
    id: 'gates',
    icon: '01',
    title: 'Ворота и калитка',
    desc: 'Узоры, пики, накладки и центральные элементы под входную группу.',
    prompt: 'Нужен подбор элементов для ворот или калитки. Есть примерный стиль, нужно понять комплектацию.',
  },
  {
    id: 'railings',
    icon: '02',
    title: 'Перила',
    desc: 'Балясины, поручни и декоративный ритм для ограждений.',
    prompt: 'Нужен подбор элементов для перил. Важно сохранить аккуратный рисунок и понятный шаг секций.',
  },
  {
    id: 'fences',
    icon: '03',
    title: 'Забор и секции',
    desc: 'Повторяемые элементы, пики и декор для длинных пролётов.',
    prompt: 'Нужны элементы для забора или секций. Хочу подобрать повторяемый рисунок без визуального перегруза.',
  },
  {
    id: 'stairs',
    icon: '04',
    title: 'Лестница',
    desc: 'Детали для внутренней или уличной лестницы, чтобы металл выглядел цельно.',
    prompt: 'Нужны элементы для лестницы. Подскажите, какие позиции лучше сочетать между собой.',
  },
]

export function getContactScenario(id) {
  return contactScenarios.find((scenario) => scenario.id === id) || null
}

export function buildScenarioContactMessage(scenarioOrId) {
  const scenario = typeof scenarioOrId === 'string' ? getContactScenario(scenarioOrId) : scenarioOrId
  if (!scenario) return ''

  return [
    'Здравствуйте! Нужен подбор кованых элементов.',
    `Задача: ${scenario.title}`,
    `Описание: ${scenario.prompt}`,
    '',
    'Подскажите, какие позиции из каталога подойдут и что нужно уточнить для расчёта.',
  ].join('\n')
}

export function buildProductContactMessage(product, options = {}) {
  if (!product) return ''

  return [
    'Здравствуйте! Интересует позиция из каталога:',
    product.name || 'товар из каталога',
    `Материал: ${product.material || 'уточнить'}`,
    `Ссылка: ${getProductUrl(product, options)}`,
    '',
    'Подскажите наличие, количество и доставку.',
  ].join('\n')
}

export function buildCategoryContactMessage(category) {
  if (!category) return ''

  const lines = [
    'Здравствуйте! Интересует категория кованых элементов:',
    category.name || 'категория каталога',
  ]

  if (category.description) {
    lines.push(`Описание: ${category.description}`)
  }

  lines.push('', 'Подскажите подходящие позиции, количество, размеры и город доставки для расчёта.')

  return lines.join('\n')
}

export function buildDeliveryContactMessage() {
  return [
    'Здравствуйте! Хочу уточнить доставку кованых элементов.',
    'Город доставки: ',
    'Что нужно доставить: ',
    'Примерное количество/объём: ',
    '',
    'Подскажите удобный способ доставки и что нужно уточнить для расчёта.',
  ].join('\n')
}

export function buildContactPrefillMessage(options = {}) {
  if (options.product) {
    return buildProductContactMessage(options.product, options)
  }

  if (options.category) {
    return buildCategoryContactMessage(options.category)
  }

  if (options.task) {
    return buildScenarioContactMessage(options.task)
  }

  if (options.topic === 'delivery') {
    return buildDeliveryContactMessage()
  }

  return ''
}
