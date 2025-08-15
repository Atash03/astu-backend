/* eslint-disable prefer-template */
import { parseStringPromise } from 'xml2js'
import { parseNumbers } from 'xml2js/lib/processors'

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('tls').DEFAULT_MIN_VERSION = 'TLSv1'

const { CDMA_URL, CDMA_USER, CDMA_PASSWORD, CDMA_PAY_SYSTEM_ID } = process.env
const CDMA_AUTH_HASH = Buffer.from(`${CDMA_USER}:${CDMA_PASSWORD}`).toString(
  'base64',
)

type Currency = 'TMT'

type PaymentRes = {
  req_id: string
  rrn: number
  status: string
  success: boolean
}

type BalanceRes = {
  req_id: string
  status: string
  amount: number
  success: boolean
  errorCode?: string
}

const BaseCDMAParams = {
  ps_id: CDMA_PAY_SYSTEM_ID!,
  currency: 'TMT' as Currency,
}

function formatDate(date: Date) {
  const d = new Date(date)
  let month = (d.getMonth() + 1).toString()
  let day = d.getDate().toString()
  const year = d.getFullYear()

  if (month.length < 2) month = `0${month}`
  if (day.length < 2) day = `0${day}`

  return [year, month, day].join('')
}

function formatTime(dateTime: Date) {
  return (
    ('0' + dateTime.getHours()).slice(-2) +
    ('0' + dateTime.getMinutes()).slice(-2) +
    ('0' + dateTime.getSeconds()).slice(-2)
  )
}

async function doRequest(functionName: string, data: Record<string, unknown>) {
  const params = new URLSearchParams({ ...data, ...BaseCDMAParams }).toString()
  const url = `${CDMA_URL}/${functionName}?${params}`

  const headers = new Headers()
  headers.append('Authorization', `Basic ${CDMA_AUTH_HASH}`)

  const requestOptions = {
    method: 'GET',
    headers,
  }

  console.log('[[ CDMA doRequest ]] url:', { url, CDMA_AUTH_HASH })

  try {
    const fetchRes = await fetch(url, requestOptions)
    const res = await fetchRes.text()

    console.log(res)
    const obj = await parseStringPromise(res, {
      explicitArray: false,
      xmlns: false,
      valueProcessors: [parseNumbers],
      explicitRoot: false,
    })
    delete obj.$
    return obj
  } catch (e) {
    console.error(e)
    return { success: false, errorCode: 'ServerUnvailable' }
  }
}

/**
 * Does balance request to Astu CDMA
 * @param phone phone number in 123456 format
 * @returns balance as BalanceRes object
 */
export async function requestCDMABalance(phone: string) {
  const res = await doRequest('Balance', { phone })
  return { ...res, success: res.status === 'OK' } as BalanceRes
}

/**
 * Processes payment to Astu CDMA
 * @param phone phone number in 123456 format
 * @param amount amount to pay (like 0.01)
 * @param rrn reference (wich must be unique for each transaction)
 * @returns success: true - ok, false - error happend, status: OK or ErrorCode
 */
export async function processCDMAPayment(
  phone: string,
  amount: number,
  rrn: number,
) {
  const dateTime = new Date()
  const payload = {
    phone,
    amount: amount.toFixed(2),
    rrn,
    date: formatDate(dateTime),
    time: formatTime(dateTime),
    pt: 2,
  }
  const res = await doRequest('Payment', payload)
  return { ...res, success: res.status === 'OK' } as PaymentRes
}
