import * as Path from "path";
import { deepStrictEqual as equal, ok } from "assert";

import { createMinimatch } from "../../lib/utils/paths";

// Used to ensure uniform path cross OS
const absolutePath = (path: string) =>
    Path.resolve(path.replace(/^\w:/, "")).replace(/[\\]/g, "/");

describe("Paths", () => {
    describe("createMinimatch", () => {
        it("Minimatch can match absolute paths expressions", () => {
            const paths = [
                "/unix/absolute/**/path",
                "\\windows\\alternative\\absolute\\path",
                "\\Windows\\absolute\\*\\path",
                "**/arbitrary/path/**",
            ];
            const mms = createMinimatch(paths);
            const patterns = mms.map(({ pattern }) => pattern);
            const comparePaths = [
                absolutePath("/unix/absolute/**/path"),
                absolutePath("/windows/alternative/absolute/path"),
                absolutePath("/Windows/absolute/*/path"),
                "**/arbitrary/path/**",
            ];

            equal(patterns, comparePaths);

            ok(mms[0].match(absolutePath("/unix/absolute/some/sub/dir/path")));
            ok(
                mms[1].match(absolutePath("/windows/alternative/absolute/path"))
            );
            ok(mms[2].match(absolutePath("/Windows/absolute/test/path")));
            ok(
                mms[3].match(
                    absolutePath("/some/deep/arbitrary/path/leading/nowhere")
                )
            );
        });

        it("Minimatch can match relative to the project root", () => {
            const paths = [
                "./relative/**/path",
                "../parent/*/path",
                "no/dot/relative/**/path/*",
                "*/subdir/**/path/*",
            ];
            const absPaths = paths.map((path) => absolutePath(path));
            const mms = createMinimatch(paths);
            const patterns = mms.map(({ pattern }) => pattern);

            equal(patterns, absPaths);
            ok(mms[0].match(Path.resolve("relative/some/sub/dir/path")));
            ok(mms[1].match(Path.resolve("../parent/dir/path")));
            ok(
                mms[2].match(
                    Path.resolve("no/dot/relative/some/sub/dir/path/test")
                )
            );
            ok(mms[3].match(Path.resolve("some/subdir/path/here")));
        });

        it("Minimatch matches dot files", () => {
            const mm = createMinimatch(["/some/path/**"])[0];
            ok(mm.match(absolutePath("/some/path/.dot/dir")));
            ok(mm.match(absolutePath("/some/path/normal/dir")));
        });

        it("Minimatch matches negated expressions", () => {
            const paths = ["!./some/path", "!!./some/path"];
            const mms = createMinimatch(paths);

            ok(
                !mms[0].match(Path.resolve("some/path")),
                "Matched a negated expression"
            );
            ok(
                mms[1].match(Path.resolve("some/path")),
                "Didn't match a doubly negated expression"
            );
        });

        it("Minimatch does not match commented expressions", () => {
            const [mm] = createMinimatch(["#/some/path"]);

            ok(!mm.match("#/some/path"), "Matched a commented expression");
        });
    });
});
