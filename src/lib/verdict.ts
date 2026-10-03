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
};

type LineRow = {
  line_id: string;
  parent_line_id: string | null;
  action: string;
  exact_fingerprint: string;
  lookalike_fingerprint: string;
  hidden_id: string;
  chain_tx: string | null;
  companies: CompanyInfo | CompanyInfo[] | null;
};

type NormalizedLine = Omit<LineRow, "companies"> & { company: CompanyInfo };

const LINE_SELECT =
  "line_id, parent_line_id, action, exact_fingerprint, lookalike_fingerprint, hidden_id, chain_tx, companies(name, category, stamp_address)";

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
      "More than one notebook line matches this file’s look-alike fingerprint, so the story is unclear.",
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

  const match: CheckLine["match"] = exactMatch ? "exact" : "lookalike";
  // Oldest → newest for the story path.
  const lines = [...chain.lines].reverse().concat(toCheckLine(row, match));

  return baseResult(
    "Trusted",
    exactMatch
      ? `${row.company.name} stamped this picture, and the file still matches the notebook exactly.`
      : `${row.company.name} stamped this picture. The exact bytes changed, but the look-alike fingerprint and story still match.`,
    {
      hiddenId: (hiddenId ?? row.hidden_id) as Hex,
      exactFingerprint,
      lookalikeFingerprint,
      lines,
    },
  );
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
    const { data } = await admin
      .from("picture_lines")
      .select(LINE_SELECT)
      .eq("exact_fingerprint", keys.exactFingerprint)
      .maybeSingle();
    const normalized = normalizeRow(data);
    if (normalized) return normalized;
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
    company,
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
