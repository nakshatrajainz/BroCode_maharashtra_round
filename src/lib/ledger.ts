import "server-only";

import {
  createPublicClient,
  createWalletClient,
  encodeAbiParameters,
  http,
  keccak256,
  parseAbiParameters,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";
import type { CategoryId } from "@/lib/categories";
import { ledgerAbi } from "@/lib/ledger-abi";

const categoryIndex: Record<CategoryId, number> = {
  maker: 0,
  editor: 1,
  publisher: 2,
};

function rpcUrl() {
  return process.env.BNB_TESTNET_RPC_URL ?? "https://bsc-testnet.publicnode.com";
}

function contractAddress(): Address {
  const value = process.env.LEDGER_CONTRACT_ADDRESS;
  if (!value) throw new Error("LEDGER_CONTRACT_ADDRESS is missing.");
  return value as Address;
}

function keeperAccount() {
  const key = process.env.LEDGER_KEEPER_PRIVATE_KEY;
  if (!key) throw new Error("LEDGER_KEEPER_PRIVATE_KEY is missing.");
  return privateKeyToAccount(key as Hex);
}

export function ledgerConfigured() {
  return Boolean(process.env.LEDGER_CONTRACT_ADDRESS && process.env.LEDGER_KEEPER_PRIVATE_KEY);
}

export function getPublicLedgerClient() {
  return createPublicClient({
    chain: bscTestnet,
    transport: http(rpcUrl()),
  });
}

function getKeeperWallet() {
  const account = keeperAccount();
  return createWalletClient({
    account,
    chain: bscTestnet,
    transport: http(rpcUrl()),
  });
}

export async function registerCompanyOnChain(input: {
  stampAddress: string;
  name: string;
  category: CategoryId;
}) {
  const publicClient = getPublicLedgerClient();
  const wallet = getKeeperWallet();
  const address = contractAddress();

  const hash = await wallet.writeContract({
    address,
    abi: ledgerAbi,
    functionName: "registerCompany",
    args: [input.stampAddress as Address, input.name, categoryIndex[input.category]],
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function setCompanyAllowedOnChain(stampAddress: string, allowed: boolean) {
  const publicClient = getPublicLedgerClient();
  const wallet = getKeeperWallet();
  const address = contractAddress();

  const hash = await wallet.writeContract({
    address,
    abi: ledgerAbi,
    functionName: "setAllowed",
    args: [stampAddress as Address, allowed],
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function readCompanyOnChain(stampAddress: string) {
  const publicClient = getPublicLedgerClient();
  return publicClient.readContract({
    address: contractAddress(),
    abi: ledgerAbi,
    functionName: "company",
    args: [stampAddress as Address],
  });
}

export async function signLinePayload(input: {
  stampPrivateKey: Hex;
  lineId: Hex;
  parentId: Hex;
  stampAddress: Address;
  action: CategoryId;
  exactFingerprint: Hex;
  lookalikeFingerprint: Hex;
  hiddenId: Hex;
  sealedPrompt: Hex;
}) {
  const payload = keccak256(
    encodeAbiParameters(
      parseAbiParameters(
        "uint256, address, bytes32, bytes32, address, uint8, bytes32, bytes32, bytes32, bytes32",
      ),
      [
        BigInt(bscTestnet.id),
        contractAddress(),
        input.lineId,
        input.parentId,
        input.stampAddress,
        categoryIndex[input.action],
        input.exactFingerprint,
        input.lookalikeFingerprint,
        input.hiddenId,
        input.sealedPrompt,
      ],
    ),
  );

  const account = privateKeyToAccount(input.stampPrivateKey);
  return account.signMessage({ message: { raw: payload } });
}

export async function writeLineOnChain(input: {
  stampPrivateKey: Hex;
  lineId: Hex;
  parentId: Hex;
  stampAddress: Address;
  action: CategoryId;
  exactFingerprint: Hex;
  lookalikeFingerprint: Hex;
  hiddenId: Hex;
  sealedPrompt: Hex;
}) {
  const signature = await signLinePayload(input);
  const publicClient = getPublicLedgerClient();
  const wallet = getKeeperWallet();
  const address = contractAddress();

  const hash = await wallet.writeContract({
    address,
    abi: ledgerAbi,
    functionName: "writeLine",
    args: [
      input.lineId,
      input.parentId,
      input.stampAddress,
      categoryIndex[input.action],
      input.exactFingerprint,
      input.lookalikeFingerprint,
      input.hiddenId,
      input.sealedPrompt,
      signature,
    ],
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}
