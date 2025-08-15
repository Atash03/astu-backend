import Ajv from 'ajv'
import anyApiReq from './json_schema/api_any_req'
import { ApiDocumentHandler } from './api_document_handler'
import { ApiActionInfo } from './api_types'
import { TestDoc } from '@/document/testDoc/testDoc'

const ajv = new Ajv()
type ApiAction = 'NewDoc' | 'SaveDoc' | 'Get' 
const apiActionInfos = {
  'NewDoc': {
    validator: ajv.compile(anyApiReq),
    status: 'NEWDOC',
    actionType: 'save'
  },
  'SaveDoc': {
    validator: ajv.compile(anyApiReq),
    status: 'SAVED_DOC',
    actionType: 'save'
  },
  'Get': {
    validator: ajv.compile(anyApiReq),
    actionType: 'get'
  }
} satisfies Record<ApiAction, ApiActionInfo>

export class TestDocApiHandler extends ApiDocumentHandler {
  get handlerValidator() {
    return ajv.compile(anyApiReq)
  }

  get apiActionInfos() {
    return apiActionInfos
  }

  async createDoc() {
    return new TestDoc(this.dbHandlerFabric)    
  }
}