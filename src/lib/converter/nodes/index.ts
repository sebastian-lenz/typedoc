import type { Converter } from "../converter";
import { aliasConverter } from "./alias";
import { classConverter } from "./class";
import { enumConverter, enumMemberConverter } from "./enum";
import { functionConverter } from "./function";
import { interfaceConverter } from "./interface";
import { methodConverter } from "./method";
import { namespaceConverter } from "./namespace";
import {
  accessorConverter,
  parameterPropertyConverter,
  propertyConverter,
} from "./property";
import { sourcefileConverter } from "./sourcefile";
import { variableConverter } from "./variable";

export { ReflectionConverter } from "./types";

export function addConverters(converter: Converter): void {
  for (const reflectionConverter of [
    accessorConverter,
    aliasConverter,
    classConverter,
    enumConverter,
    enumMemberConverter,
    interfaceConverter,
    methodConverter,
    namespaceConverter,
    parameterPropertyConverter,
    propertyConverter,
    functionConverter,
    sourcefileConverter,
    variableConverter,
  ]) {
    converter.addReflectionConverter(reflectionConverter);
  }
}
