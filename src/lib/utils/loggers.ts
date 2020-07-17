import * as ts from "typescript";
import * as Util from "util";

/**
 * List of known log levels. Used to specify the urgency of a log message.
 */
export enum LogLevel {
  Verbose,
  Info,
  Warn,
  Error,
  Success,
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
  resetErrors(): void {
    this.errorCount = 0;
  }

  /**
   * Reset the warning counter.
   */
  resetWarnings(): void {
    this.warningCount = 0;
  }

  /**
   * Log the given message.
   *
   * @param text  The message that should be logged.
   * @param args  The arguments that should be printed into the given message.
   */
  write(text: string, ...args: string[]): void {
    this.log(Util.format(text, ...args), LogLevel.Info);
  }

  /**
   * Log the given message with a trailing whitespace.
   *
   * @param text  The message that should be logged.
   * @param args  The arguments that should be printed into the given message.
   */
  writeln(text: string, ...args: string[]): void {
    this.log(Util.format(text, ...args), LogLevel.Info, true);
  }

  /**
   * Log the given success message.
   *
   * @param text  The message that should be logged.
   * @param args  The arguments that should be printed into the given message.
   */
  success(text: string, ...args: string[]): void {
    this.log(Util.format(text, ...args), LogLevel.Success);
  }

  /**
   * Log the given verbose message.
   *
   * @param text  The message that should be logged.
   * @param args  The arguments that should be printed into the given message.
   */
  verbose(text: string, ...args: string[]): void {
    this.log(Util.format(text, ...args), LogLevel.Verbose);
  }

  /**
   * Log the given warning.
   *
   * @param text  The warning that should be logged.
   * @param args  The arguments that should be printed into the given warning.
   */
  warn(text: string, ...args: string[]): void {
    this.log(Util.format(text, ...args), LogLevel.Warn);
  }

  /**
   * Log the given error.
   *
   * @param text  The error that should be logged.
   * @param args  The arguments that should be printed into the given error.
   */
  error(text: string, ...args: string[]): void {
    this.log(Util.format(text, ...args), LogLevel.Error);
  }

  /**
   * Print a log message.
   *
   * @param message  The message itself.
   * @param level  The urgency of the log message.
   * @param newLine  Should the logger print a trailing whitespace?
   */
  log(
    _message: string,
    level: LogLevel = LogLevel.Info,
    _newLine?: boolean
  ): void {
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
  diagnostics(diagnostics: ReadonlyArray<ts.Diagnostic>): void {
    diagnostics.forEach((diagnostic) => {
      this.diagnostic(diagnostic);
    });
  }

  /**
   * Print the given TypeScript log message.
   *
   * @param diagnostic  The TypeScript message that should be logged.
   */
  diagnostic(diagnostic: ts.Diagnostic): void {
    let output: string;
    if (diagnostic.file) {
      output = diagnostic.file.fileName;
      output +=
        "(" +
        ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start || 0)
          .line +
        ")";
      output +=
        ts.sys.newLine +
        " " +
        ts.flattenDiagnosticMessageText(diagnostic.messageText, ts.sys.newLine);
    } else {
      output = ts.flattenDiagnosticMessageText(
        diagnostic.messageText,
        ts.sys.newLine
      );
    }

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
  log(
    message: string,
    level: LogLevel = LogLevel.Info,
    newLine?: boolean
  ): void {
    super.log(message, level, newLine);
    if (level < this.level) {
      return;
    }

    let output = "";
    if (level === LogLevel.Error) {
      output += "Error: ";
    }
    if (level === LogLevel.Warn) {
      output += "Warning: ";
    }
    output += message;

    if (newLine || level === LogLevel.Success) {
      ts.sys.write(ts.sys.newLine);
    }
    ts.sys.write(output + ts.sys.newLine);
    if (level === LogLevel.Success) {
      ts.sys.write(ts.sys.newLine);
    }
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
  log(
    message: string,
    level: LogLevel = LogLevel.Info,
    newLine?: boolean
  ): void {
    super.log(message, level, newLine);

    this.callback(message, level, newLine);
  }
}
