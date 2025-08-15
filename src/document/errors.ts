import { RtsError } from '@/lib/errors'

export class DocumentError extends RtsError {
  static DoesNotExist(id: number, tableName: string) {
    console.log(`Document with id ${id} does not exist`)
    return new DocumentError('DOES-NOT-EXIST', `Document with id ${id} does not exist`, {id, tableName})
  }
}