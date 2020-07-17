export interface Constructor {
  // No return type defined. Used the parent one.
  new (x: string, y: string);

  // A return type is defined and is the same as the parent one.
  new (x: string, y: string): Constructor;

  // A return type is defined and is not the same as the parent one.
  new (x: string, y: string): Instance;
}

export interface Instance {}
