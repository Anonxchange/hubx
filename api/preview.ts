import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execPromise = promisify(exec);

export default async function handler(req, res) {
  try {
    const { videoUrl } = req.query;

    if (!videoUrl) {
      return res.status(400).json({ error: "Missing videoUrl" });
    }

    // save temp file name
    const output = path.join("/tmp", `thumb-${Date.now()}.jpg`);

    // run ffmpeg → capture thumbnail at 5 seconds
    await execPromise(
      `ffmpeg -y -i "${videoUrl}" -ss 00:00:05 -vframes 1 -vf scale=320:-1 ${output}`
    );

    // read file
    const fileBuffer = fs.readFileSync(output);

    // return as image
    res.setHeader("Content-Type", "image/jpeg");
    res.send(fileBuffer);
  } catch (err) {
    console.error("FFmpeg error:", err);
    res.status(500).json({ error: "Failed to generate preview" });
  }
}