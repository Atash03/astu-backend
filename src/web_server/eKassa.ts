import { LiteUserFields } from '@/document/liteUser'
import { RtsError } from '@/lib/errors'
import * as jwt from 'jsonwebtoken'
// import * as bcrypt from 'bcrypt'
import { validateOTP } from '@/lib/otp'

// type UserSessionFields = InferSelectModel<typeof userSessions>
const secretKey = process.env.WEBTOKEN_SECRET_KEY || 'This is secret key'

export type TokenData = {
  userId: number
  mobilePhoneNumber: string
  deviceId: string
} 

export async function authLiteUser(
  dbFabric: IDbHandlerFabric, 
  mobilePhoneNumber: string, 
  deviceId: string, 
  code: string
) {
  const db = dbFabric.create('lite_users')

  const validateRes = await validateOTP(deviceId, code)
  if (!validateRes) 
    throw new RtsError('WRONG-OTP', 'Specified otp code is not valid', { code: code })

  const liteUserRow = await db.transaction(async tx => {
    const [row] = await db.select(tx, { mobilePhoneNumber, deviceId }) as LiteUserFields[]    
    if (row)
      return row
    const data = { mobilePhoneNumber, deviceId }
    return await db.createNew(tx, data as IUpdateEntity) as LiteUserFields
  })

  const dataToSign: TokenData = {
    userId: liteUserRow.id,
    mobilePhoneNumber: liteUserRow.mobilePhoneNumber,
    deviceId: liteUserRow.deviceId
  }

  const token = jwt.sign(dataToSign, secretKey)
  return {token, userId: liteUserRow.id}
}

export async function decodeToken(token: string) {
  try {
    jwt.verify(token, secretKey)
    const res = jwt.decode(token) as TokenData | null
    return res
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      throw new RtsError('WRONG-TOKEN', 'Specified token is not valid', { 
        token: token, 
        jwtMessage: err.message
      })
    } else {
      throw new RtsError('INTERNAL-ERROR', 'Internal error happend while validating token', { token: token })
    }
  }
}

export async function decodeLiteToken(token: string) {
  const res = await decodeToken(token)
  if (!res)
    throw new RtsError('WRONG-TOKEN', 'Specified token is not valid', { token: token })

  return res
}