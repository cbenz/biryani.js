import protocols from "./protocols"


const {error: cError, value: cValue} = protocols.converter


// Converters internals

export class ConversionError extends Error {
  constructor(converted) {
    super()
    Error.captureStackTrace(this, this.constructor)
    this.name = this.constructor.name
    const errorStr = JSON.stringify(converted[cError])
    const valueStr = JSON.stringify(converted[cValue])
    this.message = `Conversion failed: ${errorStr} for ${valueStr}`
    this.converted = converted
  }
}

export class Converted {
  constructor(value, error = null) {
    this[cError] = error
    this[cValue] = value
  }
  error() {
    return this[cError]
  }
  value() {
    if (this[cError]) {
      throw new ConversionError(this)
    } else {
      return this[cValue]
    }
  }
  valueAndError() {
    return {value: this[cValue], error: this[cError]}
  }
  valueWithoutErrorCheck() {
    return this[cValue]
  }
}

export const converted = (value, error = null) => new Converted(value, error)
export const isConverted = (value) => value instanceof Converted
export const ensureConverted = (value) => isConverted(value) ? value : converted(value)
