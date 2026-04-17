type StubState<Return, Args> = {
  counter: number;
  permanent: boolean;
  outputs: Return[];
  args: Args[];
};
export type Stub<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R ? StubState<R, A>
    : never;
};
