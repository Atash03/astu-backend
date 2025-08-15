import Ajv from 'ajv'
import anyApiReq from './json_schema/api_any_req'
import { ApiDocumentHandler } from './api_document_handler'
import { ApiActionInfo } from './api_types'
import { TopUp } from '@/document/topUp/topUp'
import topUpNewReq from './json_schema/top_up_new_req'


const ajv = new Ajv()
type ApiAction = 'New'
const apiActionInfos = {
  'New': {
    validator: ajv.compile(topUpNewReq),
    status: 'NEW',
    actionType: 'save'
  }
} satisfies Record<ApiAction, ApiActionInfo>

export class TopUpApiHandler extends ApiDocumentHandler {
  get handlerValidator() {
    return ajv.compile(anyApiReq)
  }

  get apiActionInfos() {
    return apiActionInfos
  }

  async createDoc() {
    return new TopUp(this.dbHandlerFabric)    
  }
}