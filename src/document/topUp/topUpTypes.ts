import { topUp } from '@/db/drizzle/schema'
import { InferSelectModel } from 'drizzle-orm'

export const topUpStatuses = ['NEW', 'ERROR', 'DONE', 'CANCELED'] as const
export type TopUpStatus = typeof topUpStatuses[number]
export type TopUpAction = 'MakeDone'
export type TopUpServiceType = 'inet' | 'iptv' | 'phone' | 'cdma'

type TopUpServiceTypeField = { serviceType: TopUpServiceType }
type TopUpStatusField = { status: TopUpStatus }
export type TopUpFields = Omit<InferSelectModel<typeof topUp>, 'status' | 'serviceType'> & TopUpStatusField & TopUpServiceTypeField
