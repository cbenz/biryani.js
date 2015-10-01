import expect from "expect"
import * as tr from "transduce"

import * as b from "../src/index"
import * as functions from "../src/functions"


describe("Converters", () => {
  describe("testInteger", () => {
    it("should work with null", () => {
      expect(b.testInteger(null)).toEqual(b.converted(null, null))
    })
    it("should work with integers", () => {
      expect(b.testInteger(0)).toEqual(b.converted(0, null))
      expect(b.testInteger(1)).toEqual(b.converted(1, null))
      expect(b.testInteger(-1)).toEqual(b.converted(-1, null))
    })
    it("should fail with non-integers", () => {
      expect(b.testInteger(1.5)).toEqual(b.converted(1.5, "Integer expected"))
      expect(b.testInteger("1")).toEqual(b.converted("1", "Integer expected"))
      expect(b.testInteger("x")).toEqual(b.converted("x", "Integer expected"))
      expect(b.testInteger({})).toEqual(b.converted({}, "Integer expected"))
      expect(b.testInteger({a: 1})).toEqual(b.converted({a: 1}, "Integer expected"))
      expect(b.testInteger([])).toEqual(b.converted([], "Integer expected"))
      expect(b.testInteger(["x"])).toEqual(b.converted(["x"], "Integer expected"))
      expect(b.testInteger([1])).toEqual(b.converted([1], "Integer expected"))
      // Special case for NaN which cannot be compared with ==
      const resultWithNan = b.testInteger(NaN)
      expect(isNaN(resultWithNan[b.protocols.converter.value])).toBe(true)
      expect(resultWithNan[b.protocols.converter.error]).toBe("Integer expected")
    })
  })
  describe("toInteger", () => {
    it("should work with null", () => {
      expect(b.toInteger(null)).toEqual(b.converted(null, null))
    })
    it("should work with integers", () => {
      expect(b.toInteger(0)).toEqual(b.converted(0, null))
      expect(b.toInteger(1)).toEqual(b.converted(1, null))
      expect(b.toInteger(-1)).toEqual(b.converted(-1, null))
    })
    it("should work with non-integers representing integers", () => {
      expect(b.toInteger(1.5)).toEqual(b.converted(1, null))
      expect(b.toInteger("1")).toEqual(b.converted(1, null))
    })
    it("should fail with non-integers not representing integers", () => {
      expect(b.toInteger("x")).toEqual(b.converted("x", "Integer representation expected"))
      expect(b.toInteger({})).toEqual(b.converted({}, "Scalar expected"))
      expect(b.toInteger({a: 1})).toEqual(b.converted({a: 1}, "Scalar expected"))
      expect(b.toInteger([])).toEqual(b.converted([], "Scalar expected"))
      expect(b.toInteger(["x"])).toEqual(b.converted(["x"], "Scalar expected"))
      expect(b.toInteger([1])).toEqual(b.converted([1], "Scalar expected"))
      // Special case for NaN which cannot be compared with ==
      const resultWithNan = b.toInteger(NaN)
      expect(isNaN(resultWithNan[b.protocols.converter.value])).toBe(true)
      expect(resultWithNan[b.protocols.converter.error]).toBe("Integer representation expected")
    })
  })
})

describe("Compound converters", () => {
  describe("structuredMapping", () => {
    it("should fail with scalars", () => {
      const conv1 = b.structuredMapping({a: b.testInteger})
      const input1 = 1
      expect(conv1(input1)).toEqual(b.converted(input1, "Sequence expected"))
      const conv2 = b.structuredMapping({a: b.structuredMapping({b: b.testInteger})})
      const input2 = {a: 1}
      expect(conv2(input2)).toEqual(b.converted(input2, {a: "Sequence expected"}))
    })
    it("should work with objects", () => {
      const conv = b.structuredMapping({age: b.testInteger, name: b.pipe(b.testString, b.testNotNull)})
      const person = {age: 10, name: "Bob"}
      expect(conv(person)).toEqual(b.converted(person, null))
    })
    it("should fail with missing keys", () => {
      const conv = b.structuredMapping({age: b.testInteger, name: b.pipe(b.testString, b.testNotNull)})
      const person = {age: 10}
      expect(conv(person)).toEqual(b.converted(person, {name: "Missing key"}))
    })
    it("should fail with extra keys without defined converter", () => {
      const conv = b.structuredMapping({name: b.pipe(b.testString, b.testNotNull)})
      const person = {age: 10, name: "Bob"}
      expect(() => conv(person)).toThrow(/Converter not found for key "age"/)
    })
    it("should work with extra keys with \"other\" option passed", () => {
      const conv1 = b.structuredMapping({name: b.pipe(b.testString, b.testNotNull)}, {other: functions.identity})
      const person = {age: 10, name: "Bob"}
      expect(conv1(person)).toEqual(b.converted(person, null))
      const conv2 = b.structuredMapping({name: b.pipe(b.testString, b.testNotNull)}, {other: b.add(1)})
      expect(conv2(person)).toEqual(b.converted({age: 11, name: "Bob"}, null))
    })
    it("should work with nested objects", () => {
      const conv = b.structuredMapping({
        a: b.structuredMapping({x: b.testInteger}, {other: functions.identity}),
        b: b.structuredMapping({x: b.testInteger}, {other: functions.identity}),
      })
      const input = {a: {x: 1, y: 2}, b: {x: 3, yy: "x"}}
      expect(conv(input)).toEqual(b.converted(input, null))
    })
  })
  describe("structuredSequence", () => {
    it("should work", () => {
      const conv = b.structuredSequence([b.testInteger, b.testNotNull])
      const input = [1, null]
      expect(conv(input)).toEqual(b.converted(input, {1: "Not null expected"}))
    })
  })
  describe("uniformMapping", () => {
    it("should work with objects", () => {
      const conv = b.uniformMapping(b.testLength(1), b.testInteger)
      const input = {a: "x", bb: 2}
      expect(conv(input)).toEqual(b.converted(input, {bb: "value.length == 1 expected", a: "Integer expected"}))
    })
  })
  describe("uniformSequence", () => {
    it("should fail with scalars", () => {
      const conv1 = b.uniformSequence(b.testInteger)
      const input1 = 1
      expect(conv1(input1)).toEqual(b.converted(input1, "Sequence expected"))
      const conv2 = b.uniformSequence(b.uniformSequence(b.testInteger))
      const input2 = [1]
      expect(conv2(input2)).toEqual(b.converted(input2, {0: "Sequence expected"}))
    })
    it("should fail with no arguments", () => {
      expect(() => b.uniformSequence()).toThrow(Error)
    })
    it("should work with arrays", () => {
      const conv = b.uniformSequence(b.pipe(b.testInteger, b.testNotNull))
      const input = [1, null]
      expect(conv(input)).toEqual(b.converted(input, {1: "Not null expected"}))
    })
    it("should work with nested arrays", () => {
      const conv = b.uniformSequence(b.uniformSequence(b.pipe(b.testInteger, b.testNotNull)))
      const input = [[1, null]]
      expect(conv(input)).toEqual(b.converted(input, {0: {1: "Not null expected"}}))
    })
    it("should auto compose converters", () => {
      const conv = b.uniformSequence(b.testInteger, b.testNotNull)
      const input = [1, null]
      expect(conv(input)).toEqual(b.converted(input, {1: "Not null expected"}))
    })
    it("should work with arrays of objects", () => {
      const persons = [{age: 10, name: "Bob"}, {age: "10", name: "Bob"}]
      const conv = b.uniformSequence(b.structuredMapping({age: b.testInteger, name: b.testString}))
      expect(conv(persons)).toEqual(b.converted(persons, {1: {age: "Integer expected"}}))
    })
    it("should work with arrays of objects, with null values", () => {
      const persons = [{age: 10, name: "Bob"}, null, {age: "10", name: "Bob"}]
      const conv = b.uniformSequence(b.structuredMapping({age: b.testInteger, name: b.testString}))
      expect(conv(persons)).toEqual(b.converted(persons, {2: {age: "Integer expected"}}))
    })
  })
})

describe("Converted", () => {
  describe("toValue", () => {
    it("should work", () => expect(b.uniformSequence(b.testInteger)([0]).toValue()).toEqual([0]))
    it("should throw ConversionError",
      () => expect(() => b.uniformSequence(b.testInteger)(["x"]).toValue()).toThrow(b.ConversionError))
  })
  describe("toValueError", () => {
    it("should work", () => {
      expect(b.uniformSequence(b.testInteger)([0]).toValueError()).toEqual({value: [0], error: null})
      expect(b.uniformSequence(b.testInteger)(["x"]).toValueError())
        .toEqual({value: ["x"], error: {0: "Integer expected"}})
    })
  })
})

describe("Converters internals", () => {
  describe("convert", () => {
    it("should work with null", () => {
      expect(b.convert(null, b.testInteger)).toEqual(b.converted(null, null))
    })
    it("should fail with non-iterable", () => {
      expect(b.convert(0, b.testInteger)).toEqual(b.converted(0, "Sequence expected"))
      expect(b.convert(1.5, b.testInteger)).toEqual(b.converted(1.5, "Sequence expected"))
    })
    it("should work with empty arrays",
      () => expect(b.convert([], tr.map(b.testInteger))).toEqual(b.converted([], null))
    )
    it("should work with arrays",
      () => expect(b.convert([1, 2], tr.map(b.testInteger))).toEqual(b.converted([1, 2], null))
    )
    it("should work with objects", () => {
      const person = {age: "Bob", weight: 20}
      const testKey = b.test((value) => value.length > 3, "value.length > 3 expected")
      expect(b.convert(person, tr.map(([k, v]) => [testKey(k), b.testInteger(v)])))
        .toEqual(b.converted(person, {age: "value.length > 3 expected"}))
      expect(b.convert(person, tr.map(([k, v]) => [k, b.testInteger(v)])))
        .toEqual(b.converted(person, {age: "Integer expected"}))
    })
    it("should work with compose", () => {
      const testIntegerAndEvenAndAdd = b.pipe(
        b.testInteger,
        b.test((value) => value % 2 === 0, "Even number expected"),
        b.add(2),
      )
      expect(b.convert([0, 1], tr.map(testIntegerAndEvenAndAdd)))
        .toEqual(b.converted([2, 1], {1: "Even number expected"}))
    })
    it("should fail with arrays with non-integer values", () => {
      expect(b.convert(["x"], tr.map(b.testInteger))).toEqual(b.converted(["x"], {0: "Integer expected"}))
      expect(b.convert([1, "x"], tr.map(b.testInteger)))
        .toEqual(b.converted([1, "x"], {1: "Integer expected"}))
    })
  })
  describe("mapByKey", () => {
    it("should work", () => {
      const person = {age: 10, name: "Bob"}
      expect(b.convert(person, b.mapByKey({age: b.testInteger, name: b.testString})))
        .toEqual(b.converted(person, null))
    })
    it("should fail", () => {
      const person = {age: "10", name: "Bob"}
      expect(b.convert(person, b.mapByKey({age: b.testInteger, name: b.testString})))
        .toEqual(b.converted(person, {age: "Integer expected"}))
    })
  })
  describe("mapKeyValue", () => {
    it("should work", () => {
      const person = {age: "Bob", weight: 20}
      expect(b.convert(person, b.mapKeyValue(b.testLength(3), b.testInteger)))
        .toEqual(b.converted(person, {age: "Integer expected", weight: "value.length == 3 expected"}))
    })
    it("should work with arrays of objects", () => {
      const persons = [{name: "Bob"}, {city: "Rome", name: "Bob"}]
      expect(b.convert(persons, tr.map((person) => b.convert(person, b.mapKeyValue(b.testString, b.testString)))))
        .toEqual(b.converted(persons, null))
    })
  })
})
