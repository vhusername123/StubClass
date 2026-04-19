// deno-lint-ignore-file no-import-prefix
import { assertThrows } from "jsr:@std/assert@1.0.15/throws";
import { StubFullType } from "../mod.ts";
import type { FilterAndMapMethodsToUnknown, Stubbed } from "../mod.ts";

import { assertEquals, assertNotEquals } from "jsr:@std/assert@1.0.15";

type TestType = {
  a: (_: unknown) => unknown;
  b: (_: unknown) => void;
};

type TestType2 = {
  a: (_: unknown) => unknown;
  b: (_: unknown) => void;
  c: TestType3;
};

type TestType3 = {
  a: () => void;
};

class StubbedTestTypeWithCreateStatic extends StubFullType<TestType> {
  static create<
    T extends FilterAndMapMethodsToUnknown<TestType> =
      FilterAndMapMethodsToUnknown<TestType>,
  >(
    methodNames: (keyof FilterAndMapMethodsToUnknown<T>)[] = [
      "a",
      "b",
    ] as (keyof FilterAndMapMethodsToUnknown<T>)[],
  ): Stubbed<TestType> {
    return StubFullType._create<TestType>(methodNames);
  }
}

class StubbedTest2TypeWithConstructor extends StubFullType<TestType2> {
  c: Stubbed<TestType3>;
  private constructor() {
    super(["a", "b"]);
    this.c = StubFullType._create<TestType3>(["a"]);
  }
  static create() {
    return new StubbedTest2TypeWithConstructor();
  }
}
class MyTestError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "MyTestError";
  }
}
Deno.test("StubFullType", async (t) => {
  const testObject: Stubbed<TestType> = StubbedTestTypeWithCreateStatic
      .create(),
    testObject2 = StubbedTest2TypeWithConstructor.create();
  await t.step("get stub returns the complete and copied object", () => {
    const stub = testObject.stub;
    assertEquals(stub, testObject.stub);
    stub.b.args.push(["a"]);
    assertNotEquals(stub.b.args, testObject.stub.b.args);
  });
  await t.step("get this returns this and asserts correct type", () => {
    const typeAssert: TestType = testObject.this;
    assertEquals(typeAssert as unknown, testObject);
  });
  await t.step("register, fire, reset", () => {
    const originalStub = testObject.stub;
    testObject.registerOutput("a", "hallo");
    const returned = testObject.this.a("ha");
    assertEquals(testObject.stub["a"].args[0], ["ha"]);
    assertEquals(testObject.stub["a"].counter, 1);
    assertEquals(testObject.counter("a"), 1);
    assertEquals(testObject.lastArgs("a"), ["ha"]);
    assertEquals(returned, "hallo");
    testObject.reset();
    assertEquals(originalStub, testObject.stub);
  });
  await t.step("overwrite method", () => {
    testObject.reset();
    testObject.overwriteMethod("a", () => {
      return "hallo";
    });
    const returned = testObject.this.a("ha");
    assertEquals(returned, "hallo");
    assertEquals(testObject.counter("a"), 0);
    testObject.overwriteMethod("a");
  });
  await t.step("usage in action", async (st) => {
    const goodReturn = Math.random();
    await st.step("permanent output", () => {
      testObject.reset();
      testObject.registerOutput("a", goodReturn, true);
      const returned = dependentOnTestType(testObject.this) as unknown;
      assertEquals(goodReturn, returned);
      assertEquals(testObject.counter("a"), 5);
      assertEquals(testObject.counter("b"), 4);
      assertEquals(testObject.lastArgs("b"), [goodReturn]);
      assertEquals(testObject.stub["a"].args[0], ["hello"]);
      assertEquals(testObject.lastArgs("a"), ["hello"]);
    });
    await st.step("normal output", () => {
      testObject.reset(true);
      testObject.registerOutput("a", goodReturn);
      testObject.registerOutput("a", "2");
      testObject.registerOutput("a", "3");
      testObject.registerOutput("a", "4");
      testObject.registerOutput("a", "5");
      const returned = dependentOnTestType(testObject.this) as unknown;
      assertEquals(returned, "5");
      assertEquals(testObject.lastArgs("b")[0], "4");
    });
    await st.step("throws", () => {
      testObject.reset();
      testObject.registerOutput("b", new MyTestError("asdf"));
      assertThrows(
        () => {
          dependentOnTestType(testObject.this);
        },
        Error,
        "asdf",
      );
      assertEquals(testObject.counter("a"), 1);
      assertEquals(testObject.counter("b"), 1);
    });
  });
  await t.step("TestType 2 also has c", () => {
    const testC: Stubbed<TestType3> = testObject2.c;
    const testCThis: TestType3 = testObject2.c.this;
    assertEquals(testCThis, testC as unknown);
  });
});

function dependentOnTestType(testObject: TestType) {
  testObject.b(testObject.a("hello"));
  testObject.b(testObject.a("hello"));
  testObject.b(testObject.a("hello"));
  testObject.b(testObject.a("hello"));
  return testObject.a("hello");
}
