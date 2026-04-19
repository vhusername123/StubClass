import type { AnyFunctions } from "../AnyFunctions.ts";

export type FilterAndMapMethodsToUnknown<T> = {
  [
    K in keyof T as T[K] extends AnyFunctions ? K
      : never
  ]: (
    ...args: unknown[]
  ) => unknown;
};
