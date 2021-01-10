import { EventDispatcher } from "../utils";
import { ProjectReflection } from "../models";

import { SerializerComponent } from "./components";
import { SerializeEvent, SerializeEventData } from "./events";
import { ModelToObject } from "./schema";
import * as S from "./serializers";

export class Serializer extends EventDispatcher {
    /**
     * Triggered when the [[Serializer]] begins transforming a project.
     * @event EVENT_BEGIN
     */
    static EVENT_BEGIN = "begin";

    /**
     * Triggered when the [[Serializer]] has finished transforming a project.
     * @event EVENT_END
     */
    static EVENT_END = "end";

    /**
     * Serializers, sorted by their `serializeGroup` function to enable higher performance.
     */
    private serializers = new Map<
        (instance: unknown) => boolean,
        SerializerComponent<any>[]
    >();

    constructor() {
        super();
        addSerializers(this);
    }

    addSerializer(serializer: SerializerComponent<any>): void {
        let group = this.serializers.get(serializer.serializeGroup);

        if (!group) {
            this.serializers.set(serializer.serializeGroup, (group = []));
        }

        group.push(serializer);
        group.sort((a, b) => b.priority - a.priority);
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

    /**
     * Same as toObject but emits [[ Serializer#EVENT_BEGIN ]] and [[ Serializer#EVENT_END ]] events.
     * @param value
     * @param eventData Partial information to set in the event
     */
    projectToObject(
        value: ProjectReflection,
        eventData: { begin?: SerializeEventData; end?: SerializeEventData } = {}
    ): ModelToObject<ProjectReflection> {
        const eventBegin = new SerializeEvent(
            Serializer.EVENT_BEGIN,
            value,
            {}
        );
        if (eventData.begin) {
            eventBegin.outputDirectory = eventData.begin.outputDirectory;
            eventBegin.outputFile = eventData.begin.outputFile;
        }
        this.trigger(eventBegin);

        const project = this.toObject(value, eventBegin.output);

        const eventEnd = new SerializeEvent(
            Serializer.EVENT_END,
            value,
            project
        );
        if (eventData.end) {
            eventBegin.outputDirectory = eventData.end.outputDirectory;
            eventBegin.outputFile = eventData.end.outputFile;
        }
        this.trigger(eventEnd);

        return project;
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
