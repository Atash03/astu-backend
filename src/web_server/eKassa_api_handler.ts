/* eslint-disable no-empty */
import { ApiActionInfo } from './api_types'
import { ApiHandler } from './api_handler'
import authAuthReq from './json_schema/auth_auth_req'
import authCheckTokenReq from './json_schema/auth_check_token_req'
import authRequestOTPReq from './json_schema/auth_request_otp_req'
// import authAnyReq from  './json_schema/auth_any_req'
import { TokenData, authLiteUser, decodeLiteToken } from './eKassa'
import { RtsError } from '@/lib/errors'
import { ApiEkassaAuthReq, ApiEkassaCheckTokenReq, ApiEkassaReq, ApiEKassaRequestOtpReq, ApiEkassaResp, TopUpServiceType } from './request_types'
import Ajv from 'ajv'
import { createOTP } from '@/lib/otp'
import api_any_req from './json_schema/api_any_req'
import { con } from '@/db/drizzle/drizzle'
import { liteBanks, liteNotifications, liteServices, liteUser, topUp, topUpGroup } from '@/db/drizzle/schema'
import { desc, eq, gte, sql } from 'drizzle-orm'
import { getAgtsApi } from '@/document/topUpPlugins/agtsPlugin/agts-api/agtsApiFabric'
import * as cdmaApi from '@/lib/agts-cdma'
import ekassaDeleteUserReq from './json_schema/ekassa_delete_user_req'
import ekassaGetNotificationsReq from './json_schema/ekassa_get_notifications_req'
import ekassaGetBalanceReq from './json_schema/ekassa_get_balance_req'
import ekassaGetWorkingServicesReq from './json_schema/ekassa_get_working_services_req'
import ekassaGetHistoryReq from './json_schema/ekassa_get_history_req'

const ajv = new Ajv()
type ApiAction = 
  | 'Auth' 
  | 'CheckToken' 
  | 'RequestOTP' 

  | 'DeleteUser' 
  | 'GetNotifications' 
  | 'GetBalance' 
  | 'GetWorkingServices'
  | 'GetHistory'

const apiActionInfos = {
  'Auth': {
    validator: ajv.compile(authAuthReq),
    actionType: 'auth'
  },
  'CheckToken': {
    validator: ajv.compile(authCheckTokenReq),
    actionType: 'auth'
  },
  'RequestOTP': {
    validator: ajv.compile(authRequestOTPReq),
    actionType: 'auth'
  },
  'DeleteUser': {
    validator: ajv.compile(ekassaDeleteUserReq),
    actionType: 'delete'
  },
  'GetNotifications': {
    validator: ajv.compile(ekassaGetNotificationsReq),
    actionType: 'info'
  },  
  'GetBalance': {
    validator: ajv.compile(ekassaGetBalanceReq),
    actionType: 'info'
  },  
  'GetWorkingServices': {
    validator: ajv.compile(ekassaGetWorkingServicesReq),
    actionType: 'info'
  },
  'GetHistory': {
    validator: ajv.compile(ekassaGetHistoryReq),
    actionType: 'info'
  },
} satisfies Record<ApiAction, ApiActionInfo>

export class ekassaApiHandler extends ApiHandler<ApiEkassaResp> {
  get handlerValidator() {
    return ajv.compile(api_any_req)
  }

  get apiActionInfos() {
    return apiActionInfos
  }

  async handleApiAction(apiAction: ApiAction, payload: ApiEkassaReq) {
    
    const tokenData = this.token ? await decodeLiteToken(this.token) : undefined

    if (payload.action == 'RequestOTP') 
      return this.doRequestOTPAction(payload)
    else if (payload.action == 'Auth') 
      return this.doAuthAction(payload) 
    else if (payload.action == 'CheckToken')
      return this.doCheckTokenAction(payload)
    else if (payload.action == 'DeleteUser') 
      return this.doDeleteUserAction(tokenData)
    else if (payload.action == 'GetNotifications') 
      return this.doGetNotificationsAction()
    else if (payload.action == 'GetWorkingServices')
      return this.doGetWorkingServicesAction()
    else if (payload.action == 'GetBalance')
      return this.doGetBalanceAction(payload.fields.serviceCode, payload.fields.phoneNumber)
    else if (payload.action == 'GetHistory')
      return this.doGetHistoryAction(tokenData)
    else
      throw new RtsError('NOT-IMPLEMENTED', '', {})
  }
  async doGetHistoryAction(tokenData?: TokenData) {
    const userId = this.extractUserId(tokenData)
    const rows = await con.select()
      .from(topUpGroup)
      .innerJoin(topUp, eq(topUpGroup.id, topUp.topUpGroupId))
      .where(eq(topUpGroup.liteUserId, userId))
      .orderBy(desc(topUpGroup.id))
    const history = rows.map(r => ({TopUp: r.top_up, TopUpGroup: r.top_up_group}))
    return { success: true, history }
  }
  async doGetBalanceAction(serviceCode: TopUpServiceType, phoneNumber: string) {
    const agtsApi = getAgtsApi()
    if (serviceCode == 'cdma') {
      const res = await cdmaApi.requestCDMABalance(phoneNumber)
      if (res.errorCode) 
        return { success: false, errorCode: res.errorCode}
      if (res.status != 'OK')
        return { success: false, errorCode: 'STATUS_' + res.status}

      return { success: true, balance: res.amount }
    }

    const res = await agtsApi.getServices({phone: phoneNumber})
    const service = res[serviceCode]
    if (!service)
      throw new RtsError('SERVICE-NOT-FOUND', 'Service not found', { serviceCode: serviceCode, phoneNumber: phoneNumber })

    return { success: true, balance: service.balance }
  }

  async doGetWorkingServicesAction() {
    const serviceRows = await con.select().from(liteServices)
    const bankRows = await con.select().from(liteBanks)
    const services = Object.fromEntries(serviceRows.map(row => [row.service, row.enabled]))
    const banks = Object.fromEntries(bankRows.map(row => [row.bank, row.enabled]))
    const subServices = { alem: services['iptv.alem'], belet: services['iptv.belet']}

    return { success: true, services, banks, subServices }
  }

  async doGetNotificationsAction() {
    const rows = await con.select().from(liteNotifications)
      .where(gte(liteNotifications.dateTillShow, sql.raw('now()')))
      .orderBy(desc(liteNotifications.id))
    return { success: true, notifications: rows }
  }

  private async doDeleteUserAction(tokenData?: TokenData ) {
    const userId = this.extractUserId(tokenData)
    await con.delete(liteUser).where(eq(liteUser.id, userId))
    return { success: true }
  }

  private extractUserId(tokenData: TokenData | undefined) {
    const userId = tokenData?.userId
    if (!userId)
      throw new RtsError('AUTH-REQUIRED', 'This operation requires authentication', {})
    return userId
  }

  private async doRequestOTPAction(payload: ApiEKassaRequestOtpReq) {
    await createOTP(payload.fields.deviceId, payload.fields.mobilePhoneNumber)
    return { success: true }
  }

  private async doCheckTokenAction(payload: ApiEkassaCheckTokenReq) {
    const token = payload.fields.token
    const validateRes = await decodeLiteToken(token)
    const res = { success: true as const, fields: {...validateRes} }
    return res satisfies ApiEkassaResp
  }

  private async doAuthAction(payload: ApiEkassaAuthReq) {
    const { mobilePhoneNumber, deviceId, code } = payload.fields
    const res = await authLiteUser(this.dbHandlerFabric, mobilePhoneNumber, deviceId, code)
    return res
  }
}