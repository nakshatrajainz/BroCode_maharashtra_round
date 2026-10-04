import { bearerToken, resolveCompanyFromApiKey } from "@/lib/api-keys";
import { stampPicture } from "@/lib/stamp-core";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const apiKey = bearerToken(request);
  if (!apiKey) {
    return Response.json(
      { error: "Missing API key. Send Authorization: Bearer ml_…" },
      { status: 401 },
    );
  }

  const company = await resolveCompanyFromApiKey(apiKey);
  if (!company) {
    return Response.json({ error: "Invalid or revoked API key." }, { status: 401 });
  }
  if (company.allowed === false) {
    return Response.json({ error: `${company.name} is revoked and cannot stamp.` }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Send multipart/form-data." }, { status: 400 });
  }

  const model = String(form.get("model") ?? "").trim();
  const usePrepared = String(form.get("usePrepared") ?? "") === "true";
  const uploaded = form.get("picture");

  const defaultSentence =
    company.category === "maker"
      ? model
        ? `Created by ${company.name} with ${model}.`
        : `Created by ${company.name}.`
      : company.category === "editor"
        ? `Changed by ${company.name}.`
        : `Posted by ${company.name}.`;
  const sentence = String(form.get("sentence") ?? "").trim() || defaultSentence;

  let pictureBytes: Buffer | null = null;
  if (!usePrepared && uploaded instanceof File && uploaded.size > 0) {
    pictureBytes = Buffer.from(await uploaded.arrayBuffer());
  }

  const result = await stampPicture({
    company,
    sentence,
    modelName: model || null,
    pictureBytes,
    usePrepared,
  });

  if (!result.ok) {
    return Response.json(
      { error: result.error, hint: result.errorNext },
      { status: 400 },
    );
  }

  const created = result.created;
  return Response.json({
    ok: true,
    company: created.companyName,
    action: created.action,
    model: created.aiModel,
    stampedAt: created.stampedAt,
    lineId: created.lineId,
    parentLineId: created.parentLineId,
    onChain: created.onChain,
    chainTx: created.chainTx ?? null,
    downloadName: created.downloadName,
    // Base64 PNG so company pipelines can save the stamped file.
    pictureBase64: created.pngBytes.toString("base64"),
  });
}
