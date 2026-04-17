import { Stub } from "./types/Stub.ts";
import { FilterAndMapMethodsToUnknown } from "./types/FilterAndMapMethodsToUnknown.ts";

export abstract class StubFullType<T> {
  public get stub(): Stub<T> {
    return { ...this._stub };
  }

  protected constructor(
    private readonly _methodNames: (keyof FilterAndMapMethodsToUnknown<T>)[] = [],
    private readonly _stub: Stub<T> = {} as Stub<T>,
  ) {
    _methodNames.forEach((e) => this.initializeStub(e));
  }

  protected initializeStub<K extends keyof FilterAndMapMethodsToUnknown<T>>(
    key: K,
    fn?: (...args: unknown[]) => unknown,
  ) {
    this._stub[key] = this.createInitialState<K>();
    this[key] = fn as this[K] ?? ((...args: unknown[]) => {
      return this.fakeProcess(args, key);
    }) as this[K];
  }

  static create<StaticT>(): StaticT & StubFullType<never> {
    return new StubFullType() as StaticT & StubFullType<never>;
  }

  private createInitialState<K extends keyof T>(): Stub<T>[K] {
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
  registerOutput<K extends keyof T>(
    key: K,
    output: unknown,
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
    return this._stub[key].args[this._stub[key].counter - 1];
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
