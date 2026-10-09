# RainSoul258 Studios

An independent artist website with a live Ethereum network panel, optional
browser-wallet connection, and an audio player for the latest track.

## Run locally

Open `index.html` in a browser, or serve this directory over HTTP:

```sh
python -m http.server 8000
```

The Ethereum block and gas data come from PublicNode's public Ethereum JSON-RPC
endpoint. The ETH/USD reference comes from Coinbase's public spot-price API.
Both refresh every 15 seconds. A compatible browser wallet is optional; wallet
connection only reads the public account and chain, and never requests a
signature or transaction.

GitHub Pages publishes the repository root directly from the
`rainsoul258studios-live-web3` branch at
<https://rainsoul258studios.github.io/Nilton258-official-website/>.
