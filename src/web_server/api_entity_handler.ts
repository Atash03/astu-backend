import { ApiAnyReq } from './request_types'
import { RtsEntity } from '@/document/document'
import { ApiActionInfo, ApiError, actionType } from './api_types'
import { logger } from '@/lib/logger'
import { ApiHandler } from './api_handler'
import { IEntityFields } from '@/document/document_types'
// import { RtsError } from '@/lib/errors'
// import { ValidateFunction } from 'ajv'

type DocumentApiResponse = {
  fields: IEntityFields
  dataFields: Record<never, string>
}

export abstract class ApiEntityHandler extends ApiHandler<DocumentApiResponse> {

  abstract onAssignFields(doc: RtsEntity, apiAction: string, payload: ApiAnyReq): Promise<void> 
  abstract createDoc(): Promise<RtsEntity>

  generateResponse(doc: RtsEntity) {
    delete (doc as {dataFields: unknown}) ['dataFields'] 
    return { fields: doc.fields, dataFields: doc.dataFields }
  }

  override async handleApiAction(apiAction: string, payload: ApiAnyReq) {
    const apiActionInfo: ApiActionInfo = this.apiActionInfos[apiAction]
    const action = apiAction
    
    if (!this.apiActionInfos[action])
      throw new ApiError('UNKNOWN-ACTION-TYPE', 'Action type unknown', {action})

    // console.log({a: this.apiActionInfos[action]})

    const docActionType = this.apiActionInfos[action].actionType
    if (docActionType == actionType.save)
      return await this.doSaveAction(payload, apiActionInfo, apiAction)  
    else if (docActionType == actionType.get) {
      return await this.doGetAction(payload, apiAction)
    } 
    else throw new ApiError('UNKNOWN-ACTION-TYPE', 'Action type unknown', {action})
  }

  private async doGetAction(payload: ApiAnyReq, action: string) {
    const id = (payload?.fields as { id?: number} )?.id
    if (!id)
      throw new ApiError('NO-ID-SPECIFIED', 'id field requered for action', {action})
    const doc = await this.createDoc()
    await doc.loadExisting(id)
    return this.generateResponse(doc)
  }

  private async doSaveAction(payload: ApiAnyReq, apiActionInfo: ApiActionInfo, apiAction: string) {
    const doc = await this.createDoc()

    const id = (payload?.fields as { id?: number} )?.id
    if (id) {
      logger.log('Loading document: ', id)
      await doc.loadExisting(id)
    }

    // Assigning fields
    Object.assign(doc.fields, payload.fields)
    Object.assign(doc.dataFields, payload.dataFields)

    // if (apiActionInfo.status)
    //   doc.fields['status'] = apiActionInfo.status
    await this.onAssignFields(doc, apiAction, payload)

    if (!id)
      await doc.createNew()
    else
      await doc.save()

    // Reloading document
    await doc.loadExisting(doc.fields.id)
    return this.generateResponse(doc)
  }
}

