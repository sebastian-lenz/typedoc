import { ReferenceType } from "../../../models";

import { TypeSerializerComponent } from "../../components";
import { ReferenceType as JSONReferenceType } from "../../schema";

export class ReferenceTypeSerializer extends TypeSerializerComponent<ReferenceType> {
    supports(t: unknown) {
        return t instanceof ReferenceType;
    }

    toObject(
        type: ReferenceType,
        obj: Pick<JSONReferenceType, "type"> & Partial<JSONReferenceType>
    ): JSONReferenceType {
        if (type.reflection) {
            obj.id = type.reflection.id;
        }

        if (type.typeArguments && type.typeArguments.length > 0) {
            obj.typeArguments = type.typeArguments.map((t) =>
                this.owner.toObject(t)
            );
        }

        return {
            ...obj,
            name: type.name,
        };
    }
}
