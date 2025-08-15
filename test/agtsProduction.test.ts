import { getAgtsApi } from '@/document/topUpPlugins/agtsPlugin/agts-api/agtsApiFabric'
import { AgtsError } from '@/document/topUpPlugins/agtsPlugin/agts-api/agtsError'
import dayjs from 'dayjs'

const api = getAgtsApi(false)
const testData = {
  whiteIpAddress: process.env.WHITE_SERVER_IP,
  inetAgrNumber: 'inet-0504569',
  iptvAgrNumber: 'iptv-0504567',
  phoneAgrNumber: '2023-0013796',
  phoneNumber: '201992'
}

describe('agts Production API', () => {
  describe('updateBalance', () => {
    it('should return success result', async () => {
      const payload: AgtsUpdateBalaceReq = {
        ipaddress: testData.whiteIpAddress,
        agrmNum: testData.inetAgrNumber,
        receiptNum: 'ms_test-' + dayjs().format('YYYYMMDDHHmmss'),
        receiptDate: dayjs().format('YYYYMMDDHHmmss'),
        amount: 0.01
      }
      const res = await api.updateBalance(payload)
      expect(res.receipt).not.toBeFalsy()
      expect(res.result).toBe('action_success')
    })
  })

  describe('updateBalance', () => {
    it('should increase balance', async () => {
      const gsPayloadInit = {
        ip: testData.whiteIpAddress, 
        phone: testData.phoneNumber
      }
      const servicesInit = await api.getServices(gsPayloadInit)
      const initBalance = servicesInit.inet?.balance || 0

      const payload: AgtsUpdateBalaceReq = {
        ipaddress: testData.whiteIpAddress,
        agrmNum: testData.inetAgrNumber,
        receiptNum: 'ms_test-' + dayjs().format('YYYYMMDDHHmmss'),
        receiptDate: dayjs().format('YYYYMMDDHHmmss'),
        amount: 0.01
      }
      const res = await api.updateBalance(payload)
      console.log('==============\n\n', res)
      expect(res.receipt).not.toBeFalsy()
      expect(res.result).toBe('action_success')

      const gsPayloadAfter = {
        ip: testData.whiteIpAddress, 
        phone: testData.phoneNumber
      }
      const servicesAfter = await api.getServices(gsPayloadAfter)
      const afterBalance = servicesAfter.inet?.balance || 0
      expect(afterBalance.toFixed(2)).toBe((initBalance + 0.01).toFixed(2))

    })
  })

  describe('serviceList', () => {
    it('Should return list of services', async () => {
      const payload = {
        ip: testData.whiteIpAddress, 
        phone: testData.phoneNumber
      }
      const res = await api.getServices(payload)
      expect(res.result).toBe('action_success')
      expect(res.inet).not.toBeFalsy()
      expect(res.inet?.balance).not.toBeFalsy()
    })
  })

  describe('serviceList with wrong phone number', () => {
    it('Should throw AgtsError', async () => {
      const payload = {
        ip: testData.whiteIpAddress, 
        phone: '000000'
      }
      let errorHappend = false
      try {
        await api.getServices(payload)
      } catch (e) {
        if (!(e instanceof AgtsError))
          throw e
        console.log(e.message)
        errorHappend = true
      }

      expect(errorHappend).toBe(true)
    })
  })  

  describe('Top up to wrong agreement number', () => {
    it('Should throw AgtsError', async () => {
      const payload: AgtsUpdateBalaceReq = {
        ipaddress: testData.whiteIpAddress,
        agrmNum: 'test-00000QQQ',
        receiptNum: 'ms_test-' + dayjs().format('YYYYMMDDHHmmss'),
        receiptDate: dayjs().format('YYYYMMDDHHmmss'),
        amount: 0.01
      }
      
      let errorHappend = false

      try {
        await api.updateBalance(payload)
      } catch (e) {
        errorHappend = true
      }
      expect(errorHappend).toBe(true)
      
    })
  }) 

})