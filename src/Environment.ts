import args from "args";
import { access } from "fs";
import { dirname } from "path";
import { promisify } from "util";

import IEnvironment from "./IEnvironment";
import {
  DEFAULT_SECRETS_LISTENING_PORT,
  DEFAULT_SECRETS_SERVER_HOST_NAME
} from "./utils/constants";

const accessAsync = promisify(access);

if (!(args as any).config.name) {
  args
    .option(
      ["", "secretsHost"],
      "Optional. Customize listening address for secrets",
      DEFAULT_SECRETS_SERVER_HOST_NAME
    )
    .option(
      ["", "secretsPort"],
      "Optional. Customize listening port for secrets",
      DEFAULT_SECRETS_LISTENING_PORT
    )
    .option(
      ["l", "location"],
      "Optional. Use an existing folder as workspace path, default is current working directory",
      process.cwd()
    )
    .option(
      ["s", "silent"],
      "Optional. Disable access log displayed in console"
    )
    .option(
      ["L", "loose"],
      "Optional. Enable loose mode which ignores unsupported headers and parameters"
    )
    .option(
      ["", "skipApiVersionCheck"],
      "Optional. Skip the request API version check, request with all Api versions will be allowed"
    )
    .option(["", "oauth"], 'Optional. OAuth level. Candidate values: "basic"')
    .option(["", "cert"], "Optional. Path to certificate file")
    .option(["", "key"], "Optional. Path to certificate key .pem file")
    .option(
      ["d", "debug"],
      "Optional. Enable debug log by providing a valid local file path as log destination"
    )
    .option(["", "pwd"], "Optional. Password for .pfx file")
    .option(
      ["", "recoverableDays"],
      "Optional. Number of calendar days deleted vault objects remain recoverable. Should be between 7 and 90. Default is 90",
      90,
      (value) => parseInt(value)
    )
    .option(
      ["", "purgeProtection"],
      "Optional. If enabled, deleted vault objects cannot be purged during the retention period"
    )
    .option(
      ["", "disableSoftDelete"],
      "Optional. Allows instant permanent deletion of key vault objects."
    )
    .option(
      ["", "protectedSubscription"],
      "Optional. If enabled, behaves as if part of a subscription that cannot be cancelled"
    );

  (args as any).config.name = "volt-secrets";
}

export default class Environment implements IEnvironment {
  private flags = args.parse(process.argv);

  public secretsHost(): string | undefined {
    return this.flags.secretsHost;
  }

  public secretsPort(): number | undefined {
    return this.flags.secretsPort;
  }

  public async location(): Promise<string> {
    const location = this.flags.location || process.cwd();
    await accessAsync(location);
    return location;
  }

  public silent(): boolean {
    if (this.flags.silent !== undefined) {
      return true;
    }
    return false;
  }

  public loose(): boolean {
    if (this.flags.loose !== undefined) {
      return true;
    }
    // default is false which will block not supported APIs, headers and parameters
    return false;
  }

  public skipApiVersionCheck(): boolean {
    if (this.flags.skipApiVersionCheck !== undefined) {
      return true;
    }
    // default is false which will check API veresion
    return false;
  }

  public oauth(): string | undefined {
    return this.flags.oauth;
  }

  public cert(): string | undefined {
    return this.flags.cert;
  }

  public key(): string | undefined {
    return this.flags.key;
  }

  public pwd(): string | undefined {
    return this.flags.pwd;
  }

  public async debug(): Promise<string | undefined> {
    if (typeof this.flags.debug === "string") {
      // Enable debug log to file
      const debugFilePath = this.flags.debug;
      await accessAsync(dirname(debugFilePath));
      return debugFilePath;
    }

    if (this.flags.debug === true) {
      throw RangeError(
        `Must provide a debug log file path for parameter -d or --debug`
      );
    }

    // By default disable debug log
  }

  public recoverableDays(): number {
    if (this.flags.recoverableDays < 7 || this.flags.recoverableDays > 90) {
      throw RangeError(
        `Must provide a value between 7 and 90 for parameter --recoverableDays`
      );
    }

    return this.flags.recoverableDays;
  }

  public purgeProtection(): boolean {
    if (this.flags.purgeProtection !== undefined) {
      return true;
    }
    // default is false which will disable purge protection
    return false;
  }

  public protectedSubscription(): boolean {
    if (this.flags.protectedSubscription !== undefined) {
      return true;
    }
    // default is false
    return false;
  }

  public disableSoftDelete(): boolean {
    if (this.flags.disableSoftDelete !== undefined) {
      return true;
    }
    // default is false which allows recovery of deleted key vault objects 
    return false;
  }
}
