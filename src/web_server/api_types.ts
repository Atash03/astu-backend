import { RtsError } from '@/lib/errors'
import { ValidateFunction } from 'ajv'

export class ApiError extends RtsError {
}

export const actionType = {
  save: 'save',
  list: 'list',
  get: 'get'
} as const

export type ActionType = keyof typeof actionType

export type ApiActionInfo = {
  validator: ValidateFunction,
  status?: string
  actionType: string
  isCrutch?: boolean
}