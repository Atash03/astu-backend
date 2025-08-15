/* eslint-disable @typescript-eslint/no-loss-of-precision */
const response = (inetBalance: number, iptvBalance: number) => ({
  'result': 'action_success',
  phone: undefined,
  /*'phone': {
    'name': 'Emulator User Name',
    'mobile': null,
    'number': '123456-12',
    'balance': 26.11,
    'details': [
      {
        'blocked': 'active',
        'tariff': 'müşderi tölegi (1 manat)',
        'price': 1.0000000000000000000000000000
      },
      {
        'blocked': 'active',
        'tariff': '8 (Şäherara birikme) (0 manat)',
        'price': 0.0000000000000000000000000000
      },
      {
        'blocked': 'active',
        'tariff': '10 Halkara birikme (0 manat)',
        'price': 0.0000000000000000000000000000
      },
      {
        'blocked': 'active',
        'tariff': 'Belgini anyklamak (AOH) (4 manat)',
        'price': 4.0000000000000000000000000000
      },
      {
        'blocked': 'active',
        'tariff': 'Giriş jaňy başga belgä jogap berilmese ýollamak (Переадрес. при неответе) (1.2 manat)',
        'price': 1.2000000000000000000000000000
      }
    ]
  },*/
  'inet': {
    'name': 'Emulator User Name',
    'mobile': null,
    'number': 'inet-012353',
    'balance': inetBalance,
    'details': [
      {
        'blocked': 'balance',
        'tariff': 'FEW-2023-2Mb-RAYAT-180M',
        'price': 180.00000000000000000000000000
      }
    ]
  },
  'iptv': {
    'name': 'Emulator User Name',
    'mobile': null,
    'number': 'iptv-010748',
    'balance': iptvBalance,
    'details': [
      {
        'blocked': 'active',
        'tariff': 'IPTV-10-MANAT',
        'price': 10.000000000000000000000000000
      }
    ]
  }
})

export default response