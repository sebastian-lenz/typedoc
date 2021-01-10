import { TemplateLiteralType } from "../../../models";
import { TypeSerializerComponent } from "../../components";
import { TemplateLiteralType as JSONTemplateLiteralType } from "../../schema";

export class TemplateLiteralTypeSerializer extends TypeSerializerComponent<TemplateLiteralType> {
    supports(t: unknown) {
        return t instanceof TemplateLiteralType;
    }

    toObject(
        type: TemplateLiteralType,
        obj: Pick<JSONTemplateLiteralType, "type">
    ): JSONTemplateLiteralType {
        return {
            ...obj,
            head: type.head,
            tail: type.tail.map(([type, text]) => [
                this.owner.toObject(type),
                text,
            ]),
        };
    }
}
