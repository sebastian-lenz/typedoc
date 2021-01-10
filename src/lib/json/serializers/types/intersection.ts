import { IntersectionType } from "../../../models";

import { TypeSerializerComponent } from "../../components";
import { IntersectionType as JSONIntersectionType } from "../../schema";

export class IntersectionTypeSerializer extends TypeSerializerComponent<IntersectionType> {
    supports(t: unknown) {
        return t instanceof IntersectionType;
    }

    /**
     * Will be run after [[TypeSerializer]] so `type` will already be set.
     * @param type
     * @param obj
     */
    toObject(
        type: IntersectionType,
        obj: Pick<JSONIntersectionType, "type">
    ): JSONIntersectionType {
        return {
            ...obj,
            types: type.types.map((t) => this.owner.toObject(t)),
        };
    }
}
