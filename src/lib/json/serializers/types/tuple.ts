import { TupleType } from "../../../models";
import { NamedTupleMember } from "../../../models/types/tuple";

import { TypeSerializerComponent } from "../../components";
import {
    TupleType as JSONTupleType,
    NamedTupleMemberType as JSONNamedTupleMemberType,
} from "../../schema";

export class TupleTypeSerializer extends TypeSerializerComponent<TupleType> {
    supports(t: unknown) {
        return t instanceof TupleType;
    }

    toObject(
        tuple: TupleType,
        obj: Pick<JSONTupleType, "type">
    ): JSONTupleType {
        const result: JSONTupleType = { ...obj };

        if (tuple.elements && tuple.elements.length > 0) {
            result.elements = tuple.elements.map((t) => this.owner.toObject(t));
        }

        return result;
    }
}

export class NamedTupleMemberTypeSerializer extends TypeSerializerComponent<NamedTupleMember> {
    supports(t: unknown) {
        return t instanceof NamedTupleMember;
    }

    toObject(
        tuple: NamedTupleMember,
        obj: Pick<JSONNamedTupleMemberType, "type">
    ): JSONNamedTupleMemberType {
        return {
            ...obj,
            name: tuple.name,
            isOptional: tuple.isOptional,
            element: this.owner.toObject(tuple.element),
        };
    }
}
