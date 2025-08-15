import Ajv, {DefinedError, ValidateFunction} from 'ajv'
import apiAnyReqSchema from './json_schema/api_any_req'
import { ApiAnyReq } from './request_types'
import { DbHandlerFabric } from '@/document/dbHandlerFabric'
import { ApiActionInfo, ApiError } from './api_types'

const ajv = new Ajv()
const validateReq = ajv.compile<ApiAnyReq>(apiAnyReqSchema) 
export abstract class ApiHandler<T> {
  dbHandlerFabric: DbHandlerFabric
  token?: string
  abstract get apiActionInfos(): Record<string, ApiActionInfo>
  abstract get handlerValidator(): ValidateFunction
  abstract handleApiAction(apiAction: string, payload: ApiAnyReq): Promise<T>

  constructor (dbHandlerFabric: DbHandlerFabric) {
    this.dbHandlerFabric = dbHandlerFabric
  }

  getErrorData(validateFun: ValidateFunction) {
    const result: object[] = []
    for (const err of validateFun.errors as DefinedError[]) {
      //result += JSON.stringify(err)
      result.push(err)
    }
    return result
  }  

  async handleApiRequest(payload: unknown) {
    console.log('handle Api request', payload)
    if (!validateReq(payload)) {
      console.log('Wrong request format:', this.getErrorData(validateReq))
      throw new ApiError('WRONG-FORMAT', 'Wrong request format:', this.getErrorData(validateReq))
    }
    
    console.log('Action type = ', payload.action)
    const action = payload.action

    // Checking base schema for document request
    if (!this.handlerValidator(payload)) {
      throw new ApiError('WRONG-FORMAT', 'Wrong request format', this.getErrorData(this.handlerValidator))
    } else
    {
      console.log('Validation OK')
    }   

    const allowedActions = Object.keys(this.apiActionInfos)
    if (!this.apiActionInfos[action])
      throw new ApiError('WRONG-ACTION', 'Wrong api action', { action, allowedActions })

    const apiActionInfo: ApiActionInfo = this.apiActionInfos[action]
    const validate = apiActionInfo.validator

    // Checking schema for specific action
    if (!apiActionInfo.isCrutch)
      if (!validate(payload)) {
        throw new ApiError('WRONG-FORMAT', `Wrong request format for action'${action}'`, this.getErrorData(validate))
      }

    return await this.handleApiAction(action, payload)
  }  
}