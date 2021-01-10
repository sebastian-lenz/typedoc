import { UnknownType } from "../../../models";

import { TypeSerializerComponent } from "../../components";
import { UnknownType as JSONUnknownType } from "../../schema";

export class UnknownTypeSerializer extends TypeSerializerComponent<UnknownType> {
    supports(t: unknown) {
        return t instanceof UnknownType;
    }

    /**
     * Will be run after [[TypeSerializer]] so `type` will already be set.
     * @param type
     * @param obj
     */
    toObject(
        type: UnknownType,
        obj: Pick<JSONUnknownType, "type">
    ): JSONUnknownType {
        return {
            ...obj,
            name: type.name,
        };
    }
}
