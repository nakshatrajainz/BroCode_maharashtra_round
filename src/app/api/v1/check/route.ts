import { readUploadAsPng } from "@/lib/pictures";
import { checkPicture } from "@/lib/verdict";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Send multipart/form-data with a picture." }, { status: 400 });
  }

  const uploaded = form.get("picture");
  const claimedMaker = String(form.get("claimedMaker") ?? "").trim();

  if (!(uploaded instanceof File) || uploaded.size === 0) {
    return Response.json({ error: "Choose a picture to check." }, { status: 400 });
  }
  if (uploaded.size > 8 * 1024 * 1024) {
    return Response.json({ error: "Keep the picture under 8 MB." }, { status: 400 });
  }

  let pngBytes: Buffer;
  try {
    pngBytes = await readUploadAsPng(Buffer.from(await uploaded.arrayBuffer()));
  } catch {
    return Response.json({ error: "Upload a PNG, JPEG, or WebP picture." }, { status: 400 });
  }

  try {
    const result = await checkPicture({
      pngBytes,
      claimedMaker: claimedMaker || undefined,
    });
    return Response.json({
      ok: true,
      verdict: result.verdict,
      reason: result.reason,
      lines: result.lines.map((line) => ({
        action: line.action,
        company: line.companyName,
        model: line.aiModel,
        stampedAt: line.stampedAt,
        onChain: line.onChain,
        lineId: line.lineId,
      })),
    });
  } catch {
    return Response.json({ error: "The picture could not be checked." }, { status: 500 });
  }
}
