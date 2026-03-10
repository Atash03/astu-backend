import { DrizzleTableName } from '@/db/drizzle/schema'
import { Doc } from '../document'
import { TopUpPluginInfo } from '../topUpPluginInfo/topUpPluginInfo'
import { RtsError } from '@/lib/errors'
import dayjs from 'dayjs'
import { TopUpGroup, TopUpGroupFields } from '../topUpGroup/topUpGroup'
import { logMethod } from '@/lib/logger'
import { topUpStatuses, type TopUpStatus, type TopUpAction, type TopUpServiceType, type TopUpFields } from './topUpTypes'

export { topUpStatuses, type TopUpStatus, type TopUpAction, type TopUpServiceType, type TopUpFields }

export const topUpStatusActions = {
  'NEW': {
    'DONE': 'MakeDone',
    'ERROR': '',
    'CANCELED': ''
  },
  'ERROR': {
    'DONE': ''
  }

} as Record<TopUpStatus, Record<TopUpStatus, TopUpAction | ''>> 

export type DataField = never


export class TopUp extends Doc<TopUpFields> {
  plugin?: ITopUpPlugin

  getTableName(): DrizzleTableName {
    return 'top_up'
  }

  override get fields() {
    return super.fields as TopUpFields
  }

  override get dataFields() {
    return super.dataFields as Record<DataField, string>
  }

  async doAction(action: TopUpAction) {
    console.log('DOACTION:', action)
    if (action == 'MakeDone') {
      console.log('TOP_UP: MAKE DONE')
      const plugin = await this.getPlugin()
      await plugin.process(this.fields)
    }
  }

  async getPlugin() {
    if (this.plugin)
      return this.plugin

    if (!this.fields.pluginInfoName)
      throw new RtsError('NO-PLUGIN-NAME', 'No plugin name was specified', {})

    const pluginInfo = new TopUpPluginInfo(this._dbFabric)
    await pluginInfo.loadExistingByName(this.fields.pluginInfoName)
    const path = `../topUpPlugins/${pluginInfo.fields.plugin}`
    const pluginModule = await import(path) as ITopUpPluginModule

    this.plugin = pluginModule.default()
    return this.plugin
  }

  // async onAfterChangeStatus(oldStatus: TopUpStatus, newStatus: TopUpStatus) {
  //   await super.onAfterChangeStatus(oldStatus, newStatus)
  //   console.log({oldStatus, newStatus})
  // }
  genReceipt() {
    const dateStr = dayjs().format('YYYYMMDDHHmmss')
    return `${this.fields.phoneNumber}-${this.fields.serviceType}-${this.fields.topUpGroupId}-${dateStr}`
  }

  @logMethod('TOP-UP')
  override async createNew() {
    this.fields.internalReceipt = this.genReceipt()
    const topUpGroupId = this.fields.topUpGroupId
    if (topUpGroupId) {
      await this.checkAmountExceeded(topUpGroupId)
    }
    
    const plugin = await this.getPlugin()
    await plugin.checkFields(this.fields)

    await super.createNew()
    console.log(this.fields.internalReceipt)
  }  

  constructor (handler: IDbHandlerFabric) {
    super(handler)
    this.statusActions = topUpStatusActions
  }

  private async checkAmountExceeded(topUpGroupId: number) {
    const topUpGroup = new TopUpGroup(this._dbFabric)
    await topUpGroup.loadExisting(topUpGroupId)
    if (topUpGroup.fields.status != 'NEW')
      throw new RtsError('TOPUPGROUP-WRONG-STATUS', 'TopUpGroup has wrong status', {
        requiredStatus: 'NEW',
        actualStatus: topUpGroup.fields.status
      })
    const dbHandler = this._dbFabric.create('top_up' as DrizzleTableName)
    const topUps = await dbHandler.transaction(async (tx) => {
      return await dbHandler.select(tx, { topUpGroupId }) as TopUpGroupFields[]
    })
    const sum = topUps.map(item => item.amount).reduce((a, b) => a + b, 0)
    if (sum + this.fields.amount > topUpGroup.fields.amount)
      throw new RtsError('AMOUNT-EXCEEDED', 'Amount of topUpGroup exceeded', {
        topUpGroupAmount: topUpGroup.fields.amount,
        topUpsAmount: sum,
        addingAmount: this.fields.amount,
        notFittedAmount: sum + this.fields.amount - topUpGroup.fields.amount
      })
  }
}