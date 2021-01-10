import { SignatureReflection } from "../../../models";

import { ReflectionSerializerComponent } from "../../components";
import {
    SignatureReflection as JSONSignatureReflection,
    Reflection as JSONReflection,
} from "../../schema";

export class SignatureReflectionSerializer extends ReflectionSerializerComponent<SignatureReflection> {
    supports(t: unknown) {
        return t instanceof SignatureReflection;
    }

    toObject(
        signature: SignatureReflection,
        obj: JSONReflection
    ): JSONSignatureReflection {
        return {
            ...obj,
            typeParameter: this.owner.toObject(signature.typeParameters),
            parameters: this.owner.toObject(signature.parameters),
            type: this.owner.toObject(signature.type),
            overwrites: this.owner.toObject(signature.overwrites),
            inheritedFrom: this.owner.toObject(signature.inheritedFrom),
            implementationOf: this.owner.toObject(signature.implementationOf),
        };
    }
}
