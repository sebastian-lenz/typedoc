export type Obj = {
  a: string;
  b: number;
  c: boolean;
};

/// Mapped type tests with an available node.

export type Readonly<T> = {
  +readonly [P in keyof T]: T[P];
};

export type Partial<T> = {
  [P in keyof T]?: T[P];
};

export type MappedObj = {
  [K in keyof Obj]: Obj[K] | null;
};

/// Mapped type tests without an available node.

export function MappedReturn<T>(x: T) {
  return ({} as any) as { +readonly [K in keyof T]+?: string };
}
