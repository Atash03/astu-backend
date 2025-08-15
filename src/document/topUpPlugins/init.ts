import { DbHandlerFabric } from '@/document/dbHandlerFabric'
import { logger } from '@/lib/logger'
import { TopUpPluginInfo } from '../topUpPluginInfo/topUpPluginInfo'

async function registerAgtsTopUpPlugin(pluginInfo: TopUpPluginInfo) {
  pluginInfo.fields.title = 'Agts top up plugin'
  pluginInfo.fields.name = 'AgtsTopUp'
  pluginInfo.fields.plugin = 'agtsPlugin/plugin.ts'
  pluginInfo.fields.active = true
  await pluginInfo.createNew()
}

async function registerAgtsCdmaTopUpPlugin(pluginInfo: TopUpPluginInfo) {
  pluginInfo.fields.title = 'Agts CDMA top up plugin'
  pluginInfo.fields.name = 'AgtsCdmaTopUp'
  pluginInfo.fields.plugin = 'agtsCdmaPlugin/plugin.ts'
  pluginInfo.fields.active = true
  await pluginInfo.createNew()
}


export async function init(mode: 'drizzle' | 'json') {
  const dbHandlerFabric = new DbHandlerFabric(mode)
  const agtsPluginInfo = new TopUpPluginInfo(dbHandlerFabric)
  const agtsCdmaPluginInfo = new TopUpPluginInfo(dbHandlerFabric)

  try {
    await agtsPluginInfo.loadExistingByName('AgtsTopUp')
    logger.log('AgtsTopUp plugin already registered. Skipping')
  }
  catch(e) {
    await registerAgtsTopUpPlugin(agtsPluginInfo)
  }

  try {
    await agtsCdmaPluginInfo.loadExistingByName('AgtsCdmaTopUp')
    logger.log('AgtsCdmaTopUp plugin already registered. Skipping')
  }
  catch(e) {
    await registerAgtsCdmaTopUpPlugin(agtsCdmaPluginInfo)
  }

}