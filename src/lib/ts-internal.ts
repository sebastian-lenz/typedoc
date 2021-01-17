import type * as ts from "typescript";

/**
 * Expose the internal TypeScript APIs that are used by TypeDoc
 */
declare module "typescript" {
    interface Node {
        // https://github.com/microsoft/TypeScript/blob/v4.1.3/src/compiler/types.ts#L847
        symbol?: ts.Symbol;
    }

    interface TypeChecker {
        // https://github.com/microsoft/TypeScript/blob/v4.1.3/src/compiler/types.ts#L4145
        // https://github.com/microsoft/TypeScript/issues/42118
        getTypePredicateOfSignature(
            signature: ts.Signature
        ): ts.TypePredicate | undefined;
    }
}
