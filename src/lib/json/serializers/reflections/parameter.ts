import { ParameterReflection } from "../../../models";

import { ReflectionSerializerComponent } from "../../components";
import {
    ParameterReflection as JSONParameterReflection,
    Reflection as JSONReflection,
} from "../../schema";

export class ParameterReflectionSerializer extends ReflectionSerializerComponent<ParameterReflection> {
    supports(t: unknown) {
        return t instanceof ParameterReflection;
    }

    toObject(
        parameter: ParameterReflection,
        obj: JSONReflection
    ): JSONParameterReflection {
        const result: JSONParameterReflection = {
            ...obj,
            type: this.owner.toObject(parameter.type),
            defaultValue: this.owner.toObject(parameter.defaultValue),
        };

        return result;
    }
}
