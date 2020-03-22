import { OptionsReader, Options } from '..';
import { Logger } from '../../loggers';
import { ParameterType } from '../declaration';
import { Result } from '../..';

/**
 * Obtains option values from command-line arguments
 */
export class ArgumentsReader implements OptionsReader {
    readonly name = 'arguments';
    readonly priority: number;
    private args: string[];

    constructor(priority: number, args = process.argv.slice(2)) {
        this.priority = priority;
        this.args = args;
    }

    read(container: Options, logger: Logger): void {
        // Make container's type more lax, we do the appropriate checks manually.
        const options = container as Options & {
            setValue(name: string, value: unknown): Result<void, Error>;
            getValue(name: string): unknown;
        };
        const seen = new Set<string>();
        let index = 0;

        const error = (error: Error) => logger.error(error.message);

        while (index < this.args.length) {
            const name = this.args[index];
            const decl = name.startsWith('-')
                ? (index++, options.getDeclaration(name.replace(/^--?/, '')))
                : options.getDeclaration('inputFiles');

            if (decl) {
                if (seen.has(decl.name) && decl.type === ParameterType.Array) {
                    options.setValue(
                        decl.name,
                        (options.getValue(decl.name) as string[]).concat(this.args[index])
                    ).mapErr(error);
                } else if (decl.type === ParameterType.Boolean) {
                    const value = String(this.args[index]).toLowerCase();

                    if (value === 'true' || value === 'false') {
                        options.setValue(decl.name, value === 'true').mapErr(error);
                    } else {
                        options.setValue(decl.name, true).mapErr(error);
                        // Bool option didn't consume the next argument as expected.
                        index--;
                    }
                } else {
                    options.setValue(decl.name, this.args[index]).mapErr(error);
                }
                seen.add(decl.name);
            } else {
                logger.error(`Unknown option: ${name}`);
            }

            index++;
        }
    }
}
