import { ConditionalType } from "../../../models";
import { TypeSerializerComponent } from "../../components";
import {
    Type as JSONType,
    ConditionalType as JSONConditionalType,
} from "../../schema";

export class ConditionalTypeSerializer extends TypeSerializerComponent<ConditionalType> {
    supports(item: unknown): boolean {
        return item instanceof ConditionalType;
    }

    toObject(
        conditional: ConditionalType,
        obj: Pick<JSONConditionalType, "type"> & JSONType
    ): JSONConditionalType {
        return {
            ...obj,
            checkType: this.owner.toObject(conditional.checkType),
            extendsType: this.owner.toObject(conditional.extendsType),
            trueType: this.owner.toObject(conditional.trueType),
            falseType: this.owner.toObject(conditional.falseType),
        };
    }
}
