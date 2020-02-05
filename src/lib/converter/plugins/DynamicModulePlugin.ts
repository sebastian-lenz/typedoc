import * as ts from 'typescript';
import * as Path from 'path';

import { Reflection, ReflectionKind } from '../../models/reflections/abstract';
import { Component, ConverterComponent } from '../components';
import { BasePath } from '../utils/base-path';
import { Converter } from '../converter';
import { Context } from '../context';

/**
 * A handler that truncates the names of dynamic modules to not include the
 * project's base path.
 */
@Component({name: 'dynamic-module'})
export class DynamicModulePlugin extends ConverterComponent {
    /**
     * Helper class for determining the base path.
     */
    private basePath = new BasePath();

    /**
     * List of reflections whose name must be trimmed.
     */
    private reflections!: Reflection[];

    private hiddenExtension = ['.ts', '.d'];
    private hiddenPathPart = ['/index', '/lib', '/src'];

    /**
     * Create a new DynamicModuleHandler instance.
     */
    initialize() {
        this.listenTo(this.owner, {
            [Converter.EVENT_BEGIN]:              this.onBegin,
            [Converter.EVENT_CREATE_DECLARATION]: this.onDeclaration,
            [Converter.EVENT_RESOLVE_BEGIN]:      this.onBeginResolve
        });
    }

    /**
     * Triggered when the converter begins converting a project.
     *
     * @param context  The context object describing the current state the converter is in.
     */
    private onBegin(context: Context) {
        this.basePath.reset();
        this.reflections = [];
    }

    /**
     * Triggered when the converter has created a declaration reflection.
     *
     * @param context  The context object describing the current state the converter is in.
     * @param reflection  The reflection that is currently processed.
     * @param node  The node that is currently processed if available.
     */
    private onDeclaration(context: Context, reflection: Reflection, node?: ts.Node) {
        if (reflection.kindOf(ReflectionKind.Module)) {
            let name = reflection.name;
            if (!name.includes('/')) {
                return;
            }

            name = name.replace(/"/g, '');
            this.reflections.push(reflection);
            this.basePath.add(name);
        }
    }

    /**
     * Triggered when the converter begins resolving a project.
     *
     * @param context  The context object describing the current state the converter is in.
     */
    private onBeginResolve(context: Context) {
        this.reflections.forEach((reflection) => {
            // in case of mono-repo (node_modules outside the project), trunk the module name after the node_modules folder
            const nodeModulesRegexp = new RegExp('^(.*)node_modules/');
            reflection.name = reflection.name.replace(nodeModulesRegexp, '');

            let name = reflection.name.replace(/"/g, '');

            const currentExtension = Path.extname(name);
            const hiddenExtensions = (this.hiddenExtension.includes(currentExtension)) ?
                this.hiddenExtension : [currentExtension, ...this.hiddenExtension];

            hiddenExtensions.forEach((extension) => {
                if (name.endsWith(extension)) {
                    name = name.substr(0, name.length - extension.length);
                }
            });

            this.hiddenPathPart.forEach((pathPart) => {
                if (name.endsWith(pathPart)) {
                    name = name.substr(0, name.length - pathPart.length);
                }
            });

            reflection.name = this.basePath.trim(name);
        });
    }
}
