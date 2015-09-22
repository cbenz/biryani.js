import expect from "expect"

import * as b from "../src/index"


// Transducer extensions

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
})


// Scalar converters

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


// Compound converters

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
