import { TypeOperatorType } from "../../../models";

import { TypeSerializerComponent } from "../../components";
import { TypeOperatorType as JSONTypeOperatorType } from "../../schema";

export class TypeOperatorTypeSerializer extends TypeSerializerComponent<TypeOperatorType> {
    supports(t: unknown) {
        return t instanceof TypeOperatorType;
    }

    toObject(
        type: TypeOperatorType,
        obj: Pick<JSONTypeOperatorType, "type">
    ): JSONTypeOperatorType {
        return {
            ...obj,
            operator: type.operator,
            target: this.owner.toObject(type.target),
        };
    }
}
