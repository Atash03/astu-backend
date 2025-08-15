/* eslint-disable eqeqeq */
/* eslint-disable camelcase */
import { con } from '@/db/drizzle/drizzle'
import { sendSMS } from './sms'
import { liteOtp } from '@/db/drizzle/schema'
import { and, desc, eq, gte } from 'drizzle-orm'

/**
 * Creates 4 digits one time password
 * @param deviceId user's device id
 * @param mobilePhoneNumber user's mobile phone number
 */
export async function createOTP(deviceId: string, mobilePhoneNumber: string) {
  const randomInteger = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1) + min)
  const randomDigit = () => randomInteger(1, 9).toString()

  let code = randomDigit() + randomDigit() + randomDigit() + randomDigit()
  if (mobilePhoneNumber == process.env.LITE_TEST_PHONE)
    code = process.env.LITE_TEST_CODE || '1234'

  const new_otp = {
    code,
    deviceId,
    mobilePhoneNumber,
  }

  console.log('[astu-lite]: new otp created: ', new_otp)

  // adding otp to database
  //await prisma.lite_otp.create({ data: new_otp })
  await con.insert(liteOtp).values(new_otp)
  if (mobilePhoneNumber != process.env.LITE_TEST_PHONE)
    sendSMS({ mobilePhoneNumber, code })
}

/**
 * Validates 4 digits one time password code
 * @param deviceId user's device id
 * @param code code entered by use
 * @returns true - code is valid, false - code is invalid
 */
export async function validateOTP(
  deviceId: string,
  code: string,
): Promise<boolean> {
  const otpExpirationTime = Number(process.env.LITE_OTP_EXPIRE_TIME || '60')
  const minDate = new Date()
  minDate.setMinutes(minDate.getMinutes() - otpExpirationTime)
  console.log({minDate, otpExpirationTime})

  // const rows = await prisma.lite_otp.findMany({
  //   where: {
  //     device_id: deviceId,
  //     created_at: { gte: minDate },
  //   },
  //   orderBy: { id: 'desc' },
  //   take: 1,
  // })

  const rows = await con.select().from(liteOtp).where(
    and(
      eq(liteOtp.deviceId, deviceId), 
      gte(liteOtp.createdAt, minDate)))
    .orderBy(desc(liteOtp.id)).limit(1)

  // no valid code found
  if (rows.length <= 0) return false

  const row = rows[0]
  if (row.code != code) return false
  return true
}
