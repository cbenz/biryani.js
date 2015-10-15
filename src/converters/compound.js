import {map} from "transduce/transducers"

// import * as logging from "../logging"
// import * as simple from "./simple"
import {transduceArray, transduceObject} from "../transduce"
import {whileSuccess} from "../transducers"
import * as functions from "../functions"


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


export const whileSuccessMap = (...converters) => whileSuccess(...converters.map(map))

export const mapArray = (...converters) => transduceArray(whileSuccessMap(...converters))

export const mapObject = (keyConverter, valueConverter) => transduceObject(
  mapKeyValue(map(keyConverter), map(valueConverter))
)

export const mapObjectByKey = (converterByKey, options) => transduceObject(mapByKey(converterByKey, options))
