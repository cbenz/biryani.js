import * as t from "transduce/transducers"
import * as tr from "transduce/core"

import {converted, ensureConverted} from "../converted"
import {transduceArray, transduceObject} from "../transduce"
import {whileSuccess} from "../transducers"
import * as functions from "../functions"
import * as logging from "../logging"
import protocols from "../protocols"


const {error: cError, value: cValue} = protocols.converter


export const mapByKey = (converterByKey, {other = functions.identity} = {}) => {
  // const remainingKeys = tr.into({}, map(([k]) => [k, true]), converterByKey)
  return t.map(([key, value]) => {
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
  t.map(([key, value]) => [t.map(keyConverter(key)), t.map(valueConverter(value))])

export const whileSuccessMap = (...converters) => whileSuccess(...converters.map(t.map))

export const uniformArray = (...converters) => transduceArray(whileSuccessMap(...converters))

export const uniformObject = (keyConverter, valueConverter) => transduceObject(
  mapKeyValue(keyConverter, valueConverter)
)

export const structuredObject = (converterByKey, options) => transduceObject(mapByKey(converterByKey, options))

export const pipe = (...converters) => (value) => {
  value = ensureConverted(value)
  return tr.reduce((accumulatedValue, converter) => {
    const output = ensureConverted(converter(accumulatedValue[cValue]))
    return output[cError] === null ? output : tr.reduced(converted(value[cValue], output[cError]))
  }, value, converters)
}

export const pipeLog = (name) => {
  const logger = logging.createLogger(`pipe:${name}`)
  const tapLog = functions.tap(logging.inspect(logger))
  return (...converters) => pipe(...functions.interpose(tapLog, {wrap: true})(converters))

}
