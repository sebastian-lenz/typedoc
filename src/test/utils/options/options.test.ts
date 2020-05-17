import { Logger, Options, ParameterType, ParameterScope } from '../../../lib/utils';
import { MapDeclarationOption, NumberDeclarationOption } from '../../../lib/utils/options';
import { deepStrictEqual as equal, throws } from 'assert';
import { DeclarationOption } from '../../../lib/utils/options';

describe('Options', () => {
    const logger = new Logger();
    const options = new Options(logger) as Options & {
        addDeclaration(declaration: Readonly<DeclarationOption>): void;
        getValue(name: string): unknown;
    };
    options.addDefaultDeclarations();
    options.addDeclaration({
        name: 'mapOption',
        help: '',
        type: ParameterType.Map,
        map: {
            a: 1,
            b: 2
        },
        defaultValue: 1
    });

    it('Errors on duplicate declarations', () => {
        logger.resetErrors();
        options.addDeclaration({
            name: 'help',
            help: '',
            type: ParameterType.Boolean
        });
        equal(logger.hasErrors(), true);
    });

    it('Does not error if the same declaration is registered twice', () => {
        logger.resetErrors();
        const declaration = { name: 'test-declaration', help: '' };
        options.addDeclaration(declaration);
        options.addDeclaration(declaration);
        equal(logger.hasErrors(), false);
        options.removeDeclarationByName(declaration.name);
    });

    it('Does not throw if number declaration has no min and max values', () => {
        const declaration: NumberDeclarationOption = {
            name: 'test-number-declaration',
            help: '',
            type: ParameterType.Number,
            defaultValue: 1
        };
        options.addDeclaration(declaration);
        options.removeDeclarationByName(declaration.name);
    });

    it('Does not throw if default value is out of range for number declaration', () => {
        const declaration: NumberDeclarationOption = {
            name: 'test-number-declaration',
            help: '',
            type: ParameterType.Number,
            minValue: 1,
            maxValue: 10,
            defaultValue: 0
        };
        options.addDeclaration(declaration);
        options.removeDeclarationByName(declaration.name);
    });

    it('Does not throw if a map declaration has a default value that is not part of the map of possible values', () => {
        const declaration: MapDeclarationOption<number> = {
            name: 'testMapDeclarationWithForeignDefaultValue',
            help: '',
            type: ParameterType.Map,
            map: new Map([
                ['a', 1],
                ['b', 2]
            ]),
            defaultValue: 0
        };
        options.addDeclaration(declaration);
        options.removeDeclarationByName(declaration.name);
    });

    it('Supports removing a declaration by name', () => {
        options.addDeclaration({ name: 'not-an-option', help: '' });
        options.removeDeclarationByName('not-an-option');
        equal(options.getDeclaration('not-an-option'), undefined);
    });

    it('Also removes the declaration under its short name', () => {
        options.addDeclaration({ name: 'not-an-option', help: '', short: '#' });
        options.removeDeclarationByName('not-an-option');
        equal(options.getDeclaration('#'), undefined);
    });

    it('Ignores removal of non-existent declarations', () => {
        options.removeDeclarationByName('not-an-option');
        equal(options.getDeclaration('not-an-option'), undefined);
    });

    it('Throws on attempt to get an undeclared option', () => {
        throws(() => options.getValue('does-not-exist'));
    });

    it('Does not allow fetching compiler options through getValue', () => {
        throws(() => options.getValue('target'));
    });

    it('Errors if converting a set value errors', () => {
        throws(() => options.setValue('mapOption' as any, 'nonsense' as any));
    });

    it('Supports directly getting values', () => {
        equal(options.getRawValues().toc, []);
    });

    it('Supports getting by scope', () => {
        equal(options.getDeclarationsByScope(ParameterScope.TypeDoc).length !== 0, true);
    });
});
