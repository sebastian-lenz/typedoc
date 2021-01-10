import { InferredType } from "../../../models";
import { TypeSerializerComponent } from "../../components";

import {
    Type as JSONType,
    InferredType as JSONInferredType,
} from "../../schema";

export class InferredTypeSerializer extends TypeSerializerComponent<InferredType> {
    supports(item: unknown): boolean {
        return item instanceof InferredType;
    }

    toObject(
        inferred: InferredType,
        obj: JSONType & Pick<JSONInferredType, "type">
    ): JSONInferredType {
        return {
            ...obj,
            name: inferred.name,
        };
    }
}
