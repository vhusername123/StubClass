import type { FilterAndMapMethodsToUnknown } from "./FilterAndMapMethodsToUnknown.ts";

export type MethodKeys<T> = keyof FilterAndMapMethodsToUnknown<T>;
