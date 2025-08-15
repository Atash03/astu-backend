import dayjs from 'dayjs'
import getServicesResp from './templates/getServicesResp'
import { readFile, writeFile } from 'fs/promises'
import { AgtsError } from '../agtsError'
export const testData = {
  whiteIpAddress: '0.0.0.0',
  inetAgrNumber: 'inet-012353',
  iptvAgrNumber: 'iptv-010748',
  phoneNumber: '201992'
}

type agtsTestDbFormat = Record<string, number> 

class AgtsEmulatorDb {
  jsonFilePath = './agtsTestDb.json'
  private async fetchData(): Promise<agtsTestDbFormat> {
    try {
      const data = await readFile(this.jsonFilePath, { encoding: 'utf-8' })
      return JSON.parse(data)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        await writeFile(this.jsonFilePath, JSON.stringify({}))
        return {}
      } else {
        throw error
      }
    }
  }

  private async saveData(data: agtsTestDbFormat): Promise<void> {
    return writeFile(this.jsonFilePath, JSON.stringify(data, null, 2))
  }

  public async do<T>(action: (data: agtsTestDbFormat) => Promise<T>) {
    const data = await this.fetchData()
    const res = await action(data)
    await this.saveData(data)
    return res
  }
}

export async function updateBalance(payload: AgtsUpdateBalaceReq) {
  if (payload.amount < 0)
    throw new AgtsError('NEGATIVE-AMOUNT','Amount should be greater than 0', {agtsMessage: 'wrong_payment_amount'})
  // if (!payload.ipaddress)
  //   throw new agtsError('EMPTY-IP-ADDRESS', 'White ip address should be specified', 'access_denied')
  // if (payload.ipaddress != testData.whiteIpAddress)
  //   throw new agtsError('ACCESS-DENIED', 'Ip address is not in white list', 'access_denied')
  if (![testData.inetAgrNumber, testData.iptvAgrNumber].includes(payload.agrmNum))
    throw new AgtsError('WRONG-AGR-NUM', 'Wrong agreement number', {agtsMessage: 'wrong_agreement_number'})

  const topupDate = dayjs(payload.receiptDate, 'YYYYMMDDHHmmss')
  const now = dayjs(new Date, 'YYYYMMDDHHmmss')

  if (topupDate > now)
    throw new AgtsError('WRONG-DATE', 'Wrong top up date', {agtsMessage: 'wrong_date'})

  const db = new AgtsEmulatorDb()
  
  await db.do(async (data: agtsTestDbFormat) => {
    data[payload.agrmNum] = data[payload.agrmNum] || 0.00
    data[payload.agrmNum] += payload.amount 
    data[payload.agrmNum] = parseFloat(data[payload.agrmNum].toFixed(2))
  })

  return {
    'result': 'action_success',
    'receipt': '1831581'
  }
}

export async function getServices(payload: AgtGetServicesReq) {
  // if (payload.ip != testData.whiteIpAddress)
  //   throw new agtsError('EMPTY-IP-ADDRESS', 'White ip address should be specified', 'access_denied')
  if (payload.phone != testData.phoneNumber)
    throw new AgtsError('WRONG-PHONE-NUMBER', 'Wrong phone number', {agtsMessage: 'action_fail'})
  
  const db = new AgtsEmulatorDb()

  const {inetBalance, iptvBalance} = await db.do(async (data: agtsTestDbFormat) => {
    const inetBalance = data[testData.inetAgrNumber]
    const iptvBalance = data[testData.iptvAgrNumber]
    return {inetBalance, iptvBalance}
  })
  
  return getServicesResp(inetBalance, iptvBalance)
}