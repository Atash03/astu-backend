import { RtsError } from '@/lib/errors'

export class AgtsError extends RtsError {
  agtsErrorCode?: string
  // errorCode: string
  constructor (errorCode: string, message: string, data: object & { agtsMessage: string }) {
    super(errorCode, message, data)
    //this.errorCode = errorCode
    //this.agtsErrorCode = agtsErrorCode
  }
}