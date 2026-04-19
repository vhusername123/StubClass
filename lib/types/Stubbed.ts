import type { Stub } from "./Stub.ts";
import type { MethodKeys } from "./MethodKeys.ts";

export interface Stubbed<T> {
  readonly stub: Stub<T>;
  readonly this: T;
  reset(trueReset?: true): void;
  registerOutput<K extends MethodKeys<T>, O>(
    key: K,
    output?: O,
    permanent?: true,
  ): void;
  counter(key: MethodKeys<T>): number;
  lastArgs<K extends MethodKeys<T>>(key: K): unknown[];
  overwriteMethod<K extends MethodKeys<T>>(
    key: K,
    fn?: (...args: unknown[]) => unknown,
  ): void;
}
