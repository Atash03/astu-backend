import Ajv from 'ajv'
import { ValidateFunction } from 'ajv'
import { ApiActionInfo } from './api_types'
import { ApiHandler } from './api_handler'
import { RtsError } from '@/lib/errors'
import { con } from '@/db/drizzle/drizzle'
import { topUp, topUpGroup } from '@/db/drizzle/schema'
import { eq, gte, lt } from 'drizzle-orm'
import { HistoryRequest } from './request_types'
import historyReq from './json_schema/history_req'

const ajv = new Ajv()

type ApiAction = 'List' 

const apiActionInfos = {
  'List': {
    validator: ajv.compile<HistoryRequest>(historyReq),
    actionType: 'list'
  }
} satisfies Record<ApiAction, ApiActionInfo>

// eslint-disable-next-line @typescript-eslint/ban-types
type HistoryResp = {
}[]

const DB_MODE = process.env.DB_MODE || 'json'

export class ApiHistoryHandler extends ApiHandler<HistoryResp> {
  get apiActionInfos(): Record<string, ApiActionInfo> {
    return apiActionInfos
  }

  get handlerValidator(): ValidateFunction<unknown> {
    return ajv.compile(historyReq)
  }

  override async handleApiAction(apiAction: string, payload: HistoryRequest) {
    if (DB_MODE !== 'drizzle')
      throw new RtsError('HISTORY-ONLY-DRIZZLE', 'History API works only with Drizzle db mode', {})

    let query = con.select()
      .from(topUpGroup)
      .innerJoin(topUp, eq(topUp.topUpGroupId, topUpGroup.id)).$dynamic()
    
    if (payload.fields.maxDate)
      query = query.where(lt(topUpGroup.createdAt, new Date(payload.fields.maxDate))).$dynamic()
    if (payload.fields.minDate)
      query = query.where(gte(topUpGroup.createdAt, new Date(payload.fields.minDate))).$dynamic()

    if (payload.fields.take)
      query = query.limit(payload.fields.take).$dynamic()

    if (payload.fields.skip)
      query = query.offset(payload.fields.skip).$dynamic()

    query = query.orderBy(topUpGroup.id).$dynamic()

    const grouppedRes = {} as Record<number, {topUpGroup:object, topUps: object[]}>
    for (const row of await query) {
      if (!grouppedRes[row.top_up_group.id]) {
        grouppedRes[row.top_up_group.id] = {
          topUpGroup: row.top_up_group,
          topUps: []
        }
      }
      grouppedRes[row.top_up_group.id].topUps.push(row.top_up)
    }

    const res = []
    for (const item in grouppedRes)
      res.push(grouppedRes[item])

    return res
  }
}