import { MsPay } from '@/lib/msPayApi/msPayApi'

const vendorName = 'TestVendor'
const bankPluginInfoName = 'Rysgal'
const CardInfo = {
  'card.pan': '6711910006687856',
  'card.month': '7',
  'card.holder': '',
  'card.year': '24',
  'card.cvc': '652'
}

describe('MsPay - payment', () => {
    
  describe('Action New', () => {
    it('should return payment fields', async () => {
      const res = await MsPay.payment.doAction('New', { fields: { vendorName, bankPluginInfoName } })
      expect(res.fields.status).toBe('NEW')
      expect(res.docType).toBe('payment')
    })
  })

  describe('Action Get', () => {
    it('should return payment fields', async () => {
      const res = await MsPay.payment.doAction('New', { 
        fields: { vendorName, bankPluginInfoName },
        dataFields: { description: 'Test description' }
      })
      expect(res.fields.status).toBe('NEW')
      expect(res.docType).toBe('payment')

      const res2 = await MsPay.payment.doAction('Get', {
        fields: { id: res.fields.id } 
      })

      expect(res2.fields.id).toBe(res.fields.id)
      expect(res2.dataFields.description).toBe('Test description')
    })
  })

  describe('Action Start', () => {
    it('Should return payment in STARTED status', async () => {
      const res1 = await MsPay.payment.doAction('New', { fields: { vendorName, bankPluginInfoName  } })
      const res2 = await MsPay.payment.doAction('Start', {
        fields: {
          id: res1.fields.id,
          amount: 1
        }
      })
      expect(res2.fields.status).toBe('STARTED')
    })
  })

  describe('Action Process', () => {
    it('Should return payment in PROCESSED status', async () => {
      const res1 = await MsPay.payment.doAction('New', { fields: { vendorName, bankPluginInfoName  } })
      const res2 = await MsPay.payment.doAction('Start', {
        fields: {
          id: res1.fields.id,
          amount: 1
        }
      })
      const res3 = await MsPay.payment.doAction('Process', {
        fields: { id: res2.fields.id },
        sessionFields: CardInfo
      })
      expect(res3.fields.status).toBe('PROCESSED')
    })
  })

  describe('Actions from New to Confirm3DS', () => {
    it('Should return payment in OTP_CONFIRMED status', async () => {
      const res1 = await MsPay.payment.doAction('New', { fields: { vendorName, bankPluginInfoName  } })
      const id = res1.fields.id
      await MsPay.payment.doAction('Start', { 
        fields: { id, amount: 1 } 
      })
      await MsPay.payment.doAction('Process', { 
        fields: { id }, 
        sessionFields: CardInfo 
      })
      await MsPay.payment.doAction('Start3DS', { 
        fields: { id } 
      })

      const res5 = await MsPay.payment.doAction('ConfirmOtp', { 
        fields: { id }, 
        sessionFields: { otpCode: '12345' }
      })
      expect(res5.fields.status).toBe('OTP_CONFIRMED')
    })
  })

})

