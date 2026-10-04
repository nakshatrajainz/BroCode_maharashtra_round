import "server-only";

import type { Hex } from "viem";
import { extractHiddenId, fingerprintsForPng } from "@/lib/pictures";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CheckLine, CheckResult, Verdict } from "@/lib/verdict-types";

export type { CheckLine, CheckResult, Verdict } from "@/lib/verdict-types";

type CompanyInfo = {
  name: string;
  category: string;
  stamp_address: string;
  allowed: boolean | null;
  revoked_at: string | null;
};

type LineRow = {
  line_id: string;
  parent_line_id: string | null;
  action: string;
  exact_fingerprint: string;
  lookalike_fingerprint: string;
  hidden_id: string;
  chain_tx: string | null;
  created_at: string;
  ai_model: string | null;
  companies: CompanyInfo | CompanyInfo[] | null;
};

type NormalizedLine = Omit<LineRow, "companies"> & { company: CompanyInfo };

const LINE_SELECT =
  "line_id, parent_line_id, action, exact_fingerprint, lookalike_fingerprint, hidden_id, chain_tx, created_at, ai_model, companies(name, category, stamp_address, allowed, revoked_at)";

export async function checkPicture(input: {
  pngBytes: Buffer;
  claimedMaker?: string;
}): Promise<CheckResult> {
  const { exactFingerprint, lookalikeFingerprint } = fingerprintsForPng(input.pngBytes);
  const hiddenId = extractHiddenId(input.pngBytes);
  const claim = input.claimedMaker?.trim() ?? "";
  const admin = createAdminClient();

  const found = await findLine(admin, {
    hiddenId,
    exactFingerprint,
    lookalikeFingerprint,
  });

  if (!found) {
    if (claim) {
      return baseResult("Self-asserted", `Someone claims “${claim}” made this picture, but no allowed stamp line matches the file.`, {
        hiddenId,
        exactFingerprint,
        lookalikeFingerprint,
        lines: [],
      });
    }
    return baseResult("Unverifiable", "No notebook line matches this file. There is no stamped story to check.", {
      hiddenId,
      exactFingerprint,
      lookalikeFingerprint,
      lines: [],
    });
  }

  if (found === "ambiguous") {
    return baseResult(
      "Unverifiable",
      "More than one notebook line matches this file, so the story is unclear (for example two Makers claiming the same picture).",
      { hiddenId, exactFingerprint, lookalikeFingerprint, lines: [] },
    );
  }

  const row = found;
  const exactMatch = row.exact_fingerprint === exactFingerprint;
  const lookalikeMatch = row.lookalike_fingerprint === lookalikeFingerprint;
  const hiddenMatch = Boolean(hiddenId && row.hidden_id === hiddenId);

  if (!exactMatch && !lookalikeMatch) {
    return baseResult(
      "Unverifiable",
      "A line was found from the hidden id, but this file no longer matches the recorded fingerprints. The picture may have been altered or an old note was stuck on a different file.",
      {
        hiddenId,
        exactFingerprint,
        lookalikeFingerprint,
        lines: [toCheckLine(row, hiddenMatch ? "hidden-id" : "exact")],
      },
    );
  }

  if (isLineAfterRevoke(row)) {
    return baseResult(
      "Unverifiable",
      `${row.company.name} was revoked before or when this line was written. Old trusted lines remain; this later stamp does not count as Trusted.`,
      {
        hiddenId,
        exactFingerprint,
        lookalikeFingerprint,
        lines: [toCheckLine(row, exactMatch ? "exact" : "lookalike")],
      },
    );
  }

  if (row.company.category !== row.action) {
    return baseResult(
      "Self-asserted",
      `${row.company.name} is registered as a ${row.company.category}, but this line claims a ${row.action} action.`,
      {
        hiddenId,
        exactFingerprint,
        lookalikeFingerprint,
        lines: [toCheckLine(row, exactMatch ? "exact" : "lookalike")],
      },
    );
  }

  if (row.action === "maker" && row.parent_line_id) {
    return baseResult("Unverifiable", "The creation line incorrectly points at a parent.", {
      hiddenId,
      exactFingerprint,
      lookalikeFingerprint,
      lines: [toCheckLine(row, exactMatch ? "exact" : "lookalike")],
    });
  }

  if (row.action !== "maker" && !row.parent_line_id) {
    return baseResult(
      "Unverifiable",
      "This line should point at an earlier line, but the parent is missing.",
      {
        hiddenId,
        exactFingerprint,
        lookalikeFingerprint,
        lines: [toCheckLine(row, exactMatch ? "exact" : "lookalike")],
      },
    );
  }

  const chain = await walkParents(admin, row);
  if ("error" in chain) {
    return baseResult("Unverifiable", chain.error, {
      hiddenId,
      exactFingerprint,
      lookalikeFingerprint,
      lines: chain.lines,
    });
  }

  // Dual Maker claim on the same pixels: another Maker line with same exact fingerprint.
  if (row.action === "maker") {
    const { count } = await admin
      .from("picture_lines")
      .select("line_id", { count: "exact", head: true })
      .eq("action", "maker")
      .eq("exact_fingerprint", exactFingerprint);
    if ((count ?? 0) > 1) {
      return baseResult(
        "Unverifiable",
        "Two allowed Makers both claim they created this same picture.",
        { hiddenId, exactFingerprint, lookalikeFingerprint, lines: [] },
      );
    }
  }

  const match: CheckLine["match"] = exactMatch ? "exact" : "lookalike";
  const lines = [...chain.lines].reverse().concat(toCheckLine(row, match));
  const story = lines
    .map((line) => {
      const verb = line.action === "maker" ? "Created" : line.action === "editor" ? "Changed" : "Posted";
      const model = line.aiModel ? ` · ${line.aiModel}` : "";
      return `${verb} by ${line.companyName}${model}`;
    })
    .join(" → ");

  const makerModel = lines.find((line) => line.action === "maker")?.aiModel;
  const modelNote = makerModel ? ` Model: ${makerModel}.` : "";

  const reason =
    lines.length > 1
      ? exactMatch
        ? `Full story on the notebook: ${story}. The file matches the latest stamp exactly.${modelNote}`
        : `Full story on the notebook: ${story}. Exact bytes changed, but the look-alike fingerprint still matches.${modelNote}`
      : exactMatch
        ? `${row.company.name} created this picture${makerModel ? ` with ${makerModel}` : ""}, and the file still matches the notebook exactly. No later Editor or Publisher step yet.`
        : `${row.company.name} created this picture${makerModel ? ` with ${makerModel}` : ""}. Exact bytes changed, but the look-alike fingerprint still matches. No later Editor or Publisher step yet.`;

  return baseResult("Trusted", reason, {
    hiddenId: (hiddenId ?? row.hidden_id) as Hex,
    exactFingerprint,
    lookalikeFingerprint,
    lines,
  });
}

function isLineAfterRevoke(row: NormalizedLine) {
  if (row.company.allowed !== false || !row.company.revoked_at) return false;
  return new Date(row.created_at).getTime() >= new Date(row.company.revoked_at).getTime();
}

async function findLine(
  admin: ReturnType<typeof createAdminClient>,
  keys: { hiddenId: Hex | null; exactFingerprint: Hex; lookalikeFingerprint: Hex },
): Promise<NormalizedLine | null | "ambiguous"> {
  if (keys.hiddenId) {
    const { data } = await admin.from("picture_lines").select(LINE_SELECT).eq("hidden_id", keys.hiddenId).maybeSingle();
    const normalized = normalizeRow(data);
    if (normalized) return normalized;
  }

  {
    const { data, error } = await admin
      .from("picture_lines")
      .select(LINE_SELECT)
      .eq("exact_fingerprint", keys.exactFingerprint)
      .limit(2);
    if (!error && data) {
      if (data.length > 1) return "ambiguous";
      const normalized = normalizeRow(data[0]);
      if (normalized) return normalized;
    }
  }

  const { data: lookalikes, error } = await admin
    .from("picture_lines")
    .select(LINE_SELECT)
    .eq("lookalike_fingerprint", keys.lookalikeFingerprint)
    .limit(2);

  if (error) return null;
  if (!lookalikes || lookalikes.length === 0) return null;
  if (lookalikes.length > 1) return "ambiguous";
  return normalizeRow(lookalikes[0]);
}

function normalizeRow(data: unknown): NormalizedLine | null {
  if (!data || typeof data !== "object") return null;
  const row = data as LineRow;
  const company = Array.isArray(row.companies) ? row.companies[0] : row.companies;
  if (!company?.name || !company.category || !company.stamp_address) return null;
  return {
    line_id: row.line_id,
    parent_line_id: row.parent_line_id,
    action: row.action,
    exact_fingerprint: row.exact_fingerprint,
    lookalike_fingerprint: row.lookalike_fingerprint,
    hidden_id: row.hidden_id,
    chain_tx: row.chain_tx,
    created_at: row.created_at,
    ai_model: row.ai_model ?? null,
    company: {
      name: company.name,
      category: company.category,
      stamp_address: company.stamp_address,
      allowed: company.allowed ?? true,
      revoked_at: company.revoked_at ?? null,
    },
  };
}

function toCheckLine(row: NormalizedLine, match: CheckLine["match"]): CheckLine {
  return {
    lineId: row.line_id,
    action: row.action,
    companyName: row.company.name,
    category: row.company.category,
    stampAddress: row.company.stamp_address,
    parentLineId: row.parent_line_id,
    onChain: Boolean(row.chain_tx),
    match,
    aiModel: row.ai_model,
    stampedAt: row.created_at,
  };
}

async function walkParents(
  admin: ReturnType<typeof createAdminClient>,
  start: NormalizedLine,
): Promise<{ lines: CheckLine[] } | { error: string; lines: CheckLine[] }> {
  const lines: CheckLine[] = [];
  let parentId = start.parent_line_id;
  const seen = new Set<string>([start.line_id]);

  while (parentId) {
    if (seen.has(parentId)) {
      return { error: "The parent chain loops back on itself.", lines };
    }
    seen.add(parentId);

    const { data } = await admin.from("picture_lines").select(LINE_SELECT).eq("line_id", parentId).maybeSingle();
    const row = normalizeRow(data);
    if (!row) {
      return {
        error: "A line points at an earlier line that was never written.",
        lines,
      };
    }

    if (isLineAfterRevoke(row)) {
      return {
        error: `${row.company.name} was revoked when a parent line was written, so the chain is not Trusted.`,
        lines,
      };
    }

    lines.push(toCheckLine(row, "exact"));
    parentId = row.parent_line_id;
  }

  return { lines };
}

function baseResult(
  verdict: Verdict,
  reason: string,
  rest: Omit<CheckResult, "verdict" | "reason">,
): CheckResult {
  return { verdict, reason, ...rest };
}
