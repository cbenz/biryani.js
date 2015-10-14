import expect from "expect"
// import t from "transducers.js"

import * as b from "../src/index"


describe("Top-level API", () => {
  // describe("compose", () => {
    // it("should work with converters",
    // it("should work with transformers",
  // })
  describe("seq", () => {
    it("should work with empty array",
      () => expect(b.seq([], b.map(b.testInteger))).toEqual(b.converted([], null))
    )
    it("should work with arrays",
      () => expect(b.seq([1, 2], b.map(b.testInteger))).toEqual(b.converted([1, 2], null))
    )
    it("should work with objects", () => {
      const person = {age: "Bob", weight: 20}
      const testKey = b.test((value) => value.length > 3, "value.length > 3 expected")
      expect(b.seq(person, b.map(([k, v]) => [testKey(k), b.testInteger(v)])))
        .toEqual(b.converted(person, {age: "value.length > 3 expected"}))
      expect(b.seq(person, b.map(([k, v]) => [k, b.testInteger(v)])))
        .toEqual(b.converted(person, {age: "Integer expected"}))
    })
    it("should work with t.compose", () => {
      const testIntegerAndEvenAndAdd = b.compose(
        b.testInteger,
        b.test((value) => value % 2 === 0, "Even number expected"),
        b.add(2),
      )
      expect(b.seq([0, 1], b.map(testIntegerAndEvenAndAdd))).toEqual(b.converted([2, 1], {1: "Even number expected"}))
    })
    it("should work with arrays of objects", () => {
      const persons = [{name: "Bob"}, {city: "Rome", name: "Bob"}]
      expect(b.seq(persons, b.map((person) => b.seq(person, b.mapKeyValue(b.testString, b.testString)))))
        .toEqual(b.converted(persons, null))
    })
    it("should fail with scalars", () => {
      expect(() => b.seq(null, b.testInteger)).toThrow(TypeError)
      expect(() => b.seq(0, b.testInteger)).toThrow(TypeError)
      expect(() => b.seq(1.5, b.testInteger)).toThrow(TypeError)
      expect(() => b.seq("x", b.testInteger)).toThrow(TypeError)
    })
    it("should fail with arrays with non integer values", () => {
      expect(b.seq(["x"], b.map(b.testInteger))).toEqual(b.converted(["x"], {0: "Integer expected"}))
      expect(b.seq([1, "x"], b.map(b.testInteger)))
        .toEqual(b.converted([1, "x"], {1: "Integer expected"}))
    })
  })
  describe("toValue", () => {
    it("should work", () => expect(b.toValue(b.seq([0], b.map(b.testInteger)))).toEqual([0]))
    it("should throw ConversionError",
      () => expect(() => b.toValue(b.seq(["x"], b.map(b.testInteger)))).toThrow(b.ConversionError))
  })
})

describe("Converters", () =>
  describe("testInteger", () => {
    it("should work with integers", () => {
      expect(b.testInteger(0)).toEqual(b.converted(0, null))
      expect(b.testInteger(1)).toEqual(b.converted(1, null))
      expect(b.testInteger(-1)).toEqual(b.converted(-1, null))
    })
    it("should fail with non integers", () => {
      expect(b.testInteger(null)).toEqual(b.converted(null, "Integer expected"))
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
      expect(isNaN(resultWithNan[b.VALUE])).toBe(true)
      expect(resultWithNan[b.ERROR]).toBe("Integer expected")
    })
  })
)

describe("Transformers", () => {
  describe("mapByKey", () => {
    it("should work", () => {
      const person = {age: 10, name: "Bob"}
      expect(b.seq(person, b.mapByKey({age: b.testInteger, name: b.testString})))
        .toEqual(b.converted(person, null))
    })
    it("should fail", () => {
      const person = {age: "10", name: "Bob"}
      expect(b.seq(person, b.mapByKey({age: b.testInteger, name: b.testString})))
        .toEqual(b.converted(person, {age: "Integer expected"}))
    })
  })
  describe("mapKeyValue", () => {
    it("should work", () => {
      const person = {age: "Bob", weight: 20}
      expect(b.seq(person, b.mapKeyValue(b.testLength(3), b.testInteger)))
        .toEqual(b.converted(person, {age: "Integer expected", weight: "value.length == 3 expected"}))
    })
  })
  describe("mapSeq", () => {
    it("should work with nested arrays", () => {
      const points1 = [[1, 2], [3, "x"]]
      expect(b.seq(points1, b.mapSeq(b.testInteger)))
        .toEqual(b.converted(points1, {1: {1: "Integer expected"}}))
      const points2 = [[1, 2], null, [3, "x"]]
      expect(b.seq(points2, b.mapSeq(b.testInteger)))
        .toEqual(b.converted(points2, {2: {1: "Integer expected"}}))
    })
    it("should work with arrays of objects", () => {
      const persons1 = [{age: 10, name: "Bob"}, {age: "10", name: "Bob"}]
      expect(b.seq(persons1, b.mapSeq(b.mapByKey({age: b.testInteger, name: b.testString}))))
        .toEqual(b.converted(persons1, {1: {age: "Integer expected"}}))
      const persons2 = [{age: 10, name: "Bob"}, null, {age: "10", name: "Bob"}]
      expect(b.seq(persons2, b.mapSeq(b.mapByKey({age: b.testInteger, name: b.testString}))))
        .toEqual(b.converted(persons2, {2: {age: "Integer expected"}}))
    })
    it("should work with nested objects", () => {
      const data = {a: {x: 1, y: 2}, b: {x: 3, yy: "x"}}
      expect(b.seq(data, b.mapSeq(b.mapKeyValue(b.testLength(1), b.testInteger))))
        .toEqual(b.converted(data, {2: {"age": {"v": "Integer expected"}}}))
    })
  })
})
