import { ReflectionType } from "../../../models";

import { TypeSerializerComponent } from "../../components";
import { ReflectionType as JSONReflectionType } from "../../schema";

export class ReflectionTypeSerializer extends TypeSerializerComponent<ReflectionType> {
    supports(t: unknown) {
        return t instanceof ReflectionType;
    }

    toObject(
        reference: ReflectionType,
        obj: Pick<JSONReflectionType, "type">
    ): JSONReflectionType {
        const result: JSONReflectionType = {
            ...obj,
            declaration: this.owner.toObject(reference.declaration),
        };

        return result;
    }
}
