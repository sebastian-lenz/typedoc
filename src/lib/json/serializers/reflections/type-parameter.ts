import { TypeParameterReflection } from "../../../models";

import { ReflectionSerializerComponent } from "../../components";
import {
    TypeParameterReflection as JSONTypeParameterReflection,
    Reflection as JSONReflection,
} from "../../schema";

export class TypeParameterReflectionSerializer extends ReflectionSerializerComponent<TypeParameterReflection> {
    supports(t: unknown) {
        return t instanceof TypeParameterReflection;
    }

    toObject(
        typeParameter: TypeParameterReflection,
        obj: JSONReflection
    ): JSONTypeParameterReflection {
        return {
            ...obj,
            type: this.owner.toObject(typeParameter.type),
            default: this.owner.toObject(typeParameter.default),
        };
    }
}
