import * as ts from "typescript";
import { format } from "util";
import { url } from "inspector";
import { resolve } from "path";
import type { NeverIfInternal } from "./general";

const isDebugging = () => Boolean(url());

const Colors = {
    red: "\u001b[91m",
    yellow: "\u001b[93m",
    cyan: "\u001b[96m",
    gray: "\u001b[90m",
    reset: "\u001b[0m",
};

/**
 * List of known log levels. Used to specify the urgency of a log message.
 */
export enum LogLevel {
    Verbose,
    Info,
    Warn,
    Error,
}

/**
 * A logger that will not produce any output.
 *
 * This logger also serves as the base class of other loggers as it implements
 * all the required utility functions.
 */
export class Logger {
    /**
     * How many error messages have been logged?
     */
    errorCount = 0;

    /**
     * How many warning messages have been logged?
     */
    warningCount = 0;
    private deprecationWarnings = new Set<string>();

    /**
     * The minimum logging level to print.
     */
    level = LogLevel.Info;

    /**
     * Has an error been raised through the log method?
     */
    hasErrors(): boolean {
        return this.errorCount > 0;
    }

    /**
     * Has a warning been raised through the log method?
     */
    hasWarnings(): boolean {
        return this.warningCount > 0;
    }

    /**
     * Reset the error counter.
     */
    resetErrors() {
        this.errorCount = 0;
    }

    /**
     * Reset the warning counter.
     */
    resetWarnings() {
        this.warningCount = 0;
        this.deprecationWarnings.clear();
    }

    /**
     * @deprecated prefer Logger.info, will be removed in 0.22
     */
    write(text: string, ...args: string[]) {
        this.deprecated("Logger.write is deprecated, prefer Logger.info");
        this.log(format(text, ...args), LogLevel.Info);
    }

    /**
     * @deprecated prefer Logger.info, will be removed in 0.22
     */
    writeln(text: string, ...args: string[]) {
        this.deprecated("Logger.writeln is deprecated, prefer Logger.info");
        this.log(format(text, ...args), LogLevel.Info);
    }

    /**
     * @deprecated prefer Logger.info, will be removed in 0.22
     */
    success(text: string, ...args: string[]) {
        this.deprecated("Logger.success is deprecated, prefer Logger.info");
        this.log(format(text, ...args), LogLevel.Info);
    }

    /**
     * Log the given verbose message.
     *
     * @param text  The message that should be logged.
     * @param args  The arguments that should be printed into the given message.
     */
    verbose(text: string): void;
    /** @deprecated prefer signature without formatting, will be removed in 0.22 */
    verbose(text: string, ...args: NeverIfInternal<string[]>): void;
    verbose(text: string, ...args: string[]) {
        if (args.length) {
            this.deprecated(
                "Logger.verbose: Providing formatting arguments is deprecated"
            );
        }
        this.log(format(text, ...args), LogLevel.Verbose);
    }

    /** Log the given info message. */
    info(text: string) {
        this.log(text, LogLevel.Info);
    }

    /**
     * Log the given warning.
     *
     * @param text  The warning that should be logged.
     * @param args  The arguments that should be printed into the given warning.
     */
    warn(text: string): void;
    /** @deprecated prefer signature without formatting, will be removed in 0.22 */
    warn(text: string, ...args: NeverIfInternal<string[]>): void;
    warn(text: string, ...args: string[]) {
        if (args.length) {
            this.deprecated(
                "Logger.warn: Providing formatting arguments is deprecated"
            );
        }
        this.log(format(text, ...args), LogLevel.Warn);
    }

    /**
     * Log the given error.
     *
     * @param text  The error that should be logged.
     * @param args  The arguments that should be printed into the given error.
     */
    error(text: string): void;
    /** @deprecated prefer signature without formatting, will be removed in 0.22 */
    error(text: string, ...args: NeverIfInternal<string[]>): void;
    error(text: string, ...args: string[]) {
        if (args.length) {
            this.deprecated(
                "Logger.error: Providing formatting arguments is deprecated"
            );
        }
        this.log(format(text, ...args), LogLevel.Error);
    }

    /** @internal */
    deprecated(text: string) {
        const stack = new Error().stack?.split("\n");
        if (stack && stack.length >= 4) {
            text = text + "\n" + stack[3];
        }
        if (!this.deprecationWarnings.has(text)) {
            this.deprecationWarnings.add(text);
            this.warn(text);
        }
    }

    /**
     * Print a log message.
     *
     * @param _message  The message itself.
     * @param level  The urgency of the log message.
     * @param _newLine  Should the logger print a trailing whitespace?
     */
    log(_message: string, level: LogLevel = LogLevel.Info) {
        if (level === LogLevel.Error) {
            this.errorCount += 1;
        }
        if (level === LogLevel.Warn) {
            this.warningCount += 1;
        }
    }

    /**
     * Print the given TypeScript log messages.
     *
     * @param diagnostics  The TypeScript messages that should be logged.
     */
    diagnostics(diagnostics: ReadonlyArray<ts.Diagnostic>) {
        diagnostics.forEach((diagnostic) => {
            this.diagnostic(diagnostic);
        });
    }

    /**
     * Print the given TypeScript log message.
     *
     * @param diagnostic  The TypeScript message that should be logged.
     */
    diagnostic(diagnostic: ts.Diagnostic) {
        const output = ts.formatDiagnosticsWithColorAndContext([diagnostic], {
            getCanonicalFileName: resolve,
            getCurrentDirectory: () => process.cwd(),
            getNewLine: () => ts.sys.newLine,
        });

        switch (diagnostic.category) {
            case ts.DiagnosticCategory.Error:
                this.log(output, LogLevel.Error);
                break;
            case ts.DiagnosticCategory.Warning:
                this.log(output, LogLevel.Warn);
                break;
            case ts.DiagnosticCategory.Message:
                this.log(output, LogLevel.Info);
        }
    }
}

const messagePrefixes = {
    [LogLevel.Error]: `${Colors.red}Error: ${Colors.reset}`,
    [LogLevel.Warn]: `${Colors.yellow}Warning: ${Colors.reset}`,
    [LogLevel.Info]: `${Colors.cyan}Info: ${Colors.reset}`,
    [LogLevel.Verbose]: `${Colors.gray}Debug: ${Colors.reset}`,
};

/**
 * A logger that outputs all messages to the console.
 */
export class ConsoleLogger extends Logger {
    /**
     * Print a log message.
     *
     * @param message  The message itself.
     * @param level  The urgency of the log message.
     * @param newLine  Should the logger print a trailing whitespace?
     */
    log(message: string, level: LogLevel = LogLevel.Info) {
        super.log(message, level);
        if (level < this.level && !isDebugging()) {
            return;
        }

        const output = messagePrefixes[level] + message;
        ts.sys.write(output + ts.sys.newLine);
    }
}

/**
 * A logger that calls a callback function.
 */
export class CallbackLogger extends Logger {
    /**
     * This loggers callback function
     */
    callback: Function;

    /**
     * Create a new CallbackLogger instance.
     *
     * @param callback  The callback that should be used to log messages.
     */
    constructor(callback: Function) {
        super();
        this.callback = callback;
    }

    /**
     * Print a log message.
     *
     * @param message  The message itself.
     * @param level  The urgency of the log message.
     * @param newLine  Should the logger print a trailing whitespace?
     */
    log(message: string, level: LogLevel = LogLevel.Info, newLine?: boolean) {
        super.log(message, level);

        this.callback(message, level, newLine);
    }
}
