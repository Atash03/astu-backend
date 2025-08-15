import * as agtsEmulator from '@/document/topUpPlugins/agtsPlugin/agts-api/agts-emulator/agts-emulator'
import dayjs from 'dayjs'

const emulator = agtsEmulator as AgtsApi
const testData = agtsEmulator.testData

describe('agts Emulator', () => {
    
  describe('updateBalance', () => {
    it('should return success result', async () => {
      const payload: AgtsUpdateBalaceReq = {
        ipaddress: testData.whiteIpAddress,
        agrmNum: testData.inetAgrNumber,
        receiptNum: '',
        receiptDate: dayjs().format('YYYYMMDDHHmmss'),
        amount: 0.01
      }
      const res = await emulator.updateBalance(payload)
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
      const servicesInit = await emulator.getServices(gsPayloadInit)
      const initBalance = servicesInit.inet?.balance || 0

      const payload: AgtsUpdateBalaceReq = {
        ipaddress: testData.whiteIpAddress,
        agrmNum: testData.inetAgrNumber,
        receiptNum: '',
        receiptDate: dayjs().format('YYYYMMDDHHmmss'),
        amount: 0.01
      }
      const res = await emulator.updateBalance(payload)
      expect(res.receipt).not.toBeFalsy()
      expect(res.result).toBe('action_success')

      const gsPayloadAfter = {
        ip: testData.whiteIpAddress, 
        phone: testData.phoneNumber
      }
      const servicesAfter = await emulator.getServices(gsPayloadAfter)
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
      const res = await emulator.getServices(payload)
      expect(res.result).toBe('action_success')
      expect(res.inet).not.toBeFalsy()
      expect(res.inet?.balance).not.toBeFalsy()
    })
  })

})