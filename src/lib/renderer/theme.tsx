import * as assert from 'assert';
import * as fs from 'fs-extra';
import { dirname, join } from 'path';
import { createElement } from 'preact';
import { render } from 'preact-render-to-string';
import type { Application } from '../application';
import type { ProjectReflection, Reflection, SomeReflection } from '../models';
import { defaultTemplates } from './default-templates';
import { MinimalThemeRouter, ThemeRouter, ThemeRouterConstructor } from './router';
import { Templates } from './templates';

const STATIC_DIR = join(__dirname, '../../../static')

const writeFile = async (path: string, content: string) => {
    await fs.ensureDir(dirname(path));
    await fs.writeFile(path, content);
};

const copyFile = async (src: string, dest: string) => {
    await fs.ensureDir(dirname(dest));
    await fs.copyFile(src, dest);
};

export type Theme = (app: Application, project: ProjectReflection, outDir: string) => Promise<void>;

export function buildTheme(routerCtor: ThemeRouterConstructor, templates?: Partial<Templates>): Theme {
    return async (app, project, outDir) => {
        const router = new routerCtor(project);
        const themeTemplates: Templates = { ...defaultTemplates, ...templates };

        const pages: Reflection[] = [project];
        const tasks: Promise<void>[] = [];

        while (pages.length) {
            const page = pages.shift()!;
            assert(router.hasOwnDocument(page));

            const path = router.getDocumentName(page);
            app.logger.verbose(`${page.getFullName()} ===> ${path}`);
            const content = render(<themeTemplates.Page
                hooks={app.renderer.hooks}
                reflection={page as SomeReflection}
                router={router}
                templates={themeTemplates} />, null, { pretty: true });
            tasks.push(writeFile(join(outDir, path), content));

            if (page.isContainer()) {
                pages.push(...page.children.filter(child => router.hasOwnDocument(child)));
            }
        }

        // Copy static files
        tasks.push(copyFile(
            join(STATIC_DIR, 'style.css'),
            join(outDir, router.getAssetDirectory(), 'style.css')))

        await Promise.all(tasks);
    };
}

export const defaultTheme = buildTheme(ThemeRouter);
export const minimalTheme = buildTheme(MinimalThemeRouter);
