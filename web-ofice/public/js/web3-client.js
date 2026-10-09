const tokenContractAddress = "0x3C10c9025A20723C6ff2426D68BD969231d3Ea66";
const optimismSepoliaChainId = "0xaa37dc";
const tokenAbi = ["function balanceOf(address account, uint256 id) view returns (uint256)"];

function unlockWeb3() {
  const answer = prompt("¿En qué blockchain operan los smart contracts de Token258?");
  if (answer && answer.trim().toLowerCase() === "optimism") {
    const lockScreen = document.getElementById("lock-screen");
    lockScreen.style.opacity = "0";
    window.setTimeout(() => {
      lockScreen.style.display = "none";
      const gate = document.getElementById("web3-gate");
      gate.classList.replace("border-yellow-900", "border-cyan-500");
      gate.classList.replace("bg-yellow-950/10", "bg-cyan-950/20");
    }, 500);
  } else {
    window.alert("Respuesta incorrecta. Acceso denegado.");
  }
}

async function connectWeb3() {
  const button = document.getElementById("btn-connect-web3");
  const status = document.getElementById("web3-status");

  if (!window.ethereum) {
    status.textContent = "No se detectó una wallet compatible con Ethereum.";
    return;
  }

  button.disabled = true;
  button.textContent = "Conectando...";

  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    if (!accounts.length) {
      throw new Error("La wallet no devolvió una cuenta.");
    }

    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    if (chainId.toLowerCase() !== optimismSepoliaChainId) {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: optimismSepoliaChainId }],
      });
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const code = await provider.getCode(tokenContractAddress);
    button.textContent = `Conectado: ${accounts[0].slice(0, 6)}…${accounts[0].slice(-4)}`;
    button.classList.replace("bg-cyan-500", "bg-yellow-500");

    if (code === "0x") {
      status.textContent = "Wallet conectada a Optimism Sepolia. Token258 aún no está desplegado en esta red, así que no se puede consultar el saldo.";
      return;
    }

    const contract = new ethers.Contract(tokenContractAddress, tokenAbi, provider);
    const balance = await contract.balanceOf(accounts[0], 0);
    const formattedBalance = Number(ethers.formatUnits(balance, 18)).toLocaleString("es-ES", {
      maximumFractionDigits: 2,
    });

    status.textContent = `Saldo consultado en Optimism Sepolia: ${formattedBalance} ZnZ. No se envió ninguna transacción.`;
  } catch (error) {
    button.textContent = "Reintentar conexión";
    status.textContent = error.code === 4001
      ? "La conexión o el cambio de red fue rechazado en la wallet."
      : `No se pudo consultar el saldo: ${error.message}`;
  } finally {
    button.disabled = false;
  }
}
