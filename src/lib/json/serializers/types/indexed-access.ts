import { IndexedAccessType } from "../../../models";
import { TypeSerializerComponent } from "../../components";
import {
    Type as JSONType,
    IndexedAccessType as JSONIndexedAccessType,
} from "../../schema";

export class IndexedAccessTypeSerializer extends TypeSerializerComponent<IndexedAccessType> {
    supports(item: unknown): boolean {
        return item instanceof IndexedAccessType;
    }

    toObject(
        type: IndexedAccessType,
        obj: Pick<JSONIndexedAccessType, "type"> & JSONType
    ): JSONIndexedAccessType {
        return {
            ...obj,
            indexType: this.owner.toObject(type.indexType),
            objectType: this.owner.toObject(type.objectType),
        };
    }
}
