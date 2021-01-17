import * as FS from "fs";
import * as Path from "path";
import * as Util from "util";

import type { Theme } from "../theme";
import { HelperStack } from "./resources/helpers";
import { TemplateStack, PartialStack } from "./resources/templates";

export class Resources {
    templates: TemplateStack;

    layouts: TemplateStack;

    partials: PartialStack;

    helpers: HelperStack;

    private theme: Theme;

    private isActive = false;

    constructor(theme: Theme) {
        this.theme = theme;
        this.templates = new TemplateStack();
        this.layouts = new TemplateStack();
        this.partials = new PartialStack();
        this.helpers = new HelperStack();

        this.addDirectory("default", theme.owner.getDefaultTheme());
        this.addDirectory("theme", theme.basePath);
    }

    activate(): boolean {
        if (this.isActive) {
            return false;
        }
        this.isActive = true;

        this.partials.activate();
        this.helpers.activate();
        return true;
    }

    deactivate(): boolean {
        if (!this.isActive) {
            return false;
        }
        this.isActive = false;

        this.partials.deactivate();
        this.helpers.deactivate();
        return true;
    }

    getTheme(): Theme {
        return this.theme;
    }

    addDirectory(name: string, path: string) {
        if (this.isActive) {
            throw new Error(
                "Cannot add directories while the resource is active."
            );
        }

        path = Path.resolve(path);
        if (!FS.existsSync(path)) {
            throw new Error(
                Util.format("The theme path `%s` does not exist.", path)
            );
        }

        if (!FS.statSync(path).isDirectory()) {
            throw new Error(
                Util.format("The theme path `%s` is not a directory.", path)
            );
        }

        this.templates.addOrigin(name, Path.join(path, "templates"), true);
        this.layouts.addOrigin(name, Path.join(path, "layouts"), true);
        this.partials.addOrigin(name, Path.join(path, "partials"), true);
        this.helpers.addOrigin(name, Path.join(path, "helpers"), true);
    }

    removeDirectory(name: string) {
        if (this.isActive) {
            throw new Error(
                "Cannot remove directories while the resource is active."
            );
        }

        this.templates.removeOrigin(name);
        this.layouts.removeOrigin(name);
        this.partials.removeOrigin(name);
        this.helpers.removeOrigin(name);
    }

    removeAllDirectories() {
        if (this.isActive) {
            throw new Error(
                "Cannot remove directories while the resource is active."
            );
        }

        this.templates.removeAllOrigins();
        this.layouts.removeAllOrigins();
        this.partials.removeAllOrigins();
        this.helpers.removeAllOrigins();
    }
}
