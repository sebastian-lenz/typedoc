import type * as ts from 'typescript';
import type { IndependentReflection, ContainerReflection } from '../../models';
import type { Context } from '../context';

export interface ReflectionConverter<T extends ts.Node = ts.Node, O extends IndependentReflection = IndependentReflection> {
    kind: T['kind'][];
    convert(converter: Context<ContainerReflection<O>>, symbol: ts.Symbol, nodes: readonly T[]): O | Promise<O>;
}
