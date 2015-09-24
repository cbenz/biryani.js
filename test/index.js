import expect from "expect"
import t from "transducers.js"

import * as b from "../src/index"


describe("Transducer extension", () =>
  describe("seq", () => {
    it("should not be callable with scalars", () => {
      expect(() => b.seq(null, b.testInteger)).toThrow(TypeError)
      expect(() => b.seq(0, b.testInteger)).toThrow(TypeError)
      expect(() => b.seq(1.5, b.testInteger)).toThrow(TypeError)
      expect(() => b.seq("x", b.testInteger)).toThrow(TypeError)
    })
    it("should return value with valueOnly option and valid data",
      () => expect(b.seq([0], b.map(b.testInteger), {valueOnly: true})).toEqual(0))
    it("should throw ConversionError with valueOnly option and invalid data",
      () => expect(() => b.seq(["x"], b.map(b.testInteger), {valueOnly: true})).toThrow(b.ConversionError))
    it("should be used with t.compose", () => {
      const testIntegerAndEven = t.compose(
        b.map(b.testInteger),
        b.map(b.test((value) => value % 2 === 0, "Not an even number")),
      )
      expect(b.seq([0, 1], testIntegerAndEven)).toEqual(b.converted([0, 1], {1: "Not an even number"}))
    })
    it("should be used with objects", () => {
      const person = {age: "Bob", weight: 20}
      const testKey = b.test((value) => value.length > 3, "value.length > 3 expected")
      expect(b.seq(person, b.map(([k, v]) => [testKey(k), b.testInteger(v)])))
        .toEqual(b.converted(person, {age: {k: "value.length > 3 expected", v: "Integer expected"}}))
    })
    // it("should be used with objects with null values", () => {
    //   const person = {age: 15, weight: 20, city: null}
    //   expect(b.seq(person, b.map(([k, v]) => [k, b.testInteger(v)]))).toEqual(b.converted(person, null))
    // })
    it("should be used at different levels of depth", () => {
      const points = [[1, 2], null, [3, "x"]]
      expect(b.seq(points, b.map((point) => b.seq(point, b.map(b.testInteger)))))
        .toEqual(b.converted(points, {2: {1: "Integer expected"}}))
      // TODO Add nested objects
    })
    it("should be used at different levels of depth with t.compose", () => {
      expect(b.seq([[1, 2], null, [3, "x"]], t.compose(
        b.map(b.testLength(2)),
        b.map((point) => b.seq(point, t.compose(b.map(b.testInteger), b.map(b.add(1))))),
      ))).toEqual(b.converted([[2, 3], null, [4, "x"]], {2: {1: "Integer expected"}}))
    })
  })
)

describe("Scalar converter", () =>
  describe("testInteger", () => {
    it("should be ok with integers", () => {
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
      // expect(b.testInteger(NaN)).toEqual(b.converted(NaN, "Integer expected"))
    })
  })
)

describe("Compound converter", () => {
  describe("map", () => {
    it("should be ok with empty array",
      () => expect(b.seq([], b.map(b.testInteger))).toEqual(b.converted([], null))
    )
    it("should be ok with array of integers",
      () => expect(b.seq([1, 2], b.map(b.testInteger))).toEqual(b.converted([1, 2], null))
    )
    it("should skip null items inside array", () => {
      expect(b.seq([null], b.map(b.testInteger))).toEqual(b.converted([null], null))
      expect(b.seq([1, null, 2], b.map(b.testInteger))).toEqual(b.converted([1, null, 2], null))
    })
    it("should fail with non integer items in array", () => {
      expect(b.seq(["x"], b.map(b.testInteger))).toEqual(b.converted(["x"], {0: "Integer expected"}))
      expect(b.seq([1, null, "x"], b.map(b.testInteger)))
        .toEqual(b.converted([1, null, "x"], {2: "Integer expected"}))
    })
  })
  describe("mapkv", () => {
    it("should be ok", () => {
      const person = {age: "Bob", weight: 20}
      expect(b.seq(person, b.mapkv(b.identity, b.testInteger)))
        .toEqual(b.converted(person, {age: {v: "Integer expected"}}))
    })
  })
  describe("mapseq", () => {
    it("should return a compound error", () => {
      const points = [[1, 2], null, [3, "x"]]
      expect(b.seq(points, b.mapseq(b.map(b.testInteger))))
        .toEqual(b.converted(points, {2: {1: "Integer expected"}}))
    })
  })
  describe("mapv", () => {
    it("should be ok", () => {
      const person = {age: 10, name: "Bob"}
      expect(b.seq(person, b.mapv({age: b.testInteger, name: b.testString})))
        .toEqual(b.converted(person, null))
    })
    it("should fail", () => {
      const person = {age: "10", name: "Bob"}
      expect(b.seq(person, b.mapv({age: b.testInteger, name: b.testString})))
        .toEqual(b.converted(person, {age: {v: "Integer expected"}}))
    })
  })
})
