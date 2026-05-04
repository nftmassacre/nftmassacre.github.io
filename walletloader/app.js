const ETHPLORER_URL = "https://api.ethplorer.io/getAddressInfo";
const ETHPLORER_KEY = "freekey";
const ALCHEMY_NFT_URL = "https://eth-mainnet.g.alchemy.com/nft/v2/demo/getNFTsForOwner";
const ALCHEMY_NFT_PAGE_SIZE = 50;
const SOLANA_DEMO_WALLET = "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY";
const ETHERSCAN_ADDRESS_URL = "https://etherscan.io/address/";
const ETHERSCAN_TOKEN_URL = "https://etherscan.io/token/";
const TRUSTWALLET_ETH_LOGO = "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png";
const TRUSTWALLET_SOL_LOGO = "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png";

const SOLANA_RPC_URL = "https://solana-rpc.publicnode.com";
const SOLANA_TOKEN_LIST_URL = "https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/src/tokens/solana.tokenlist.json";
const SOLSCAN_ACCOUNT_URL = "https://solscan.io/account/";
const SOLSCAN_TOKEN_URL = "https://solscan.io/token/";
const MAGIC_EDEN_WALLET_TOKENS_URL = "https://api-mainnet.magiceden.dev/v2/wallets/";
const JINA_PROXY_PREFIX = "https://r.jina.ai/http://";
const SOLANA_METADATA_PROGRAM_ID = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
const SOLANA_TOKEN_PROGRAM_IDS = [
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
];

const walletForm = typeof document !== "undefined" ? document.getElementById("walletForm") : null;
const addressInput = typeof document !== "undefined" ? document.getElementById("addressInput") : null;
const chainIndicatorNode = typeof document !== "undefined" ? document.getElementById("chainIndicator") : null;
const statusNode = typeof document !== "undefined" ? document.getElementById("status") : null;
const summaryNode = typeof document !== "undefined" ? document.getElementById("summary") : null;
const fungibleNode = typeof document !== "undefined" ? document.getElementById("fungibleResults") : null;
const nftNode = typeof document !== "undefined" ? document.getElementById("nftResults") : null;
const fungibleCountNode = typeof document !== "undefined" ? document.getElementById("fungibleCount") : null;
const nftCountNode = typeof document !== "undefined" ? document.getElementById("nftCount") : null;

const { ethers } = typeof window !== "undefined" ? window : {};
const RENDER_BATCH_SIZE = 100;
const TEXT_DECODER = new TextDecoder();
const FETCH_TIMEOUT_MS = 30000;

const CHAIN_DETAILS = {
  ethereum: {
    key: "ethereum",
    label: "Ethereum",
    shortLabel: "ETH",
    className: "is-ethereum",
    iconSvg: `
      <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
        <path fill="#627eea" d="M12 2.35 18.4 12 12 15.78 5.6 12 12 2.35Z" />
        <path fill="#8aa2ff" d="M12 2.35V15.78L5.6 12 12 2.35Z" />
        <path fill="#3d5bd1" d="M12 16.92 18.4 13.14 12 21.65 5.6 13.14 12 16.92Z" />
        <path fill="#6f88f1" d="M12 16.92V21.65L5.6 13.14 12 16.92Z" />
      </svg>
    `.trim()
  },
  solana: {
    key: "solana",
    label: "Solana",
    shortLabel: "SOL",
    className: "is-solana",
    iconSvg: `
      <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
        <defs>
          <linearGradient id="solana-gradient" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stop-color="#00ffa3" />
            <stop offset="100%" stop-color="#dc1fff" />
          </linearGradient>
        </defs>
        <path fill="url(#solana-gradient)" d="M6.4 5.2h11.2c.56 0 .84.67.45 1.06l-1.73 1.73a1.51 1.51 0 0 1-1.07.44H4.05c-.56 0-.84-.67-.45-1.06l1.73-1.73c.28-.28.67-.46 1.07-.46Z" />
        <path fill="url(#solana-gradient)" d="M6.4 15.55h11.2c.56 0 .84.67.45 1.06l-1.73 1.73a1.51 1.51 0 0 1-1.07.44H4.05c-.56 0-.84-.67-.45-1.06l1.73-1.73c.28-.29.67-.45 1.07-.45Z" />
        <path fill="url(#solana-gradient)" d="M17.6 10.38H6.4c-.4 0-.79.16-1.07.45L3.6 12.56c-.39.39-.11 1.06.45 1.06h11.2c.4 0 .79-.16 1.07-.45l1.73-1.73c.39-.39.11-1.06-.45-1.06Z" />
      </svg>
    `.trim()
  }
};

let activeRequest = 0;
let tokenRegistryPromise = null;

function setStatus(message, isError = false) {
  if (!statusNode) {
    return;
  }
  statusNode.textContent = message;
  statusNode.style.color = isError ? "#9a2d12" : "";
}

function getChainMeta(chain) {
  return chain ? CHAIN_DETAILS[chain] || null : null;
}

function setChainIndicator(chain) {
  if (!chainIndicatorNode) {
    return;
  }

  const chainMeta = getChainMeta(chain);
  if (!chainMeta) {
    chainIndicatorNode.hidden = true;
    chainIndicatorNode.className = "chain-indicator";
    chainIndicatorNode.innerHTML = "";
    return;
  }

  chainIndicatorNode.hidden = false;
  chainIndicatorNode.className = `chain-indicator ${chainMeta.className}`;
  chainIndicatorNode.innerHTML = `
    <span class="chain-indicator__icon" aria-hidden="true">${chainMeta.iconSvg}</span>
    <span class="chain-indicator__label">${chainMeta.label}</span>
  `;
}

function shortAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatNumber(value, options = {}) {
  if (value == null || Number.isNaN(Number(value))) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", options).format(Number(value));
}

function formatUsd(value) {
  if (value == null || !Number.isFinite(Number(value))) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1 ? 2 : 6
  }).format(Number(value));
}

function truncate(text, length = 180) {
  if (!text) {
    return "";
  }
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}

function clearNode(node) {
  if (!node) {
    return;
  }
  node.innerHTML = "";
  node.classList.remove("empty-state");
}

function createSummaryItem(label, value) {
  const item = document.createElement("div");
  item.className = "summary__item";
  item.innerHTML = `
    <div class="summary__label">${label}</div>
    <div class="summary__value">${value}</div>
  `;
  return item;
}

function fallbackLogo(symbol) {
  const logo = document.createElement("div");
  logo.className = "asset-logo--fallback";
  logo.textContent = (symbol || "?").slice(0, 3);
  return logo;
}

function assetMetric(label, value) {
  return `
    <div>
      <div class="metric-label">${label}</div>
      <div class="metric-value">${value}</div>
    </div>
  `;
}

function normalizeTokenId(rawTokenId) {
  if (rawTokenId == null || rawTokenId === "") {
    return "";
  }

  try {
    return BigInt(rawTokenId).toString();
  } catch {
    return String(rawTokenId);
  }
}

function formatTokenBalance(rawBalance, decimals) {
  if (rawBalance == null || rawBalance === "") {
    return 0;
  }

  try {
    return Number(ethers.formatUnits(String(rawBalance), decimals));
  } catch {
    return Number(rawBalance) / 10 ** decimals;
  }
}

function formatSplTokenBalance(rawBalance, decimals) {
  if (rawBalance == null) {
    return 0;
  }

  const rawNumber = Number(rawBalance);
  if (Number.isFinite(rawNumber)) {
    return rawNumber / 10 ** decimals;
  }

  const rawString = String(rawBalance);
  if (!decimals) {
    return Number(rawString);
  }

  const padded = rawString.padStart(decimals + 1, "0");
  const whole = padded.slice(0, -decimals);
  const fraction = padded.slice(-decimals).replace(/0+$/, "");
  return Number(fraction ? `${whole}.${fraction}` : whole);
}

function getTokenLogoUrl(address) {
  try {
    const checksum = ethers.getAddress(address);
    return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${checksum}/logo.png`;
  } catch {
    return "";
  }
}

function normalizeAssetUrl(url) {
  if (!url) {
    return "";
  }

  const value = String(url).trim();
  if (!value) {
    return "";
  }

  if (value.startsWith("ipfs://ipfs/")) {
    return `https://ipfs.io/ipfs/${value.slice("ipfs://ipfs/".length)}`;
  }

  if (value.startsWith("ipfs://")) {
    return `https://ipfs.io/ipfs/${value.slice("ipfs://".length)}`;
  }

  if (value.startsWith("ar://")) {
    return `https://arweave.net/${value.slice("ar://".length)}`;
  }

  return value;
}

function cleanMetadataText(value) {
  return String(value || "").replace(/\0/g, "").trim();
}

function renderInBatches(container, items, renderItem, label) {
  let cursor = 0;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "load-more";

  function paintBatch() {
    const fragment = document.createDocumentFragment();
    const nextItems = items.slice(cursor, cursor + RENDER_BATCH_SIZE);

    for (const item of nextItems) {
      fragment.appendChild(renderItem(item));
    }

    container.appendChild(fragment);
    cursor += nextItems.length;

    if (cursor >= items.length) {
      button.remove();
    } else {
      button.textContent = `Show ${Math.min(RENDER_BATCH_SIZE, items.length - cursor)} More ${label}`;
      if (!button.isConnected) {
        container.appendChild(button);
      }
    }
  }

  button.addEventListener("click", paintBatch);
  paintBatch();
}

function renderFungibles(assets) {
  if (!fungibleCountNode || !fungibleNode) {
    return;
  }
  fungibleCountNode.textContent = String(assets.length);
  clearNode(fungibleNode);

  if (!assets.length) {
    fungibleNode.classList.add("empty-state");
    fungibleNode.innerHTML = "<p>No fungible assets were found for this wallet.</p>";
    return;
  }

  renderInBatches(
    fungibleNode,
    assets,
    (asset) => {
      const card = document.createElement("article");
      card.className = "asset-card";

      const logoUrl = asset.logoUrl;
      if (logoUrl) {
        const logo = document.createElement("img");
        logo.className = "asset-logo";
        logo.alt = `${asset.symbol || asset.name || "Token"} logo`;
        logo.src = logoUrl;
        logo.loading = "lazy";
        logo.onerror = () => {
          logo.replaceWith(fallbackLogo(asset.symbol || asset.name));
        };
        card.appendChild(logo);
      } else {
        card.appendChild(fallbackLogo(asset.symbol || asset.name));
      }

      const details = document.createElement("div");
      details.className = "asset-meta";
      details.innerHTML = `
        <div class="asset-title-row">
          <h3 class="asset-title">${asset.name || "Unnamed Token"}</h3>
          <span class="asset-symbol">${asset.symbol || "N/A"}</span>
        </div>
        <div class="asset-grid">
          ${asset.metrics.map((metric) => assetMetric(metric.label, metric.value)).join("")}
        </div>
        <div class="asset-links">
          <a href="${asset.explorerUrl}" target="_blank" rel="noopener">${asset.explorerLabel || "View On Explorer"}</a>
        </div>
      `;

      card.appendChild(details);
      return card;
    },
    "assets"
  );
}

function renderNfts(nfts) {
  if (!nftCountNode || !nftNode) {
    return;
  }
  nftCountNode.textContent = String(nfts.length);
  clearNode(nftNode);

  if (!nfts.length) {
    nftNode.classList.add("empty-state");
    nftNode.innerHTML = "<p>No NFTs were found for this wallet.</p>";
    return;
  }

  renderInBatches(
    nftNode,
    nfts,
    (nft) => {
      const card = document.createElement("article");
      card.className = "nft-card";

      const media = document.createElement("div");
      media.className = "nft-media";
      if (nft.previewType === "video") {
        media.innerHTML = `<video src="${nft.previewUrl}" muted playsinline controls preload="metadata"></video>`;
      } else if (nft.previewUrl) {
        media.innerHTML = `<img src="${nft.previewUrl}" alt="${nft.name || "NFT preview"}" loading="lazy">`;
      }
      card.appendChild(media);

      const meta = document.createElement("div");
      meta.className = "nft-meta";
      meta.innerHTML = `
        <div class="nft-title-row">
          <h3 class="nft-title">${nft.name || "Untitled NFT"}</h3>
          <span class="badge">${nft.tokenType || "NFT"}</span>
        </div>
        <div class="asset-grid">
          ${nft.metrics.map((metric) => assetMetric(metric.label, metric.value)).join("")}
        </div>
        ${nft.description ? `<p class="nft-description">${truncate(nft.description, 220)}</p>` : ""}
        <div class="nft-links">
          <a href="${nft.explorerUrl}" target="_blank" rel="noopener">${nft.explorerLabel || "View On Explorer"}</a>
          ${nft.imageUrl ? `<a href="${nft.imageUrl}" target="_blank" rel="noopener">Open Image</a>` : ""}
          ${nft.mediaUrl ? `<a href="${nft.mediaUrl}" target="_blank" rel="noopener" download>Download Embedded Media</a>` : ""}
          ${nft.metadataUrl ? `<a href="${nft.metadataUrl}" target="_blank" rel="noopener">Metadata</a>` : ""}
        </div>
      `;

      card.appendChild(meta);
      return card;
    },
    "NFTs"
  );
}

async function fetchJson(url, init = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(init.headers || {})
      }
    });
  } finally {
    clearTimeout(timeoutId);
  }
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }
  return response.json();
}

async function fetchJsonWithJinaFallback(url) {
  try {
    return await fetchJson(url);
  } catch (error) {
    // Magic Eden's shared wallet endpoint is useful here, but browser CORS can block it.
    // Fall back to a plain-text mirror so GitHub Pages can still load public Solana NFTs.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let proxiedResponse;
    try {
      proxiedResponse = await fetch(`${JINA_PROXY_PREFIX}${url}`, {
        signal: controller.signal,
        headers: { Accept: "text/plain" }
      });
    } finally {
      clearTimeout(timeoutId);
    }
    if (!proxiedResponse.ok) {
      throw error;
    }

    const text = await proxiedResponse.text();
    const marker = "Markdown Content:\n";
    const markerIndex = text.indexOf(marker);
    let payload = markerIndex >= 0 ? text.slice(markerIndex + marker.length).trim() : text.trim();
    if (payload.startsWith("```")) {
      payload = payload.replace(/^```[a-z]*\\n?/i, "").replace(/```$/, "").trim();
    }
    return JSON.parse(payload);
  }
}

async function fetchSolanaRpc(method, params) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(SOLANA_RPC_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: `${method}-${Date.now()}`,
        method,
        params
      })
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`Solana RPC request failed with ${response.status}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message || `${method} failed`);
  }
  return data.result;
}

function normalizeEthereumAddress(rawAddress) {
  if (!ethers) {
    return null;
  }

  try {
    return ethers.getAddress(rawAddress.trim());
  } catch {
    return null;
  }
}

function normalizeSolanaAddress(rawAddress) {
  if (typeof window === "undefined" || !window.solanaWeb3?.PublicKey) {
    return null;
  }

  try {
    return new window.solanaWeb3.PublicKey(rawAddress.trim()).toBase58();
  } catch {
    return null;
  }
}

function detectWalletChain(rawAddress) {
  const value = String(rawAddress || "").trim();
  if (!value) {
    return null;
  }

  const ethereumAddress = normalizeEthereumAddress(value);
  if (ethereumAddress) {
    return {
      chain: "ethereum",
      address: ethereumAddress
    };
  }

  const solanaAddress = normalizeSolanaAddress(value);
  if (solanaAddress) {
    return {
      chain: "solana",
      address: solanaAddress
    };
  }

  return null;
}

function looksLikeLegacyCollectible(token) {
  const info = token.tokenInfo || {};
  const decimals = Number(info.decimals || 0);
  const rawBalance = Number(token.rawBalance ?? token.balance ?? 0);
  const totalSupply = Number(info.totalSupply || 0);
  const hasPrice = Number.isFinite(Number(info.price?.rate));

  return (
    Boolean(info.address) &&
    Boolean(info.name || info.symbol) &&
    decimals === 0 &&
    !hasPrice &&
    Number.isInteger(rawBalance) &&
    rawBalance > 0 &&
    rawBalance <= 10000 &&
    (totalSupply === 0 || totalSupply <= 1000000)
  );
}

function normalizeLegacyCollectible(token, ownerAddress) {
  const info = token.tokenInfo || {};
  const balance = String(token.rawBalance ?? token.balance ?? "1");

  return {
    chain: "ethereum",
    contractAddress: info.address || "",
    collection: info.name || info.symbol || "Legacy Collectible",
    tokenId: "",
    tokenType: "Legacy Collectible",
    name: info.name || info.symbol || "Legacy Collectible",
    description: "This asset is being surfaced from the wallet's token balances because the upstream NFT indexer does not classify this older Ethereum collectible cleanly.",
    balance,
    previewUrl: "",
    previewType: "image",
    imageUrl: "",
    mediaUrl: "",
    metadataUrl: "",
    explorerUrl: `${ETHERSCAN_TOKEN_URL}${info.address}?a=${ownerAddress}`,
    explorerLabel: "View Contract",
    metrics: [
      { label: "Collection", value: info.name || info.symbol || "Unknown" },
      { label: "Token ID", value: "N/A" },
      { label: "Balance", value: balance },
      { label: "Contract", value: info.address ? shortAddress(info.address) : "N/A" }
    ]
  };
}

async function fetchEthereumFungibles(address) {
  const data = await fetchJson(`${ETHPLORER_URL}/${address}?apiKey=${ETHPLORER_KEY}`);
  const assets = [];
  const legacyCollectibles = [];

  const ethBalance = Number(data?.ETH?.balance || 0);
  const ethPrice = Number(data?.ETH?.price?.rate || 0);
  if (ethBalance > 0) {
    assets.push({
      chain: "ethereum",
      address: "ETH",
      name: "Ethereum",
      symbol: "ETH",
      logoUrl: TRUSTWALLET_ETH_LOGO,
      usdValue: ethBalance * ethPrice,
      explorerUrl: `${ETHERSCAN_ADDRESS_URL}${address}`,
      explorerLabel: "View On Etherscan",
      metrics: [
        { label: "Balance", value: formatNumber(ethBalance, { maximumFractionDigits: 6 }) },
        { label: "Value", value: formatUsd(ethBalance * ethPrice) },
        { label: "Price", value: formatUsd(ethPrice) },
        { label: "Asset", value: "ETH" }
      ]
    });
  }

  for (const token of data.tokens || []) {
    const info = token.tokenInfo || {};
    const decimals = Number(info.decimals || 0);
    const balance = formatTokenBalance(token.rawBalance ?? token.balance, decimals);
    const price = Number(info.price?.rate || 0);

    if (!info.address || !Number.isFinite(balance) || balance <= 0) {
      continue;
    }

    if (looksLikeLegacyCollectible(token)) {
      legacyCollectibles.push(normalizeLegacyCollectible(token, address));
      continue;
    }

    const usdValue = price ? balance * price : null;
    assets.push({
      chain: "ethereum",
      address: info.address,
      name: info.name || "Unnamed Token",
      symbol: info.symbol || "N/A",
      logoUrl: getTokenLogoUrl(info.address),
      usdValue,
      explorerUrl: `${ETHERSCAN_TOKEN_URL}${info.address}?a=${address}`,
      explorerLabel: "View On Etherscan",
      metrics: [
        { label: "Balance", value: formatNumber(balance, { maximumFractionDigits: decimals === 0 ? 0 : 6 }) },
        { label: "Value", value: price ? formatUsd(usdValue) : "Unpriced" },
        { label: "Price", value: price ? formatUsd(price) : "Unpriced" },
        { label: "Contract", value: shortAddress(info.address) }
      ]
    });
  }

  return {
    fungibles: assets.sort((a, b) => {
      const aValue = a.usdValue ?? -1;
      const bValue = b.usdValue ?? -1;
      return bValue - aValue;
    }),
    legacyCollectibles
  };
}

function normalizeEthereumNft(nft) {
  const metadata = nft.metadata || {};
  const media = Array.isArray(nft.media) ? nft.media[0] || {} : {};
  const tokenId = normalizeTokenId(nft.id?.tokenId);
  const imageUrl =
    normalizeAssetUrl(media.gateway) ||
    normalizeAssetUrl(media.thumbnail) ||
    normalizeAssetUrl(media.raw) ||
    normalizeAssetUrl(metadata.image) ||
    normalizeAssetUrl(metadata.image_url) ||
    "";
  const mediaUrl =
    normalizeAssetUrl(metadata.animation_url) ||
    normalizeAssetUrl(metadata.animation) ||
    normalizeAssetUrl(media.raw) ||
    normalizeAssetUrl(media.gateway) ||
    "";

  let previewUrl = imageUrl;
  let previewType = "image";

  if (!previewUrl && mediaUrl && (media.format || "").match(/mp4|webm|mov/i)) {
    previewUrl = mediaUrl;
    previewType = "video";
  }

  const contractAddress = nft.contract?.address || "";
  const collection = nft.contractMetadata?.openSea?.collectionName || nft.contractMetadata?.name || "";
  const balance = nft.balance || "1";

  return {
    chain: "ethereum",
    contractAddress,
    collection,
    tokenId,
    tokenType: nft.id?.tokenMetadata?.tokenType || nft.contractMetadata?.tokenType || "NFT",
    name: nft.title || metadata.name || "",
    description: nft.description || metadata.description || "",
    balance,
    previewUrl,
    previewType,
    imageUrl,
    mediaUrl,
    metadataUrl: normalizeAssetUrl(nft.tokenUri?.gateway) || normalizeAssetUrl(nft.tokenUri?.raw) || "",
    explorerUrl: `${ETHERSCAN_TOKEN_URL}${contractAddress}?a=${tokenId}`,
    explorerLabel: "View Contract",
    metrics: [
      { label: "Collection", value: collection || "Unknown" },
      { label: "Token ID", value: tokenId || "N/A" },
      { label: "Balance", value: balance },
      { label: "Contract", value: contractAddress ? shortAddress(contractAddress) : "N/A" }
    ]
  };
}

async function fetchEthereumNfts(address) {
  const collected = [];
  let pageKey = "";
  let page = 0;

  while (page < 10) {
    const url = new URL(ALCHEMY_NFT_URL);
    url.searchParams.set("owner", address);
    url.searchParams.set("pageSize", String(ALCHEMY_NFT_PAGE_SIZE));
    if (pageKey) {
      url.searchParams.set("pageKey", pageKey);
    }

    const data = await fetchJson(url.toString());
    for (const nft of data.ownedNfts || []) {
      collected.push(normalizeEthereumNft(nft));
    }

    if (!data.pageKey) {
      break;
    }

    pageKey = data.pageKey;
    page += 1;
  }

  return collected;
}

function normalizeSolanaNftFromMagicEden(token) {
  const mintAddress = token.mintAddress || "";
  const collection = cleanMetadataText(token.collectionName) || cleanMetadataText(token.collection) || "";
  const imageUrl = normalizeAssetUrl(token.image);
  const mediaUrl = normalizeAssetUrl(token.animationUrl || token.video || "");

  return {
    chain: "solana",
    contractAddress: mintAddress,
    collection,
    tokenId: "",
    tokenType: "NFT",
    name: cleanMetadataText(token.name) || shortAddress(mintAddress),
    description: "",
    balance: "1",
    previewUrl: imageUrl || mediaUrl,
    previewType: mediaUrl && !imageUrl ? "video" : "image",
    imageUrl,
    mediaUrl,
    metadataUrl: "",
    explorerUrl: `${SOLSCAN_TOKEN_URL}${mintAddress}`,
    explorerLabel: "View Mint",
    metrics: [
      { label: "Collection", value: collection || "Unknown" },
      { label: "Standard", value: "NFT" },
      { label: "Balance", value: "1" },
      { label: "Mint", value: mintAddress ? shortAddress(mintAddress) : "N/A" }
    ]
  };
}

async function fetchSolanaNfts(address) {
  const collected = [];
  const pageSize = 25;

  for (let offset = 0; offset < 200; offset += pageSize) {
    const url = `${MAGIC_EDEN_WALLET_TOKENS_URL}${address}/tokens?offset=${offset}&limit=${pageSize}`;
    let items;
    try {
      items = await fetchJsonWithJinaFallback(url);
    } catch (error) {
      if (collected.length) {
        break;
      }
      throw error;
    }
    if (!Array.isArray(items) || !items.length) {
      break;
    }

    collected.push(...items.map(normalizeSolanaNftFromMagicEden).filter((item) => item.contractAddress));
    if (items.length < pageSize) {
      break;
    }
  }

  return collected;
}

function getSolanaWeb3() {
  if (typeof window === "undefined" || !window.solanaWeb3?.PublicKey) {
    throw new Error("Solana support is not available right now.");
  }
  return window.solanaWeb3;
}

function chunkArray(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function readBorshString(bytes, state) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const length = view.getUint32(state.offset, true);
  state.offset += 4;
  const value = TEXT_DECODER.decode(bytes.slice(state.offset, state.offset + length));
  state.offset += length;
  return cleanMetadataText(value);
}

function parseMetadataAccount(base64Value) {
  if (!base64Value) {
    return null;
  }

  const binary = atob(base64Value);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const state = { offset: 0 };

  state.offset += 1; // key
  state.offset += 32; // update authority
  state.offset += 32; // mint

  const name = readBorshString(bytes, state);
  const symbol = readBorshString(bytes, state);
  const uri = normalizeAssetUrl(readBorshString(bytes, state));

  return {
    name,
    symbol,
    uri
  };
}

async function loadSolanaTokenRegistry() {
  if (!tokenRegistryPromise) {
    tokenRegistryPromise = fetchJson(SOLANA_TOKEN_LIST_URL)
      .then((data) => {
        const registry = new Map();
        for (const token of data.tokens || []) {
          registry.set(token.address, token);
        }
        return registry;
      })
      .catch(() => new Map());
  }

  return tokenRegistryPromise;
}

async function fetchSolanaBalance(address) {
  const balanceResult = await fetchSolanaRpc("getBalance", [address]);
  const lamports = Number(balanceResult?.value || 0);
  return lamports / 1_000_000_000;
}

async function fetchSolanaTokenAccounts(address) {
  const programResults = await Promise.all(
    SOLANA_TOKEN_PROGRAM_IDS.map((programId) => (
      fetchSolanaRpc("getTokenAccountsByOwner", [
        address,
        { programId },
        { encoding: "jsonParsed" }
      ]).catch(() => ({ value: [] }))
    ))
  );

  return programResults.flatMap((result, index) => (
    (result.value || []).map((entry) => {
      const info = entry.account?.data?.parsed?.info;
      const tokenAmount = info?.tokenAmount;
      if (!info?.mint || !tokenAmount?.amount) {
        return null;
      }

      return {
        mint: info.mint,
        owner: info.owner,
        programId: SOLANA_TOKEN_PROGRAM_IDS[index],
        tokenAccount: entry.pubkey,
        amountRaw: tokenAmount.amount,
        decimals: Number(tokenAmount.decimals || 0),
        uiAmountString: tokenAmount.uiAmountString || String(tokenAmount.uiAmount || 0)
      };
    }).filter(Boolean)
  ));
}

function aggregateSolanaHoldings(accounts) {
  const holdings = new Map();

  for (const account of accounts) {
    const rawAmount = BigInt(account.amountRaw || "0");
    if (rawAmount <= 0n) {
      continue;
    }

    const existing = holdings.get(account.mint);
    if (existing) {
      existing.amountRaw += rawAmount;
      existing.tokenAccounts.push(account.tokenAccount);
      continue;
    }

    holdings.set(account.mint, {
      mint: account.mint,
      decimals: account.decimals,
      amountRaw: rawAmount,
      programId: account.programId,
      tokenAccounts: [account.tokenAccount]
    });
  }

  return [...holdings.values()].map((holding) => ({
    ...holding,
    amountRawString: holding.amountRaw.toString(),
    uiAmount: formatSplTokenBalance(holding.amountRaw, holding.decimals)
  }));
}

async function fetchSolanaMetadataAccounts(mints) {
  if (!mints.length) {
    return new Map();
  }

  const { PublicKey } = getSolanaWeb3();
  const metadataProgramKey = new PublicKey(SOLANA_METADATA_PROGRAM_ID);
  const mintToMetadataAddress = new Map();

  for (const mint of mints) {
    const [metadataKey] = PublicKey.findProgramAddressSync(
      [
        new TextEncoder().encode("metadata"),
        metadataProgramKey.toBytes(),
        new PublicKey(mint).toBytes()
      ],
      metadataProgramKey
    );
    mintToMetadataAddress.set(mint, metadataKey.toBase58());
  }

  const metadataEntries = [...mintToMetadataAddress.entries()];
  const results = new Map();

  for (const chunk of chunkArray(metadataEntries, 99)) {
    const addresses = chunk.map(([, metadataAddress]) => metadataAddress);
    const accountResult = await fetchSolanaRpc("getMultipleAccounts", [addresses, { encoding: "base64" }]);
    const accounts = accountResult?.value || [];
    accounts.forEach((account, index) => {
      const mint = chunk[index][0];
      const base64Value = account?.data?.[0];
      const parsed = parseMetadataAccount(base64Value);
      if (parsed) {
        results.set(mint, parsed);
      }
    });
  }

  return results;
}

async function fetchOffChainMetadataMap(uris) {
  const uniqueUris = [...new Set(uris.map(normalizeAssetUrl).filter(Boolean))];
  const metadataMap = new Map();

  await Promise.allSettled(
    uniqueUris.map(async (uri) => {
      const data = await fetchJson(uri);
      metadataMap.set(uri, data);
    })
  );

  return metadataMap;
}

function extractSolanaMedia(metadataJson) {
  const files = Array.isArray(metadataJson?.properties?.files) ? metadataJson.properties.files : [];
  const firstImageFile = files.find((file) => String(file?.type || "").startsWith("image/"));
  const firstVideoFile = files.find((file) => String(file?.type || "").startsWith("video/"));
  const imageUrl =
    normalizeAssetUrl(metadataJson?.image) ||
    normalizeAssetUrl(metadataJson?.image_url) ||
    normalizeAssetUrl(firstImageFile?.uri) ||
    "";
  const mediaUrl =
    normalizeAssetUrl(metadataJson?.animation_url) ||
    normalizeAssetUrl(metadataJson?.animation) ||
    normalizeAssetUrl(firstVideoFile?.uri) ||
    normalizeAssetUrl(files[0]?.uri) ||
    imageUrl;

  let previewUrl = imageUrl;
  let previewType = "image";

  if (!previewUrl && mediaUrl && /\.(mp4|webm|mov)(\?|$)/i.test(mediaUrl)) {
    previewUrl = mediaUrl;
    previewType = "video";
  }

  return {
    imageUrl,
    mediaUrl,
    previewUrl,
    previewType
  };
}

function buildSolanaNft(holding, metadata, metadataJson) {
  const offChainMedia = extractSolanaMedia(metadataJson);
  const tokenType = cleanMetadataText(metadataJson?.token_standard || metadataJson?.properties?.category || "NFT") || "NFT";
  const collection =
    cleanMetadataText(metadataJson?.collection?.name) ||
    cleanMetadataText(metadataJson?.collectionName) ||
    cleanMetadataText(metadata?.symbol) ||
    "";
  const balance = formatNumber(holding.uiAmount, { maximumFractionDigits: 0 });
  const metadataUrl = normalizeAssetUrl(metadata?.uri);

  return {
    chain: "solana",
    contractAddress: holding.mint,
    collection,
    tokenId: "",
    tokenType,
    name: cleanMetadataText(metadataJson?.name) || cleanMetadataText(metadata?.name) || shortAddress(holding.mint),
    description: cleanMetadataText(metadataJson?.description),
    balance,
    previewUrl: offChainMedia.previewUrl,
    previewType: offChainMedia.previewType,
    imageUrl: offChainMedia.imageUrl,
    mediaUrl: offChainMedia.mediaUrl,
    metadataUrl,
    explorerUrl: `${SOLSCAN_TOKEN_URL}${holding.mint}`,
    explorerLabel: "View Mint",
    metrics: [
      { label: "Collection", value: collection || "Unknown" },
      { label: "Standard", value: tokenType },
      { label: "Balance", value: balance },
      { label: "Mint", value: shortAddress(holding.mint) }
    ]
  };
}

function buildSolanaFungible(holding, tokenInfo) {
  const balance = formatNumber(holding.uiAmount, { maximumFractionDigits: holding.decimals === 0 ? 0 : 6 });
  const symbol = cleanMetadataText(tokenInfo?.symbol) || shortAddress(holding.mint);
  const name = cleanMetadataText(tokenInfo?.name) || `Token ${shortAddress(holding.mint)}`;

  return {
    chain: "solana",
    address: holding.mint,
    name,
    symbol,
    logoUrl: normalizeAssetUrl(tokenInfo?.logoURI),
    usdValue: null,
    explorerUrl: `${SOLSCAN_TOKEN_URL}${holding.mint}`,
    explorerLabel: "View On Solscan",
    metrics: [
      { label: "Balance", value: balance },
      { label: "Value", value: "Unpriced" },
      { label: "Price", value: "Unpriced" },
      { label: "Mint", value: shortAddress(holding.mint) }
    ]
  };
}

async function loadSolanaWalletData(address) {
  const shouldLoadSplFungibles = typeof document === "undefined";
  const [nativeSolBalance, tokenRegistry, tokenAccounts, magicEdenNfts] = await Promise.all([
    fetchSolanaBalance(address),
    shouldLoadSplFungibles ? loadSolanaTokenRegistry() : Promise.resolve(new Map()),
    shouldLoadSplFungibles ? fetchSolanaTokenAccounts(address) : Promise.resolve([]),
    fetchSolanaNfts(address).catch(() => [])
  ]);

  const holdings = aggregateSolanaHoldings(tokenAccounts);
  let nfts = magicEdenNfts;

  if (!nfts.length && shouldLoadSplFungibles && holdings.length) {
    const candidateMints = holdings
      .filter((holding) => holding.decimals === 0 && holding.amountRaw === 1n)
      .map((holding) => holding.mint);
    const metadataMap = await fetchSolanaMetadataAccounts(candidateMints);
    const nftCandidates = holdings.filter((holding) => metadataMap.has(holding.mint) && holding.decimals === 0 && holding.amountRaw === 1n);
    const offChainMetadataMap = await fetchOffChainMetadataMap(
      nftCandidates.map((holding) => metadataMap.get(holding.mint)?.uri || "")
    );

    nfts = nftCandidates.map((holding) => {
      const metadata = metadataMap.get(holding.mint);
      const metadataJson = offChainMetadataMap.get(normalizeAssetUrl(metadata?.uri)) || null;
      return buildSolanaNft(holding, metadata, metadataJson);
    });
  }

  const nftMintSet = new Set(nfts.map((nft) => nft.contractAddress));
  const fungibles = [];

  if (nativeSolBalance > 0) {
    fungibles.push({
      chain: "solana",
      address: "SOL",
      name: "Solana",
      symbol: "SOL",
      logoUrl: TRUSTWALLET_SOL_LOGO,
      usdValue: null,
      explorerUrl: `${SOLSCAN_ACCOUNT_URL}${address}`,
      explorerLabel: "View On Solscan",
      metrics: [
        { label: "Balance", value: formatNumber(nativeSolBalance, { maximumFractionDigits: 6 }) },
        { label: "Value", value: "Unpriced" },
        { label: "Price", value: "Unpriced" },
        { label: "Asset", value: "SOL" }
      ]
    });
  }

  for (const holding of holdings) {
    if (nftMintSet.has(holding.mint)) {
      continue;
    }

    fungibles.push(buildSolanaFungible(holding, tokenRegistry.get(holding.mint)));
  }

  fungibles.sort((a, b) => {
    if (a.symbol === "SOL") {
      return -1;
    }
    if (b.symbol === "SOL") {
      return 1;
    }
    return Number((b.metrics[0] || {}).value.replace(/,/g, "")) - Number((a.metrics[0] || {}).value.replace(/,/g, ""));
  });

  return {
    address,
    chain: "solana",
    fungibles,
    nfts
  };
}

function renderSummary(address, fungibles, nfts) {
  if (!summaryNode) {
    return;
  }
  const nftMediaCount = nfts.filter((item) => item.mediaUrl).length;
  summaryNode.hidden = false;
  summaryNode.innerHTML = "";
  summaryNode.append(
    createSummaryItem("Wallet", shortAddress(address)),
    createSummaryItem("Fungible Assets", String(fungibles.length)),
    createSummaryItem("NFTs", String(nfts.length)),
    createSummaryItem("NFTs With Embedded Media", String(nftMediaCount))
  );
}

function resetResults() {
  if (!summaryNode || !fungibleNode || !nftNode || !fungibleCountNode || !nftCountNode) {
    return;
  }
  summaryNode.hidden = true;
  summaryNode.innerHTML = "";
  fungibleNode.classList.add("empty-state");
  fungibleNode.innerHTML = "<p>No fungible assets loaded yet.</p>";
  nftNode.classList.add("empty-state");
  nftNode.innerHTML = "<p>No NFTs loaded yet.</p>";
  fungibleCountNode.textContent = "0";
  nftCountNode.textContent = "0";
}

async function loadEthereumWalletData(address) {
  const [fungibleResult, fetchedNfts] = await Promise.all([
    fetchEthereumFungibles(address),
    fetchEthereumNfts(address)
  ]);

  const fungibles = fungibleResult.fungibles;
  const indexedContracts = new Set(
    fetchedNfts
      .map((item) => item.contractAddress?.toLowerCase())
      .filter(Boolean)
  );
  const legacyCollectibles = fungibleResult.legacyCollectibles.filter(
    (item) => !indexedContracts.has(item.contractAddress?.toLowerCase())
  );
  const nfts = [...fetchedNfts, ...legacyCollectibles];

  return {
    address,
    chain: "ethereum",
    fungibles,
    nfts
  };
}

async function loadWallet(rawAddress) {
  const requestId = ++activeRequest;
  resetResults();

  const detected = detectWalletChain(rawAddress);
  if (!detected) {
    setChainIndicator(null);
    setStatus("That is not a valid Ethereum or Solana address.", true);
    return;
  }

  const chainMeta = getChainMeta(detected.chain);
  const address = detected.address;
  setChainIndicator(detected.chain);

  const url = new URL(window.location.href);
  url.searchParams.set("address", address);
  window.history.replaceState({}, "", url);

  const loadingMessage = detected.chain === "solana"
    ? "Loading Solana hackathon wallet assets for game-content inspection..."
    : `Loading ${chainMeta?.label || "wallet"} fungible assets and NFTs...`;
  setStatus(loadingMessage);

  try {
    const walletData = await loadWalletData(address);

    if (requestId !== activeRequest) {
      return;
    }

    renderSummary(walletData.address, walletData.fungibles, walletData.nfts);
    renderFungibles(walletData.fungibles);
    renderNfts(walletData.nfts);
    const loadedMessage = walletData.chain === "solana"
      ? `Solana hackathon wallet ready: ${walletData.fungibles.length} fungible assets and ${walletData.nfts.length} NFTs can feed the game loop for ${shortAddress(walletData.address)}.`
      : `Loaded ${walletData.fungibles.length} fungible assets and ${walletData.nfts.length} NFTs for ${shortAddress(walletData.address)} on ${getChainMeta(walletData.chain)?.label || "that chain"}.`;
    setStatus(loadedMessage);
  } catch (error) {
    if (requestId !== activeRequest) {
      return;
    }

    resetResults();
    setStatus(`Unable to load wallet data right now: ${error.message}`, true);
  }
}

async function loadWalletData(rawAddress) {
  const detected = detectWalletChain(rawAddress);
  if (!detected) {
    throw new Error("That is not a valid Ethereum or Solana address.");
  }

  if (detected.chain === "ethereum") {
    return loadEthereumWalletData(detected.address);
  }

  return loadSolanaWalletData(detected.address);
}

export {
  detectWalletChain,
  fetchEthereumFungibles as fetchFungibles,
  fetchEthereumNfts as fetchNfts,
  getChainMeta,
  loadWalletData,
  normalizeEthereumNft as normalizeNft,
  SOLANA_DEMO_WALLET
};

if (walletForm && addressInput) {
  walletForm.addEventListener("submit", (event) => {
    event.preventDefault();
    loadWallet(addressInput.value);
  });

  const url = new URL(window.location.href);
  const presetAddress = url.searchParams.get("address") || (
    url.searchParams.get("solanademo") === "yes" ? SOLANA_DEMO_WALLET : ""
  );
  if (presetAddress) {
    addressInput.value = presetAddress;
    loadWallet(presetAddress);
  }
}
