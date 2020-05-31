import type { Converter } from '../converter';
import { enumMemberConverter, enumConverter } from './enum';
import { namespaceConverter } from './namespace';
import { functionConverter } from './function';
import { variableConverter } from './variable';
import { aliasConverter } from './alias';
import { interfaceConverter } from './interface';
import { propertyConverter, accessorConverter } from './property';
import { methodConverter } from './method';
import { classConverter } from './class';

export { ReflectionConverter } from './types'

export function addConverters(converter: Converter) {
    for (const reflectionConverter of [
        accessorConverter,
        aliasConverter,
        classConverter,
        enumConverter,
        enumMemberConverter,
        interfaceConverter,
        methodConverter,
        namespaceConverter,
        propertyConverter,
        functionConverter,
        variableConverter,
    ]) {
        converter.addReflectionConverter(reflectionConverter);
    }
}
