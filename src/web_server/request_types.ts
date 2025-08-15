/* eslint-disable @typescript-eslint/no-unused-vars */
export type ApiAnyReq = {
  action: string
  fields?: object
  dataFields?: object
  sessionFields?: object
}

export type TopUpServiceType = 
  | 'inet'
  | 'iptv'
  | 'phone'
  | 'cdma'

export type TopUpServiceTypeEx = 
  TopUpServiceType | 'iptv.belet' | 'iptv.alem'

type CardInfoField = 
  | 'card.pan' 
  | 'card.month' 
  | 'card.year' 
  | 'card.cvc' 
  | 'card.holder'

export type TopUpGroupApiAction = 
  | 'New'
  | 'CreatePayment'
  | 'ConfirmPayment'
  | 'MakePaid'
  | 'MakeDone'
  | 'Get'

export type ApiTopUpAction = 
  | 'New' 
  | 'Get'

export const topUpGroupStatuses = [
  'NEW',
  'PAYMENT_CREATED',
  'PAYMENT_PROCESSING',
  'PAID',
  'DONE',
  'CANCELED',
  'PAYMENT_REJECTED',
  'TOPUP_IN_PROGRESS',
  'PARTIALLY_DONE'
] as const

export const topUpStatuses = [
  'NEW',
  'DONE',
  'ERROR',
  'CANCELED',
] as const

export type TopUpGroupAnyReq = {
  action: TopUpGroupApiAction
  fields?: object
  dataFields?: object
  sessionFields?: object
}

export type TopUpGroupStatus = typeof topUpGroupStatuses[number]  
export type TopUpStatus = typeof topUpStatuses[number]  

export type GetFields = {
  action: 'Get'
  fields: { id: number }
}

export type TopUpNewFields = {
  action: 'New'
  fields: {
    topUpGroupId: number
    amount: number
    serviceType: TopUpServiceType
    pluginInfoName: string
    phoneNumber: string
  }
  dataFields?: { description?: string }
}

export type TopUpGroupNewFields = {
  action: 'New'
  fields: {
    amount: number
    phoneNumber: string
  }
  dataFields?: { description?: string }
}

export type TopUpGroupCreatePaymentFields = {
  action: 'CreatePayment'
  fields: {
    id: number
  }
  sessionFields: {
    vendorName: string
    bankPluginInfoName: string
    'card.pan': string
    'card.month': string
    'card.holder': string
    'card.year': string
    'card.cvc': string
  }
}

export type TopUpGroupConfirmPaymentFields = {
  action: 'ConfirmPayment'
  fields: {
    id: number
  }
  sessionFields: {
    otpCode: string
  }
}

export type ApiErrorResp = {
  errorCode: string
  error: string
  data: object
}

export type ApiDocumentSuccefullResp = {
  docType: string
  fields?: object
  dataFields: Record<string, string | undefined>
}

export type TopUpGroupFields = {
  id: number
  status: TopUpGroupStatus
  amount: number
  phoneNumber: string
  liteUserId?: number
  createdAt: string
  updatedAt: string
}

export type TopUpGroupDataFields = {
  description?: string
  maskedCardNumber?: string
  maskedPhoneNumber?: string
} & Record<string, string | undefined>

export type ApiSuccefullTopUpGroupResp = {
  docType: 'top_up_group'
  fields: TopUpGroupFields
  dataFields: TopUpGroupDataFields
}

export type ApiTopUpGroupRequest =
  | TopUpGroupNewFields 
  | TopUpGroupCreatePaymentFields 
  | TopUpGroupConfirmPaymentFields
  | GetFields


// export type ApiTopUpResp = ApiSuccefullTopUpGroupResp | ApiErrorResp

export type ApiTopUpRequest = 
  | TopUpNewFields
  | GetFields

export type TopUpFields = {
  id: number
  status: TopUpStatus
  topUpGroupId: number
  createdAt: string
  updatedAt: string
  phoneNumber: string
}

export type ApiSuccefullTopUpResp = {
  docType: 'top_up'
  fields: TopUpFields
  dataFields: Record<string, string | undefined>
}

export type ApiHistoryRequest = {
  action: 'List'
  fields: {
      phoneNumber: string
      minDate?: string
      maxDate?: string
      take?: number
      skip?: number
  }
}

export type ApiHistoryResp = {
  topUpGroup: TopUpGroupFields
  topUps: TopUpFields[]
}[]

export type HistoryRequest = ApiHistoryRequest

export type ApiAnyResp = ApiErrorResp | ApiDocumentSuccefullResp | ApiHistoryResp | ApiSmsResponse

//============= EKASSA ========================
type integer = number

/**
 * Request fields
 * @additionalProperties true
 */
type TFields = object

export type ApiEkassaAnyReq = {
  action: 'Auth' | 'CheckToken' | 'RequestOTP'
  fields?: TFields
}

export type ApiEkassaAuthReq = {
  action: 'Auth',
  fields: {
    deviceId: string
    mobilePhoneNumber: string
    code: string
  }
} 

export type ApiEkassaCheckTokenReq = {
  action: 'CheckToken',
  fields: {
    token: string
  }
} 

export type ApiEKassaRequestOtpReq = {
  action: 'RequestOTP'
  fields: {
    deviceId: string
    mobilePhoneNumber: string
  }
}

export type ApiEkassaDeleteUserReq = {
  action: 'DeleteUser'
} 
export type ApiEkassaGetNotificationsReq = {
  action: 'GetNotifications'
} 
export type ApiEkassaGetBalanceReq = {
  action: 'GetBalance'
  fields: {
    serviceCode: TopUpServiceType
    phoneNumber: string
  }
} 
export type ApiEkassaGetWorkingServicesReq = {
  action: 'GetWorkingServices'
}

export type ApiEkassaGetHistoryReq = {
  action: 'GetHistory'
}

export type ApiEkassaReq = ApiEkassaAuthReq | ApiEkassaCheckTokenReq 
  | ApiEKassaRequestOtpReq | ApiEkassaDeleteUserReq 
  | ApiEkassaGetNotificationsReq | ApiEkassaGetBalanceReq 
  | ApiEkassaGetWorkingServicesReq | ApiEkassaGetHistoryReq

export type ApiEkassaResp = {
  action?: 'Auth'
  token: string
  userId: number
} | { 
  action?: 'CheckToken'
  success: true
  fields: {
    userId: number
    mobilePhoneNumber: string
    deviceId: string
  }
} | {
  action?: 'RequestOTP'
  success: boolean
} | {
  action?: 'GetNotifications'
  success: boolean
  notifications: {
    id: number
    titleRu: string
    titleTm: string
    createdAt: string
    textRu: string
    textTm: string
    dateTillShow: string
  }[]
} | {
  action?: 'GetBalance'
  success: boolean
  balance: number
} | {
  action?: 'DeleteUser'
  success: boolean
} | {
  action?: 'GetWorkingServices'
  success: boolean
  services: Record<TopUpServiceType, boolean>

  banks: Record<'1' | '2', boolean>
} | {
  action?: 'GetHistory'
  topUpGroups: {
    TopUpGroup: TopUpGroupFields,
    TopUp: TopUpFields
  }[]
}

//============= SMS Requests ================

export type ApiSmsRequest = {
  action: 'RequestSms'
  fields: {
    deviceId: string
    mobilePhoneNumber: string
  }
} | {
  action: 'ValidateSms'
  fields: {
    deviceId: string
    mobilePhoneNumber: string
    smsCode: string
  }
}

export type ApiSmsResponse = {
  fields: {
    result: boolean
  }
}
