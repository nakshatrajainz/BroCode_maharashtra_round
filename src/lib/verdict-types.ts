export type Verdict = "Trusted" | "Self-asserted" | "Unverifiable";

export type CheckLine = {
  lineId: string;
  action: string;
  companyName: string;
  category: string;
  stampAddress: string;
  parentLineId: string | null;
  onChain: boolean;
  match: "exact" | "lookalike" | "hidden-id";
  aiModel: string | null;
  stampedAt: string;
};

export type CheckResult = {
  verdict: Verdict;
  reason: string;
  hiddenId: string | null;
  exactFingerprint: string;
  lookalikeFingerprint: string;
  lines: CheckLine[];
};
