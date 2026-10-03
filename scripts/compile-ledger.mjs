import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const solc = require("solc");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = join(root, "contracts", "Ledger.sol");
const source = readFileSync(sourcePath, "utf8");

const input = {
  language: "Solidity",
  sources: {
    "Ledger.sol": { content: source },
  },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object"],
      },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = (output.errors ?? []).filter((item) => item.severity === "error");
if (errors.length) {
  for (const error of errors) console.error(error.formattedMessage ?? error.message);
  process.exit(1);
}

const contract = output.contracts["Ledger.sol"].Ledger;
const artifactDir = join(root, "contracts", "artifacts");
mkdirSync(artifactDir, { recursive: true });

const artifact = {
  abi: contract.abi,
  bytecode: `0x${contract.evm.bytecode.object}`,
};

writeFileSync(join(artifactDir, "Ledger.json"), JSON.stringify(artifact, null, 2));
console.log("Wrote contracts/artifacts/Ledger.json");
