import expect from "expect"
import t from "transducers.js"

import * as b from "../src/index"


describe("testInteger", () => {
  it(
    "should ignore null value",
    () => expect(b.testInteger(null)).toEqual(b.converted(null, null))
  )
  it(
    "should be ok with integers",
    () => {
      expect(b.testInteger(0)).toEqual(b.converted(0, null))
      expect(b.testInteger(1)).toEqual(b.converted(1, null))
      expect(b.testInteger(-1)).toEqual(b.converted(-1, null))
    }
  )
  it(
    "should return an error with non integers",
    () => {
      expect(b.testInteger(1.5)).toEqual(b.converted(1.5, "not an integer"))
      expect(b.testInteger("1")).toEqual(b.converted("1", "not an integer"))
      expect(b.testInteger("x")).toEqual(b.converted("x", "not an integer"))
      expect(b.testInteger({})).toEqual(b.converted({}, "not an integer"))
      expect(b.testInteger({"a": 1})).toEqual(b.converted({"a": 1}, "not an integer"))
      expect(b.testInteger([])).toEqual(b.converted([], "not an integer"))
      expect(b.testInteger(["x"])).toEqual(b.converted(["x"], "not an integer"))
      expect(b.testInteger([1])).toEqual(b.converted([1], "not an integer"))
      // expect(b.testInteger(NaN)).toEqual(b.converted(NaN, "not an integer"))
    }
  )
})


describe("map(testInteger)", () => {
  it(
    "should ignore null value",
    () => expect(b.convert(null, b.map(b.testInteger))).toEqual(b.converted(null, null))
  )
  it(
    "should be ok with empty array",
    () => expect(b.convert([], b.map(b.testInteger))).toEqual(b.converted([], null))
  )
  it(
    "should be ok with array of integers",
    () => expect(b.convert([1, 2], b.map(b.testInteger))).toEqual(b.converted([1, 2], null))

  )
  it(
    "should skip null items inside array",
    () => {
      expect(b.convert([null], b.map(b.testInteger))).toEqual(b.converted([null], null))
      expect(b.convert([1, null, 2], b.map(b.testInteger))).toEqual(b.converted([1, null, 2], null))
    }
  )
  it(
    "should return a composite error with non integer items in array",
    () => {
      expect(b.convert(["x"], b.map(b.testInteger))).toEqual(b.converted(["x"], {"0": "not an integer"}))
      expect(b.convert([1, null, "x"], b.map(b.testInteger)))
        .toEqual(b.converted([1, null, "x"], {"2": "not an integer"}))
    }
  )
})


describe("convertOrThrow", () => {
  it(
    "should ignore null value",
    () => expect(b.convertOrThrow(null, b.testInteger)).toEqual(null)
  )
  it(
    "should be ok with valid data",
    () => expect(b.testInteger(0)).toEqual(0)
  )
  it(
    "should throw ConversionError with invalid data",
    () => expect(() => b.testInteger("x")).toThrow(b.ConversionError)
  )
})
