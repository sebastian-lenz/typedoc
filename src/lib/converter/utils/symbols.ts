import * as ts from "typescript";

export function resolveAliasedSymbol(
    symbol: ts.Symbol,
    checker: ts.TypeChecker
): ts.Symbol {
    while (ts.SymbolFlags.Alias & symbol.flags) {
        symbol = checker.getAliasedSymbol(symbol);
    }
    return symbol;
}
