import { SourceReference } from "../../../models";

/**
 * An internal concrete implementation for the [[ SourceReference ]] interface
 * so it can be identified
 */
export class SourceReferenceWrapper {
    constructor(public sourceReference: SourceReference) {}
}
