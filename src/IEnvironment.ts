export default interface IEnvironment {
  secretsHost(): string | undefined;
  secretsPort(): number | undefined;
  location(): Promise<string>;
  silent(): boolean;
  loose(): boolean;
  skipApiVersionCheck(): boolean;
  cert(): string | undefined;
  key(): string | undefined;
  pwd(): string | undefined;
  debug(): Promise<string | boolean | undefined>;
  oauth(): string | undefined;
}
