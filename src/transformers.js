import * as tr from "transduce/core"
import * as util from "transduce/lib/util"

import {converted, ensureConverted} from "./converted"
import protocols from "./protocols"


const {error: cError, value: cValue} = protocols.converter
const {init: tInit, step: tStep, result: tResult} = util.protocols.transducer


// Transformers

const arrayTransformer = tr.transformer([])
const objectTransformer = tr.transformer({})

export class ConvertedTransformer {
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
    if (output[cError] && Object.getOwnPropertyNames(output[cError]).length === 0) {
      output[cError] = null
    }
    return output
  }
}

export class ConvertedArrayTransformer extends ConvertedTransformer {
  constructor(errorTransformer = objectTransformer) {
    super(arrayTransformer, errorTransformer)
    this.index = 0
  }
  [tStep](value, input) {
    input = ensureConverted(input)
    this.valueTransformer[tStep](value[cValue], input[cValue])
    const error = input[cError]
    if (error) {
      this.errorTransformer[tStep](value[cError], [this.index, error])
    }
    this.index++
    return value
  }
}

export class ConvertedObjectTransformer extends ConvertedTransformer {
  constructor(errorTransformer = objectTransformer) {
    super(objectTransformer, errorTransformer)
  }
  [tStep](value, input) {
    const [inputKey, inputValue] = input.map(ensureConverted)
    this.valueTransformer[tStep](value[cValue], [inputKey[cValue], inputValue[cValue]])
    const error = inputKey[cError] || inputValue[cError]
    if (error) {
      this.errorTransformer[tStep](value[cError], [inputKey[cValue], error])
    }
    return value
  }
}
