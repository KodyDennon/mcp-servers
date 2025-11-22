import fs from "fs";
import path from "path";
import dotenv from "dotenv";

export class ConfigManager {
  private envPath: string;
  private config: Record<string, string> = {};

  constructor(cwd: string = process.cwd()) {
    this.envPath = path.join(cwd, ".env");
    this.load();
  }

  private load() {
    if (fs.existsSync(this.envPath)) {
      const envConfig = dotenv.parse(fs.readFileSync(this.envPath));
      this.config = { ...this.config, ...envConfig };
    }
  }

  get(key: string): string | undefined {
    return this.config[key] || process.env[key];
  }

  set(key: string, value: string) {
    this.config[key] = value;
    this.save();
  }

  private save() {
    const content = Object.entries(this.config)
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    fs.writeFileSync(this.envPath, content);
  }

  has(key: string): boolean {
    return !!this.get(key);
  }
}
