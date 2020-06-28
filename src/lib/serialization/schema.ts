/**
 * Contains interfaces which describe the JSON output. Each interface is related to a specific type of serializer.
 *
 * ## Plugins
 * Plugins which modify the serialization process can use declaration merging
 * to add custom properties to the exported interfaces.
 * For example, if your custom serializer adds a property to all [[Reflection]] objects:
 * ```ts
 * declare module 'typedoc/dist/lib/serialization/schema' {
 *     export interface AbstractReflection {
 *         myCustomProp: boolean
 *     }
 * }
 * ```
 *
 * If a plugin defines a new Model type, [[ModelToObject]] will not pick up the serializer type and
 * the resulting type will not be included in the return type of {@link Serializer.toObject}.
 * To fix this, use declaration merging to augment the [[Serializer]] class.
 * ```ts
 * declare module 'typedoc/dist/lib/serialization/serializer' {
 *     export interface Serializer {
 *         toObject(value: CustomModel, obj?: Partial<CustomModel>): CustomOutput
 *     }
 * }
 * ```
 *
 * For documentation on the JSON output properties, view the corresponding model.
 * @packageDocumentation
 */

import type * as M from '../models';

/**
 * Describes the mapping from Model types to the corresponding JSON output type.
 */
export type ModelToObject<T> = T extends Array<infer U> ? _ModelToObject<U>[] : _ModelToObject<T>;

type _ModelToObject<T> =
    T extends M.SomeType ? M.TypeToSerialized<T> :
    T extends M.SomeReflection ? M.ModelToSerialized<T> :
    T;

export type Serialized<T extends M.SomeType | M.SomeReflection, K extends keyof T> =
    & BaseSerialized<T>
    & _Serialized<T, K>;

type _Serialized<T, K extends keyof T> = {
    -readonly [K2 in K]: ModelToObject<T[K2]>
};

export type BaseSerialized<T extends M.SomeType | M.SomeReflection> =
    T extends M.SomeType ? SerializedType<T> :
    T extends M.SomeContainerReflection ? SerializedContainerReflection<T> :
    T extends M.SomeReflection ? SerializedReflection<T> : unknown;

export interface SerializedType<T extends M.SomeType> {
    kind: T['kind'];
    kindString: string;
}

export interface SerializedReflection<T extends M.SomeReflection> {
    id: number;
    kind: T['kind'];
    kindString: string;

    name: string;
    originalName?: string;
    comment?: SerializedComment;
}

export interface SerializedContainerReflection<T extends M.SomeContainerReflection> extends SerializedReflection<T> {
    children: ModelToObject<T['children']>;
}

export interface SerializedComment {
    shortText: string;
    text: string;
    tags: SerializedCommentTag[];
}

export interface SerializedCommentTag {
    tagName: string;
    text: string;
    paramName?: string;
}
