import assert from 'node:assert/strict'

import { usePhoneMask } from '../src/composables/usePhoneMask.js'

const { formatPhone, formatPhoneInputEvent, normalizePhoneDigits, onPhoneInput } = usePhoneMask()

function createInputEvent(value, selectionStart = value.length) {
  return {
    target: {
      value,
      selectionStart,
      selectionEnd: selectionStart,
      setSelectionRange(start, end) {
        this.selectionStart = start
        this.selectionEnd = end
      },
    },
  }
}

assert.equal(normalizePhoneDigits(''), '')
assert.equal(normalizePhoneDigits('   '), '')
assert.equal(normalizePhoneDigits('+7 (700) 123-45-67'), '7001234567')
assert.equal(normalizePhoneDigits('8700123456789'), '7001234567')

assert.equal(formatPhone(''), '')
assert.equal(formatPhone('   '), '')
assert.equal(formatPhone('7'), '+7')
assert.equal(formatPhone('8'), '+7')
assert.equal(formatPhone('77001234567'), '+7 (700) 123-45-67')
assert.equal(formatPhone('87001234567'), '+7 (700) 123-45-67')
assert.equal(formatPhone('7001'), '+7 (001)')
assert.equal(formatPhone('7001234'), '+7 (001) 234-')
assert.equal(formatPhone('70012345'), '+7 (001) 234-5')
assert.equal(formatPhone('7700123456789'), '+7 (700) 123-45-67')

const fakeInput = createInputEvent('77001234567')
const returned = onPhoneInput(fakeInput)
assert.equal(returned, '+7 (700) 123-45-67')
assert.equal(fakeInput.target.value, '+7 (700) 123-45-67')
assert.equal(fakeInput.target.selectionStart, fakeInput.target.value.length)

const pastedInput = createInputEvent('+7 775 853 70 92')
assert.equal(formatPhoneInputEvent(pastedInput), '+7 (775) 853-70-92')
assert.equal(pastedInput.target.selectionStart, pastedInput.target.value.length)

const middleEdit = createInputEvent('+7 (775) 853-70-92', 11)
assert.equal(formatPhoneInputEvent(middleEdit), '+7 (775) 853-70-92')
assert.equal(middleEdit.target.selectionStart, 11)

const backspaceMiddle = createInputEvent('+7 (775) 53-70-92', 8)
assert.equal(formatPhoneInputEvent(backspaceMiddle), '+7 (775) 537-09-2')
assert.equal(backspaceMiddle.target.selectionStart, 7)

console.log('ok phone-mask: formatting, paste and caret handling')
