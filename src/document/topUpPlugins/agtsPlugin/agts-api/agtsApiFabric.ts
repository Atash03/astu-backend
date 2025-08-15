import * as agtsEmulator from './agts-emulator/agts-emulator'
import * as agtsProdApi from './agts-prod/agts-api'

export function getAgtsApi(testMode: boolean | undefined = undefined) {

  let useEmulator = (process.env.AGTS_PLUGIN_MODE =='test') || testMode
  if (testMode === false)
    useEmulator = false

  console.log({useEmulator, testMode, PM: process.env.AGTS_PLUGIN_MODE})
  if (useEmulator)
    return agtsEmulator as AgtsApi
  else 
    return agtsProdApi as AgtsApi
}