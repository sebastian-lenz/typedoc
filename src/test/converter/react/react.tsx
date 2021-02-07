/** @jsx React.createElement */
declare namespace React {
    namespace JSX {
        interface IntrinsicElements {
            [x: string]: any;
        }
    }

    function createElement(): any;
}

export interface DemoProps {
    name: string;
    age: number;
}

export class Demo {
    private foo: number;

    constructor(_props: DemoProps) {
        this.foo = 42;
    }

    render() {
        return <div>Hello world! {this.foo}</div>;
    }
}
