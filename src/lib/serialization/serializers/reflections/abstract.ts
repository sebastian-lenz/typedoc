import { Reflection } from "../../../models";

import { ReflectionSerializerComponent } from "../../components";
import { DecoratorWrapper } from "../models";
import type { Reflection as JSONReflection } from "../../schema";

export class ReflectionSerializer extends ReflectionSerializerComponent<Reflection> {
    static PRIORITY = 1000;

    supports(t: unknown) {
        return t instanceof Reflection;
    }

    toObject(
        reflection: Reflection,
        obj?: Partial<JSONReflection>
    ): JSONReflection {
        const result: JSONReflection = {
            ...obj,
            id: reflection.id,
            name: reflection.name,
            kind: reflection.kind,
            kindString: reflection.kindString,
            flags: {},
            comment: this.owner.toObject(reflection.comment),
            decorates: this.owner.toObject(reflection.decorates),
            decorators: this.owner.toObject(
                reflection.decorators?.map((d) => new DecoratorWrapper(d))
            ),
        };

        if (reflection.originalName !== reflection.name) {
            result.originalName = reflection.originalName;
        }

        const flags = [
            "isPrivate",
            "isProtected",
            "isPublic",
            "isStatic",
            "isExternal",
            "isOptional",
            "isRest",
            "isAbstract",
            "isReadonly",
        ] as const;

        for (const key of flags) {
            if (reflection.flags[key] === true) {
                result.flags[key] = true;
            }
        }

        return result;
    }
}
