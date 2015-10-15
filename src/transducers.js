import * as tr from "transduce/core"
import * as util from "transduce/lib/util"

import {converted, ensureConverted} from "./converted"
import protocols from "./protocols"


const {error: cError, value: cValue} = protocols.converter
const {init: tInit, step: tStep, result: tResult} = util.protocols.transducer


// Check error

export class CheckError {
  constructor(errorTransformer, successTransformer) {
    this.errorTransformer = errorTransformer
    this.successTransformer = successTransformer
  }
  [tInit]() {
    return this.successTransformer[tInit]()
  }
  [tResult](value) {
    return this.successTransformer[tResult](value)
  }
  [tStep](value, input) {
    input = ensureConverted(input)
    return input[cError] === null ?
      this.successTransformer[tStep](value, input[cValue]) :
      this.errorTransformer[tStep](value, input)
  }
}

export const ifError = (transducer) => (transformer) => new CheckError(transducer(transformer), transformer)
export const ifSuccess = (transducer) => (transformer) => new CheckError(transformer, transducer(transformer))

export const composeWrappedBy = (transducer) => (...transducers) => tr.compose(...transducers.map(transducer))

export const whileError = (...transducers) => composeWrappedBy(ifError)(...transducers)
export const whileSuccess = (...transducers) => composeWrappedBy(ifSuccess)(...transducers)


// Converted

export const arrayTransformer = tr.transformer([])
export const objectTransformer = tr.transformer({})

export class ConvertedReducer {
  constructor(valueTransformer, errorTransformer) {
    this.valueTransformer = valueTransformer
    this.errorTransformer = errorTransformer
  }
  [tInit]() {
    const value = this.valueTransformer[tInit]()
    const error = this.errorTransformer[tInit]()
    const result = converted(value, error)
    return result
  }
  [tResult](value) {
    const output = converted(
      this.valueTransformer[tResult](value[cValue]),
      this.errorTransformer[tResult](value[cError]),
    )
    if (output[cError] !== null && Object.getOwnPropertyNames(output[cError]).length === 0) {
      output[cError] = null
    }
    return output
  }
}

export class ConvertedArrayReducer extends ConvertedReducer {
  constructor(errorTransformer) {
    super(arrayTransformer, errorTransformer)
    this.index = 0
  }
  [tStep](value, input) {
    input = ensureConverted(input)
    this.valueTransformer[tStep](value[cValue], input[cValue])
    const error = input[cError]
    if (error !== null) {
      this.errorTransformer[tStep](value[cError], [this.index, error])
    }
    this.index++
    return value
  }
}

export class ConvertedObjectReducer extends ConvertedReducer {
  constructor(errorTransformer) {
    super(objectTransformer, errorTransformer)
  }
  [tStep](value, input) {
    const [inputKey, inputValue] = input.map(ensureConverted)
    this.valueTransformer[tStep](value[cValue], [inputKey[cValue], inputValue[cValue]])
    const error = inputKey[cError] || inputValue[cError]
    if (error !== null) {
      this.errorTransformer[tStep](value[cError], [inputKey[cValue], error])
    }
    return value
  }
}

export const convertedArray = (errorTransformer = objectTransformer) => new ConvertedArrayReducer(errorTransformer)
export const convertedObject = (errorTransformer = objectTransformer) => new ConvertedObjectReducer(errorTransformer)


// Single value

export class ScalarValue {
  [tInit]() {
    return null
  }
  [tResult](value) {
    return value
  }
  [tStep](value, input) {
    return input
  }
}

export const scalarValue = new ScalarValue()
