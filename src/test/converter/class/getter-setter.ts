class GetterSetter {
  private _name: string;

  get name(): string {
    return this._name;
  }
  set name(value: string) {
    this._name = value;
  }

  get readOnlyName(): string {
    return this._name;
  }

  set writeOnlyName(value: string) {
    this._name = value;
  }
}

export {};
