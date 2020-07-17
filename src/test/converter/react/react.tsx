import { createElement } from "preact";

export interface DemoProps {
  name: string;
  age: number;
}

export class Demo {
  private foo: number;

  constructor(props: DemoProps) {
    this.foo = 42;
  }

  render() {
    return <div>Hello world! {this.foo}</div>;
  }
}
