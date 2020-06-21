import { createElement, VNode, Fragment } from 'preact';
import { Templates, TemplateProps } from './templates';
import { ReflectionKind, ReflectionKindToModel, SomeReflection } from '../models';

// See the Templates interface for doc comments.
// TODO: Lots to do to make this good yet.

export const defaultTemplates: Templates = {
    Page(props) {
        const { reflection, templates, hooks } = props;
        return <html>
            <head>
                {hooks.emit('head.begin', reflection)}
                <meta charSet='utf-8' />
                <meta name='description' content={`Documentation for ${reflection.project!.name}`} />
                <meta name='viewport' content='width=device-width, initial-scale=1' />
                <meta name='generator' content='typedoc' />
                <title>
                    {reflection.isProject() ? reflection.name : `${reflection.name} | ${reflection.project!.name}`}
                </title>
                <link rel='stylesheet' href={props.router.createAssetLink(reflection, 'style.css')} />
                {hooks.emit('head.end', reflection)}
            </head>
            <body>
                <script>
                    const loads = +localStorage.getItem('loads') || 0;
                    localStorage.setItem('loads', loads + 1);
                    if (loads % 2) document.body.classList.add('dark')
                </script>
                {hooks.emit('body.begin', reflection)}
                <templates.Header {...props} />
                <main>
                    <templates.Navigation {...props} />
                    <section id='main'>
                        <templates.Reflection {...props} />
                    </section>
                </main>
                <templates.Footer {...props} />
                {hooks.emit('body.end', reflection)}
            </body>
        </html>;
    },

    Header(props) {
        const { templates, reflection, router } = props;

        let displayName = reflection.name;
        if (reflection.kindOf(ReflectionKind.Class, ReflectionKind.Interface) && reflection.typeParameters.length) {
            displayName += `<${reflection.typeParameters.map(param => param.toString()).join(', ')}>`;
        }

        // TODO This needs to have a search bar, among other things.
        return <header>
            <div className='toolbar'>
                <a href={router.createLink(reflection, reflection.project!)}>{reflection.project!.name}</a>
                <input id='search' placeholder='Click or press S for search'/>
            </div>
            <div className='title'>
                <templates.Breadcrumbs {...props} />
                <h1>{displayName}</h1>
            </div>
        </header>;
    },

    Navigation({ reflection, router }) {
        const navMembers: SomeReflection[] = router.hasOwnDocument(reflection) && reflection.isContainer()
            ? reflection.children
            : reflection.parent!.children;

        return <nav>
            <ul>
                {navMembers.map(member => <li><a href={router.createLink(reflection, member)}>{member.name}</a></li>)}
            </ul>
        </nav>;
    },

    Breadcrumbs({ reflection, router }) {
        const path: SomeReflection[] = [];
        let iter = reflection.parent;
        while (iter) {
            path.unshift(iter);
            iter = iter.parent;
        }

        if (path.length < 1) {
            return <Fragment />;
        }

        return <ul className='breadcrumbs'>
            {path.map(refl => <li><a href={router.createLink(reflection, refl)}>{refl.name}</a></li>)}
        </ul>;
    },

    Footer() {
        // TODO hideGenerator, legend
        return <footer>
            <p>Generated using <a href='https://typedoc.org/' target='_blank'>TypeDoc</a></p>
        </footer>;
    },

    Reflection({ reflection, templates, hooks, router, ...extra }) {
        const templateMap: { [K in ReflectionKind]: (props: TemplateProps<ReflectionKindToModel[K]>) => VNode } = {
            [ReflectionKind.Project]: templates.Project,
            [ReflectionKind.Module]: templates.Module,
            [ReflectionKind.Namespace]: templates.Namespace,
            [ReflectionKind.Enum]: templates.Enum,
            [ReflectionKind.EnumMember]: templates.EnumMember,
            [ReflectionKind.Variable]: templates.Variable,
            [ReflectionKind.Function]: templates.Function,
            [ReflectionKind.Class]: templates.Class,
            [ReflectionKind.Interface]: templates.Interface,
            [ReflectionKind.Object]: templates.Object,
            [ReflectionKind.Property]: templates.Property,
            [ReflectionKind.Accessor]: templates.Accessor,
            [ReflectionKind.Method]: templates.Method,
            [ReflectionKind.Signature]: templates.Signature,
            [ReflectionKind.Parameter]: templates.Parameter,
            [ReflectionKind.Alias]: templates.TypeAlias,
            [ReflectionKind.Reference]: templates.Reference
        };

        // tslint:disable-next-line:variable-name
        const Template = templateMap[reflection.kind];

        if (!Template) {
            const kindString = reflection.kind in ReflectionKind
                ? ReflectionKind.toKindString(reflection.kind)
                : `${reflection.kind}`;
            throw new Error(`Invalid reflection kind ${kindString} for reflection ${reflection.getFullName()}`);
        }

        // Discriminated unions don't play nicely here... TS infers the required type to be `never`
        return <Fragment>
            {hooks.emit('reflection.before', reflection)}
            <div className={`reflection ${ReflectionKind.toKindString(reflection.kind)}`}>
                {hooks.emit('reflection.begin', reflection)}
                <Template reflection={reflection as never} templates={templates} hooks={hooks} router={router} {...extra} />
                {hooks.emit('reflection.end', reflection)}
            </div>
            {hooks.emit('reflection.after', reflection)}
        </Fragment>
    },

    Project({ reflection, templates }) {
        return <div>Project {reflection.name}</div>;
    },

    Module({ reflection, templates, hooks }) {
        return <div>Module {reflection.name}</div>;
    },

    Namespace({ reflection, templates, hooks }) {
        return <div>Namespace {reflection.name}</div>;
    },

    Interface({ reflection }) {
        return <div>Interface {reflection.name}</div>;
    },

    TypeAlias({ reflection }) {
        return <div>Interface {reflection.name}</div>;
    },

    Enum({ reflection }) {
        return <div>Enum {reflection.name}</div>;
    },

    EnumMember({ reflection }) {
        return <div>EnumMember {reflection.name}</div>;
    },

    Function({ reflection }) {
        return <div>Function {reflection.name}</div>;
    },

    Class({ reflection }) {
        return <div>Class {reflection.name}</div>;
    },

    Object({ reflection }) {
        return <div>Object {reflection.name}</div>;
    },

    Method({ reflection }) {
        return <div>Method {reflection.name}</div>;
    },

    Property({ reflection }) {
        return <div>Property {reflection.name}</div>;
    },

    Accessor({ reflection }) {
        return <div>Accessor {reflection.name}</div>;
    },

    Variable({ reflection }) {
        return <div>Accessor {reflection.name}</div>;
    },

    Signature({ reflection }) {
        return <div>Signature {reflection.name}</div>;
    },

    Parameter({ reflection }) {
        return <div>Parameter {reflection.name}</div>;
    },

    Reference({ reflection }) {
        return <div>Reference {reflection.name}</div>;
    }
};
