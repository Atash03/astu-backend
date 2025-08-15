/* eslint-disable no-var */
import tty from 'tty'
import clc, { Format } from 'cli-color'
import { marked } from 'marked'
import TerminalRenderer from 'marked-terminal'
import dayjs from 'dayjs'

marked.setOptions({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderer: new TerminalRenderer() as any
})


const redirectedToFile = !tty.isatty(process.stdout.fd)

try {
  var loggingEnabled = process.env.LOGGING_ENABLED == 'ON'
  var logLevel = process.env.LOG_LEVEL ? parseInt(process.env.LOG_LEVEL) : 10
} catch (e) {
  // eslint-disable-next-line no-console
  console.log('Cannot parse .env logging variables')
  // eslint-disable-next-line no-console
  console.error(e)
}

function getTimeStr () {
  return `[${dayjs().format('DD.MM.YY HH:mm:ss')}]`
}

function _log(...params: unknown[]) {
  // eslint-disable-next-line no-console
  if (loggingEnabled) console.log(getTimeStr(),...params)
}

function _error(...params: unknown[]) {
  // eslint-disable-next-line no-console
  if (loggingEnabled) console.error(getTimeStr(), ...params)
}

function _marked(str: string) {
  process.stdout.write(getTimeStr() + ' ' + marked(str).toString())
}

export const logger = {
  logWithLevel: (level: number) => {
    if (level <= logLevel) return _log
    else return () => {}
  },
  log: _log,
  error: _error,
  marked: _marked
}

function formatTitle(str: string, formatter: Format = clc.yellowBright){
  if (redirectedToFile)
    return str
  else 
    return clc.bold(formatter(str))
}

function formatIdentifier(str: string){
  if (redirectedToFile)
    return str
  else 
    return clc.bold(logColors.blue(str))
}

export const logColors = {
  yellow: clc.yellowBright,
  green: clc.xterm(28),
  blue: clc.xterm(25)
}

export function logMethod(prefix: string, logParams: boolean = false, titleFormatter: Format = clc.yellowBright) {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = function (...args: unknown[]) {
      const paramsStr = (logParams && args.length>0) ? `params: [${args}]` : ''

      console.log(`${formatTitle(prefix, titleFormatter)}: ${
        formatIdentifier(propertyKey)} ${paramsStr}`)
      return originalMethod.apply(this, args)
    }
    return descriptor
  }

}
