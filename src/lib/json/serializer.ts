import { promises as fs } from "fs";
import { dirname, resolve } from "path";

import type { Application } from "../application";
import type { ProjectReflection } from "../models";
import type { Renderer } from "../renderer";
import { insertPrioritySorted } from "../utils";
import { SerializerComponent } from "./components";
import { ModelToObject } from "./schema";
import * as S from "./serializers";

export class Serializer implements Renderer {
    readonly name = "json";

    /**
     * Serializers, sorted by their `serializeGroup` function to enable higher performance.
     */
    private serializers = new Map<
        (instance: unknown) => boolean,
        SerializerComponent<any>[]
    >();

    constructor(private app: Application) {
        addSerializers(this);
    }

    isEnabled(): boolean {
        return !this.app.options.isDefault("json");
    }

    async render(project: ProjectReflection) {
        const out = resolve(this.app.options.getValue("json") || "docs.json");
        const json = this.toObject(project);
        await fs.mkdir(dirname(out), { recursive: true });
        await fs.writeFile(out, JSON.stringify(json, null, "\t"));
        this.app.logger.info(`JSON written to ${out}`);
    }

    addSerializer(serializer: SerializerComponent<any>): void {
        let group = this.serializers.get(serializer.serializeGroup);

        if (!group) {
            this.serializers.set(serializer.serializeGroup, (group = []));
        }

        insertPrioritySorted(group, serializer);
    }

    toObject<T>(value: T, init?: object): ModelToObject<T>;
    toObject(value: unknown, init: object = {}): unknown {
        if (value == null || typeof value !== "object") {
            return value; // Serializing some primitive
        }

        if (Array.isArray(value)) {
            if (value.length === 0) {
                return undefined;
            }
            return value.map((val) => this.toObject(val));
        }

        // Note: This type *could* potentially lie, if a serializer declares a partial type but fails to provide
        // the defined property, but the benefit of being mostly typed is probably worth it.
        // TypeScript errors out if init is correctly typed as `Partial<ModelToObject<T>>`
        return this.findSerializers(value).reduce<any>(
            (result, curr) => curr.toObject(value, result),
            init
        );
    }

    private findSerializers<T>(value: T): SerializerComponent<T>[] {
        const routes: SerializerComponent<any>[] = [];

        for (const [groupSupports, components] of this.serializers.entries()) {
            if (groupSupports(value)) {
                for (const component of components) {
                    if (component.supports(value)) {
                        routes.push(component);
                    }
                }
            }
        }

        return routes as any;
    }
}

const serializerComponents: (new (
    owner: Serializer
) => SerializerComponent<any>)[] = [
    S.CommentTagSerializer,
    S.CommentSerializer,

    S.ReflectionSerializer,
    S.ReferenceReflectionSerializer,
    S.ContainerReflectionSerializer,
    S.DeclarationReflectionSerializer,
    S.ParameterReflectionSerializer,
    S.SignatureReflectionSerializer,
    S.TypeParameterReflectionSerializer,

    S.SourceReferenceContainerSerializer,

    S.TypeSerializer,
    S.ArrayTypeSerializer,
    S.ConditionalTypeSerializer,
    S.IndexedAccessTypeSerializer,
    S.InferredTypeSerializer,
    S.IntersectionTypeSerializer,
    S.IntrinsicTypeSerializer,
    S.OptionalTypeSerializer,
    S.PredicateTypeSerializer,
    S.QueryTypeSerializer,
    S.ReferenceTypeSerializer,
    S.ReferenceTypeSerializer,
    S.ReflectionTypeSerializer,
    S.RestTypeSerializer,
    S.LiteralTypeSerializer,
    S.TupleTypeSerializer,
    S.TemplateLiteralTypeSerializer,
    S.NamedTupleMemberTypeSerializer,
    S.MappedTypeSerializer,
    S.TypeOperatorTypeSerializer,
    S.TypeParameterTypeSerializer,
    S.UnionTypeSerializer,
    S.UnknownTypeSerializer,

    S.DecoratorContainerSerializer,
    S.ReflectionCategorySerializer,
    S.ReflectionGroupSerializer,
];

function addSerializers(owner: Serializer) {
    for (const component of serializerComponents) {
        owner.addSerializer(new component(owner));
    }
}
