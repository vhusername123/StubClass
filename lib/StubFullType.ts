import type { Stub } from "./types/Stub.ts";
import type { FilterAndMapMethodsToUnknown } from "./types/FilterAndMapMethodsToUnknown.ts";
import type { Stubbed } from "./types/Stubbed.ts";
import type { MethodKeys } from "./types/MethodKeys.ts";
import type { AnyFunctions } from "./types/AnyFunctions.ts";

export class StubFullType<T> implements Stubbed<T> {
  public get stub(): Stub<T> {
    return this._stub;
  }
  get this(): T {
    return this as unknown as T;
  }
  protected constructor(
    private readonly _methodNames: (MethodKeys<T>)[] = [],
    private readonly _stub: Stub<T> = {} as Stub<T>,
  ) {
    this._methodNames.forEach((e) => this.initializeStub(e));
  }
  protected static _create<T>(
    methodNames?: (keyof FilterAndMapMethodsToUnknown<T>)[],
  ): Stubbed<T> {
    return new StubFullType(methodNames);
  }
  protected initializeStub<K extends MethodKeys<T>>(
    key: K,
    fn?: AnyFunctions,
  ) {
    this._stub[key] = this.createInitialState<K>();
    this.overwriteMethod(key, fn);
  }

  overwriteMethod<K extends MethodKeys<T>>(
    key: K,
    fn?: AnyFunctions,
  ): void {
    this[key] = fn as this[K] ?? ((...args: unknown[]) => {
      return this.fakeProcess(args, key);
    }) as this[K];
  }

  private createInitialState<K extends MethodKeys<T>>(): Stub<T>[K] {
    return {
      counter: 0,
      outputs: [],
      args: [],
      permanent: false,
    } as unknown as Stub<T>[K];
  }

  reset(trueReset = false) {
    Object.keys(this._stub).forEach((key) => {
      const f = key as keyof T;
      if (this._stub[f].permanent && !trueReset) {
        return;
      }
      this._stub[f] = this.createInitialState();
    });
  }

  registerOutput<K extends MethodKeys<T>, O>(
    key: K,
    output?: O,
    permanent = false,
  ) {
    const stub = this._stub[key] as Stub<T>[K];
    stub.outputs.push(output);
    this._stub[key].permanent = permanent;
  }

  counter(key: keyof T): number {
    return this._stub[key].counter ?? 0;
  }

  lastArgs<K extends keyof T>(key: K): unknown[] {
    return [...this._stub[key].args[this._stub[key].counter - 1]];
  }

  private nextOutput(
    key: keyof T,
  ): unknown {
    return this._stub[key].permanent
      ? this._stub[key].outputs[0]
      : this._stub[key].outputs.shift();
  }

  private incrementCounter(key: keyof T) {
    this._stub[key].counter = (this._stub[key].counter) + 1;
  }

  protected fakeProcess(
    args: unknown[],
    method: keyof T,
  ) {
    this.saveArgs(args, method);
    this.incrementCounter(method);
    const nextOutput = this.nextOutput(method);
    if (nextOutput instanceof Error) throw nextOutput;
    return nextOutput;
  }

  private saveArgs(
    args: unknown[],
    method: keyof T,
  ) {
    this._stub[method].args.push(args);
  }
}
