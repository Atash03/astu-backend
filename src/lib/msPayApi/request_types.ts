/* eslint-disable @typescript-eslint/no-unused-vars */

import { PaymentDataField, PaymentStatus } from './paymentTypes'

type CardInfoField = 
  | 'card.pan' 
  | 'card.month' 
  | 'card.year' 
  | 'card.cvc' 
  | 'card.holder'

export type ApiPaymentAction = 
  | 'New' 
  | 'Start' 
  | 'Process' 
  | 'Start3DS' 
  | 'ConfirmOtp' 
  | 'CrutchDone' 
  | 'Get'

export type ApiAnyReq = {
  action: string,
  fields?: object
  dataFields?: object
}

export type ApiAnyPaymentReq = {
  action: ApiPaymentAction,
  fields?: object
  dataFields?: object
  sessionFields?: object
}

export type NewPaymentFields = {
  action: 'New'
  fields: { vendorName: string, bankPluginInfoName: string }
  dataFields?: { description?: string }
}

export type StartPaymentFields = {
  action: 'Start'
  fields: { id: number, amount: number }
}

export type ProsessPaymentFields = {
  action: 'Process'
  fields: { id: number }
  sessionFields: Record<CardInfoField, string>
}

export type Start3DSFields = {
  action: 'Start3DS'
  fields: { id: number }
}

export type Confirm3DSFields = {
  action: 'ConfirmOtp'
  fields: { id: number }
  sessionFields: { otpCode: string }
}

export type GetFields = {
  action: 'Get'
  fields: { id: number }
}

export type ApiPaymentRequest = 
  | NewPaymentFields 
  | StartPaymentFields 
  | ProsessPaymentFields 
  | Start3DSFields 
  | Confirm3DSFields
  | GetFields

export type ApiErrorResp = {
  errorCode: string
  error: string
  data: object
}
export type ApiSuccefullResp = {
  docType: string
  fields?: object
  dataFields: Record<string, string>
}

export type ApiAnyResp = ApiErrorResp | ApiSuccefullResp

export type ApiSuccefullPaymentResp = {
  docType: 'payment'
  fields: {
    id: number
    status: PaymentStatus
    merchantName: string
    createdAt: string
    updatedAt: string
  }
  dataFields: Record<PaymentDataField, string>
}

export type ApiPaymentResp = ApiSuccefullPaymentResp | ApiErrorResp