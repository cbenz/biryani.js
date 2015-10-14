import * as tr from "transduce/core"

import {converted, ensureConverted} from "../converted"
import * as functions from "../functions"
import * as logging from "../logging"
import * as simple from "./simple"
import * as transformers from "../transformers"
import protocols from "../protocols"


const {error: cError, value: cValue} = protocols.converter


export const map = (callback) => tr.transducer(
  function step(xfStep, value, input) {
    input = ensureConverted(input)
    return xfStep(
      value,
      input[cError] === null ? callback(input[cValue]) : input,
    )
  }
)

export const mapByKey = (converterByKey, {other = functions.identity} = {}) => {
  // const remainingKeys = tr.into({}, map(([k]) => [k, true]), converterByKey)
  return map(([key, value]) => {
    let converter = converterByKey[key]
    if (converter) {
      // remainingKeys[key] = false
    } else {
      converter = other
    }
    if (!converter) {
      throw new Error(
        `Converter not found for key "${key}" among ${JSON.stringify(Object.getOwnPropertyNames(converterByKey))}`
      )
    }
    return [key, converter(value)]
  })
}

export const mapKeyValue = (keyConverter, valueConverter) =>
  map(([key, value]) => [keyConverter(key), valueConverter(value)])

export const pipe = (...converters) => {
  const log = logging.createLog("pipe")
  return (value) => converters.reduce((accumulator, converter, index) => {
    if (!converter) {
      throw new Error("Empty converter!")
    }
    log("index: %s, accumulator: %j", index, accumulator, converter)
    accumulator = ensureConverted(accumulator)
    if (accumulator[cError]) {
      return accumulator
    }
    const result = ensureConverted(converter(accumulator[cValue]))
    return result[cError] ? converted(value, result[cError]) : result
  }, value)
}

export const transduce = (transducer, transformer) => (value) => {
  if (value === null) {
    return converted(null, null)
  }
  const output = tr.transduce(transducer, transformer, value)
  return output[cError] === null ? output : converted(value, output[cError])
}
export const transduceArray = (transducer) => pipe(
  simple.testArray,
  transduce(transducer, new transformers.ConvertedArrayTransformer()),
)
export const transduceObject = (transducer) => pipe(
  simple.testObject,
  transduce(transducer, new transformers.ConvertedObjectTransformer()),
)

export const uniformArray = (...converters) => transduceArray(
  tr.compose(...converters.map((converter) => map(converter)))
)

export const uniformObject = (keyConverter, valueConverter) =>
  transduceObject(mapKeyValue(keyConverter, valueConverter))
  
export const structuredObject = (...args) => transduceObject(mapByKey(...args))
