const PaymentStatuses = [
  'NEW',
  'STARTED',
  'CANCELED',
  'PROCESSED',
  'STARTED3DS',
  'DECLINED',
  'OTP_CONFIRMED',
  'PROCESSING',
  'ERROR_AFTER_CONFIRMED',
  'DONE'] as const
const PaymentActions = ['Start', 'Process', 'Start3DS', 'ConfirmOtp', 'ConfirmDone'] as const

export type PaymentStatus = typeof PaymentStatuses[number]
export type PaymentAction = typeof PaymentActions[number]
// export type PaymentTableFields = InferSelectModel<typeof payment>
// export type PaymentFields = Omit<PaymentTableFields, 'status'> & PaymentStatusField
// export type BankPluginFields = InferSelectModel<typeof bankPluginInfo>

export type CardInfo = {
  pan: string
  month: number
  year: number
  cvc: string
  holder?: string
}

export type PaymentDataField = 
    'internalReceipt'
  | 'orderId'
  | 'description'
  | 'amount'
  | 'maskedPhoneNumber' // raw Smart Vista field
  | 'maskedCardNumber'  // raw Smart Vista field
  
export type PaymentStatusField = {status: PaymentStatus}