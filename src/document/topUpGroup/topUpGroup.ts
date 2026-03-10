import { DrizzleTableName } from '@/db/drizzle/schema'
import { Doc } from '../document'
import { topUpGroup } from '@/db/drizzle/schema'
import { InferSelectModel } from 'drizzle-orm'
import { MsPay } from '@/lib/msPayApi/msPayApi'
import { RtsError } from '@/lib/errors'
import { TopUp, TopUpFields } from '../topUp/topUp'
import { logMethod, logger } from '@/lib/logger'
import { TaskLogger } from '@/periodic_tasks/taskLogger'

export const topUpGroupStatuses = [
  'NEW', 
  'PAYMENT_CREATED', 
  'PAYMENT_PROCESSING', 
  'PAID',
  'DONE',
  'CANCELED',
  'PAYMENT_REJECTED',
  'TOPUP_IN_PROGRESS',
  'PARTIALLY_DONE'
] as const
export type TopUpGroupStatus = typeof topUpGroupStatuses[number]
export type TopUpGroupAction = 'MakeDone' | 'CreatePayment' | 'ConfirmPayment' | 'MakePaid'
type TopUpGroupStatusField = { status: TopUpGroupStatus }
export type TopUpGroupFields = Omit<InferSelectModel<typeof topUpGroup>, 'status'> & TopUpGroupStatusField

export const topUpStatusActions = {
  'NEW': {
    'PAYMENT_CREATED': 'CreatePayment',
    'CANCELED': ''
  },
  'PAYMENT_CREATED': {
    'PAYMENT_PROCESSING': 'ConfirmPayment',
    'PAYMENT_REJECTED': '',
  },
  'PAYMENT_PROCESSING': {
    'PAID': 'MakePaid',
    'PAYMENT_REJECTED': ''
  },
  'PAID': {
    'DONE': 'MakeDone',
    'PARTIALLY_DONE': ''
  },
  'PARTIALLY_DONE': {
    'DONE': 'MakeDone'
  }
} as Record<TopUpGroupStatus, Record<TopUpGroupStatus, TopUpGroupAction | ''>> 

export type DataField = 'mspayReceipt' | 'maskedPhoneNumber' | 'maskedCardNumber'

type CardField = 
  | 'card.pan'
  | 'card.month'
  | 'card.year'
  | 'card.cvc'
  | 'card.holder'

type SessionField =
  | 'otpCode'
  | 'vendorName'
  | 'bankPluginInfoName'
  | CardField
  | 'taskName'

export class TopUpGroup extends Doc<TopUpGroupFields> {
  getTableName(): DrizzleTableName {
    return 'top_up_group'
  }

  override get fields() {
    return super.fields as TopUpGroupFields
  }

  override get dataFields() {
    return super.dataFields as Record<DataField, string>
  }

  get sessionData() {
    return this._sessionData as Partial<Record<SessionField, string>>
  } 

  @logMethod('TopUpGroup')
  async createPayment() {
    console.log(this.sessionData)
    if (!this.sessionData['vendorName'])
      throw new RtsError('VENDOR-NOT-SET', 'vendor not set', { id: this.fields.id })
    if (!this.sessionData['bankPluginInfoName'])
      throw new RtsError('BANK-NOT-SET', 'bankPluginInfoName not set', { id: this.fields.id })
    if (!this.fields.amount)
      throw new RtsError('WRONG-AMOUNT', 'Wrong top up group amount', {})

    const dbTopUpHandler = this._dbFabric.create('top_up')
    await dbTopUpHandler.transaction(async (tx) => {
      const rows = await dbTopUpHandler.select(tx, { topUpGroupId : this.fields.id})
      console.log({rows})
      const sum = (rows as TopUpFields[]).map(r => r.amount).reduce((a,b) => a+b, 0)
      if (sum != this.fields.amount)
        throw new RtsError(
          'WRONG-AMOUNT', 
          'TopUpGroup amount does not match sum of TopUp amounts',
          {sum, amount: this.fields.amount})
    })

    console.log('bankPluginInfoName:', this.sessionData['bankPluginInfoName'])
    const res1 = await MsPay.payment.doAction('New', {
      fields: { 
        vendorName: this.sessionData['vendorName'],
        bankPluginInfoName: this.sessionData['bankPluginInfoName']
      },
      dataFields: { description: `AgtsBackendPayment. TopUpGroupId: ${this.fields.id}` }
    })

    await MsPay.payment.doAction('Start', {
      fields: {
        id: res1.fields.id,
        amount: this.fields.amount
      }
    })

    const cardInfo: Record<CardField, string> = {
      'card.pan': this.sessionData['card.pan'] || '',
      'card.month': this.sessionData['card.month'] || '',
      'card.year': this.sessionData['card.year'] || '',
      'card.cvc': this.sessionData['card.cvc'] || '',
      'card.holder': this.sessionData['card.holder'] || ''
    }

    await MsPay.payment.doAction('Process', {
      fields: { id: res1.fields.id },
      sessionFields: cardInfo
    })

    const res2 = await MsPay.payment.doAction('Start3DS', {
      fields: { id: res1.fields.id }
    })

    this.fields.rtsPaymentStatus = res2.fields.status
    this.fields.rtsPaymentReceipt = res2.dataFields.internalReceipt
    this.fields.rtsPaymentId = res2.fields.id

    const {maskedPhoneNumber, maskedCardNumber} = res2.dataFields
    this.dataFields.maskedCardNumber = maskedCardNumber
    this.dataFields.maskedPhoneNumber = maskedPhoneNumber    
  }

  async confirmPayment() {
    if (!this.fields.rtsPaymentId)
      throw new RtsError('NO-PAYMENT', 
        'Payment was not attached to TopUpGroup', {id: this.fields.id})
    if (!this.sessionData.otpCode)
      throw new RtsError('NO-OTP', 'No otp code was specified', {})

    const res = await MsPay.payment.doAction('ConfirmOtp', {
      fields: { id: this.fields.rtsPaymentId },
      sessionFields: { otpCode: this.sessionData.otpCode }
    })

    this.fields.rtsPaymentStatus = res.fields.status
  }

  async makePaid() {
    if (!this.fields.rtsPaymentId)
      throw new RtsError('PAYMENT-NO-ATTACHED', 'Payment was not attached to TopUpGroup', {
        id: this.fields.id
      })
      
    const res = await MsPay.payment.doAction('Get', {
      fields: { id: this.fields.rtsPaymentId }
    })

    if (this.fields.rtsPaymentId != res.fields.id)
      throw new RtsError('INTERNAL-ERROR', 'Wrong payment Id was received', {
        rtsPaymentId: this.fields.rtsPaymentId,
        paymentId: res.fields.id
      })

    this.fields.rtsPaymentStatus = res.fields.status
    console.log({res})

    if (res.fields.status == 'DECLINED') {
      this.fields.status = 'PAYMENT_REJECTED'
    } else if (res.fields.status == 'CANCELED')
      this.fields.status = 'CANCELED'
    else if (res.fields.status != 'DONE')
      throw new RtsError('PAYMENT-NOT-DONE', 'Payment not done yet', {
        id: this.fields.id,
        rtsPaymentId: this.fields.rtsPaymentId,
        rtsPaymentReceipt: this.fields.rtsPaymentReceipt,
        rtsPaymentStatus: this.fields.rtsPaymentStatus
      })
  }

  async makeTopUpsDone(rows: IEntityFields[]) {
    let N = 0
    // console.log({rows})
    for (const row of rows) {
      const topUp = new TopUp(this._dbFabric)
      await topUp.loadExisting(row.id)
      topUp.fields.status = 'DONE'
      try {
        await topUp.save()
        N++
      } catch (e) {
        logger.marked(`# Cannot proceed TOPUP ${topUp.fields.id}`)
        const taskName = this.sessionData['taskName'] || '<topUpGroup>'
        if (e instanceof RtsError) {
          console.error(e.code, e.message, e.data)
          await TaskLogger.log(taskName, 'makeTopUpsDone', 
            `id: ${this.fields.id}, ${e.code}, ${e.message}, ${JSON.stringify(e.data)}`)
        }
        else {
          console.log(e)
          await TaskLogger.log(taskName, 'makeTopUpsDone', `${e}`)
        }
      }
    }
    return N
  }

  async makeDone() {
    const dbTopUpHandler = this._dbFabric.create('top_up')
    
    await dbTopUpHandler.transaction(async (tx) => {
      const rows = await dbTopUpHandler.select(tx, { topUpGroupId : this.fields.id})
      const N = rows.length
      const succefullN = await this.makeTopUpsDone(rows)

      if (succefullN < N)
        TopUpGroup.incRetriesCounter(this.fields.id, this._dbFabric)

      if (succefullN == 0)
        this.fields.status = 'PAID'
      else if (succefullN < N)
        this.fields.status = 'PARTIALLY_DONE'
    })    
  }

  async doAction(action: TopUpGroupAction) {
    if (action == 'CreatePayment')
      await this.createPayment()
    else if (action == 'ConfirmPayment')
      await this.confirmPayment()
    else if (action == 'MakePaid')
      await this.makePaid()
    else if (action == 'MakeDone')
      await this.makeDone()
    else 
      throw new RtsError('UNKOWN-ACTION', 'Uknown action for TopUpGroup', { action })
    console.log('DOACTION:', action)
  }
  async onAfterChangeStatus(oldStatus: TopUpGroupStatus, newStatus: TopUpGroupStatus) {
    await super.onAfterChangeStatus(oldStatus, newStatus)
    console.log({oldStatus, newStatus})
  }
  async onBeforeSave() {
    await super.onBeforeSave()
    console.log('[Test Document] before save')
  }
  async onAfterSave() {
    await super.onAfterSave()
    console.log('[Test Document] after save')
  }
    
  @logMethod('TopUpGroup')
  static incRetriesCounter(id: number, dbHandlerFabric: IDbHandlerFabric) {
    TopUpGroup.doIncRetriesCounter(id, dbHandlerFabric).then(() => {
      console.log('Increased retry counter', {id})
    }).catch(e => {
      console.log('Error while increasing retries counter')
      console.error(e)
    })
  }
  
  private static async doIncRetriesCounter(id: number, dbHandlerFabric: IDbHandlerFabric) {
    const delay = new Promise((resove) => { setTimeout(resove, 100) } )
    await delay

    console.log(`incRetriesCounter ${id}`)
    try {
      const db = dbHandlerFabric.create('top_up_group')
      await db.transaction(async tx => {
        const [row] = (await db.select(tx, { id })) as TopUpGroupFields[]
        const data = { retries: (row.retries || 0) + 1 } as Partial<TopUpGroupFields>
        await db.update(tx, id, data)
      })
      console.log(`# incRetriesCounter done ${id}`)
    } catch (e) {
      if (e instanceof RtsError)
        console.log(e.code, e.message, e.data)
      else
        console.log(`Error: ${e}`)
    }
  }

  constructor (handler: IDbHandlerFabric) {
    super(handler)
    this.statusActions = topUpStatusActions
  }
}
