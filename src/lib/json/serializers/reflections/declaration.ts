import { DeclarationReflection } from "../../../models";

import { ReflectionSerializerComponent } from "../../components";
import { ContainerReflectionSerializer } from "./container";
import {
    DeclarationReflection as JSONDeclarationReflection,
    ContainerReflection as JSONContainerReflection,
} from "../../schema";

export class DeclarationReflectionSerializer extends ReflectionSerializerComponent<DeclarationReflection> {
    static PRIORITY = ContainerReflectionSerializer.PRIORITY - 1; // mimic inheritance, run after parent

    supports(t: unknown) {
        return t instanceof DeclarationReflection;
    }

    toObject(
        d: DeclarationReflection,
        obj: JSONContainerReflection
    ): JSONDeclarationReflection {
        const result: JSONDeclarationReflection = {
            ...obj,
            typeParameter: this.owner.toObject(d.typeParameters),
            type: this.owner.toObject(d.type),
            signatures: this.owner.toObject(d.signatures),
            indexSignature: this.owner.toObject(d.indexSignature),
        };

        if (d.getSignature) {
            result.getSignature = [this.owner.toObject(d.getSignature)];
        }
        if (d.setSignature) {
            result.setSignature = [this.owner.toObject(d.setSignature)];
        }

        return Object.assign(result, {
            defaultValue: this.owner.toObject(d.defaultValue),
            overwrites: this.owner.toObject(d.overwrites),
            inheritedFrom: this.owner.toObject(d.inheritedFrom),
            implementationOf: this.owner.toObject(d.implementationOf),
            extendedTypes: this.owner.toObject(d.extendedTypes),
            extendedBy: this.owner.toObject(d.extendedBy),
            implementedTypes: this.owner.toObject(d.implementedTypes),
            implementedBy: this.owner.toObject(d.implementedBy),
        });
    }
}
