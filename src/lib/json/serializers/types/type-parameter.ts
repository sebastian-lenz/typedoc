import { TypeParameterType } from "../../../models";

import { TypeSerializerComponent } from "../../components";
import { TypeParameterType as JSONTypeParameterType } from "../../schema";

export class TypeParameterTypeSerializer extends TypeSerializerComponent<TypeParameterType> {
    supports(t: unknown) {
        return t instanceof TypeParameterType;
    }

    toObject(
        type: TypeParameterType,
        obj: Pick<JSONTypeParameterType, "type">
    ): JSONTypeParameterType {
        const result: JSONTypeParameterType = {
            ...obj,
            name: type.name,
        };

        if (type.constraint) {
            result.constraint = this.owner.toObject(type.constraint);
        }
        if (type.default) {
            result.default = this.owner.toObject(type.default);
        }

        return result;
    }
}
