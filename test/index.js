import expect from "expect"
import t from "transducers.js"

import * as b from "../src/index"


describe("Transducer extensions", () =>
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
      expect(b.seq([0, 1], testIntegerAndEven)).toEqual(b.converted([0, 1], {"1": "Not an even number"}))
    })
    it("should be used at different levels of depth", () => {
      const points = [[1, 2], null, [3, "x"]]
      expect(b.seq(points, b.map((point) => b.seq(point, b.map(b.testInteger)))))
        .toEqual(b.converted(points, {"2": {"1": "Not an integer"}}))
    })
    it("should be used at different levels of depth with t.compose", () => {
      expect(b.seq([[1, 2], null, [3, "x"]], t.compose(
        b.map(b.testLengthOf(2)),
        b.map((point) => b.seq(point, t.compose(b.map(b.testInteger), b.map(b.add(1))))),
      ))).toEqual(b.converted([[2, 3], null, [4, "x"]], {"2": {"1": "Not an integer"}}))
    })
  })
)

describe("Scalar converters", () =>
  describe("testInteger", () => {
    it("should be ok with integers", () => {
      expect(b.testInteger(0)).toEqual(b.converted(0, null))
      expect(b.testInteger(1)).toEqual(b.converted(1, null))
      expect(b.testInteger(-1)).toEqual(b.converted(-1, null))
    })
    it("should return an error with non integers", () => {
      expect(b.testInteger(null)).toEqual(b.converted(null, "Not an integer"))
      expect(b.testInteger(1.5)).toEqual(b.converted(1.5, "Not an integer"))
      expect(b.testInteger("1")).toEqual(b.converted("1", "Not an integer"))
      expect(b.testInteger("x")).toEqual(b.converted("x", "Not an integer"))
      expect(b.testInteger({})).toEqual(b.converted({}, "Not an integer"))
      expect(b.testInteger({"a": 1})).toEqual(b.converted({"a": 1}, "Not an integer"))
      expect(b.testInteger([])).toEqual(b.converted([], "Not an integer"))
      expect(b.testInteger(["x"])).toEqual(b.converted(["x"], "Not an integer"))
      expect(b.testInteger([1])).toEqual(b.converted([1], "Not an integer"))
      // expect(b.testInteger(NaN)).toEqual(b.converted(NaN, "Not an integer"))
    })
  })
)

describe("Compound converters", () => {
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
    it("should return a compound error with non integer items in array", () => {
      expect(b.seq(["x"], b.map(b.testInteger))).toEqual(b.converted(["x"], {"0": "Not an integer"}))
      expect(b.seq([1, null, "x"], b.map(b.testInteger)))
        .toEqual(b.converted([1, null, "x"], {"2": "Not an integer"}))
    })
  })
  describe("mapseq", () => {
    it("should be ok ", () => {
      const points = [[1, 2], null, [3, "x"]]
      expect(b.seq(points, b.mapseq(b.map(b.testInteger)))).toEqual(b.converted(points, {"2": {"1": "Not an integer"}}))
    })
  })
})
