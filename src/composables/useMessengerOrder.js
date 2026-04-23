import { buildTelegramLink, buildWhatsAppLink } from './messengerConfig.js'
import { formatPrice } from './usePrice.js'

function safeMultiply(price, quantity) {
  return Math.round(price * quantity * 100) / 100
}

export function useMessengerOrder() {
  const deliveryLabels = {
    tk: 'Транспортная компания',
    courier: 'Курьер',
    pickup: 'Самовывоз',
  }

  const paymentLabels = {
    cash: 'Наличные',
    card: 'Банковская карта',
    transfer: 'Банковский перевод',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
  }

  function buildOrderMessage(cartItems, totalPrice, form) {
    let msg = `🔧 Заказ с сайта Эталон Ковка\n\n`
    msg += `👤 Имя: ${form.name}\n`
    msg += `📞 Телефон: ${form.phone}\n`

    if (form.email) {
      msg += `✉️ Email: ${form.email}\n`
    }

    if (form.city) {
      msg += `🏙️ Город: ${form.city}\n`
    }

    if (form.street) {
      msg += `🛣️ Улица: ${form.street}\n`
    }

    if (form.addressLine) {
      msg += `📍 Адрес: ${form.addressLine}\n`
    }

    if (form.comment) {
      msg += `📝 Комментарий: ${form.comment}\n`
    }

    msg += `\n📦 Товары:\n`

    cartItems.forEach((item) => {
      if (item.hidePrice) {
        msg += `— ${item.name} x${item.quantity} — цена по запросу\n`
      } else {
        msg += `— ${item.name} x${item.quantity} — ${formatPrice(safeMultiply(item.price, item.quantity))}\n`
      }
    })

    const hasPrice = cartItems.some((i) => !i.hidePrice)
    if (hasPrice) {
      msg += `\n💰 Итого: ${formatPrice(totalPrice)}\n`
    } else {
      msg += `\n💰 Цена по запросу\n`
    }

    msg += `🚚 Доставка: ${deliveryLabels[form.delivery] || form.delivery}\n`
    msg += `💳 Оплата: ${paymentLabels[form.payment] || form.payment}`

    return msg
  }

  function getWhatsAppLink(cartItems, totalPrice, form) {
    return buildWhatsAppLink(buildOrderMessage(cartItems, totalPrice, form))
  }

  function getTelegramLink(cartItems, totalPrice, form) {
    return buildTelegramLink(buildOrderMessage(cartItems, totalPrice, form))
  }

  return { getWhatsAppLink, getTelegramLink, buildOrderMessage }
}
