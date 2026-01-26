import { promises as fs } from "fs";
import path from "path";

const projectRoot = process.cwd();
const publicDir = path.join(projectRoot, "public");
const files = ["index.html", "game.js", "style.css"];

await fs.mkdir(publicDir, { recursive: true });

await Promise.all(
  files.map(async (file) => {
    const sourcePath = path.join(projectRoot, file);
    const targetPath = path.join(publicDir, file);
    const content = await fs.readFile(sourcePath);
    await fs.writeFile(targetPath, content);
  }),
);

console.log("Synced game assets to public/");
