import { IntrinsicType } from "../../../models";

import { TypeSerializerComponent } from "../../components";
import { IntrinsicType as JSONIntrinsicType } from "../../schema";

export class IntrinsicTypeSerializer extends TypeSerializerComponent<IntrinsicType> {
    supports(t: unknown) {
        return t instanceof IntrinsicType;
    }

    /**
     * Will be run after [[TypeSerializer]] so `type` will already be set.
     * @param type
     * @param obj
     */
    toObject(
        type: IntrinsicType,
        obj: Pick<JSONIntrinsicType, "type">
    ): JSONIntrinsicType {
        return {
            ...obj,
            name: type.name,
        };
    }
}
