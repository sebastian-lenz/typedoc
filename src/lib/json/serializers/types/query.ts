import { QueryType } from "../../../models";
import { TypeSerializerComponent } from "../../components";
import { QueryType as JSONQueryType } from "../../schema";

export class QueryTypeSerializer extends TypeSerializerComponent<QueryType> {
    supports(t: unknown) {
        return t instanceof QueryType;
    }

    toObject(type: QueryType, obj: Pick<JSONQueryType, "type">): JSONQueryType {
        return {
            ...obj,
            queryType: this.owner.toObject(type.queryType),
        };
    }
}
