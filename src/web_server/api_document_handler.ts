import { Doc } from '@/document/document'
import { ApiEntityHandler } from './api_entity_handler'
import { ApiActionInfo } from './api_types'
import { ApiAnyReq } from './request_types'

export abstract class ApiDocumentHandler extends ApiEntityHandler {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override async onAssignFields(doc: Doc, apiAction: string, payload: ApiAnyReq) {
    const apiActionInfo: ApiActionInfo = this.apiActionInfos[apiAction]
    if (apiActionInfo.status)
      doc.fields['status'] = apiActionInfo.status
  }
}