// supabase/functions/process-video/index.ts
// ----------------------------------------------------
// Updated: generate a 10‑second preview by picking a random HLS
// segment (or a random URI from the playlist) and converting it
// to WebP. The preview is uploaded to BunnyCDN.
// ----------------------------------------------------

import { createFFmpeg } from "npm:@ffmpeg/ffmpeg@0.12.6";

// -----------------------------------------------------------------
// Environment variables – keep them secret in the Supabase UI
// -----------------------------------------------------------------
const BUNNY_ZONE = Deno.env.get("BUNNY_STORAGE_ZONE");
const BUNNY_KEY  = Deno.env.get("BUNNY_STORAGE_API_KEY");
if (!BUNNY_ZONE || !BUNNY_KEY) {
  console.error("❌ Missing BunnyCDN env vars");
}

// -----------------------------------------------------------------
// FFmpeg singleton – preload the WASM module once per cold start
// -----------------------------------------------------------------
const ffmpeg = createFFmpeg({ log: true });
async function preload() {
  if (!ffmpeg.isLoaded()) {
    console.info("🔄 Loading ffmpeg.wasm …");
    await ffmpeg.load();
    console.info("✅ ffmpeg.wasm ready");
  }
}
EdgeRuntime.waitUntil(preload());

// -----------------------------------------------------------------
// Helper – upload a Buffer to BunnyCDN
// -----------------------------------------------------------------
async function uploadToBunny(path: string, data: Uint8Array, mime: string) {
  const url = `https://storage.bunnycdn.com/${BUNNY_ZONE}/${path}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      AccessKey: BUNNY_KEY ?? "",
      "Content-Type": mime,
    },
    body: data,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Bunny upload failed (${res.status}): ${txt}`);
  }
  return url; // public link
}

// -----------------------------------------------------------------
// Main handler
// -----------------------------------------------------------------
Deno.serve(async (req: Request) => {
  // ------------------- parse JSON -------------------
  let payload: any;
  try { payload = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const { videoId, hlsUrl, userId, title } = payload;
  if (!videoId || !hlsUrl || !userId) {
    return new Response(JSON.stringify({ error: "Missing videoId, hlsUrl or userId" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  // Ensure ffmpeg is ready (fast‑path)
  if (!ffmpeg.isLoaded()) await ffmpeg.load();

  try {
    // ------------------- fetch playlist -------------------
    const playlistRes = await fetch(hlsUrl);
    if (!playlistRes.ok) throw new Error(`Playlist ${playlistRes.status}`);
    const playlist = await playlistRes.text();

    // Extract all .ts URIs (ignore comments)
    const lines = playlist.split(/\r?\n/).filter(l => l && !l.startsWith("#"));
    const tsUris = lines.filter(l => l.endsWith(".ts"));
    if (tsUris.length === 0) throw new Error("No .ts files in playlist");

    // Pick a random URI
    const randIndex = crypto.getRandomValues(new Uint32Array(1))[0] % tsUris.length;
    let segmentUrl = tsUris[randIndex].trim();
    if (!segmentUrl.startsWith("http")) {
      const base = new URL(hlsUrl);
      segmentUrl = new URL(segmentUrl, base).toString();
    }

    // ------------------- download segment -------------------
    const segRes = await fetch(segmentUrl);
    if (!segRes.ok) throw new Error(`Segment ${segRes.status}`);
    const segData = new Uint8Array(await segRes.arrayBuffer());
    ffmpeg.FS("writeFile", "segment.ts", segData);

    // ------------------- create 10‑sec WebP preview -------------------
    const PREVIEW_SEC = "10"; // hard‑coded 10 seconds
    await ffmpeg.run(
      "-i", "segment.ts",
      "-t", PREVIEW_SEC,
      "-vf", "scale=640:-1",
      "-c:v", "libwebp",
      "-lossless", "1",
      "preview.webp",
    );
    const previewBytes = ffmpeg.FS("readFile", "preview.webp");

    // ------------------- upload to Bunny -------------------
    const previewPath = `previews/${videoId}/preview.webp`;
    const previewUrl = await uploadToBunny(previewPath, previewBytes, "image/webp");

    // ------------------- respond -------------------
    const result = { videoId, title: title ?? null, previewUrl };
    return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error("⚠️ process‑video error:", e);
    return new Response(JSON.stringify({ error: "Processing failed", details: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { "Content-Type": "application/json" } });
  } finally {
    // cleanup virtual FS
    try { ffmpeg.FS("unlink", "segment.ts"); ffmpeg.FS("unlink", "preview.webp"); } catch { }
  }
});