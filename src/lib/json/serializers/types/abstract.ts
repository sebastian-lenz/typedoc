import { Type } from "../../../models";

import { TypeSerializerComponent } from "../../components";
import { Type as JSONType } from "../../schema";

export class TypeSerializer extends TypeSerializerComponent<Type> {
    static PRIORITY = 1000;

    supports(t: unknown) {
        return t instanceof Type;
    }

    toObject(type: Type, obj?: Partial<JSONType>): JSONType {
        return {
            ...obj,
            type: type.type,
        };
    }
}
