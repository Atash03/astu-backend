/**   
 * This module provides a mock database transaction functionality using JSON files. 
 * 
 * JsonTransaction class allows one to fetch, save, create, 
 * and update data in a local JSON file 'data.json'. This serves as a persistence mechanism. 
 * 
 * TestDocDbHandler, implements the IDocDbHandler interface and provides 
 * methods to select, create, update, and manage data fields within the mock database. 
 * It uses a `JsonTransaction` instance in all of its operations.
 */

import { DocumentError } from '@/document/errors'
// import dayjs from 'dayjs'
import fs from 'fs'
import path from 'path'
import util from 'util'

const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)

type MockDockFields = 
  IDocFields & {name?: string} & {dataFields: Record<string, string>}

type MockDatabase = Record<string, Array<MockDockFields>>


function parseField(_1: string, value: string) {
  if (typeof value != 'string')
    return value

  const dateRegex = /date\((.*)\)/
  const rgRes = dateRegex.exec(value.toString())
  const dateStr = rgRes && rgRes[1]
  return dateStr ? new Date(dateStr) : value
}

function formatField(field: string, value: string) {
  if (['createdAt', 'updatedAt'].includes(field)) {
    return `date(${value})`
  }
  return value
}


export class JsonTransaction {
  private jsonFilePath: string
  tableName: string
  savedState?: MockDatabase

  constructor(tableName: string) {
    this.jsonFilePath = path.resolve(__dirname, './data.json')
    this.tableName = tableName
  }

  async saveState() {
    this.savedState = await this.fetchData()
  }

  async restoreState() {
    if (!this.savedState)
      throw new Error('State was not saved')
    await this.saveData(this.savedState)
  }

  async getAllRecords() {
    const data = await this.fetchData()
    return data[this.tableName] || []
  }

  private async fetchData(): Promise<MockDatabase> {
    try {
      const data = await readFile(this.jsonFilePath, { encoding: 'utf-8' })
      return JSON.parse(data, parseField)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        await writeFile(this.jsonFilePath, JSON.stringify({}))
        return {}
      } else {
        throw error
      }
    }
  }

  private async saveData(data: MockDatabase): Promise<void> {
    return writeFile(this.jsonFilePath, JSON.stringify(data, formatField, 2))
  }

  async findUnique({ where }: { where: { id?: number, name?: string } }) : Promise<MockDockFields | null> {
    const data = await this.fetchData()
    if (!data[this.tableName])
      data[this.tableName] = []
    const tableData = data[this.tableName]
    if (where.id)
      return tableData.find(d => d.id === where.id) || null
    if (where.name)
      return tableData.find(d => d.name === where.name) || null
    else 
      throw new Error('Wrong arguments: ' + JSON.stringify(where))
  }

  async create({ data }: {data: Partial<MockDockFields>}) : Promise<MockDockFields> {
    const allData = await this.fetchData() as MockDatabase
    
    if (!allData[this.tableName])
      allData[this.tableName] = []

    const tableData = allData[this.tableName]
    data['id'] = tableData.length + 1
    data.dataFields = {}
    tableData.push(data as MockDockFields)
    await this.saveData(allData)
    return data as MockDockFields
  }

  async update({where, data}: {where: {id: number}, data: object}): Promise<MockDockFields> {
    const allData = await this.fetchData()as MockDatabase
    if (!allData[this.tableName])
      allData[this.tableName] = []

    const tableData = allData[this.tableName]

    const index = tableData.findIndex(d => d.id === where.id)
    if (index === -1)
      throw DocumentError.DoesNotExist(where.id, this.tableName)
    
    tableData[index] = { ...tableData[index], ...data }
    await this.saveData(allData)
    return tableData[index] as MockDockFields
  }
}