import { SerializerComponent } from "../components";
import { DecoratorWrapper } from "./models/decorator-wrapper";
import { Decorator } from "../schema";

export class DecoratorContainerSerializer extends SerializerComponent<DecoratorWrapper> {
    static PRIORITY = 1000;

    /**
     * Filter for instances of [[DecoratorWrapper]]
     */
    serializeGroup(instance: unknown): boolean {
        return instance instanceof DecoratorWrapper;
    }

    supports() {
        return true;
    }

    toObject(
        { decorator }: DecoratorWrapper,
        obj?: Partial<Decorator>
    ): Decorator {
        const result: Decorator = {
            ...obj,
            name: decorator.name,
        };

        if (decorator.type) {
            result.type = this.owner.toObject(decorator.type);
        }

        if (decorator.arguments) {
            result.arguments = decorator.arguments;
        }

        return result;
    }
}
