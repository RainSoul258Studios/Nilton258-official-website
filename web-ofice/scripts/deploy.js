import "dotenv/config";
import { readFile } from "node:fs/promises";
import { ContractFactory, JsonRpcProvider, Wallet } from "ethers";

const networks = {
  "optimism-sepolia": {
    chainId: 11155420n,
    rpcUrl: process.env.OP_SEPOLIA_RPC_URL || "https://sepolia.optimism.io",
  },
  optimism: {
    chainId: 10n,
    rpcUrl: process.env.OP_MAINNET_RPC_URL || "https://mainnet.optimism.io",
  },
};

async function main() {
  const networkName = process.argv[2];
  const network = networks[networkName];
  if (!network) {
    throw new Error(`Choose one of: ${Object.keys(networks).join(", ")}.`);
  }

  const initialURI = process.env.INITIAL_TOKEN_URI;
  if (
    !initialURI ||
    !/^(ipfs:\/\/|https:\/\/)/.test(initialURI) ||
    !initialURI.endsWith("/") ||
    /(CID_|PLACEHOLDER|AQUI)/i.test(initialURI)
  ) {
    throw new Error("Set INITIAL_TOKEN_URI to a real IPFS or HTTPS metadata directory URL ending in '/'.");
  }
  if (!process.env.PRIVATE_KEY) {
    throw new Error("Set PRIVATE_KEY for the explicitly selected deployment wallet.");
  }
  if (networkName === "optimism" && process.env.ENABLE_MAINNET_DEPLOY !== "true") {
    throw new Error("Mainnet deployment is disabled. Set ENABLE_MAINNET_DEPLOY=true only after verification.");
  }

  const provider = new JsonRpcProvider(network.rpcUrl, network.chainId, { staticNetwork: true });
  const connectedNetwork = await provider.getNetwork();
  if (connectedNetwork.chainId !== network.chainId) {
    throw new Error(`RPC is connected to chain ${connectedNetwork.chainId}, expected ${network.chainId}.`);
  }

  const wallet = new Wallet(process.env.PRIVATE_KEY, provider);
  const artifactPath = new URL("../artifacts/contracts/Token258.sol/Token258.json", import.meta.url);
  const artifact = JSON.parse(await readFile(artifactPath, "utf8"));
  const factory = new ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const token = await factory.deploy(initialURI);
  await token.waitForDeployment();
  console.log(`Token258 deployed to ${await token.getAddress()} on ${networkName}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});