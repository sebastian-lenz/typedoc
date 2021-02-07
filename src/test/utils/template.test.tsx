import { deepStrictEqual as equal } from "assert";
import { Fragment, Raw } from "../../lib/utils/jsx";
import { createElement, renderElement } from "../../lib/utils/template";

describe("JSX", () => {
    it("Works with basic case", () => {
        const element = (
            <details data-a="foo" open>
                Text
            </details>
        );
        equal(
            renderElement(element),
            '<details data-a="foo" open>Text</details>'
        );
    });

    it("Escapes string content", () => {
        equal(renderElement(<div>&lt;&gt;</div>), "<div>&lt;&gt;</div>");
    });

    it("Renders to the empty string if no component is provided", () => {
        equal(renderElement(null), "");
        equal(renderElement(void 0), "");
    });

    it("Supports component functions", () => {
        const Component = (props: { text: string }) => (
            <span>{props.text}</span>
        );

        equal(renderElement(<Component text="hi!" />), "<span>hi!</span>");
    });

    it("Recognizes void elements", () => {
        equal(renderElement(<div id="main" />), '<div id="main" />');
    });

    it("Handles false boolean attributes", () => {
        equal(renderElement(<details open={false} />), "<details />");
    });

    it("Supports children", () => {
        const Component = (props: { text: string }) => (
            <span>{props.text}</span>
        );

        const element = (
            <div>
                {null}
                {undefined}
                {["a", "b"]}
                <Component text="hi" />
            </div>
        );

        equal(renderElement(element), "<div>ab<span>hi</span></div>");
    });

    it("Supports fragments", () => {
        equal(
            renderElement(
                <>
                    <div>A</div>
                    <div>B</div>
                </>
            ),
            "<div>A</div><div>B</div>"
        );
    });

    it("Supports Portal for injecting raw HTML", () => {
        equal(
            renderElement(<Raw html="<strong>foo</strong>" />),
            "<strong>foo</strong>"
        );
    });
});
