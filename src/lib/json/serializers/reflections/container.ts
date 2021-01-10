import { ContainerReflection } from "../../../models";

import { ReflectionSerializerComponent } from "../../components";
import { SourceReferenceWrapper } from "../models";
import {
    ContainerReflection as JSONContainerReflection,
    Reflection as JSONReflection,
} from "../../schema";

export class ContainerReflectionSerializer extends ReflectionSerializerComponent<ContainerReflection> {
    supports(t: unknown) {
        return t instanceof ContainerReflection;
    }

    /**
     * Will be run after [[ReflectionSerializer]] so will be passed the result of that serialization.
     * @param container
     * @param obj
     */
    toObject(
        container: ContainerReflection,
        obj: JSONReflection
    ): JSONContainerReflection {
        return {
            ...obj,
            children: this.owner.toObject(container.children),
            groups: this.owner.toObject(container.groups),
            categories: this.owner.toObject(container.categories),
            sources: this.owner.toObject(
                container.sources?.map((s) => new SourceReferenceWrapper(s))
            ),
        };
    }
}
