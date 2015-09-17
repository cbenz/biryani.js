import expect from "expect"

import * as b from "../src/index"


// IN [1, 2]
// OUT [1, 2], null
// testCase(validateIntegerSequence, )

// IN [1, 2, "x"]
// OUT [1, 2, "x"], {2: "not an integer"}
// testCase(validateIntegerSequence, [1, 2, "x"])


describe("isInteger", () => {
  it(
    "should return the input value when the value is an integer",
    () => expect(b.isInteger(1)).toEqual(b.ensureConverted(1))
  )
  it(
    "should return an error when the value is not an integer",
    () => {
      expect(b.isInteger("1")).toEqual(b.ensureConverted("1", "not an integer"))
      expect(b.isInteger("x")).toEqual(b.ensureConverted("x", "not an integer"))
    }
  )
})


describe("uniformSequence(isInteger)", () => {
  it(
    "should return the input value when the value is an array of integers",
    () => expect(b.uniformSequence(b.isInteger)([1, 2])).toEqual(b.ensureConverted([1, 2]))
  )
  it(
    "should return an error when some values in the array are not integers",
    () => {
      expect(b.uniformSequence(b.isInteger)([1, 2, "x"]))
        .toEqual(b.ensureConverted([1, 2, "x"], {2: "not an integer"}))
      expect(b.uniformSequence(b.isInteger)([1, 2, "1"]))
        .toEqual(b.ensureConverted([1, 2, "1"], {2: "not an integer"}))
    }
  )
})
