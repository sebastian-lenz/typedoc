import * as assert from 'assert';
import { ReflectionKind, TypeKind, SomeReflection, SomeType, Reflection, Type, ReflectionFlags, ContainerReflection } from '../models';
import type { ModelToObject, BaseSerialized } from './schema';
import { insertOrderSorted } from '../utils';

export interface SerializeWorker<T extends Type | Reflection> {
    order: number;

    serialize(value: T, serialized: Partial<ModelToObject<T>>): Partial<ModelToObject<T>>;
}

export interface RegisterableSerializeWorker<T extends Type | Reflection> extends SerializeWorker<T> {
    kind: T['kind'];
}

export class Serializer {
    private _reflectionSerializers = new Map<ReflectionKind, SerializeWorker<SomeReflection>[]>();
    private _typeSerializers = new Map<TypeKind, SerializeWorker<SomeType>[]>();

    constructor() {
        addBaseSerializers(this);
    }

    addReflectionSerializer(kinds: ReflectionKind, worker: SerializeWorker<SomeReflection>): void {
        for (const kind of ReflectionKind.toKindArray(kinds)) {
            const group = this._reflectionSerializers.get(kind) ?? [];
            insertOrderSorted(group, worker);
            this._reflectionSerializers.set(kind, group);
        }
    }

    addTypeSerializer(kinds: TypeKind, worker: SerializeWorker<SomeType>): void {
        for (const kind of TypeKind.toKindArray(kinds)) {
            const group = this._typeSerializers.get(kind) ?? [];
            insertOrderSorted(group, worker);
            this._typeSerializers.set(kind, group);
        }
    }

    toObject<T extends SomeType | SomeReflection>(value: T, init: object = {}): ModelToObject<T> {
        let serializers: SerializeWorker<any>[] | undefined;

        if (value instanceof Reflection) {
            serializers = this._reflectionSerializers.get(value.kind);
        } else if (value instanceof Type) {
            serializers = this._typeSerializers.get(value.kind);
        }

        assert(serializers, `No serializers registered for object with kind: ${value.kind}. This is a bug.`);

        return serializers.reduce((serialized, worker) => worker.serialize(value as any, serialized), init) as ModelToObject<T>;
    }

    toObjects<T extends SomeType | SomeReflection>(values: T[]): ModelToObject<T>[] {
        return values.map(value => this.toObject(value));
    }
}

function addBaseSerializers(serializer: Serializer) {
    serializer.addTypeSerializer(TypeKind.All, {
        order: -1,
        serialize(type, init): BaseSerialized<SomeType> {
            const base: BaseSerialized<SomeType> = {
                ...init,
                kind: type.kind as any,
                kindString: TypeKind.toKindString(type.kind)
            };

            // TS can't validate that `base` is the right type.
            return type.serialize(serializer, base as any);
        }
    })

    serializer.addReflectionSerializer(ReflectionKind.All, {
        order: -1,
        serialize(reflection, init) {
            const base: BaseSerialized<SomeReflection> = {
                ...init,
                id: reflection.id,
                name: reflection.name,
                kind: reflection.kind,
                kindString: ReflectionKind.toKindString(reflection.kind),
                flags: {}
            };

            if (reflection.originalName !== reflection.name) {
                base.originalName = reflection.originalName;
            }

            for (const key of Object.getOwnPropertyNames(ReflectionFlags.prototype)) {
                if (reflection.flags[key] === true) {
                    base.flags[key] = true;
                }
            }

            if (reflection instanceof ContainerReflection) {
                const children = serializer.toObjects(reflection.children as SomeReflection[]);
                // TS isn't quite smart enough to know this is OK.
                (base as any).children = children;
            }

            // TS can't validate base is the right type here.
            return reflection.serialize(serializer, base as any);
        }
    })
}
