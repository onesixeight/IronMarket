import assert from 'node:assert/strict'

import { usePhoneMask } from '../src/composables/usePhoneMask.js'

const { formatPhone, onPhoneInput } = usePhoneMask()

// Пустая строка / пробелы → пустой результат.
assert.equal(formatPhone(''), '')
assert.equal(formatPhone('   '), '')

// Одиночная 7/8 (код) → «+7».
assert.equal(formatPhone('7'), '+7')
assert.equal(formatPhone('8'), '+7')

// Реальная логика: ведущая 7/8 отбрасывается, следующие цифры форматируются
// по маске +7 (XXX) XXX-XX-XX. Полный 11-значный номер (7 + 10) → полный формат.
assert.equal(formatPhone('77001234567'), '+7 (700) 123-45-67')
assert.equal(formatPhone('87001234567'), '+7 (700) 123-45-67')

// Частичный ввод добивается маской до текущей длины.
assert.equal(formatPhone('7001'), '+7 (001)')
assert.equal(formatPhone('7001234'), '+7 (001) 234-')
assert.equal(formatPhone('70012345'), '+7 (001) 234-5')

// Ввод сверх 11 цифр обрезается (clamp).
assert.equal(formatPhone('7700123456789'), '+7 (700) 123-45-67')

// onPhoneInput возвращает отформатированное значение и пишет его в input.
const fakeInput = { target: { value: '77001234567' } }
const returned = onPhoneInput(fakeInput)
assert.equal(returned, '+7 (700) 123-45-67')
assert.equal(fakeInput.target.value, '+7 (700) 123-45-67')

console.log('✓ phone-mask: formatPhone + onPhoneInput')
