import { promises as fs } from "fs";
import path from "path";

export async function GET() {
  const filePath = path.join(process.cwd(), "style.css");
  const content = await fs.readFile(filePath, "utf8");

  return new Response(content, {
    headers: {
      "Content-Type": "text/css; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
