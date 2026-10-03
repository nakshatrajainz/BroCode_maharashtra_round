import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createPublicClient, createWalletClient, http, formatEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";

function loadEnv(path) {
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (!(key in process.env)) process.env[key] = value;
  }
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
loadEnv(join(root, ".env"));

const privateKey = process.env.LEDGER_KEEPER_PRIVATE_KEY;
if (!privateKey) {
  console.error("LEDGER_KEEPER_PRIVATE_KEY is missing in .env");
  process.exit(1);
}

const rpc = process.env.BNB_TESTNET_RPC_URL ?? "https://bsc-testnet.publicnode.com";
const account = privateKeyToAccount(privateKey);
const artifact = JSON.parse(readFileSync(join(root, "contracts", "artifacts", "Ledger.json"), "utf8"));

const publicClient = createPublicClient({
  chain: bscTestnet,
  transport: http(rpc),
});
const walletClient = createWalletClient({
  account,
  chain: bscTestnet,
  transport: http(rpc),
});

const balance = await publicClient.getBalance({ address: account.address });
console.log(`Keeper ${account.address}`);
console.log(`Balance ${formatEther(balance)} tBNB`);

if (balance === 0n) {
  console.error("\nFund this keeper on BNB testnet, then re-run:");
  console.error(`  npm run ledger:deploy`);
  console.error("Faucet: https://www.bnbchain.org/en/testnet-faucet");
  process.exit(1);
}

const hash = await walletClient.deployContract({
  abi: artifact.abi,
  bytecode: artifact.bytecode,
  args: [],
});
console.log(`Deploy tx ${hash}`);

const receipt = await publicClient.waitForTransactionReceipt({ hash });
if (!receipt.contractAddress) {
  console.error("Deploy succeeded but no contract address was returned.");
  process.exit(1);
}

console.log(`Ledger ${receipt.contractAddress}`);
console.log("Paste into .env:");
console.log(`LEDGER_CONTRACT_ADDRESS=${receipt.contractAddress}`);
