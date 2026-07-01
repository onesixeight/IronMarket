export const CONTACTS = {
  phone: {
    raw: '77758537092',
    tel: '+77758537092',
    display: '+7 775 853 70 92',
    href: 'tel:+77758537092',
  },
  email: {
    value: 'etalonkovka@mail.ru',
    href: 'mailto:etalonkovka@mail.ru',
  },
  telegram: {
    username: 'etalonkovka',
    display: '@etalonkovka',
  },
  location: {
    city: 'Астана',
    country: 'Казахстан',
    short: 'Астана • Казахстан',
    region: 'Астана и Казахстан',
    address: 'Астана, просп. Богенбай Батыра, 6/4, 16 ряд, 14 место',
    streetAddress: 'просп. Богенбай Батыра, 6/4, 16 ряд, 14 место',
    mapUrl: 'https://yandex.ru/map-widget/v1/?text=%D0%90%D1%81%D1%82%D0%B0%D0%BD%D0%B0%2C%20%D0%BF%D1%80%D0%BE%D1%81%D0%BF.%20%D0%91%D0%BE%D0%B3%D0%B5%D0%BD%D0%B1%D0%B0%D0%B9%20%D0%91%D0%B0%D1%82%D1%8B%D1%80%D0%B0%2C%206%2F4%2C%2016%20%D1%80%D1%8F%D0%B4%2C%2014%20%D0%BC%D0%B5%D1%81%D1%82%D0%BE&z=17',
    mapTitle: 'Карта: Астана, просп. Богенбай Батыра, 6/4, 16 ряд, 14 место',
  },
  hours: {
    primary: 'Пн-Вс: 9:00-18:00',
    note: 'Без выходных',
  },
}

export const WHATSAPP_PHONE = CONTACTS.phone.raw
export const TELEGRAM_USERNAME = CONTACTS.telegram.username
