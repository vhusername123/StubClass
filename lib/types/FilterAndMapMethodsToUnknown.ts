export type FilterAndMapMethodsToUnknown<T> = {
  [
    // deno-lint-ignore no-explicit-any
    K in keyof T as T[K] extends (...args: any[]) => any ? K
      : never
  ]: (
    ...args: unknown[]
  ) => unknown;
};
