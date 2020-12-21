import ILogger from "./ILogger";

export class Logger implements ILogger {
  public constructor() {}

  public error(message: string, contextID?: string) {
    console.error(message, contextID);
  }

  public warn(message: string, contextID?: string) {
    console.log(message, contextID);
  }

  public info(message: string, contextID?: string) {
    console.info(message, contextID);
  }

  public verbose(message: string, contextID?: string) {
    console.debug(message, contextID);
  }

  public debug(message: string, contextID?: string) {
    console.debug(message, contextID);
  }
}

// A singleton logger instance
const logger = new Logger();

export default logger;
