/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Logger } from '@nestjs/common';

export { ConsoleKit as consoleKit };

export class ConsoleKit {
  private isDebug: boolean;
  static _instance: ConsoleKit | null = null;
  static instance(): ConsoleKit {
    const instance = ConsoleKit._instance;
    if (instance) {
      return instance;
    }
    ConsoleKit._instance = new ConsoleKit();
    return ConsoleKit._instance;
  }

  private constructor() {
    this.isDebug = process.env.DEBUG === 'true';
  }

  static logKit(message?: any, ...optionalParams: any[]) {
    if (this.instance().isDebug) {
      console.log(message, ...optionalParams);
    }
  }

  static errorKit(message?: any, ...optionalParams: any[]) {
    if (this.instance().isDebug) {
      console.error(message, ...optionalParams);
    }
  }

  static warnKit(message?: any, ...optionalParams: any[]) {
    if (this.instance().isDebug) {
      console.warn(message, ...optionalParams);
    }
  }

  static debugKit(message?: any, ...optionalParams: any[]) {
    if (this.instance().isDebug) {
      console.debug(message, ...optionalParams);
    }
  }
}

export class LoggerKit extends Logger {
  isDebug: boolean;

  private constructor(context: string) {
    super(context);
  }
  public static create(context: string): LoggerKit | null {
    return process.env.DEBUG === 'true' ? new LoggerKit(context) : null;
  }
}

export {};
