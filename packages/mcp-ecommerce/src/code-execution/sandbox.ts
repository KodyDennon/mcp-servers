import vm from "vm";
import fs from "fs";
import path from "path";
import {
  UnifiedOrder,
  UnifiedProduct,
  UnifiedShipment,
  UnifiedInvoice,
} from "../types.js";

interface SandboxContext {
  console: Console;
  fs: {
    readFile: (path: string) => string;
    writeFile: (path: string, content: string) => void;
    exists: (path: string) => boolean;
    mkdir: (path: string) => void;
  };
  [key: string]: any;
}

export class Sandbox {
  private context: vm.Context;
  private dataDir: string;

  constructor(plugins: any) {
    this.dataDir = path.join(process.cwd(), ".data");
    this.ensureDataDir();

    const sandboxContext: SandboxContext = {
      console: console,
      fs: {
        readFile: (filePath: string) => {
          this.validatePath(filePath);
          return fs.readFileSync(path.join(this.dataDir, filePath), "utf-8");
        },
        writeFile: (filePath: string, content: string) => {
          this.validatePath(filePath);
          fs.writeFileSync(path.join(this.dataDir, filePath), content);
        },
        exists: (filePath: string) => {
          this.validatePath(filePath);
          return fs.existsSync(path.join(this.dataDir, filePath));
        },
        mkdir: (dirPath: string) => {
          this.validatePath(dirPath);
          const fullPath = path.join(this.dataDir, dirPath);
          if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
          }
        },
      },
      ...plugins, // Expose plugins directly to the sandbox
    };

    this.context = vm.createContext(sandboxContext);
  }

  private ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private validatePath(filePath: string) {
    const fullPath = path.join(this.dataDir, filePath);
    if (!fullPath.startsWith(this.dataDir)) {
      throw new Error(
        "Access denied: Cannot access files outside the data directory.",
      );
    }
  }

  async execute(code: string): Promise<any> {
    try {
      // Wrap code in an async IIFE to support top-level await
      const wrappedCode = `(async () => { ${code} })()`;
      const script = new vm.Script(wrappedCode);
      return await script.runInContext(this.context);
    } catch (error) {
      throw new Error(`Execution failed: ${(error as Error).message}`);
    }
  }
}
