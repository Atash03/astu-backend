/* eslint-disable import/prefer-default-export */
interface Params {
  mobilePhoneNumber: string
  code: string
}

function clearPhoneNumber(str: string) {
  return str.replaceAll(/[^\d]/g, '') as string
}

interface RequestOptions {
  method: string
  headers: Headers
  body: string
}

export const sendSMS = ({ mobilePhoneNumber, code }: Params) => {
  const [login, password, url] = [
    process.env.LITE_SMS_SERVER_USER,
    process.env.LITE_SMS_SERVER_PASSWORD,
    process.env.LITE_SMS_SERVER,
  ]

  if (!url || !login || !password) {
    console.log(`
      Error while sending SMS code to user:
      These env variables should be set in .env file:
        LITE_SMS_SERVER_USER, LITE_SMS_SERVER_PASSWORD, LITE_SMS_SERVER
    `)
    return
  }

  const authString = `${login}:${password}`
  const authHash = Buffer.from(authString).toString('base64')

  const myHeaders = new Headers()
  myHeaders.append('Content-Type', 'application/json')
  myHeaders.append('Authorization', `Basic ${authHash}`)

  const raw = JSON.stringify({
    sms: code,
    phone: clearPhoneNumber(mobilePhoneNumber),
  })

  const requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow',
  } as RequestOptions

  fetch(url, requestOptions)
    .then(response => response.text())
    .then(result => console.log('Sended SMS Code: ', result))
    .catch(error => console.log('error', error))
}
