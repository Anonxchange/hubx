import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import ffmpegPath from "ffmpeg-static";
import type { NextApiRequest, NextApiResponse } from "next";

const execFilePromise = promisify(execFile);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { videoUrl } = req.query;

    if (!videoUrl || typeof videoUrl !== "string") {
      return res.status(400).json({ error: "Missing videoUrl" });
    }

    // temporary file path inside Vercel serverless
    const output = path.join("/tmp", `thumb-${Date.now()}.jpg`);

    // run ffmpeg-static to extract 1 frame at 5s
    await execFilePromise(ffmpegPath as string, [
      "-y",
      "-ss", "00:00:05", // seek to 5s
      "-i", videoUrl,    // input video
      "-vframes", "1",   // just 1 frame
      "-vf", "scale=320:-1", // scale width 320, keep aspect ratio
      output,
    ]);

    // read the file into buffer
    const fileBuffer = fs.readFileSync(output);

    // return as image/jpeg
    res.setHeader("Content-Type", "image/jpeg");
    res.send(fileBuffer);

    // clean up (optional)
    fs.unlinkSync(output);
  } catch (err: any) {
    console.error("FFmpeg error:", err);
    res.status(500).json({ error: "Failed to generate preview" });
  }
}