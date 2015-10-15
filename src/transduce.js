import {map} from "transduce/transducers"
import * as tr from "transduce/core"

import {converted, ensureConverted} from "./converted"
import {convertedArray, convertedObject, scalarValue} from "./transducers"
import {testArray, testObject} from "./converters/simple"
import protocols from "./protocols"


const {error: cError, value: cValue} = protocols.converter


export const transduce = (transducer, transformer) => (value) => {
  value = ensureConverted(value)
  if (value[cValue] === null) {
    return converted(null, null)
  }
  if (value[cError] !== null) {
    return value
  }
  const output = tr.transduce(transducer, transformer, value[cValue])
  return output[cError] === null ? output : converted(value[cValue], output[cError])
}

export const transduceValue = (transducer) => (value) => {
  value = ensureConverted(value)
  if (value[cValue] === null) {
    return converted(null, null)
  }
  if (value[cError] !== null) {
    return value
  }
  const output = transduce(transducer, scalarValue)([value[cValue]])
  return output[cError] === null ? output : converted(value[cValue], output[cError])
}

// export const transduceArray = (transducer) => transduce(transducer, convertedArray())
export const transduceArray = (transducer) => (value) => {
  const valueOutput = transduceValue(map(testArray))(value)
  return transduce(transducer, convertedArray())(valueOutput)
}

// export const transduceObject = (transducer) => transduce(transducer, convertedObject())
export const transduceObject = (transducer) => (value) => {
  const valueOutput = transduceValue(map(testObject))(value)
  return transduce(transducer, convertedObject())(valueOutput)
}
