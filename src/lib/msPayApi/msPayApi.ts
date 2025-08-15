import { RtsError } from '../errors'
import { ApiAnyReq, ApiAnyResp, ApiErrorResp, ApiPaymentRequest, ApiSuccefullPaymentResp, ApiSuccefullResp } from './request_types'

abstract class DocumentApi<TReqType extends ApiAnyReq, TRespType extends ApiSuccefullResp> {
  async doAction<
    TReq extends TReqType,
    TAction extends TReq['action']
    >(action: TAction, data: Omit< {action: TAction} & TReqType, 'action' >) : Promise<TRespType> 
  {
    const payload = { action, ...data}
    try {
      const res = await this.fetchAction(payload)
      console.log(res, "RESPONSE");
      
      return res
    } catch (e) {
      if (e instanceof RtsError)
        throw e
      else if (e instanceof Error)
        throw new RtsError('INTERNAL-ERROR', e.message, {})
      else 
        throw new RtsError('INTERNAL-ERROR', `${e}`, {})
    }
  }

  abstract get url(): string

  private isErrorResp(obj: ApiAnyResp) : obj is ApiErrorResp {
    return !!(obj as { errorCode?: string }).errorCode
  }

  private async fetchAction(payload: ApiAnyReq) {
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    const requestOptions = {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    }
    
    const url = this.url
    try {
      // eslint-disable-next-line no-var
      var fetchRes = await fetch(url, requestOptions)
      console.log(url, "URL-API")
      console.log(fetchRes.status, "STATUS-API")
    } catch (e) {
      console.error(e)
      throw new RtsError('MSPAY-NOT-AVAILABLE', 'Millisan Payment server is not available', {})
    }
    const text = await fetchRes.text()
    const resObj = JSON.parse(text) as TRespType
    if (this.isErrorResp(resObj))
      throw new RtsError(resObj.errorCode, resObj.error, resObj.data)
    
    return resObj
  }
}

export class PaymentApi extends DocumentApi<ApiPaymentRequest, ApiSuccefullPaymentResp> {
  get url(): string {
    return process.env.MSPAY_API_URL || 'http://127.0.0.1:3000/payment'
  }

  override async doAction<
    TReq extends ApiPaymentRequest,
    TAction extends TReq['action']
    >(action: TAction, data: Omit< {action: TAction} & ApiPaymentRequest, 'action' >) 
  {
    console.log(action)
    console.log(data)
    // const payload = { action, ...data}
    // const res = await this.fetchAction(payload)
    const res = await super.doAction(action, data)
    console.log(res, "MSAPI RESPONSE")
    return res
  }
}

export class MsPay {
  static #paymentApi?: PaymentApi
  static get payment() {
    if (!MsPay.#paymentApi) {
      MsPay.#paymentApi = new PaymentApi
    }
    return MsPay.#paymentApi
  }
}
