import { ProxyAgent, fetch as undiciFetch, setGlobalDispatcher } from "undici";

declare global {
  var __imichatNetworkConfigured: boolean | undefined;
  var __imichatProxyAgent: ProxyAgent | undefined;
}

function getProxyUrl() {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || "";

  if (!proxyUrl) {
    return "";
  }

  // Vercel functions cannot reach a localhost proxy from your development machine.
  if (process.env.VERCEL && isLoopbackProxy(proxyUrl)) {
    return "";
  }

  return proxyUrl;
}

function isLoopbackProxy(proxyUrl: string) {
  try {
    const { hostname } = new URL(proxyUrl);
    return hostname === "127.0.0.1" || hostname === "localhost" || hostname === "::1";
  } catch {
    return false;
  }
}

export function configureServerNetwork() {
  if (typeof window !== "undefined") {
    return;
  }

  if (globalThis.__imichatNetworkConfigured) {
    return;
  }

  const proxyUrl = getProxyUrl();
  if (proxyUrl) {
    globalThis.__imichatProxyAgent = new ProxyAgent(proxyUrl);
    setGlobalDispatcher(globalThis.__imichatProxyAgent);
  }

  globalThis.__imichatNetworkConfigured = true;
}

export function getServerNetworkContext() {
  const proxyUrl = getProxyUrl();

  return {
    proxyUrl,
    hasProxy: proxyUrl.length > 0,
  };
}

export function getProxyFetchOptions() {
  return globalThis.__imichatProxyAgent
    ? { dispatcher: globalThis.__imichatProxyAgent }
    : {};
}

export function serverFetch(
  input: Parameters<typeof undiciFetch>[0],
  init?: Parameters<typeof undiciFetch>[1],
) {
  return undiciFetch(input, {
    ...init,
    ...getProxyFetchOptions(),
  });
}
