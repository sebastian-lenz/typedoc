import { OptionsReader, Options } from "..";
import { Logger } from "../../loggers";
import { ParameterType } from "../declaration";

/**
 * Obtains option values from command-line arguments
 */
export class ArgumentsReader implements OptionsReader {
  readonly name = "arguments";
  readonly order: number;
  private args: string[];

  constructor(order: number, args = process.argv.slice(2)) {
    this.order = order;
    this.args = args;
  }

  read(container: Options, logger: Logger): void {
    // Make container's type more lax, we do the appropriate checks manually.
    const options = container as Options & {
      setValue(name: string, value: unknown): void;
      getValue(name: string): unknown;
    };
    const seen = new Set<string>();
    let index = 0;

    const trySet = (name: string, value: unknown) => {
      try {
        options.setValue(name, value);
      } catch (err) {
        logger.error(err.message);
      }
    };

    while (index < this.args.length) {
      const name = this.args[index];
      const decl = name.startsWith("-")
        ? (index++, options.getDeclaration(name.replace(/^--?/, "")))
        : options.getDeclaration("inputFiles");

      if (decl) {
        if (seen.has(decl.name) && decl.type === ParameterType.Array) {
          trySet(
            decl.name,
            (options.getValue(decl.name) as string[]).concat(this.args[index])
          );
        } else if (decl.type === ParameterType.Boolean) {
          const value = String(this.args[index]).toLowerCase();

          if (value === "true" || value === "false") {
            trySet(decl.name, value === "true");
          } else {
            trySet(decl.name, true);
            // Bool option didn't consume the next argument as expected.
            index--;
          }
        } else {
          trySet(decl.name, this.args[index]);
        }
        seen.add(decl.name);
      } else {
        logger.error(`Unknown option: ${name}`);
      }

      index++;
    }
  }
}
