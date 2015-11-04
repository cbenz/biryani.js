import * as tr from "transduce/core"

import {converted, ensureConverted} from "./converted"
import {convertedArray, convertedObject} from "./transducers"
import {pipe} from "./converters/compound"
import {testArray, testObject} from "./converters/simple"
import protocols from "./protocols"


const {error: cError, value: cValue} = protocols.converter


export const transduce = (transducer, transformer) => (value) => {
  value = ensureConverted(value)
  if (value[cValue] === null) {
    return converted(null, null)
  }
  // We say: a converter must never be called if the value has an error.
  // if (value[cError] !== null) {
  //   return value
  // }
  const output = tr.transduce(transducer, transformer, value[cValue])
  return output[cError] === null ? output : converted(value[cValue], output[cError])
}


export const transduceArray = (transducer) => pipe(
  testArray,
  // TODO Use generator
  // tr.into([], transducer), // Does not check errors.
  transduce(transducer, convertedArray()),
  // (value) => tr.sequence(transducer, value),
)

export const transduceObject = (transducer) => pipe(
  testObject,
  // TODO Use generator
  // tr.into({}, transducer), // Does not check errors.
  transduce(transducer, convertedObject()), // Does not produce a generator.
)
