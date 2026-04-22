// src/pages/admin/adminShared.js

export const initials = (nom, prenom) =>
  `${(prenom || "").trim()[0] || ""}${(nom || "").trim()[0] || ""}`.toUpperCase() || "U";

export const fmt = (v) => {
  if (!v) return "-";
  try {
    return new Date(v).toLocaleString();
  } catch {
    return String(v);
  }
};

export const fmtPrice = (v) => {
  if (v === null || v === undefined || v === "") return "-";
  const n = Number(v);
  if (Number.isNaN(n)) return "-";
  return `${n.toFixed(3)} TND`;
};

export const fullImageUrl = (path, version = "") => {
  if (!path) return "";

  const raw = String(path).trim();
  if (!raw) return "";

  if (raw.startsWith("data:") || raw.startsWith("blob:")) return raw;

  const appendVersion = (url) => {
    if (version === null || version === undefined || version === "") return url;
    return `${url}${url.includes("?") ? "&" : "?"}v=${encodeURIComponent(version)}`;
  };

  if (/^https?:\/\//i.test(raw)) {
    return appendVersion(raw);
  }

  const base = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080").replace(/\/+$/, "");
  const normalized = raw.replace(/\\/g, "/").trim();

  if (normalized.startsWith("/")) {
    return appendVersion(`${base}${normalized}`);
  }

  return appendVersion(`${base}/${normalized.replace(/^\/+/, "")}`);
};

export function articleImageVersion(a) {
  return [
    a?.id ?? "",
    a?.imageUrl ?? "",
    a?.imageUrl2 ?? "",
    a?.imageUrl3 ?? "",
    a?.imageUrl4 ?? "",
    a?.updatedAt ?? "",
    a?.salePrice ?? "",
    a?.saleStartAt ?? "",
    a?.saleEndAt ?? "",
    a?.recommended ?? "",
  ].join("-");
}

export function variationImageVersion(v) {
  return [
    v?.id ?? "",
    v?.imageUrl ?? "",
    v?.imageUrl2 ?? "",
    v?.imageUrl3 ?? "",
    v?.imageUrl4 ?? "",
    v?.prix ?? "",
    v?.quantiteStock ?? "",
    v?.couleurId ?? "",
    v?.tailleId ?? "",
    v?.updatedAt ?? "",
    Array.isArray(v?.imageUrls) ? v.imageUrls.join("|") : "",
    Array.isArray(v?.images) ? v.images.map((x) => x?.id ?? x?.url ?? x ?? "").join("|") : "",
  ].join("-");
}

export const toInputDateTime = (v) => {
  if (!v) return "";
  try {
    const d = new Date(v);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
};

export const isSaleActive = (a) => {
  if (!a?.salePrice || Number(a.salePrice) >= Number(a.prix || 0)) return false;
  const now = Date.now();
  const start = a.saleStartAt ? new Date(a.saleStartAt).getTime() : null;
  const end = a.saleEndAt ? new Date(a.saleEndAt).getTime() : null;
  if (start && now < start) return false;
  if (end && now > end) return false;
  return true;
};

export const salePercent = (a) => {
  if (!isSaleActive(a)) return null;
  return Math.round(((Number(a.prix) - Number(a.salePrice)) / Number(a.prix)) * 100);
};

export const emptyArticleForm = {
  nom: "",
  description: "",
  details: "",
  prix: "",
  actif: true,
  categorieId: "",
  marque: "",
  matiere: "",
  sku: "",
  salePrice: "",
  saleStartAt: "",
  saleEndAt: "",
  recommended: false,
  imageFile1: null,
  imageFile2: null,
  imageFile3: null,
  imageFile4: null,
  existingImage1: "",
  existingImage2: "",
  existingImage3: "",
  existingImage4: "",
};

export const emptyVariationForm = {
  prix: "",
  quantiteStock: "",
  couleurId: "",
  tailleId: "",
  imageFile1: null,
  imageFile2: null,
  imageFile3: null,
  imageFile4: null,
  model3dFile: null,
  existingImage1: "",
  existingImage2: "",
  existingImage3: "",
  existingImage4: "",
  existingModel3dUrl: "",
  existingModel3dName: "",
  existingModel3dType: "",
};

export const emptyCategoryForm = { nom: "", description: "" };
export const emptyColorForm = { nom: "", codeHex: "#000000" };
export const emptySizeForm = { pointure: "" };

export const ORDER_PAGE_SIZE = 7;

export const ORDER_TABS = [
  { key: "PENDING", label: "Pending" },
  { key: "SEND", label: "Send" },
  { key: "CANCELLED", label: "Cancelled" },
  { key: "CLOSED", label: "Closed" },
];

export const normalizeOrderStatus = (status) => String(status || "").trim().toUpperCase();

export function getOrderBucket(status) {
  const s = normalizeOrderStatus(status);
  if (["ANNULEE", "CANCELLED"].includes(s)) return "CANCELLED";
  if (["LIVREE", "CLOSED", "COMPLETED"].includes(s)) return "CLOSED";
  if (["CONFIRMEE", "EN_COURS", "EXPEDIEE", "SHIPPED", "SENT"].includes(s)) return "SEND";
  return "PENDING";
}

export function getOrderBadgeLabel(status) {
  const s = normalizeOrderStatus(status);
  if (s === "EN_ATTENTE") return "Pending";
  if (s === "CONFIRMEE") return "Confirmed";
  if (s === "EN_COURS") return "In process";
  if (s === "EXPEDIEE") return "Sent";
  if (s === "LIVREE") return "Closed";
  if (s === "ANNULEE") return "Cancelled";
  return status || "Pending";
}

export function getOrderBadgeClass(status) {
  const bucket = getOrderBucket(status);
  return `orderStatusBadge ${bucket.toLowerCase()}`;
}

export function normalizeRole(role) {
  return String(role || "")
    .trim()
    .toUpperCase()
    .replace(/^ROLE_/, "")
    .replace(/[\s-]+/g, "_");
}

export function isAdminRole(role) {
  const r = normalizeRole(role);
  return (
    r === "Administrateur" ||
    r === "ADMIN_GENERAL" ||
    r === "GENERAL_ADMIN" ||
    r === "GENERALE_ADMIN"
  );
}

export function isControleurRole(role) {
  const r = normalizeRole(role);
  return r === "Responsable e-commerce";
}

export function isVendeurRole(role) {
  const r = normalizeRole(role);
  return r === "Gestionnaire de catalogue" || r === "VENDERU" || r === "SELLER";
}

export function isUserRole(role) {
  return normalizeRole(role) === "USER";
}

export function canOrderRole(role) {
  return !isAdminRole(role) && !isControleurRole(role);
}

export function canAccessAdminPanel(role) {
  return isAdminRole(role) || isVendeurRole(role) || isControleurRole(role);
}

export function getStoredToken() {
  try {
    const direct = localStorage.getItem("emirio_token") || localStorage.getItem("token");
    if (direct) return direct;

    const authRaw = localStorage.getItem("auth");
    if (!authRaw) return "";

    const auth = JSON.parse(authRaw);
    return auth?.token || "";
  } catch {
    return "";
  }
}

export function getStoredRole() {
  try {
    const direct = localStorage.getItem("role");
    if (direct) return normalizeRole(direct);

    const authRaw = localStorage.getItem("auth");
    if (!authRaw) return "";

    const auth = JSON.parse(authRaw);
    return normalizeRole(
      auth?.role ??
        auth?.user?.role ??
        auth?.utilisateur?.role ??
        auth?.client?.role ??
        ""
    );
  } catch {
    return "";
  }
}
export function canAccessReclamations(role) {
  const r = normalizeRole(role);
  return r === "Administrateur" || r === "Responsable e-commerce";
}

export function persistAuth(token, role) {
  const normalizedRole = normalizeRole(role);

  if (token) {
    localStorage.setItem("emirio_token", token);
    localStorage.setItem("token", token);
  }

  if (normalizedRole) {
    localStorage.setItem("role", normalizedRole);
  } else {
    localStorage.removeItem("role");
  }

  localStorage.setItem(
    "auth",
    JSON.stringify({
      token: token || "",
      role: normalizedRole || "",
    })
  );
}

export function clearStoredAuth() {
  localStorage.removeItem("emirio_token");
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("auth");
}