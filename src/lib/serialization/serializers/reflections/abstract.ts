import { Reflection, TraverseProperty } from '../../../models';

import { ReflectionSerializerComponent } from '../../components';
import { DecoratorWrapper } from '../models';
import { ReflectionFlags } from '../../../models/reflections/abstract';
import { Reflection as JSONReflection } from '../../schema';

export class ReflectionSerializer extends ReflectionSerializerComponent<Reflection> {
    static PRIORITY = 1000;

    supports(t: unknown) {
        return t instanceof Reflection;
    }

    toObject(reflection: Reflection, obj?: Partial<JSONReflection>): JSONReflection {
        const result: JSONReflection = {
            ...obj,
            id: reflection.id,
            name: reflection.name,
            kind: reflection.kind,
            flags: {}
        };

        if (reflection.originalName !== reflection.name) {
            result.originalName = reflection.originalName;
        }

        if (reflection.comment) {
            result.comment = this.owner.toObject(reflection.comment);
        }

        for (const key of Object.getOwnPropertyNames(ReflectionFlags.prototype)) {
            if (reflection.flags[key] === true) {
                result.flags[key] = true;
            }
        }

        if (reflection.decorates && reflection.decorates.length > 0) {
            result.decorates = reflection.decorates.map(t => this.owner.toObject(t));
        }

        if (reflection.decorators && reflection.decorators.length > 0) {
            result.decorators = reflection.decorators.map(d => this.owner.toObject(new DecoratorWrapper(d)));
        }

        reflection.traverse((child, property) => {
            if (property === TraverseProperty.TypeLiteral) {
                return;
            }
            let name = TraverseProperty[property];
            name = name[0].toLowerCase() + name.substr(1);
            if (!result[name]) {
                result[name] = [];
            }
            result[name].push(this.owner.toObject(child));
        });

        return result;
    }
}
