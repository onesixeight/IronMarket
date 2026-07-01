import assert from 'node:assert/strict'
import { setTimeout as wait } from 'node:timers/promises'

import { debounce } from '../src/composables/useDebounce.js'

// Debounce вызывает функцию один раз после задержки, игнорируя промежуточные вызовы.
{
  let calls = 0
  let lastArg = null
  const fn = debounce((v) => {
    calls++
    lastArg = v
  }, 30)

  fn('a')
  fn('b')
  fn('c') // только последний должен сработать
  assert.equal(calls, 0) // ещё не вызвана
  await wait(50)
  assert.equal(calls, 1)
  assert.equal(lastArg, 'c')
}

// cancel() предотвращает вызов.
{
  let calls = 0
  const fn = debounce(() => calls++, 30)
  fn()
  fn.cancel()
  await wait(50)
  assert.equal(calls, 0)
}

// После cancel функцию можно использовать снова.
{
  let calls = 0
  const fn = debounce(() => calls++, 30)
  fn()
  fn.cancel()
  await wait(50)
  fn()
  await wait(50)
  assert.equal(calls, 1)
}

// Используется задержка по умолчанию, когда не задана.
{
  let calls = 0
  const fn = debounce(() => calls++) // delay по умолчанию = 300
  fn()
  await wait(50) // меньше 300
  assert.equal(calls, 0)
  await wait(300)
  assert.equal(calls, 1)
}

// leading запускает первый вызов сразу, а trailing добирает последний вызов из пачки.
{
  const values = []
  const fn = debounce((value) => {
    values.push(value)
    return value.toUpperCase()
  }, 30, { leading: true })

  assert.equal(fn('a'), 'A')
  assert.equal(fn('b'), 'A')
  assert.deepEqual(values, ['a'])
  await wait(50)
  assert.deepEqual(values, ['a', 'b'])
}

// trailing можно отключить, если нужен только немедленный leading-вызов.
{
  const values = []
  const fn = debounce((value) => values.push(value), 30, { leading: true, trailing: false })

  fn('a')
  fn('b')
  await wait(50)
  assert.deepEqual(values, ['a'])
}

// flush() выполняет отложенный вызов сразу и возвращает результат.
{
  let calls = 0
  const fn = debounce((value) => {
    calls++
    return value * 2
  }, 30)

  assert.equal(fn(3), undefined)
  assert.equal(fn.flush(), 6)
  assert.equal(calls, 1)
  await wait(50)
  assert.equal(calls, 1)
}

console.log('✓ debounce: trailing / leading / cancel / flush / default delay')
