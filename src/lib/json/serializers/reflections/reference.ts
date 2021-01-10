import { ReferenceReflection } from "../../../models";
import { ReflectionSerializerComponent } from "../../components";
import {
    DeclarationReflection as JSONDeclarationReflection,
    ReferenceReflection as JSONReferenceReflection,
} from "../../schema";
import { DeclarationReflectionSerializer } from "./declaration";

export class ReferenceReflectionSerializer extends ReflectionSerializerComponent<ReferenceReflection> {
    static PRIORITY = DeclarationReflectionSerializer.PRIORITY - 1;

    supports(t: unknown) {
        return t instanceof ReferenceReflection;
    }

    toObject(
        ref: ReferenceReflection,
        obj: JSONDeclarationReflection
    ): JSONReferenceReflection {
        return {
            ...obj,
            target: ref.tryGetTargetReflection()?.id ?? -1,
        };
    }
}
