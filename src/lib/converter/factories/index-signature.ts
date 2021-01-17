import * as assert from "assert";
import * as ts from "typescript";
import {
    DeclarationReflection,
    ParameterReflection,
    ReflectionKind,
    SignatureReflection,
} from "../../models";
import type { Context } from "../context";
import { ConverterEvents } from "../converter-events";

export function convertIndexSignature(context: Context, symbol: ts.Symbol) {
    assert(context.scope instanceof DeclarationReflection);

    const indexSymbol = symbol.members?.get("__index" as ts.__String);
    if (indexSymbol) {
        // Right now TypeDoc models don't have a way to distinguish between string
        // and number index signatures... { [x: string]: 1 | 2; [x: number]: 2 }
        // will be misrepresented.
        const indexDeclaration = indexSymbol.getDeclarations()?.[0];
        assert(
            indexDeclaration && ts.isIndexSignatureDeclaration(indexDeclaration)
        );
        const param = indexDeclaration.parameters[0];
        assert(param && ts.isParameter(param));
        const index = new SignatureReflection(
            "__index",
            ReflectionKind.IndexSignature,
            context.scope
        );
        index.parameters = [
            new ParameterReflection(
                param.name.getText(),
                ReflectionKind.Parameter,
                index
            ),
        ];
        index.parameters[0].type = context.converter.convertType(
            context.withScope(index.parameters[0]),
            param.type
        );
        index.type = context.converter.convertType(
            context.withScope(index),
            indexDeclaration.type
        );
        context.registerReflection(index, indexSymbol);
        context.trigger(
            ConverterEvents.CREATE_SIGNATURE,
            index,
            indexDeclaration
        );

        context.scope.indexSignature = index;
    }
}
