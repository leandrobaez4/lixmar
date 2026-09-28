import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

for (const directory of ["src", "scripts", "test"]) {
  for (const file of fs.readdirSync(directory).filter((name) => name.endsWith(".mjs"))) {
    execFileSync(process.execPath, ["--check", path.join(directory, file)], { stdio: "inherit" });
  }
}
