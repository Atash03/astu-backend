/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable quotes */
import https from 'https'
import { AgtsError } from '../agtsError'

export const agtsApiServices = ['inet', 'iptv', 'phone']
export const agtsApiSubServices = ['belet', 'alem']

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
})

const getOptions = {
  method: 'GET',
  // @ts-ignore
  agent: httpsAgent,
}

type serviceInfoInternal = {
  name: string
  balance: number
  number: string
  details: Record<string, string>[]
}
type servicesInfoInternal = {
  result: string
  phone?: serviceInfoInternal
  inet?: serviceInfoInternal
  iptv?: serviceInfoInternal
  msg?: string
} & Record<string, serviceInfoInternal>

export async function getservicesInternal(phoneNumber: string) {
  const endpoint = `${process.env.AGTS_DATA_API_URL}/getservices/${process.env.WHITE_SERVER_IP}/${phoneNumber}`
  // console.log('****', endpoint)
  const externalApiRequest = await fetch(endpoint, getOptions)
  const result = await externalApiRequest.json()
  return result as servicesInfoInternal
}

// eslint-disable-next-line
export async function getServices({phone}: AgtGetServicesReq) {
  // eslint-disable-next-line no-param-reassign
  // console.log('Getting service list for ', phone)
  const result = await getservicesInternal(phone)

  if (process.env.TEST_MODE)
    console.log({result})

  if (result.result !== 'action_success') {
    throw new AgtsError('CANNOT-GET-SERVICES', 'Cannot get services from agts api', 
      { agtsMessage: result.msg || '' })
  }
  return result
}

export type UpdateBalanceResp = {
  result?: 'action_success' | string
  receipt?: string
}

export async function updateBalance(payload: AgtsUpdateBalaceReq) {
  const topupRequest = await fetch(
    `${process.env.AGTS_PAYMENT_API_URL}/updatebalance/${process.env.WHITE_SERVER_IP}/${payload.agrmNum}/${payload.receiptNum}/${payload.receiptDate}/${payload.amount}`,
    {
      method: 'GET',
      //  @ts-ignore
      agent: httpsAgent,
    },
  )
  // eslint-disable-next-line
  const topupResponse = await topupRequest.json()

  if (topupResponse.result !== 'action_success') {
    throw new AgtsError('CANNOT-GET-SERVICES', 'Cannot get services from agts api', 
      { agtsMessage: topupResponse.msg || '' })
  }  
  // console.log({topupResponse})
  return topupResponse as UpdateBalanceResp
}
