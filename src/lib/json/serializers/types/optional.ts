import { OptionalType } from "../../../models";

import { TypeSerializerComponent } from "../../components";
import { OptionalType as JSONOptionalType } from "../../schema";

export class OptionalTypeSerializer extends TypeSerializerComponent<OptionalType> {
    supports(t: unknown) {
        return t instanceof OptionalType;
    }

    /**
     * Will be run after [[TypeSerializer]] so `type` will already be set.
     * @param type
     * @param obj
     */
    toObject(
        type: OptionalType,
        obj: Pick<JSONOptionalType, "type">
    ): JSONOptionalType {
        return {
            ...obj,
            elementType: this.owner.toObject(type.elementType),
        };
    }
}
