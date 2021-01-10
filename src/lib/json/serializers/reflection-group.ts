import { ReflectionGroup } from "../../models/ReflectionGroup";

import { SerializerComponent } from "../components";
import { ReflectionGroup as JSONReflectionGroup } from "../schema";

export class ReflectionGroupSerializer extends SerializerComponent<ReflectionGroup> {
    static PRIORITY = 1000;

    /**
     * Filter for instances of [[ReflectionGroup]]
     */
    serializeGroup(instance: unknown): boolean {
        return instance instanceof ReflectionGroup;
    }

    supports() {
        return true;
    }

    toObject(
        group: ReflectionGroup,
        obj?: Partial<JSONReflectionGroup>
    ): JSONReflectionGroup {
        const result: JSONReflectionGroup = {
            ...obj,
            title: group.title,
            kind: group.kind,
        };

        if (group.children && group.children.length > 0) {
            result.children = group.children.map((child) => child.id);
        }

        if (group.categories && group.categories.length > 0) {
            result.categories = group.categories.map((category) =>
                this.owner.toObject(category)
            );
        }

        return result;
    }
}
