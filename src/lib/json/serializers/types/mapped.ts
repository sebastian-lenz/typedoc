import { TypeSerializerComponent } from "../../components";
import { MappedType } from "../../../models";
import { MappedType as JSONMappedType } from "../../schema";

export class MappedTypeSerializer extends TypeSerializerComponent<MappedType> {
    supports(t: unknown) {
        return t instanceof MappedType;
    }

    toObject(
        map: MappedType,
        obj: Pick<JSONMappedType, "type">
    ): JSONMappedType {
        return {
            ...obj,
            parameter: map.parameter,
            parameterType: this.owner.toObject(map.parameterType),
            templateType: this.owner.toObject(map.templateType),
            readonlyModifier: map.readonlyModifier,
            optionalModifier: map.optionalModifier,
            nameType: this.owner.toObject(map.nameType),
        };
    }
}
