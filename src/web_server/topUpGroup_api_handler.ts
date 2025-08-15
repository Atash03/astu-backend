import Ajv from 'ajv'
import { ApiDocumentHandler } from './api_document_handler'
import { ApiActionInfo, ApiError } from './api_types'
import { TopUpGroup, TopUpGroupStatus } from '@/document/topUpGroup/topUpGroup'
import { ApiAnyReq } from './request_types'
import anyReq from './json_schema/api_any_req'
import topUpGroupConfirmPaymentReq from './json_schema/top_up_group_confirm_payment_req'
import topUpGroupCreatePaymentReq from './json_schema/top_up_group_create_payment_req'
import topUpGroupNewReq from './json_schema/top_up_group_new_req'
import topUpGroupAnyReq from './json_schema/top_up_group_any_req'

const ajv = new Ajv()
type ApiAction = 'New' | 'CreatePayment'  | 'ConfirmPayment' | 'MakePaid' | 'MakeDone' |'Get'
const apiActionInfos = {
  'New': {
    validator: ajv.compile(topUpGroupNewReq),
    status: 'NEW' satisfies TopUpGroupStatus,
    actionType: 'save' 
  },
  'CreatePayment': {
    validator: ajv.compile(topUpGroupCreatePaymentReq),
    status: 'PAYMENT_CREATED' satisfies TopUpGroupStatus,
    actionType: 'save'
  },
  'ConfirmPayment': {
    validator: ajv.compile(topUpGroupConfirmPaymentReq),
    status: 'PAYMENT_PROCESSING' satisfies TopUpGroupStatus,
    actionType: 'save'
  },
  'MakePaid': {
    validator: ajv.compile(anyReq),
    status: 'PAID' satisfies TopUpGroupStatus,
    actionType: 'save'
  },
  'MakeDone': {
    validator: ajv.compile(anyReq),
    status: 'DONE' satisfies TopUpGroupStatus,
    actionType: 'save'
  },
  'Get' : {
    validator: ajv.compile(anyReq),
    actionType: 'get'
  }
  
} satisfies Record<ApiAction, ApiActionInfo>

export class TopUpGroupApiHandler extends ApiDocumentHandler {
  get handlerValidator() {
    return ajv.compile(topUpGroupAnyReq)
  }

  get apiActionInfos() {
    return apiActionInfos
  }

  async onAssignFields(doc: TopUpGroup, apiActionName: ApiAction, payload: ApiAnyReq ) {
    await super.onAssignFields(doc, apiActionName, payload)
    const apiAction: ApiActionInfo = this.apiActionInfos[apiActionName]
    if ((payload.action !== 'New') && (doc._initFields.status == apiAction.status)) {
      const errData = {fields: doc.fields, dataFields: doc.dataFields}
      throw new ApiError('ALREADY-DONE', `Document action already done: ${apiActionName}`, {errData})
    }
    Object.assign(doc.sessionData, payload.sessionFields)
  }

  async createDoc() {
    return new TopUpGroup(this.dbHandlerFabric)    
  }
}