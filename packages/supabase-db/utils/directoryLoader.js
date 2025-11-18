import { promises as fs } from "fs";
import { extname, join, resolve } from "path";
const DEFAULT_EXTENSIONS = new Set([
    ".txt",
    ".md",
    ".markdown",
    ".sql",
    ".csv",
    ".json",
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".py",
    ".java",
    ".go",
    ".rb",
]);
export class DirectoryLoader {
    constructor(rootPath, options = {}) {
        if (!rootPath) {
            throw new Error("directoryPath is required");
        }
        this.rootPath = resolve(rootPath);
        this.extensions = options.extensions
            ? new Set(options.extensions.map((ext) => ext.startsWith(".") ? ext.toLowerCase() : `.${ext.toLowerCase()}`))
            : DEFAULT_EXTENSIONS;
    }
    async load() {
        return this.#walk(this.rootPath);
    }
    async #walk(currentPath) {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });
        const documents = [];
        for (const entry of entries) {
            const fullPath = join(currentPath, entry.name);
            if (entry.isDirectory()) {
                documents.push(...(await this.#walk(fullPath)));
                continue;
            }
            if (!this.#shouldInclude(entry.name)) {
                continue;
            }
            const pageContent = await fs.readFile(fullPath, "utf8");
            documents.push({
                pageContent,
                metadata: {
                    source: fullPath,
                    filename: entry.name,
                },
            });
        }
        return documents;
    }
    #shouldInclude(filename) {
        if (!this.extensions || !this.extensions.size) {
            return true;
        }
        const extension = extname(filename).toLowerCase();
        return this.extensions.has(extension);
    }
}
//# sourceMappingURL=directoryLoader.js.map