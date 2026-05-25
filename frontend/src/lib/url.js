export function normalizeUrl(value) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim().replace(/\/+$/, "");

  return trimmed.replace(/\/api$/, "");
}

export function getApiBaseUrl(apiUrl, mode) {
  const normalizedApiUrl = normalizeUrl(apiUrl);

  if (mode === "development") {
    return "/api";
  }

  return normalizedApiUrl ? `${normalizedApiUrl}/api` : "/api";
}

export function getSocketBaseUrl(apiUrl, mode) {
  const normalizedApiUrl = normalizeUrl(apiUrl);

  if (mode === "development") {
    return "/";
  }

  return normalizedApiUrl || "/";
}
