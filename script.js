const RPC_URL = "https://ethereum.publicnode.com";
const ETH_PRICE_URL = "https://api.coinbase.com/v2/prices/ETH-USD/spot";
const REFRESH_INTERVAL = 15_000;

const blockNumberElement = document.querySelector("#block-number");
const gasPriceElement = document.querySelector("#gas-price");
const ethPriceElement = document.querySelector("#eth-price");
const networkStatus = document.querySelector("#network-status");
const networkStatusText = document.querySelector("#network-status-text");
const networkError = document.querySelector("#network-error");
const lastUpdated = document.querySelector("#last-updated");
const connectWalletButton = document.querySelector("#connect-wallet");
const walletState = document.querySelector("#wallet-state");
const walletMessage = document.querySelector("#wallet-message");
const walletAddressLink = document.querySelector("#wallet-address-link");

let refreshInProgress = false;

async function rpcRequest(method) {
  const response = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params: [] }),
  });

  if (!response.ok) {
    throw new Error(`Ethereum RPC returned HTTP ${response.status}.`);
  }

  const payload = await response.json();
  if (payload.error) {
    throw new Error(payload.error.message || "Ethereum RPC request failed.");
  }
  if (typeof payload.result !== "string") {
    throw new Error("Ethereum RPC returned an invalid response.");
  }
  return payload.result;
}

async function fetchEthPrice() {
  const response = await fetch(ETH_PRICE_URL);
  if (!response.ok) {
    throw new Error(`Price feed returned HTTP ${response.status}.`);
  }

  const payload = await response.json();
  const amount = Number(payload.data && payload.data.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Price feed returned an invalid ETH price.");
  }
  return amount;
}

function formatPrice(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function setLiveStatus(isLive) {
  networkStatus.classList.toggle("is-error", !isLive);
  networkStatusText.textContent = isLive ? "LIVE" : "RECONNECTING";
}

async function refreshNetworkData() {
  if (refreshInProgress) return;
  refreshInProgress = true;
  const errors = [];

  try {
    const [blockResult, gasResult, priceResult] = await Promise.allSettled([
      rpcRequest("eth_blockNumber"),
      rpcRequest("eth_gasPrice"),
      fetchEthPrice(),
    ]);

    if (blockResult.status === "fulfilled") {
      blockNumberElement.textContent = Number.parseInt(blockResult.value, 16).toLocaleString("en-US");
    } else {
      blockNumberElement.textContent = "Unavailable";
      errors.push(`Block data: ${blockResult.reason.message}`);
    }

    if (gasResult.status === "fulfilled") {
      const gasWei = Number(BigInt(gasResult.value));
      gasPriceElement.textContent = (gasWei / 1e9).toFixed(2);
    } else {
      gasPriceElement.textContent = "Unavailable";
      errors.push(`Gas data: ${gasResult.reason.message}`);
    }

    if (priceResult.status === "fulfilled") {
      ethPriceElement.textContent = formatPrice(priceResult.value);
    } else {
      ethPriceElement.textContent = "Unavailable";
      errors.push(`ETH price: ${priceResult.reason.message}`);
    }

    const networkIsLive = blockResult.status === "fulfilled";
    setLiveStatus(networkIsLive);
    lastUpdated.textContent = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date());
    networkError.hidden = errors.length === 0;
    networkError.textContent = errors.length > 0
      ? `${errors.join(" ")} Data refreshes automatically every 15 seconds.`
      : "";
  } catch (error) {
    setLiveStatus(false);
    networkError.hidden = false;
    networkError.textContent = `Unable to refresh network data: ${error.message}`;
  } finally {
    refreshInProgress = false;
  }
}

function shortenAddress(address) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function updateWallet(accounts, chainId) {
  const account = accounts[0];
  if (!account) {
    walletState.classList.remove("is-connected");
    walletState.lastChild.textContent = " NOT CONNECTED";
    walletMessage.textContent = "Connect a browser wallet to see your public address. This page never asks you to sign or send a transaction.";
    walletAddressLink.hidden = true;
    connectWalletButton.textContent = "Connect wallet ↗";
    connectWalletButton.disabled = false;
    return;
  }

  const address = account.toLowerCase();
  walletState.classList.add("is-connected");
  walletState.lastChild.textContent = ` ${chainId === "0x1" ? "CONNECTED · ETHEREUM" : `CONNECTED · CHAIN ${Number.parseInt(chainId, 16)}`}`;
  walletMessage.textContent = "Your public wallet address is connected. No transaction or signature has been requested.";
  walletAddressLink.href = `https://etherscan.io/address/${encodeURIComponent(address)}`;
  walletAddressLink.textContent = `${shortenAddress(account)} · VIEW ON ETHERSCAN ↗`;
  walletAddressLink.hidden = false;
  connectWalletButton.textContent = "Wallet connected ✓";
  connectWalletButton.disabled = true;
}

async function connectWallet() {
  if (!window.ethereum) {
    walletMessage.textContent = "No browser wallet was detected. Install a compatible wallet to connect; this page never asks you to sign or send a transaction.";
    return;
  }

  connectWalletButton.disabled = true;
  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    updateWallet(accounts, chainId);
  } catch (error) {
    walletMessage.textContent = error.code === 4001
      ? "Wallet connection was declined. You can connect whenever you're ready."
      : `Wallet connection failed: ${error.message}`;
    connectWalletButton.disabled = false;
  }
}

connectWalletButton.addEventListener("click", connectWallet);
refreshNetworkData();
window.setInterval(refreshNetworkData, REFRESH_INTERVAL);

if (window.ethereum) {
  Promise.all([
    window.ethereum.request({ method: "eth_accounts" }),
    window.ethereum.request({ method: "eth_chainId" }),
  ]).then(([accounts, chainId]) => updateWallet(accounts, chainId))
    .catch((error) => {
      walletMessage.textContent = `Unable to read wallet connection: ${error.message}`;
    });

  window.ethereum.on("accountsChanged", (accounts) => {
    window.ethereum.request({ method: "eth_chainId" })
      .then((chainId) => updateWallet(accounts, chainId))
      .catch((error) => {
        walletMessage.textContent = `Unable to read wallet network: ${error.message}`;
      });
  });
  window.ethereum.on("chainChanged", (chainId) => {
    window.ethereum.request({ method: "eth_accounts" })
      .then((accounts) => updateWallet(accounts, chainId))
      .catch((error) => {
        walletMessage.textContent = `Unable to read wallet accounts: ${error.message}`;
      });
  });
}
