import { NextApiRequest, NextApiResponse } from "next";
import ffmpegPath from "ffmpeg-static";
import { spawn } from "child_process";
import fs from "fs";

// Disable body parser for binary
export const config = {
  api: { bodyParser: false },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { videoUrl } = req.query;

  if (!videoUrl) {
    return res.status(400).json({ error: "videoUrl required" });
  }

  const inputPath = "/tmp/input.mp4";
  const outputPath = "/tmp/preview.mp4";

  // Step 1: download video from Bunny
  const response = await fetch(videoUrl as string);
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(inputPath, buffer);

  // Step 2: run ffmpeg with spawn
  await new Promise((resolve, reject) => {
    const ffmpeg = spawn(ffmpegPath as string, [
      "-ss", "00:00:30",  // start at 30s
      "-t", "10",         // 10 seconds
      "-i", inputPath,
      "-vf", "scale=320:-1",
      "-c:v", "libx264",
      "-c:a", "aac",
      outputPath,
    ]);

    ffmpeg.on("close", (code) => {
      if (code === 0) resolve(null);
      else reject(new Error("ffmpeg failed"));
    });
  });

  // Step 3: send preview back
  const previewBuffer = fs.readFileSync(outputPath);
  res.setHeader("Content-Type", "video/mp4");
  res.send(previewBuffer);
}