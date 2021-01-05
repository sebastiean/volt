import * as fs from "fs";
import { DeletionRecoveryLevel } from './generated/artifacts/models';
import { OAuthLevel } from './models';

export enum CertOptions {
  Default,
  PEM,
  PFX
}

export default abstract class ConfigurationBase {
  public constructor(
    public readonly host: string,
    public readonly port: number,
    public readonly enableAccessLog: boolean = false,
    public readonly accessLogWriteStream?: NodeJS.WritableStream,
    public readonly enableDebugLog: boolean = false,
    public readonly debugLogFilePath?: string,
    public readonly loose: boolean = false,
    public readonly skipApiVersionCheck: boolean = false,
    public readonly cert: string = "",
    public readonly key: string = "",
    public readonly pwd: string = "",
    public readonly oauth?: string,
    public readonly recoverableDays: number = 90,
    public readonly softDelete: boolean = true, // soft-delete enable by default https://docs.microsoft.com/en-us/azure/key-vault/general/soft-delete-change
    public readonly purgeProtection: boolean = false,
    public readonly protectedSubscription: boolean = false
  ) { }

  public hasCert() {
    if (this.cert.length > 0 && this.key.length > 0) {
      return CertOptions.PEM;
    }
    if (this.cert.length > 0 && this.pwd.toString().length > 0) {
      return CertOptions.PFX;
    }

    return CertOptions.Default;
  }

  public getCert(option: any) {
    switch (option) {
      case CertOptions.PEM:
        return {
          cert: fs.readFileSync(this.cert),
          key: fs.readFileSync(this.key)
        };
      case CertOptions.PFX:
        return {
          pfx: fs.readFileSync(this.cert),
          passphrase: this.pwd.toString()
        };
      default:
        return null;
    }
  }

  public getOAuthLevel(): undefined | OAuthLevel {
    if (this.oauth) {
      if (this.oauth.toLowerCase() === "basic") {
        return OAuthLevel.BASIC;
      }
    }

    return;
  }

  public getRecoveryLevel(): DeletionRecoveryLevel {
    if (this.recoverableDays >= 7 && this.recoverableDays < 90 && !this.protectedSubscription && !this.purgeProtection) {
      return "CustomizedRecoverable";
    }
    if (this.recoverableDays >= 7 && this.recoverableDays < 90 && this.protectedSubscription && !this.purgeProtection) {
      return "CustomizedRecoverable+ProtectedSubscription";
    }
    if (this.recoverableDays >= 7 && this.recoverableDays < 90 && !this.protectedSubscription && this.purgeProtection) {
      return "CustomizedRecoverable+Purgeable";
    }
    if (this.recoverableDays === 0 && !this.purgeProtection) {
      return "Purgeable";
    }
    if (this.recoverableDays === 90 && !this.protectedSubscription && this.purgeProtection) {
      return "Recoverable";
    }
    if (this.recoverableDays === 90 && this.protectedSubscription && this.purgeProtection) {
      return "Recoverable+ProtectedSubscription";
    }
    if (this.recoverableDays === 90 && !this.protectedSubscription && !this.purgeProtection) {
      return "Recoverable+Purgeable";
    }
    throw new Error("Cannot resolve vault recovery level.");
  }

  public getHttpServerAddress(): string {
    return `http${this.hasCert() === CertOptions.Default ? "" : "s"}://${this.host
      }:${this.port}`;
  }
}
