import { TopUpFields } from '@/document/topUp/topUp'
import * as cdmaApi from '@/lib/agts-cdma'
import { RtsError } from '@/lib/errors'

class Plugin implements ITopUpPlugin {
  async process(fields: TopUpFields) {
    if (!fields.phoneNumber)
      throw new RtsError('EMPTY-PHONE-NUMBER', 'Empty phone number', { fields })
    const req = await cdmaApi.processCDMAPayment(fields.phoneNumber, fields.amount / 100, 1000 + fields.id)
    const res = {
      cdmaReqId: req.req_id,
      cdmaStatus: req.status,
      cdmaRrn: String(req.rrn),
      cdmaSuccess: String(req.success)
    }
    return res
  }
  async checkFields(fields: TopUpFields) {
    if (!fields.phoneNumber)
      throw new RtsError('EMPTY-PHONE-NUMBER', 'Empty phone number', { fields })
    if (fields.serviceType != 'cdma')
      throw new RtsError('WRONG-SERVICE', 'Wrong service specified', { expectedService: 'cdma', actualService: fields.serviceType })
  }

}

const plugin = () => {
  return new Plugin() as ITopUpPlugin
}
export default plugin as TopUpPluginFabricFun