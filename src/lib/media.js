const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080").replace(/\/+$/, "");

export function isAbsoluteUrl(value = "") {
  return /^https?:\/\//i.test(value);
}

export function isDataUrl(value = "") {
  return value.startsWith("data:");
}

export function isModel3dPath(value = "") {
  const v = String(value || "").toLowerCase();
  return (
    v.includes("/model3d") ||
    v.endsWith(".glb") ||
    v.endsWith(".gltf") ||
    v.endsWith(".obj") ||
    v.endsWith(".fbx") ||
    v.endsWith(".stl")
  );
}

export function toSafeImageUrl(path = "", version = "") {
  if (!path) return "";
  if (isDataUrl(path)) return path;
  if (isModel3dPath(path)) return "";
  if (isAbsoluteUrl(path)) return path;

  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const suffix = version
    ? `${cleanPath.includes("?") ? "&" : "?"}v=${encodeURIComponent(version)}`
    : "";

  return `${API_BASE}${cleanPath}${suffix}`;
}