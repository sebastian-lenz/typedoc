import { ok } from "assert";
import * as jsx from "./jsx";

function escapeHtml(html: string) {
    return html.replace(
        /[&<>'"]/g,
        (c) =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
            }[c as never])
    );
}

/**
 * JSX factory function to create an "element" that can later be rendered with {@link renderElement}
 * @param tag
 * @param props
 * @param children
 */
export function createElement(
    tag: typeof jsx.Fragment | keyof jsx.IntrinsicElements | jsx.Component<any>,
    props: object | null,
    ...children: jsx.Children[]
): jsx.Element {
    return { tag, props, children };
}

/** @hidden */
export namespace createElement {
    export import JSX = jsx;
}

export function renderElement(element: jsx.Element | null | undefined): string {
    if (!element) {
        return "";
    }

    const { tag, props, children } = element;

    if (typeof tag === "function") {
        if (tag === jsx.Raw) {
            return String((props as any).html);
        }
        return renderElement(tag(Object.assign({ children }, props)));
    }

    const html: string[] = [];

    if (tag !== jsx.Fragment) {
        html.push("<", tag);

        for (const [key, val] of Object.entries(props ?? {})) {
            if (typeof val == "boolean") {
                if (val) {
                    html.push(" ", key);
                }
            } else {
                html.push(" ", key, "=", JSON.stringify(val));
            }
        }
    }

    let hasChildren = false;
    if ("innerHTML" in (props ?? {})) {
        ok(
            children.length === 0,
            "Elements may not specify both children and innerHTML"
        );
        hasChildren = true;
        html.push(">", String((props as any).innerHTML));
    } else if (children.length) {
        hasChildren = true;
        if (tag !== jsx.Fragment) html.push(">");
        renderChildren(children);
    }

    if (tag !== jsx.Fragment) {
        if (hasChildren) {
            html.push("</", tag, ">");
        } else {
            html.push(" />");
        }
    }

    return html.join("");

    function renderChildren(children: jsx.Children[]) {
        for (const child of children) {
            if (!child) continue;

            if (Array.isArray(child)) {
                renderChildren(child);
            } else if (typeof child === "string") {
                html.push(escapeHtml(child));
            } else {
                html.push(renderElement(child));
            }
        }
    }
}
