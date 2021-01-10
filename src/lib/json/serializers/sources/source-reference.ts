import { SerializerComponent } from "../../components";
import { SourceReferenceWrapper } from "../models";
import { SourceReference as JSONSourceReference } from "../../schema";

export class SourceReferenceContainerSerializer extends SerializerComponent<SourceReferenceWrapper> {
    static PRIORITY = 1000;

    serializeGroup(instance: unknown) {
        return instance instanceof SourceReferenceWrapper;
    }

    supports() {
        return true;
    }

    toObject(
        { sourceReference: ref }: SourceReferenceWrapper,
        obj?: Partial<JSONSourceReference>
    ): JSONSourceReference {
        return {
            ...obj,
            fileName: ref.fileName,
            line: ref.line,
            character: ref.character,
        };
    }
}
