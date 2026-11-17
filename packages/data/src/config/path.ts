import path from "node:path";
import fs from "node:fs";


const ROOT_MARKER = ".data-root";

function findRoot(startDir: string): string {
    let dir = startDir;
    console.log("dir: ", dir);

    while (true) {
        if (fs.existsSync(path.join(dir, ROOT_MARKER))) return dir;
        const parent = path.dirname(dir);
        console.log("parent: ", parent);

        if (parent === dir) {
            throw new Error(`${ROOT_MARKER} not found above ${startDir}`);
        }
        dir = parent;
        console.log("dir: ", dir);
    }
}

function resoleRoot(): string {
    const fromEnv = process.env.DATA_ROOT?.trim();
    console.log("fromEnv: ", fromEnv);

    if (fromEnv) {
        const abs = path.resolve(fromEnv);
        console.log("fromEnv: ", fromEnv);

        if (!fs.existsSync(abs)) {
            throw new Error(`DATA_ROOT points to a missing path: ${abs}`);
        }
        return abs;
    }
    return findRoot(import.meta.dirname) // Node >= 20.11
}

export const dataRoot = resoleRoot();
console.log("dataRoot: ", dataRoot);


