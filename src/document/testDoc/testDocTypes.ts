import { testDocument } from '@/db/drizzle/schema'
import { InferSelectModel } from 'drizzle-orm'

export const testDocStatuses = ['NEW', 'UPDATED', 'CLOSED'] as const
export type TestDocStatus = typeof testDocStatuses[number]
export type TestDocAction = 'MakeUpdated' | 'MakeClosed'
export type TestDocFields = InferSelectModel<typeof testDocument>

export const testDocStatusActions = {
  'NEW': {
    'UPDATED': 'MakeUpdated'
  },
  'UPDATED': {
    'CLOSED': 'MakeClosed'
  }

} as Record<TestDocStatus, Record<TestDocStatus, TestDocAction | ''>> 
