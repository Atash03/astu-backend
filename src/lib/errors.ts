export class RtsError extends Error {
  #data: object
  #code: string
  constructor (code: string, message: string, data: object) {
    super(message)
    this.#data = data
    this.#code = code
  }
  get data() { return this.#data }  
  get code() { return this.#code }
}

export class InitError extends RtsError {}