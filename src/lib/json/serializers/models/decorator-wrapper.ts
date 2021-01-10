import { Decorator } from "../../../models";

/**
 * An internal concrete implementation for the [[ Decorator ]] interface
 * so it can be identified
 */
export class DecoratorWrapper {
    constructor(public decorator: Decorator) {}
}
