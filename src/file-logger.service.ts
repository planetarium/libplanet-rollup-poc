import { Logger, Injectable, LoggerService, ConsoleLogger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileLogger extends ConsoleLogger {
  private logFilePath = path.join(__dirname, '..', '..', 'data', 'logs', 'application.log');

  constructor(context: string = 'App') {
    super(context);
    // Ensure the logs directory exists
    fs.mkdirSync(path.dirname(this.logFilePath), { recursive: true });
  }

  private writeToFile(message: string): void {
    fs.appendFileSync(this.logFilePath, message + '\n', { encoding: 'utf8' });
  }

  log(message: string, context?: string) {
    super.log(message, context); // Log to console
    this.writeToFile(`[LOG] ${new Date().toISOString()} [${context || 'App'}]: ${message}`);
  }

  error(message: string, trace?: string, context?: string) {
    super.error(message, trace, context); // Log to console
    this.writeToFile(`[ERROR] ${new Date().toISOString()} [${context || 'App'}]: ${message}\nTrace: ${trace || ''}`);
  }

  warn(message: string, context?: string) {
    super.warn(message, context); // Log to console
    this.writeToFile(`[WARN] ${new Date().toISOString()} [${context || 'App'}]: ${message}`);
  }

  debug(message: string, context?: string) {
    super.debug?.(message, context); // Log to console if debug is enabled
    this.writeToFile(`[DEBUG] ${new Date().toISOString()} [${context || 'App'}]: ${message}`);
  }

  verbose(message: string, context?: string) {
    super.verbose?.(message, context); // Log to console if verbose is enabled
    this.writeToFile(`[VERBOSE] ${new Date().toISOString()} [${context || 'App'}]: ${message}`);
  }
}
