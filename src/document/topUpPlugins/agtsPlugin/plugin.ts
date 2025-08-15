import { TopUpFields, TopUpServiceType } from '@/document/topUp/topUp'
import { getAgtsApi } from './agts-api/agtsApiFabric'
import { RtsError } from '@/lib/errors'
import dayjs from 'dayjs'
import { logMethod } from '@/lib/logger'

class Plugin implements ITopUpPlugin {
  #api?: AgtsApi
  
  public async isServiceEnabled(phone: string, srv: TopUpServiceType) {
    const api = getAgtsApi()
    if (!phone) return false
    const services = await api.getServices({ phone })
    // console.log({services})
    const service = services[srv]
    return !!(service && service.number)
  }

  public async checkServiceEnabled(phone: string, srv: TopUpServiceType) {
    const serviceEnabled = await this.isServiceEnabled(phone, srv)
    if (!serviceEnabled)
      throw new RtsError('SERVICE-NOT-ENABLED', 'Service is not enabled', {
        service: srv,
        phone
      })
  }

  @logMethod('AGTS-PLUGIN')
  async checkFields(fields: TopUpFields) {
    // console.log(fields)
    if (!fields.phoneNumber)
      throw new RtsError('EMPTY-PHONE-NUMBER', 'Empty phone number', { fields })
    await this.checkServiceEnabled(fields.phoneNumber, fields.serviceType)
  }  

  async process(fields: TopUpFields) {
    const api = getAgtsApi()
    const phone = fields.phoneNumber
    if (!phone)
      throw new RtsError('PHONE-NOT-SPECIFIED', 'Phone number is not specified', {})
    const agtsServices = await api.getServices({ phone })
    const serviceType = fields.serviceType as AgtsServiceType
    const agtsService = agtsServices[serviceType]
    if (!agtsService)
      throw new RtsError('WRONG-SERVICE', 'Wrong service specified for user', {phone, serviceType})
    if (!fields.internalReceipt)
      throw new RtsError('WRONG-RECEIPT', 'Receipt field was not filled', {})
    if (!process.env.WHITE_SERVER_IP)
      throw new RtsError('NO-WHITE-IP', 'Agts white IP address was not specified', {})

    const payload: AgtsUpdateBalaceReq = {
      agrmNum: agtsService.number,
      receiptNum: fields.internalReceipt,
      receiptDate: dayjs().format('YYYYMMDDHHmmss'),
      amount: fields.amount / 100,
      ipaddress: process.env.WHITE_SERVER_IP
    }
    const res = await api.updateBalance(payload)
    return res
  }

  get api(): AgtsApi {
    if (!this.#api) {
      this.#api = getAgtsApi()
    }
    return this.#api
  }
}

const plugin = () => {
  return new Plugin() as ITopUpPlugin
}
export default plugin as TopUpPluginFabricFun