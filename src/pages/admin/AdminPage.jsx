import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";
import "./admin.css";

const initials = (nom, prenom) =>
  `${(prenom || "").trim()[0] || ""}${(nom || "").trim()[0] || ""}`.toUpperCase() || "U";

const fmt = (v) => {
  if (!v) return "-";
  try {
    return new Date(v).toLocaleString();
  } catch {
    return String(v);
  }
};

const fmtPrice = (v) => {
  if (v === null || v === undefined || v === "") return "-";
  return `${Number(v).toFixed(3)} TND`;
};

const fullImageUrl = (path, version = "") => {
  if (!path) return "";
  if (path.startsWith("data:")) return path;
  if (path.startsWith("http")) return path;
  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
  return `${base}${path}${path.includes("?") ? "&" : "?"}v=${encodeURIComponent(version)}`;
};

function articleImageVersion(a) {
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

function variationImageVersion(v) {
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
  ].join("-");
}


const toInputDateTime = (v) => {
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

const isSaleActive = (a) => {
  if (!a?.salePrice || Number(a.salePrice) >= Number(a.prix || 0)) return false;
  const now = Date.now();
  const start = a.saleStartAt ? new Date(a.saleStartAt).getTime() : null;
  const end = a.saleEndAt ? new Date(a.saleEndAt).getTime() : null;
  if (start && now < start) return false;
  if (end && now > end) return false;
  return true;
};

const salePercent = (a) => {
  if (!isSaleActive(a)) return null;
  return Math.round(((Number(a.prix) - Number(a.salePrice)) / Number(a.prix)) * 100);
};

const emptyArticleForm = {
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

const emptyVariationForm = {
  prix: "",
  quantiteStock: "",
  couleurId: "",
  tailleId: "",
  imageFile1: null,
  imageFile2: null,
  imageFile3: null,
  imageFile4: null,
  existingImage1: "",
  existingImage2: "",
  existingImage3: "",
  existingImage4: "",
};
const emptyCategoryForm = { nom: "", description: "" };
const emptyColorForm = { nom: "", codeHex: "#000000" };
const emptySizeForm = { pointure: "" };

const ORDER_PAGE_SIZE = 7;
const ORDER_TABS = [
  { key: "PENDING", label: "Pending" },
  { key: "SEND", label: "Send" },
  { key: "CANCELLED", label: "Cancelled" },
  { key: "CLOSED", label: "Closed" },
];

const normalizeOrderStatus = (status) => String(status || "").trim().toUpperCase();

function getOrderBucket(status) {
  const s = normalizeOrderStatus(status);
  if (["ANNULEE", "CANCELLED"].includes(s)) return "CANCELLED";
  if (["LIVREE", "CLOSED", "COMPLETED"].includes(s)) return "CLOSED";
  if (["CONFIRMEE", "EN_COURS", "EXPEDIEE", "SHIPPED", "SENT"].includes(s)) return "SEND";
  return "PENDING";
}

function getOrderBadgeLabel(status) {
  const s = normalizeOrderStatus(status);
  if (s === "EN_ATTENTE") return "Pending";
  if (s === "CONFIRMEE") return "Confirmed";
  if (s === "EN_COURS") return "In process";
  if (s === "EXPEDIEE") return "Sent";
  if (s === "LIVREE") return "Closed";
  if (s === "ANNULEE") return "Cancelled";
  return status || "Pending";
}

function getOrderBadgeClass(status) {
  const bucket = getOrderBucket(status);
  return `orderStatusBadge ${bucket.toLowerCase()}`;
}

function normalizeRole(role) {
  return String(role || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

function isAdminRole(role) {
  const r = normalizeRole(role);
  return r === "ADMIN_GENERAL" || r === "ADMIN";
}

function isVendeurRole(role) {
  const r = normalizeRole(role);
  return r === "VENDEUR" || r === "SELLER";
}

function getStoredToken() {
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

function getStoredRole() {
  try {
    const directRole = localStorage.getItem("role");
    if (directRole) return normalizeRole(directRole);

    const authRaw = localStorage.getItem("auth");
    if (authRaw) {
      const auth = JSON.parse(authRaw);
      if (auth?.role) return normalizeRole(auth.role);
      if (auth?.user?.role) return normalizeRole(auth.user.role);
    }
  } catch {
    return "";
  }
  return "";
}

function persistAuth(token, role) {
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

function clearStoredAuth() {
  localStorage.removeItem("emirio_token");
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("auth");
}

function getReclamationTitle(item) {
  return (
    item?.objet ||
    item?.sujet ||
    item?.title ||
    item?.titre ||
    item?.subject ||
    item?.type ||
    "Reclamation"
  );
}

function getReclamationMessage(item) {
  return (
    item?.message ||
    item?.description ||
    item?.contenu ||
    item?.details ||
    item?.texte ||
    item?.body ||
    "-"
  );
}

function getReclamationStatus(item) {
  return item?.statut || item?.status || item?.etat || "PENDING";
}

function getReclamationAuthor(item) {
  return (
    item?.email ||
    item?.emailClient ||
    item?.clientEmail ||
    item?.utilisateurEmail ||
    item?.nomComplet ||
    item?.clientNom ||
    item?.nom ||
    item?.userName ||
    "-"
  );
}

function getReclamationDate(item) {
  return (
    item?.dateCreation ||
    item?.createdAt ||
    item?.date ||
    item?.created_at ||
    item?.updatedAt ||
    null
  );
}

export default function AdminPage() {
  const { t, i18n } = useTranslation();

  const [role, setRole] = useState("");
  const [roleLoading, setRoleLoading] = useState(true);

  const isAdminGeneral = useMemo(() => isAdminRole(role), [role]);
  const isVendeur = useMemo(() => isVendeurRole(role), [role]);

  const allowedSections = useMemo(() => {
    if (isAdminGeneral) return ["customers", "catalog", "dashboard", "orders"];
    if (isVendeur) return ["catalog"];
    return [];
  }, [isAdminGeneral, isVendeur]);
  const [section, setSection] = useState("catalog");

  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [catalogQ, setCatalogQ] = useState("");
  const [catalogError, setCatalogError] = useState("");
  const [busyCatalog, setBusyCatalog] = useState(false);

  const [recConfig, setRecConfig] = useState({
    strategy: "HYBRID",
    favoriteWeight: 5,
    clickWeight: 3,
    oldArticleWeight: 1,
    bestSellerWeight: 4,
    oldArticleDays: 120,
    limitCount: 12,
  });

  const [categories, setCategories] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [variations, setVariations] = useState([]);

  const [articleForm, setArticleForm] = useState(emptyArticleForm);
  const [variationForm, setVariationForm] = useState(emptyVariationForm);
  const [variationError, setVariationError] = useState("");
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [colorForm, setColorForm] = useState(emptyColorForm);
  const [sizeForm, setSizeForm] = useState(emptySizeForm);

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [busyOrderId, setBusyOrderId] = useState(null);
  const [orderQ, setOrderQ] = useState("");
  const [orderTab, setOrderTab] = useState("PENDING");
  const [orderSort, setOrderSort] = useState("newest");
  const [orderPage, setOrderPage] = useState(1);

  const [reclamations, setReclamations] = useState([]);
  const [reclamationsLoading, setReclamationsLoading] = useState(false);
  const [reclamationsError, setReclamationsError] = useState("");
  const [reclamationQ, setReclamationQ] = useState("");
  const [selectedReclamation, setSelectedReclamation] = useState(null);

  const [editingArticleId, setEditingArticleId] = useState(null);
  const [editingVariationId, setEditingVariationId] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingColorId, setEditingColorId] = useState(null);
  const [editingSizeId, setEditingSizeId] = useState(null);

  const clientDialogRef = useRef(null);
  const articleDialogRef = useRef(null);
  const variationDialogRef = useRef(null);
  const categoryDialogRef = useRef(null);
  const colorDialogRef = useRef(null);
  const sizeDialogRef = useRef(null);

  const currentLang = useMemo(() => {
    const lng =
      i18n.resolvedLanguage ||
      i18n.language ||
      localStorage.getItem("language") ||
      "en";
    if (lng.startsWith("fr")) return "fr";
    if (lng.startsWith("ar")) return "ar";
    return "en";
  }, [i18n.language, i18n.resolvedLanguage]);

  useEffect(() => {
    let mounted = true;

    async function bootstrapRole() {
      try {
        const token = getStoredToken();

        if (!token) {
          clearStoredAuth();
          if (mounted) {
            setRole("");
            setRoleLoading(false);
          }
          return;
        }

        const res = await api.get("/api/profile");
        const apiRole = normalizeRole(res?.data?.role || "");

        persistAuth(token, apiRole);

        if (mounted) {
          setRole(apiRole);
        }
      } catch {
        clearStoredAuth();
        if (mounted) {
          setRole("");
        }
      } finally {
        if (mounted) {
          setRoleLoading(false);
        }
      }
    }

    bootstrapRole();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!allowedSections.length) return;
    if (!allowedSections.includes(section)) {
      setSection(allowedSections[0]);
    }
  }, [allowedSections, section]);

  useEffect(() => {
    setOrderPage(1);
  }, [orderQ, orderTab, orderSort]);

  const colorNameById = useMemo(
    () => Object.fromEntries(colors.map((c) => [Number(c.id), c.nom])),
    [colors]
  );

  const sizeNameById = useMemo(
    () => Object.fromEntries(sizes.map((s) => [Number(s.id), s.pointure])),
    [sizes]
  );

  const groupedVariations = useMemo(() => {
    return variations.reduce((acc, v) => {
      const colorName = v.couleurNom || colorNameById[Number(v.couleurId)] || "Unknown";
      const sizeName = v.taillePointure || sizeNameById[Number(v.tailleId)] || "-";
      if (!acc[colorName]) acc[colorName] = [];
      acc[colorName].push(sizeName);
      return acc;
    }, {});
  }, [variations, colorNameById, sizeNameById]);

  const filteredCustomers = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((u) =>
      `${u.nom || ""} ${u.prenom || ""} ${u.email || ""} ${u.role || ""}`
        .toLowerCase()
        .includes(s)
    );
  }, [q, rows]);

  const filteredArticles = useMemo(() => {
    const s = catalogQ.trim().toLowerCase();
    if (!s) return articles;
    return articles.filter((a) =>
      `${a.nom || ""} ${a.description || ""} ${a.categorieNom || ""} ${a.marque || ""} ${a.sku || ""}`
        .toLowerCase()
        .includes(s)
    );
  }, [catalogQ, articles]);

  const filteredReclamations = useMemo(() => {
    const s = reclamationQ.trim().toLowerCase();
    if (!s) return reclamations;
    return reclamations.filter((r) =>
      `${getReclamationTitle(r)} ${getReclamationMessage(r)} ${getReclamationAuthor(r)} ${getReclamationStatus(r)}`
        .toLowerCase()
        .includes(s)
    );
  }, [reclamationQ, reclamations]);

  const filteredOrders = useMemo(() => {
    const qv = orderQ.trim().toLowerCase();
    let list = [...orders].filter((o) => getOrderBucket(o.statutCommande) === orderTab);

    if (qv) {
      list = list.filter((o) => {
        const customerName = `${o.prenomClient || ""} ${o.nomClient || ""}`.trim().toLowerCase();
        const ref = String(o.referenceCommande || o.id || "").toLowerCase();
        const email = String(o.emailClient || "").toLowerCase();
        const phone = String(o.telephone || "").toLowerCase();
        return (
          customerName.includes(qv) ||
          ref.includes(qv) ||
          email.includes(qv) ||
          phone.includes(qv)
        );
      });
    }

    list.sort((a, b) => {
      if (orderSort === "oldest") {
        return new Date(a.dateCommande || 0).getTime() - new Date(b.dateCommande || 0).getTime();
      }
      if (orderSort === "amount-high") {
        return Number(b.total || 0) - Number(a.total || 0);
      }
      if (orderSort === "amount-low") {
        return Number(a.total || 0) - Number(b.total || 0);
      }
      return new Date(b.dateCommande || 0).getTime() - new Date(a.dateCommande || 0).getTime();
    });

    return list;
  }, [orders, orderQ, orderTab, orderSort]);

  const totalOrderPages = Math.max(1, Math.ceil(filteredOrders.length / ORDER_PAGE_SIZE));

  const pagedOrders = useMemo(() => {
    const start = (orderPage - 1) * ORDER_PAGE_SIZE;
    return filteredOrders.slice(start, start + ORDER_PAGE_SIZE);
  }, [filteredOrders, orderPage]);

  useEffect(() => {
    if (orderPage > totalOrderPages) {
      setOrderPage(totalOrderPages);
    }
  }, [orderPage, totalOrderPages]);

  async function changeLang(lng) {
    await i18n.changeLanguage(lng);
    localStorage.setItem("language", lng);
    document.documentElement.lang = lng;
    document.documentElement.dir = i18n.dir(lng);
  }
  async function updateUserRole(id, role) {
    setError("");
    setBusyId(id);

    try {
      const res = await api.put(`/api/admin/users/${id}/role`, { role });
      setSelected(res.data);
      await loadList(false);
    } catch (e) {
      setError(e?.response?.data?.message || "Role update failed");
    } finally {
      setBusyId(null);
    }
  }

  function closeDialog(ref) {
    ref.current?.close();
  }

  async function loadOrders() {
    if (!isAdminGeneral) return;
    setOrdersError("");
    setOrdersLoading(true);
    try {
      const res = await api.get("/api/admin/orders");
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setOrdersError(e?.response?.data?.message || "Cannot load orders");
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }

  async function confirmOrder(id) {
    setBusyOrderId(id);
    setOrdersError("");
    try {
      await api.patch(`/api/admin/orders/${id}/status`, { statutCommande: "CONFIRMEE" });
      await loadOrders();
    } catch (e) {
      setOrdersError(e?.response?.data?.message || "Cannot confirm order");
    } finally {
      setBusyOrderId(null);
    }
  }

  async function cancelOrder(id) {
    setBusyOrderId(id);
    setOrdersError("");
    try {
      await api.patch(`/api/admin/orders/${id}/status`, { statutCommande: "ANNULEE" });
      await loadOrders();
    } catch (e) {
      setOrdersError(e?.response?.data?.message || "Cannot cancel order");
    } finally {
      setBusyOrderId(null);
    }
  }

  async function reviewPayment(id, accepted) {
    setBusyOrderId(id);
    setOrdersError("");
    try {
      await api.patch(`/api/admin/orders/${id}/payment-review`, {
        accepted,
        note: accepted ? "Payment accepted by admin" : "Payment rejected by admin",
      });
      await loadOrders();
    } catch (e) {
      setOrdersError(e?.response?.data?.message || "Cannot review payment");
    } finally {
      setBusyOrderId(null);
    }
  }

  async function markDelivered(id) {
    setBusyOrderId(id);
    setOrdersError("");
    try {
      await api.patch(`/api/admin/orders/${id}/delivered`);
      await loadOrders();
    } catch (e) {
      setOrdersError(e?.response?.data?.message || "Cannot mark order as delivered");
    } finally {
      setBusyOrderId(null);
    }
  }

  async function loadRecommendationConfig() {
    if (!isAdminGeneral) return;
    try {
      const res = await api.get("/api/admin/recommendation-config");
      if (res?.data) {
        setRecConfig({
          strategy: res.data.strategy || "HYBRID",
          favoriteWeight: res.data.favoriteWeight ?? 5,
          clickWeight: res.data.clickWeight ?? 3,
          oldArticleWeight: res.data.oldArticleWeight ?? 1,
          bestSellerWeight: res.data.bestSellerWeight ?? 4,
          oldArticleDays: res.data.oldArticleDays ?? 120,
          limitCount: res.data.limitCount ?? 12,
        });
      }
    } catch { }
  }

  async function saveRecommendationConfig() {
    if (!isAdminGeneral) return;
    try {
      await api.put("/api/admin/recommendation-config", recConfig);
    } catch (e) {
      setCatalogError(e?.response?.data?.message || "Save recommendation config failed");
    }
  }

  async function loadList(pickFirst = false) {
    if (!isAdminGeneral) return;
    setError("");
    try {
      const res = await api.get("/api/admin/clients");
      const list = Array.isArray(res.data) ? res.data : [];
      setRows(list);

      if (pickFirst && list.length) {
        const firstId = selected?.id ?? list[0].id;
        const d = await api.get(`/api/admin/clients/${firstId}`);
        setSelected(d.data);
      } else if (!list.length) {
        setSelected(null);
      }
    } catch (e) {
      setError(e?.response?.data?.message || "Cannot load customers");
      setRows([]);
      setSelected(null);
    }
  }

  async function selectClient(id) {
    if (!isAdminGeneral) return;
    setError("");
    try {
      const d = await api.get(`/api/admin/clients/${id}`);
      setSelected(d.data);
    } catch (e) {
      setError(e?.response?.data?.message || "Cannot load customer");
    }
  }

  async function setStatus(id, statutCompte) {
    if (!isAdminGeneral) return;
    setError("");
    setBusyId(id);
    try {
      const d = await api.put(`/api/admin/clients/${id}/status`, { statutCompte });
      setSelected(d.data);
      await loadList(false);
    } catch (e) {
      setError(e?.response?.data?.message || "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteClient(id) {
    if (!isAdminGeneral) return;
    if (!window.confirm("Delete this customer?")) return;
    setError("");
    setBusyId(id);
    try {
      await api.delete(`/api/admin/clients/${id}`);
      clientDialogRef.current?.close();
      setSelected(null);
      await loadList(true);
    } catch (e) {
      setError(e?.response?.data?.message || "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  async function loadReclamations() {
    setReclamationsError("");
    setReclamationsLoading(true);
    try {
      const res = await api.get("/api/admin/reclamations");
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.content)
          ? res.data.content
          : [];
      setReclamations(list);
      if (!selectedReclamation && list.length) setSelectedReclamation(list[0]);
      if (!list.length) setSelectedReclamation(null);
    } catch (e) {
      setReclamationsError(e?.response?.data?.message || "Cannot load reclamations");
      setReclamations([]);
      setSelectedReclamation(null);
    } finally {
      setReclamationsLoading(false);
    }
  }

  async function loadArticleDetails(id) {
    const [res, vr] = await Promise.all([
      api.get(`/api/articles/${id}`),
      api.get(`/api/admin/articles/${id}/variations`),
    ]);
    setSelectedArticle(res.data);
    setVariations(vr.data || []);
  }

  async function refreshCatalog(pickFirst = false) {
    const [a, c, co, s] = await Promise.all([
      api.get("/api/admin/articles"),
      api.get("/api/admin/categories"),
      api.get("/api/admin/colors"),
      api.get("/api/admin/sizes"),
    ]);

    const list = a.data || [];
    setArticles(list);
    setCategories(c.data || []);
    setColors(co.data || []);
    setSizes(s.data || []);

    if (!list.length) {
      setSelectedArticle(null);
      setVariations([]);
      return;
    }

    if (pickFirst) {
      await loadArticleDetails(list[0].id);
      return;
    }

    const stillExists = selectedArticle && list.some((x) => x.id === selectedArticle.id);
    if (stillExists) {
      await loadArticleDetails(selectedArticle.id);
    } else {
      await loadArticleDetails(list[0].id);
    }
  }

  useEffect(() => {
    refreshCatalog(true).catch((e) =>
      setCatalogError(e?.response?.data?.message || e.message || "Cannot load catalog")
    );

    loadReclamations().catch(() => { });

    if (isAdminGeneral) {
      loadList(true).catch((e) =>
        setError(e?.response?.data?.message || e.message || "Cannot load customers")
      );
      loadRecommendationConfig().catch(() => { });
      loadOrders().catch(() => { });
    } else {
      setRows([]);
      setSelected(null);
      setOrders([]);
    }
  }, [isAdminGeneral]);
  function openCreateArticle() {
    setEditingArticleId(null);
    setArticleForm({
      ...emptyArticleForm,
      imageFile1: null,
      imageFile2: null,
      imageFile3: null,
      imageFile4: null,
      existingImage1: "",
      existingImage2: "",
      existingImage3: "",
      existingImage4: "",
    });
    articleDialogRef.current?.showModal();
  }
  function openEditArticle(article = selectedArticle) {
  if (!article) return;
  setEditingArticleId(article.id);
  setArticleForm({
    nom: article.nom || "",
    description: article.description || "",
    details: article.details || "",
    prix: article.prix ?? "",
    actif: !!article.actif,
    categorieId: article.categorieId || "",
    marque: article.marque || "",
    matiere: article.matiere || "",
    sku: article.sku || "",
    salePrice: article.salePrice ?? "",
    saleStartAt: toInputDateTime(article.saleStartAt),
    saleEndAt: toInputDateTime(article.saleEndAt),
    recommended: !!article.recommended,
    imageFile1: null,
    imageFile2: null,
    imageFile3: null,
    imageFile4: null,
    existingImage1: article.imageUrl || "",
    existingImage2: article.imageUrl2 || "",
    existingImage3: article.imageUrl3 || "",
    existingImage4: article.imageUrl4 || "",
  });
  articleDialogRef.current?.showModal();
}

  async function saveArticle(e) {
    e.preventDefault();
    setBusyCatalog(true);
    setCatalogError("");

    const prix = Number(articleForm.prix);
    const salePrice = articleForm.salePrice !== "" ? Number(articleForm.salePrice) : null;

    if (!articleForm.nom.trim()) {
      setCatalogError("Article name is required.");
      setBusyCatalog(false);
      return;
    }

    if (!articleForm.categorieId) {
      setCatalogError("Category is required.");
      setBusyCatalog(false);
      return;
    }

    if (!Number.isFinite(prix) || prix <= 0) {
      setCatalogError("Price must be greater than 0.");
      setBusyCatalog(false);
      return;
    }

    if (salePrice !== null && (!Number.isFinite(salePrice) || salePrice < 0 || salePrice >= prix)) {
      setCatalogError("Sale price must be lower than the main price.");
      setBusyCatalog(false);
      return;
    }

    if (articleForm.saleStartAt && articleForm.saleEndAt) {
      const start = new Date(articleForm.saleStartAt).getTime();
      const end = new Date(articleForm.saleEndAt).getTime();
      if (end < start) {
        setCatalogError("Sale end date must be after sale start date.");
        setBusyCatalog(false);
        return;
      }
    }

    try {
      const payload = {
        nom: articleForm.nom.trim(),
        description: articleForm.description,
        details: articleForm.details,
        prix,
        actif: !!articleForm.actif,
        categorieId: Number(articleForm.categorieId),
        marque: articleForm.marque,
        matiere: articleForm.matiere,
        sku: articleForm.sku,
        salePrice,
        saleStartAt: articleForm.saleStartAt || null,
        saleEndAt: articleForm.saleEndAt || null,
        recommended: !!articleForm.recommended,
      };

      const fd = new FormData();
      fd.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));

     if (articleForm.imageFile1) fd.append("image1", articleForm.imageFile1);
if (articleForm.imageFile2) fd.append("image2", articleForm.imageFile2);
if (articleForm.imageFile3) fd.append("image3", articleForm.imageFile3);
if (articleForm.imageFile4) fd.append("image4", articleForm.imageFile4);

      if (editingArticleId) {
        await api.put(`/api/admin/articles/${editingArticleId}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/api/admin/articles", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      articleDialogRef.current?.close();
      await refreshCatalog(true);
    } catch (e2) {
      setCatalogError(e2?.response?.data?.message || "Save article failed");
    } finally {
      setBusyCatalog(false);
    }
  }

  async function deleteArticle(id) {
    if (!window.confirm("Delete this article?")) return;
    setBusyCatalog(true);
    setCatalogError("");

    try {
      await api.delete(`/api/admin/articles/${id}`);
      if (selectedArticle?.id === id) {
        setSelectedArticle(null);
        setVariations([]);
      }
      await refreshCatalog(true);
    } catch (e) {
      setCatalogError(e?.response?.data?.message || "Delete article failed");
    } finally {
      setBusyCatalog(false);
    }
  }

  function closeVariationDialog() {
    setVariationError("");
    variationDialogRef.current?.close();
  }

  function openCreateVariation() {
    if (!selectedArticle) return;
    if (!colors.length || !sizes.length) {
      setCatalogError("Create at least one color and one size before adding a variation.");
      return;
    }

    setEditingVariationId(null);
    setVariationError("");
    setVariationForm({
      prix: selectedArticle?.prix ?? "",
      quantiteStock: 0,
      couleurId: colors[0]?.id ? String(colors[0].id) : "",
      tailleId: sizes[0]?.id ? String(sizes[0].id) : "",
      imageFile1: null,
      imageFile2: null,
      imageFile3: null,
      imageFile4: null,
      existingImage1: "",
      existingImage2: "",
      existingImage3: "",
      existingImage4: "",
    });
    variationDialogRef.current?.showModal();
  }

  function openEditVariation(v) {
    setEditingVariationId(v.id);
    setVariationError("");
    setVariationForm({
      prix: v.prix ?? "",
      quantiteStock: v.quantiteStock ?? "",
      couleurId: v.couleurId ? String(v.couleurId) : "",
      tailleId: v.tailleId ? String(v.tailleId) : "",
      imageFile1: null,
      imageFile2: null,
      imageFile3: null,
      imageFile4: null,
      existingImage1: v.imageUrl || "",
      existingImage2: v.imageUrl2 || "",
      existingImage3: v.imageUrl3 || "",
      existingImage4: v.imageUrl4 || "",
    });
    variationDialogRef.current?.showModal();
  }

  async function saveVariation(e) {
    e.preventDefault();
    if (!selectedArticle) return;

    setCatalogError("");
    setVariationError("");

    if (!variationForm.couleurId || !variationForm.tailleId) {
      setVariationError("Please select a color and a size.");
      return;
    }

    const prix = Number(variationForm.prix);
    const quantiteStock = Number(variationForm.quantiteStock);
    const couleurId = Number(variationForm.couleurId);
    const tailleId = Number(variationForm.tailleId);

    if (!Number.isFinite(prix) || prix <= 0) {
      setVariationError("Price must be greater than 0.");
      return;
    }

    if (!Number.isFinite(quantiteStock) || quantiteStock < 0 || !Number.isInteger(quantiteStock)) {
      setVariationError("Stock must be a whole number equal to or greater than 0.");
      return;
    }

    const duplicateExists = variations.some(
      (v) =>
        Number(v.couleurId) === couleurId &&
        Number(v.tailleId) === tailleId &&
        Number(v.id) !== Number(editingVariationId)
    );

    if (duplicateExists) {
      setVariationError("This color size variation already exists.");
      return;
    }

    setBusyCatalog(true);

    try {
      const payload = { prix, quantiteStock, couleurId, tailleId };
      const fd = new FormData();
      fd.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));

      if (variationForm.imageFile1) fd.append("image1", variationForm.imageFile1);
      if (variationForm.imageFile2) fd.append("image2", variationForm.imageFile2);
      if (variationForm.imageFile3) fd.append("image3", variationForm.imageFile3);
      if (variationForm.imageFile4) fd.append("image4", variationForm.imageFile4);

      if (editingVariationId) {
        await api.put(`/api/admin/variations/${editingVariationId}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post(`/api/admin/articles/${selectedArticle.id}/variations`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      closeVariationDialog();
      await loadArticleDetails(selectedArticle.id);
      await refreshCatalog(false);
    } catch (e2) {
      setCatalogError(e2?.response?.data?.message || "Save variation failed");
    } finally {
      setBusyCatalog(false);
    }
  }

  async function deleteVariation(id) {
    if (!window.confirm("Delete this variation?")) return;
    setBusyCatalog(true);
    try {
      await api.delete(`/api/admin/variations/${id}`);
      if (selectedArticle?.id) await loadArticleDetails(selectedArticle.id);
    } catch (e) {
      setCatalogError(e?.response?.data?.message || "Delete variation failed");
    } finally {
      setBusyCatalog(false);
    }
  }

  function openCreateCategory() {
    setEditingCategoryId(null);
    setCategoryForm({ nom: "", description: "" });
    categoryDialogRef.current?.showModal();
  }

  function openEditCategory(c) {
    setEditingCategoryId(c.id);
    setCategoryForm({ nom: c.nom || "", description: c.description || "" });
    categoryDialogRef.current?.showModal();
  }

  async function saveCategory(e) {
    e.preventDefault();
    setBusyCatalog(true);
    setCatalogError("");

    if (!categoryForm.nom.trim()) {
      setCatalogError("Category name is required.");
      setBusyCatalog(false);
      return;
    }

    try {
      const payload = {
        nom: categoryForm.nom.trim(),
        description: categoryForm.description?.trim() || "",
      };

      if (editingCategoryId) {
        await api.put(`/api/admin/categories/${editingCategoryId}`, payload);
      } else {
        await api.post("/api/admin/categories", payload);
      }

      categoryDialogRef.current?.close();
      setCategoryForm({ nom: "", description: "" });
      await refreshCatalog(false);
    } catch (e2) {
      setCatalogError(e2?.response?.data?.message || "Save category failed");
    } finally {
      setBusyCatalog(false);
    }
  }

  async function deleteCategory(id) {
    if (!window.confirm("Delete this category?")) return;
    setBusyCatalog(true);
    try {
      await api.delete(`/api/admin/categories/${id}`);
      await refreshCatalog(false);
    } catch (e) {
      setCatalogError(e?.response?.data?.message || "Delete category failed");
    } finally {
      setBusyCatalog(false);
    }
  }

  function openCreateColor() {
    setEditingColorId(null);
    setColorForm({ nom: "", codeHex: "#000000" });
    colorDialogRef.current?.showModal();
  }

  function openEditColor(c) {
    setEditingColorId(c.id);
    setColorForm({ nom: c.nom || "", codeHex: c.codeHex || "#000000" });
    colorDialogRef.current?.showModal();
  }

  async function saveColor(e) {
    e.preventDefault();
    setBusyCatalog(true);
    setCatalogError("");

    if (!colorForm.nom.trim()) {
      setCatalogError("Color name is required.");
      setBusyCatalog(false);
      return;
    }

    try {
      const payload = {
        nom: colorForm.nom.trim(),
        codeHex: colorForm.codeHex || "#000000",
      };

      if (editingColorId) {
        await api.put(`/api/admin/colors/${editingColorId}`, payload);
      } else {
        await api.post("/api/admin/colors", payload);
      }

      colorDialogRef.current?.close();
      setColorForm({ nom: "", codeHex: "#000000" });
      await refreshCatalog(false);
    } catch (e2) {
      setCatalogError(e2?.response?.data?.message || "Save color failed");
    } finally {
      setBusyCatalog(false);
    }
  }

  async function deleteColor(id) {
    if (!window.confirm("Delete this color?")) return;
    setBusyCatalog(true);
    try {
      await api.delete(`/api/admin/colors/${id}`);
      await refreshCatalog(false);
    } catch (e) {
      setCatalogError(e?.response?.data?.message || "Delete color failed");
    } finally {
      setBusyCatalog(false);
    }
  }

  function openCreateSize() {
    setEditingSizeId(null);
    setSizeForm({ pointure: "" });
    sizeDialogRef.current?.showModal();
  }

  function openEditSize(s) {
    setEditingSizeId(s.id);
    setSizeForm({ pointure: s.pointure || "" });
    sizeDialogRef.current?.showModal();
  }

  async function saveSize(e) {
    e.preventDefault();
    setBusyCatalog(true);
    setCatalogError("");

    if (!String(sizeForm.pointure).trim()) {
      setCatalogError("Size is required.");
      setBusyCatalog(false);
      return;
    }

    try {
      const payload = { pointure: String(sizeForm.pointure).trim() };

      if (editingSizeId) {
        await api.put(`/api/admin/sizes/${editingSizeId}`, payload);
      } else {
        await api.post("/api/admin/sizes", payload);
      }

      sizeDialogRef.current?.close();
      setSizeForm({ pointure: "" });
      await refreshCatalog(false);
    } catch (e2) {
      setCatalogError(e2?.response?.data?.message || "Save size failed");
    } finally {
      setBusyCatalog(false);
    }
  }

  async function deleteSize(id) {
    if (!window.confirm("Delete this size?")) return;
    setBusyCatalog(true);
    try {
      await api.delete(`/api/admin/sizes/${id}`);
      await refreshCatalog(false);
    } catch (e) {
      setCatalogError(e?.response?.data?.message || "Delete size failed");
    } finally {
      setBusyCatalog(false);
    }
  }

  if (roleLoading) {
    return (
      <div className="adminLayout">
        <main className="adminContent">
          <div className="fadeInUp">
            <div className="admPage">
              <div className="admAlert">Loading...</div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!isAdminGeneral && !isVendeur) {
    return (
      <div className="adminLayout">
        <main className="adminContent">
          <div className="fadeInUp">
            <div className="admPage">
              <div className="admAlert">Access denied. Your role is not allowed to open this page.</div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="adminLayout">
      <aside className="adminSidebar clean">
        <div className="adminSidebarTop">
          <div className="adminBrandBlock">
            <div className="adminBrandTitle">EMIRIO</div>
            <div className="adminBrandSub">
              {isAdminGeneral ? "Admin General Panel" : "Vendeur Panel"}
            </div>
          </div>

          <div className="adminLangBox">
            <label className="adminLangLabel" htmlFor="admin-language">
              {t("admin.language") || "Language"}
            </label>

            <select
              id="admin-language"
              className="adminLangSelect"
              value={currentLang}
              onChange={(e) => changeLang(e.target.value)}
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
            </select>
          </div>
        </div>

        <div className="adminMenu onlyMenu">
          {isAdminGeneral && (
            <button
              className={`adminMenuItem ${section === "customers" ? "active" : ""}`}
              onClick={() => setSection("customers")}
            >
              Customers
            </button>
          )}

          <button
            className={`adminMenuItem ${section === "catalog" ? "active" : ""}`}
            onClick={() => setSection("catalog")}
          >
            Catalog
          </button>



          {isAdminGeneral && (
            <button
              className={`adminMenuItem ${section === "dashboard" ? "active" : ""}`}
              onClick={() => setSection("dashboard")}
            >
              Dashboard
            </button>
          )}

          {isAdminGeneral && (
            <button
              className={`adminMenuItem ${section === "orders" ? "active" : ""}`}
              onClick={() => setSection("orders")}
            >
              Orders
            </button>
          )}
        </div>
      </aside>

      <main className="adminContent">
        {section === "orders" && isAdminGeneral && (
          <div className="fadeInUp">
            <div className="admPage ordersPage">
              <div className="ordersHero">
                <div>
                  <div className="admH1">Order management</div>
                  <div className="admH2">
                    Track store orders with quick filters, thumbnails and smooth actions.
                  </div>
                </div>

                <div className="ordersHeroActions">
                  <button className="admBtn" onClick={() => loadOrders()}>
                    Refresh
                  </button>
                </div>
              </div>

              {ordersError ? <div className="admAlert">{ordersError}</div> : null}

              <div className="ordersShell">
                <div className="ordersTopBar">
                  <div className="ordersSearchBox">
                    <span className="ordersSearchIcon">⌕</span>
                    <input
                      className="ordersSearchInput"
                      value={orderQ}
                      onChange={(e) => setOrderQ(e.target.value)}
                      placeholder="Search orders"
                    />
                  </div>

                  <div className="ordersSortBox">
                    <select value={orderSort} onChange={(e) => setOrderSort(e.target.value)}>
                      <option value="newest">Sorting by: Newest</option>
                      <option value="oldest">Sorting by: Oldest</option>
                      <option value="amount-high">Sorting by: Amount high</option>
                      <option value="amount-low">Sorting by: Amount low</option>
                    </select>
                  </div>
                </div>

                <div className="ordersTabs">
                  {ORDER_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      className={`ordersTab ${orderTab === tab.key ? "active" : ""}`}
                      onClick={() => setOrderTab(tab.key)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="ordersTable">
                  <div className="ordersTableHead">
                    <div>Customer Name</div>
                    <div>NO. Order</div>
                    <div>Order Status</div>
                    <div>Order Date</div>
                    <div>Details</div>
                    <div>Total</div>
                    <div>Actions</div>
                    <div>Payment</div>
                    <div>Invoice</div>
                    <div>Signature</div>
                  </div>

                  {ordersLoading ? (
                    <div className="ordersEmpty shimmerCard">Loading orders...</div>
                  ) : !pagedOrders.length ? (
                    <div className="ordersEmpty">No orders found.</div>
                  ) : (
                    pagedOrders.map((order, index) => {
                      const customerName =
                        `${order.prenomClient || ""} ${order.nomClient || ""}`.trim() ||
                        "Unknown customer";

                      const customerSub = order.emailClient || order.telephone || order.adresse || "-";
                      const ref = order.referenceCommande || `#${order.id}`;
                      const lines = Array.isArray(order.lignes) ? order.lignes : [];
                      const thumbs = lines.slice(0, 3);
                      const moreCount = Math.max(0, lines.length - 3);
                      const normalizedStatus = normalizeOrderStatus(order.statutCommande);

                      return (
                        <div
                          key={order.id || ref}
                          className="ordersRow"
                          style={{ animationDelay: `${index * 70}ms` }}
                        >
                          <div className="ordersCustomerCell">
                            <div className="ordersAvatar">
                              {customerName
                                .split(" ")
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((p) => p[0])
                                .join("")
                                .toUpperCase() || "U"}
                            </div>

                            <div>
                              <div className="ordersCustomerName">{customerName}</div>
                              <div className="ordersCustomerSub">{customerSub}</div>
                            </div>
                          </div>

                          <div className="ordersRef">{ref}</div>

                          <div>
                            <span className={getOrderBadgeClass(order.statutCommande)}>
                              {getOrderBadgeLabel(order.statutCommande)}
                            </span>
                          </div>

                          <div className="ordersDate">{fmt(order.dateCommande)}</div>

                          <div className="ordersDetailsCell">
                            <div className="ordersThumbGroup">
                              {thumbs.map((line, i) =>
                                line.imageUrl ? (
                                  <img
                                    key={`${line.id || i}-${i}`}
                                    src={fullImageUrl(line.imageUrl)}
                                    alt={line.articleNom || line.nomProduit || "Product"}
                                    className="ordersThumb"
                                  />
                                ) : (
                                  <div
                                    key={`${line.id || i}-${i}`}
                                    className="ordersThumb fallback"
                                  >
                                    {(line.articleNom || line.nomProduit || "?")
                                      .slice(0, 1)
                                      .toUpperCase()}
                                  </div>
                                )
                              )}

                              {moreCount > 0 ? (
                                <div className="ordersMoreThumb">+{moreCount}</div>
                              ) : null}
                            </div>
                          </div>

                          <div className="ordersTotalCell">
                            <strong>{fmtPrice(order.total)}</strong>
                          </div>

                          <div className="ordersActionsCell">
                            <button
                              type="button"
                              className="admBtn mini primary"
                              onClick={() => confirmOrder(order.id)}
                              disabled={
                                busyOrderId === order.id ||
                                normalizedStatus === "CONFIRMEE" ||
                                normalizedStatus === "ANNULEE" ||
                                normalizedStatus === "LIVREE"
                              }
                            >
                              Confirm
                            </button>

                            <button
                              type="button"
                              className="admBtn mini danger"
                              onClick={() => cancelOrder(order.id)}
                              disabled={
                                busyOrderId === order.id ||
                                normalizedStatus === "ANNULEE" ||
                                normalizedStatus === "LIVREE"
                              }
                            >
                              Cancel
                            </button>

                            <button
                              type="button"
                              className="admBtn mini"
                              onClick={() => reviewPayment(order.id, true)}
                              disabled={busyOrderId === order.id || order.statutPaiement === "ACCEPTE"}
                            >
                              Accept payment
                            </button>

                            <button
                              type="button"
                              className="admBtn mini danger"
                              onClick={() => reviewPayment(order.id, false)}
                              disabled={busyOrderId === order.id || order.statutPaiement === "REFUSE"}
                            >
                              Reject payment
                            </button>

                            <button
                              type="button"
                              className="admBtn mini primary"
                              onClick={() => markDelivered(order.id)}
                              disabled={
                                busyOrderId === order.id ||
                                normalizeOrderStatus(order.statutCommande) === "LIVREE"
                              }
                            >
                              Delivered
                            </button>
                          </div>

                          <div className="ordersPaymentCell">
                            <div>
                              <strong>{order.modePaiement || "-"}</strong>
                            </div>
                            <div>{order.statutPaiement || "-"}</div>
                            <div>
                              {order.cardLast4 ? `Card **** ${order.cardLast4}` : null}
                              {order.cardLast4 &&
                                (order.d17Phone || order.d17Reference || order.bankReference)
                                ? " • "
                                : null}
                              {order.d17Phone ? `D17: ${order.d17Phone}` : null}
                              {order.d17Phone && (order.d17Reference || order.bankReference)
                                ? " • "
                                : null}
                              {order.d17Reference ? `Ref: ${order.d17Reference}` : null}
                              {order.d17Reference && order.bankReference ? " • " : null}
                              {order.bankReference ? `Bank ref: ${order.bankReference}` : null}
                            </div>
                            <small>{order.paymentInstructions || "-"}</small>
                          </div>

                          <div className="ordersInvoiceCell">
                            <div>{order.invoiceNumber || "-"}</div>
                            {order.invoiceUrl ? (
                              <a href={fullImageUrl(order.invoiceUrl)} target="_blank" rel="noreferrer">
                                Open invoice
                              </a>
                            ) : (
                              "-"
                            )}
                          </div>

                          <div className="ordersSignatureCell">
                            {order.signatureDataUrl ? (
                              <a href={order.signatureDataUrl} target="_blank" rel="noreferrer">
                                View signature
                              </a>
                            ) : (
                              "-"
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="ordersPagination">
                  <button
                    type="button"
                    className="ordersPageBtn"
                    disabled={orderPage <= 1}
                    onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalOrderPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`ordersPageBtn ${orderPage === p ? "active" : ""}`}
                      onClick={() => setOrderPage(p)}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    type="button"
                    className="ordersPageBtn"
                    disabled={orderPage >= totalOrderPages}
                    onClick={() => setOrderPage((p) => Math.min(totalOrderPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {section === "customers" && isAdminGeneral && (
          <div className="fadeInUp">
            <div className="admPage">
              <div className="admHeader">
                <div>
                  <div className="admH1">{t("admin.customers.title") || "Customers"}</div>
                  <div className="admH2">
                    {t("admin.customers.subtitle") || "Manage customer accounts"}
                  </div>
                </div>

                <div className="admHeaderRight">
                  <div className="admSearchWrap">
                    <input
                      className="admSearch"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder={t("admin.customers.searchPlaceholder") || "Search customers"}
                    />
                  </div>
                  <button
                    className="admBtn primary"
                    onClick={() => selected && clientDialogRef.current?.showModal()}
                    disabled={!selected}
                  >
                    {t("admin.common.seeProfile") || "See profile"}
                  </button>
                </div>
              </div>

              {error && <div className="admAlert">{error}</div>}

              <div className="admGrid">
                <div className="admCard">
                  <div className="admCardTop">
                    <div className="admCardTitle">
                      {filteredCustomers.length} {t("admin.common.customersCount") || "customers"}
                    </div>
                    <button className="admBtn" onClick={() => loadList(false)}>
                      {t("admin.common.refresh") || "Refresh"}
                    </button>
                  </div>

                  <div className="admTable">
                    <div className="admTr head">
                      <div>{t("admin.table.name") || "Name"}</div>
                      <div>{t("admin.table.email") || "Email"}</div>
                      <div>{t("admin.table.status") || "Status"}</div>
                      <div style={{ textAlign: "right" }}>{t("admin.table.actions") || "Actions"}</div>
                    </div>

                    {filteredCustomers.map((u) => (
                      <div
                        key={u.id}
                        className={`admTr row ${selected?.id === u.id ? "active" : ""}`}
                        onClick={() => selectClient(u.id)}
                      >
                        <div className="admNameCell">
                          <div className="admAvatar">{initials(u.nom, u.prenom)}</div>
                          <div>
                            <div className="admName">
                              {u.prenom} {u.nom}
                            </div>
                            <div className="admRole">{u.role}</div>
                          </div>
                        </div>

                        <div className="admEmail">{u.email}</div>

                        <div>
                          <span className={`admBadge ${u.statutCompte === "ACTIVE" ? "ok" : "bad"}`}>
                            {u.statutCompte}
                          </span>
                        </div>

                        <div className="admRowActions" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="admBtn mini"
                            disabled={busyId === u.id}
                            onClick={() => setStatus(u.id, "ACTIVE")}
                          >
                            {t("admin.common.enable") || "Enable"}
                          </button>

                          <button
                            className="admBtn mini"
                            disabled={busyId === u.id}
                            onClick={() => setStatus(u.id, "BLOCKED")}
                          >
                            {t("admin.common.block") || "Block"}
                          </button>

                          <button
                            className="admBtn mini danger"
                            disabled={busyId === u.id}
                            onClick={() => deleteClient(u.id)}
                          >
                            {t("admin.common.delete") || "Delete"}
                          </button>

                          <button
                            className="admBtn mini"
                            disabled={busyId === u.id}
                            onClick={() => updateUserRole(u.id, "USER")}
                          >
                            USER
                          </button>

                          <button
                            className="admBtn mini"
                            disabled={busyId === u.id}
                            onClick={() => updateUserRole(u.id, "VENDEUR")}
                          >
                            VENDEUR
                          </button>

                          <button
                            className="admBtn mini"
                            disabled={busyId === u.id}
                            onClick={() => updateUserRole(u.id, "ADMIN_GENERAL")}
                          >
                            ADMIN
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="admCard side">
                  {!selected ? (
                    <div className="admEmpty">
                      {t("admin.customers.selectClient") || "Select a customer"}
                    </div>
                  ) : (
                    <>
                      <div className="admSideTop">
                        <div className="admAvatar big">{initials(selected.nom, selected.prenom)}</div>
                        <div>
                          <div className="admSideName">
                            {selected.prenom} {selected.nom}
                          </div>
                          <div className="admSideRole">{selected.role}</div>
                        </div>
                      </div>

                      <div className="admDivider" />
                      <div className="admInfo">
                        <div className="admInfoRow">
                          <span>{t("admin.table.email") || "Email"}</span>
                          <span className="mono">{selected.email}</span>
                        </div>
                        <div className="admInfoRow">
                          <span>{t("admin.table.status") || "Status"}</span>
                          <span>{selected.statutCompte}</span>
                        </div>
                        <div className="admInfoRow">
                          <span>{t("admin.common.created") || "Created"}</span>
                          <span>{fmt(selected.dateDeCreation)}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {section === "catalog" && (
          <div className="fadeInUp">
            <div className="admPage">
              <div className="admHeader">
                <div>
                  <div className="admH1">{t("admin.catalog.title") || "Catalog"}</div>
                  <div className="admH2">
                    {t("admin.catalog.subtitle") || "Manage products, categories, colors and sizes"}
                  </div>
                </div>

                <div className="admHeaderRight">
                  <div className="admSearchWrap">
                    <input
                      className="admSearch"
                      value={catalogQ}
                      onChange={(e) => setCatalogQ(e.target.value)}
                      placeholder={t("admin.catalog.searchPlaceholder") || "Search articles"}
                    />
                  </div>
                  <button className="admBtn" onClick={() => refreshCatalog(false)}>
                    {t("admin.common.refresh") || "Refresh"}
                  </button>
                  <button className="admBtn" onClick={openCreateCategory}>
                    {t("admin.catalog.addCategory") || "Add category"}
                  </button>
                  <button className="admBtn" onClick={openCreateColor}>
                    {t("admin.catalog.addColor") || "Add color"}
                  </button>
                  <button className="admBtn" onClick={openCreateSize}>
                    {t("admin.catalog.addSize") || "Add size"}
                  </button>
                  <button className="admBtn primary" onClick={openCreateArticle}>
                    {t("admin.catalog.addArticle") || "Add article"}
                  </button>
                </div>
              </div>

              {catalogError && <div className="admAlert">{catalogError}</div>}

              <div className="admGrid">
                <div className="admCard">
                  <div className="admCardTop">
                    <div className="admCardTitle">
                      {filteredArticles.length} {t("admin.common.articlesCount") || "articles"}
                    </div>
                  </div>

                  <div className="admTable">
                    <div className="admTr head articleRow">
                      <div>{t("admin.table.article") || "Article"}</div>
                      <div>{t("admin.table.category") || "Category"}</div>
                      <div>{t("admin.table.price") || "Price"}</div>
                      <div>{t("admin.table.status") || "Status"}</div>
                      <div style={{ textAlign: "right" }}>{t("admin.table.actions") || "Actions"}</div>
                    </div>

                    {filteredArticles.map((a) => {
                      const saleLive = isSaleActive(a);

                      return (
                        <div
                          key={a.id}
                          className={`admTr row articleRow ${selectedArticle?.id === a.id ? "active" : ""}`}
                          onClick={() => loadArticleDetails(a.id).catch((e) => setCatalogError(e.message))}
                        >
                          <div className="articleCell">
                            <div className="articleThumbWrap">
                              {a.imageUrl ? (
                                <img
                                  src={fullImageUrl(a.imageUrl, articleImageVersion(a))}
                                  alt={a.nom}
                                  className="articleThumb"
                                />) : (
                                <div className="articleThumb empty">{t("admin.common.noImage") || "No image"}</div>
                              )}
                            </div>

                            <div>
                              <div className="admName">{a.nom}</div>
                              <div className="admRole">
                                #{a.id}
                                {a.recommended ? ` • ${t("admin.catalog.recommended") || "Recommended"}` : ""}
                                {saleLive ? ` • Sale -${salePercent(a)}%` : ""}
                              </div>
                            </div>
                          </div>

                          <div>{a.categorieNom}</div>

                          <div>
                            {saleLive ? `${fmtPrice(a.salePrice)} / ${fmtPrice(a.prix)}` : fmtPrice(a.prix)}
                          </div>

                          <div>
                            <span className={`admBadge ${a.actif ? "ok" : "bad"}`}>
                              {a.actif ? "ACTIVE" : "INACTIVE"}
                            </span>
                          </div>

                          <div className="admRowActions" onClick={(e) => e.stopPropagation()}>
                            <button className="admBtn mini" onClick={() => openEditArticle(a)}>
                              {t("admin.common.edit") || "Edit"}
                            </button>
                            <button className="admBtn mini danger" onClick={() => deleteArticle(a.id)}>
                              {t("admin.common.delete") || "Delete"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="admCard side">
                  {!selectedArticle ? (
                    <div className="admEmpty">{t("admin.catalog.selectArticle") || "Select an article"}</div>
                  ) : (
                    <>
                      <div className="admSideTop articleSideTop">
                        {selectedArticle.imageUrl ? (
                          <img
                            src={fullImageUrl(selectedArticle.imageUrl, articleImageVersion(selectedArticle))}
                            alt={selectedArticle.nom}
                            className="selectedArticleImage"
                          />
                        ) : (
                          <div className="selectedArticleImage empty">{t("admin.common.noImage", "No image")}</div>
                        )}

                        <div>
                          <div className="admSideName">{selectedArticle.nom}</div>
                          <div className="admSideRole">{selectedArticle.categorieNom}</div>
                        </div>
                      </div>

                      <div className="admDivider" />

                      <div className="admInfo">
                        <div className="admInfoRow">
                          <span>{t("admin.catalog.price") || "Price"}</span>
                          <span>{fmtPrice(selectedArticle.prix)}</span>
                        </div>
                        <div className="admInfoRow">
                          <span>{t("admin.catalog.salePrice") || "Sale price"}</span>
                          <span>{fmtPrice(selectedArticle.salePrice)}</span>
                        </div>
                        <div className="admInfoRow">
                          <span>{t("admin.catalog.saleStart") || "Sale start"}</span>
                          <span>{fmt(selectedArticle.saleStartAt)}</span>
                        </div>
                        <div className="admInfoRow">
                          <span>{t("admin.catalog.saleEnd") || "Sale end"}</span>
                          <span>{fmt(selectedArticle.saleEndAt)}</span>
                        </div>
                        <div className="admInfoRow">
                          <span>{t("admin.catalog.onSaleNow") || "On sale now"}</span>
                          <span>{isSaleActive(selectedArticle) ? (t("admin.common.yes") || "Yes") : (t("admin.common.no") || "No")}</span>
                        </div>
                        <div className="admInfoRow">
                          <span>{t("admin.catalog.recommended") || "Recommended"}</span>
                          <span>{selectedArticle.recommended ? (t("admin.common.yes") || "Yes") : (t("admin.common.no") || "No")}</span>
                        </div>
                        <div className="admInfoRow">
                          <span>{t("admin.catalog.brand") || "Brand"}</span>
                          <span>{selectedArticle.marque || "-"}</span>
                        </div>
                        <div className="admInfoRow">
                          <span>{t("admin.catalog.material") || "Material"}</span>
                          <span>{selectedArticle.matiere || "-"}</span>
                        </div>
                        <div className="admInfoRow">
                          <span>{t("admin.catalog.sku") || "SKU"}</span>
                          <span>{selectedArticle.sku || "-"}</span>
                        </div>
                      </div>

                      <div className="admDivider" />

                      <div className="admCardTop">
                        <div>
                          <div className="admCardTitle">{t("admin.catalog.variations") || "Variations"}</div>
                          <div className="variationHint">
                            One article can have many combinations like Black / 41, Black / 42,
                            White / 41, White / 42.
                          </div>
                        </div>

                        <button className="admBtn mini primary" onClick={openCreateVariation}>
                          {t("admin.catalog.addVariation") || "Add variation"}
                        </button>
                      </div>

                      {!!Object.keys(groupedVariations).length && (
                        <div className="variationSummary">
                          {Object.entries(groupedVariations).map(([colorName, sizeValues]) => (
                            <div key={colorName} className="variationChip">
                              <span className="variationChipTitle">{colorName}</span>
                              <span>{[...new Set(sizeValues)].join(", ")}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="admTable compact">
                        {variations.map((v) => (
                          <div key={v.id} className="admTr row varRowWithImage">
                            <div className="varMain">
                              <div className="varImageCell">
                                {v.imageUrl ? (
                                  <img
                                    src={fullImageUrl(v.imageUrl, variationImageVersion(v))}
                                    alt={`${v.couleurNom} ${v.taillePointure}`}
                                    className="articleThumb"
                                  />
                                ) : (
                                  <div className="articleThumb empty">No image</div>
                                )}
                              </div>

                              <div className="varInfo">
                                <div className="admName">
                                  {v.couleurNom} / {v.taillePointure}
                                </div>
                                <div className="admRole">Stock: {v.quantiteStock}</div>
                              </div>

                              <div className="varPrice">{fmtPrice(v.prix)}</div>
                            </div>

                            <div className="admRowActions variationActions">
                              <button
                                type="button"
                                className="admBtn mini"
                                onClick={() => openEditVariation(v)}
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="admBtn mini danger"
                                onClick={() => deleteVariation(v.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}

                        {!variations.length ? <div className="admEmpty">No variations</div> : null}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="admGrid refsGrid">
                <div className="admCard">
                  <div className="admCardTop">
                    <div className="admCardTitle">{t("admin.catalog.categories") || "Categories"}</div>
                    <button className="admBtn mini" onClick={openCreateCategory}>
                      {t("admin.catalog.addCategory") || "Add category"}
                    </button>
                  </div>

                  <div className="admTable compact">
                    {categories.map((c) => (
                      <div key={c.id} className="admTr row">
                        <div>
                          <div className="admName">{c.nom}</div>
                          <div className="admRole">{c.description || "-"}</div>
                        </div>

                        <div className="admRowActions">
                          <button className="admBtn mini" onClick={() => openEditCategory(c)}>
                            {t("admin.common.edit") || "Edit"}
                          </button>
                          <button className="admBtn mini danger" onClick={() => deleteCategory(c.id)}>
                            {t("admin.common.delete") || "Delete"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="admCard">
                  <div className="admCardTop">
                    <div className="admCardTitle">{t("admin.catalog.colors") || "Colors"}</div>
                    <button className="admBtn mini" onClick={openCreateColor}>
                      {t("admin.catalog.addColor") || "Add color"}
                    </button>
                  </div>

                  <div className="admTable compact">
                    {colors.map((c) => (
                      <div key={c.id} className="admTr row">
                        <div className="colorCell">
                          <span className="colorDot" style={{ background: c.codeHex }} />
                          <div>
                            <div className="admName">{c.nom}</div>
                            <div className="admRole">{c.codeHex}</div>
                          </div>
                        </div>

                        <div className="admRowActions">
                          <button className="admBtn mini" onClick={() => openEditColor(c)}>
                            {t("admin.common.edit") || "Edit"}
                          </button>
                          <button className="admBtn mini danger" onClick={() => deleteColor(c.id)}>
                            {t("admin.common.delete") || "Delete"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="admCard">
                  <div className="admCardTop">
                    <div className="admCardTitle">{t("admin.catalog.sizes") || "Sizes"}</div>
                    <button className="admBtn mini" onClick={openCreateSize}>
                      {t("admin.catalog.addSize") || "Add size"}
                    </button>
                  </div>

                  <div className="admTable compact">
                    {sizes.map((s) => (
                      <div key={s.id} className="admTr row">
                        <div>
                          <div className="admName">{s.pointure}</div>
                        </div>

                        <div className="admRowActions">
                          <button className="admBtn mini" onClick={() => openEditSize(s)}>
                            {t("admin.common.edit") || "Edit"}
                          </button>
                          <button className="admBtn mini danger" onClick={() => deleteSize(s.id)}>
                            {t("admin.common.delete") || "Delete"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <dialog ref={articleDialogRef} className="admDialog productDialog">
                <div className="admDialogHead">
                  <div className="admDialogTitle">
                    {editingArticleId ? "Edit article" : "Add article"}
                  </div>
                  <button
                    className="admBtn mini"
                    type="button"
                    onClick={() => articleDialogRef.current?.close()}
                  >
                    {t("admin.common.close") || "Close"}
                  </button>
                </div>

                <form className="productForm admDialogBody" onSubmit={saveArticle}>
                  <label>
                    <span>Product name</span>
                    <input
                      value={articleForm.nom}
                      onChange={(e) => setArticleForm({ ...articleForm, nom: e.target.value })}
                      required
                    />
                  </label>

                  <label>
                    <span>Category</span>
                    <select
                      value={articleForm.categorieId}
                      onChange={(e) => setArticleForm({ ...articleForm, categorieId: e.target.value })}
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nom}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Price</span>
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={articleForm.prix}
                      onChange={(e) => setArticleForm({ ...articleForm, prix: e.target.value })}
                      required
                    />
                  </label>

                  <label>
                    <span>Sale price</span>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={articleForm.salePrice}
                      onChange={(e) => setArticleForm({ ...articleForm, salePrice: e.target.value })}
                    />
                  </label>

                  <label>
                    <span>Sale start</span>
                    <input
                      type="datetime-local"
                      value={articleForm.saleStartAt}
                      onChange={(e) => setArticleForm({ ...articleForm, saleStartAt: e.target.value })}
                    />
                  </label>

                  <label>
                    <span>Sale end</span>
                    <input
                      type="datetime-local"
                      value={articleForm.saleEndAt}
                      onChange={(e) => setArticleForm({ ...articleForm, saleEndAt: e.target.value })}
                    />
                  </label>

                  <label>
                    <span>Brand</span>
                    <input
                      value={articleForm.marque}
                      onChange={(e) => setArticleForm({ ...articleForm, marque: e.target.value })}
                    />
                  </label>

                  <label>
                    <span>Material</span>
                    <input
                      value={articleForm.matiere}
                      onChange={(e) => setArticleForm({ ...articleForm, matiere: e.target.value })}
                    />
                  </label>

                  <label>
                    <span>SKU</span>
                    <input
                      value={articleForm.sku}
                      onChange={(e) => setArticleForm({ ...articleForm, sku: e.target.value })}
                    />
                  </label>

                  <label className="checkRow">
                    <input
                      type="checkbox"
                      checked={articleForm.actif}
                      onChange={(e) => setArticleForm({ ...articleForm, actif: e.target.checked })}
                    />
                    <span>Active product</span>
                  </label>

                  <label className="checkRow">
                    <input
                      type="checkbox"
                      checked={articleForm.recommended}
                      onChange={(e) => setArticleForm({ ...articleForm, recommended: e.target.checked })}
                    />
                    <span>Best choice</span>
                  </label>

                  <label className="fullCol">
                    <span>Short description</span>
                    <textarea
                      rows="4"
                      value={articleForm.description}
                      onChange={(e) => setArticleForm({ ...articleForm, description: e.target.value })}
                    />
                  </label>

                  <label className="fullCol">
                    <span>More information</span>
                    <textarea
                      rows="6"
                      value={articleForm.details}
                      onChange={(e) => setArticleForm({ ...articleForm, details: e.target.value })}
                    />
                  </label>

                 <label>
  <span>Article image 1</span>
  <input
    type="file"
    accept="image/*"
    onChange={(e) =>
      setArticleForm({
        ...articleForm,
        imageFile1: e.target.files?.[0] || null,
      })
    }
  />
</label>

<label>
  <span>Article image 2</span>
  <input
    type="file"
    accept="image/*"
    onChange={(e) =>
      setArticleForm({
        ...articleForm,
        imageFile2: e.target.files?.[0] || null,
      })
    }
  />
</label>

<label>
  <span>Article image 3</span>
  <input
    type="file"
    accept="image/*"
    onChange={(e) =>
      setArticleForm({
        ...articleForm,
        imageFile3: e.target.files?.[0] || null,
      })
    }
  />
</label>

<label>
  <span>Article image 4</span>
  <input
    type="file"
    accept="image/*"
    onChange={(e) =>
      setArticleForm({
        ...articleForm,
        imageFile4: e.target.files?.[0] || null,
      })
    }
  />
</label>

                  {(articleForm.existingImage1 ||
                    articleForm.existingImage2 ||
                    articleForm.existingImage3 ||
                    articleForm.existingImage4) && (
                      <div className="fullCol variationCurrentImages">
                        <div className="variationHelp">Current article images</div>
                        <div className="variationPreviewGrid">
                          {articleForm.existingImage1 ? (
                            <img
                              src={fullImageUrl(articleForm.existingImage1, editingArticleId || "new")}
                              alt="Article 1"
                              className="variationPreviewThumb"
                            />
                          ) : null}
                          {articleForm.existingImage2 ? (
                            <img
                              src={fullImageUrl(articleForm.existingImage2, editingArticleId || "new")}
                              alt="Article 2"
                              className="variationPreviewThumb"
                            />
                          ) : null}
                          {articleForm.existingImage3 ? (
                            <img
                              src={fullImageUrl(articleForm.existingImage3, editingArticleId || "new")}
                              alt="Article 3"
                              className="variationPreviewThumb"
                            />
                          ) : null}
                          {articleForm.existingImage4 ? (
                            <img
                              src={fullImageUrl(articleForm.existingImage4, editingArticleId || "new")}
                              alt="Article 4"
                              className="variationPreviewThumb"
                            />
                          ) : null}
                        </div>
                      </div>
                    )}

                  <div className="admDialogActions fullCol">
                    <button type="submit" className="admBtn primary" disabled={busyCatalog}>
                      {editingArticleId ? "Update article" : "Save article"}
                    </button>
                  </div>
                </form>
              </dialog>

              <dialog ref={variationDialogRef} className="admDialog productDialog">
                <div className="admDialogHead">
                  <div className="admDialogTitle">
                    {editingVariationId ? "Edit variation" : "Add variation"}
                  </div>
                  <button className="admBtn mini" type="button" onClick={closeVariationDialog}>
                    Close
                  </button>
                </div>

                <form className="productForm admDialogBody" onSubmit={saveVariation}>
                  <div className="variationHelp fullCol">
                    Create one row per combination. Example: White / 42 and Black / 42 are two
                    different variations for the same article.
                  </div>

                  {variationError ? <div className="admAlert fullCol">{variationError}</div> : null}

                  <label>
                    <span>Color</span>
                    <select
                      value={variationForm.couleurId}
                      onChange={(e) =>
                        setVariationForm({ ...variationForm, couleurId: e.target.value })
                      }
                      required
                      disabled={!colors.length}
                    >
                      <option value="">Select color</option>
                      {colors.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nom}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Size</span>
                    <select
                      value={variationForm.tailleId}
                      onChange={(e) =>
                        setVariationForm({ ...variationForm, tailleId: e.target.value })
                      }
                      required
                      disabled={!sizes.length}
                    >
                      <option value="">Select size</option>
                      {sizes.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.pointure}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Price</span>
                    <input
                      type="number"
                      min="0.001"
                      step="0.001"
                      value={variationForm.prix}
                      onChange={(e) => setVariationForm({ ...variationForm, prix: e.target.value })}
                      required
                    />
                  </label>

                  <label>
                    <span>Stock</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={variationForm.quantiteStock}
                      onChange={(e) =>
                        setVariationForm({ ...variationForm, quantiteStock: e.target.value })
                      }
                      required
                    />
                  </label>

                  <label>
                    <span>Variation image 1</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setVariationForm({
                          ...variationForm,
                          imageFile1: e.target.files?.[0] || null,
                        })
                      }
                    />
                  </label>

                  <label>
                    <span>Variation image 2</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setVariationForm({
                          ...variationForm,
                          imageFile2: e.target.files?.[0] || null,
                        })
                      }
                    />
                  </label>

                  <label>
                    <span>Variation image 3</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setVariationForm({
                          ...variationForm,
                          imageFile3: e.target.files?.[0] || null,
                        })
                      }
                    />
                  </label>

                  <label>
                    <span>Variation image 4</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setVariationForm({
                          ...variationForm,
                          imageFile4: e.target.files?.[0] || null,
                        })
                      }
                    />
                  </label>

                  {(variationForm.existingImage1 ||
                    variationForm.existingImage2 ||
                    variationForm.existingImage3 ||
                    variationForm.existingImage4) && (
                      <div className="fullCol variationCurrentImages">
                        <div className="variationHelp">Current variation images</div>
                        <div className="variationPreviewGrid">
                          {variationForm.existingImage1 ? (
                            <img
                              src={fullImageUrl(variationForm.existingImage1, editingVariationId || "new")}
                              alt="Variation 1"
                              className="variationPreviewThumb"
                            />
                          ) : null}
                          {variationForm.existingImage2 ? (
                            <img
                              src={fullImageUrl(variationForm.existingImage2, editingVariationId || "new")}
                              alt="Variation 2"
                              className="variationPreviewThumb"
                            />
                          ) : null}
                          {variationForm.existingImage3 ? (
                            <img
                              src={fullImageUrl(variationForm.existingImage3, editingVariationId || "new")}
                              alt="Variation 3"
                              className="variationPreviewThumb"
                            />
                          ) : null}
                          {variationForm.existingImage4 ? (
                            <img
                              src={fullImageUrl(variationForm.existingImage4, editingVariationId || "new")}
                              alt="Variation 4"
                              className="variationPreviewThumb"
                            />
                          ) : null}
                        </div>
                      </div>
                    )}

                  <div className="fullCol variationHelp">
                    Add images for this color / size variation here.
                  </div>

                  <div className="admDialogActions fullCol">
                    <button
                      type="submit"
                      className="admBtn primary"
                      disabled={busyCatalog || !colors.length || !sizes.length}
                    >
                      {editingVariationId ? "Update variation" : "Save variation"}
                    </button>
                  </div>
                </form>
              </dialog>

              <dialog ref={categoryDialogRef} className="admDialog productDialog">
                <div className="admDialogHead">
                  <div className="admDialogTitle">
                    {editingCategoryId ? "Edit category" : "Add category"}
                  </div>
                  <button
                    className="admBtn mini"
                    type="button"
                    onClick={() => categoryDialogRef.current?.close()}
                  >
                    Close
                  </button>
                </div>

                <form className="productForm admDialogBody" onSubmit={saveCategory}>
                  <label>
                    <span>Category name</span>
                    <input
                      value={categoryForm.nom}
                      onChange={(e) => setCategoryForm({ ...categoryForm, nom: e.target.value })}
                      required
                    />
                  </label>

                  <label className="fullCol">
                    <span>Description</span>
                    <textarea
                      rows="4"
                      value={categoryForm.description}
                      onChange={(e) =>
                        setCategoryForm({ ...categoryForm, description: e.target.value })
                      }
                    />
                  </label>

                  <div className="admDialogActions fullCol">
                    <button type="submit" className="admBtn primary" disabled={busyCatalog}>
                      {editingCategoryId ? "Update category" : "Save category"}
                    </button>
                  </div>
                </form>
              </dialog>

              <dialog ref={colorDialogRef} className="admDialog productDialog">
                <div className="admDialogHead">
                  <div className="admDialogTitle">
                    {editingColorId ? "Edit color" : "Add color"}
                  </div>
                  <button
                    className="admBtn mini"
                    type="button"
                    onClick={() => colorDialogRef.current?.close()}
                  >
                    Close
                  </button>
                </div>

                <form className="productForm admDialogBody" onSubmit={saveColor}>
                  <label>
                    <span>Color name</span>
                    <input
                      value={colorForm.nom}
                      onChange={(e) => setColorForm({ ...colorForm, nom: e.target.value })}
                      required
                    />
                  </label>

                  <label>
                    <span>Hex color</span>
                    <input
                      type="color"
                      value={colorForm.codeHex || "#000000"}
                      onChange={(e) => setColorForm({ ...colorForm, codeHex: e.target.value })}
                    />
                  </label>

                  <div className="admDialogActions fullCol">
                    <button type="submit" className="admBtn primary" disabled={busyCatalog}>
                      {editingColorId ? "Update color" : "Save color"}
                    </button>
                  </div>
                </form>
              </dialog>

              <dialog ref={sizeDialogRef} className="admDialog productDialog">
                <div className="admDialogHead">
                  <div className="admDialogTitle">{editingSizeId ? "Edit size" : "Add size"}</div>
                  <button className="admBtn mini" type="button" onClick={() => closeDialog(sizeDialogRef)}>
                    Close
                  </button>
                </div>

                <form className="productForm admDialogBody" onSubmit={saveSize}>
                  <label>
                    <span>Size</span>
                    <input
                      value={sizeForm.pointure}
                      onChange={(e) => setSizeForm({ ...sizeForm, pointure: e.target.value })}
                      required
                    />
                  </label>

                  <div className="admDialogActions fullCol">
                    <button type="submit" className="admBtn primary" disabled={busyCatalog}>
                      {editingSizeId ? "Update size" : "Save size"}
                    </button>
                  </div>
                </form>
              </dialog>
            </div>
          </div>
        )}

        {section === "reclamations" && (
          <div className="fadeInUp">
            <div className="admPage">
              <div className="admHeader">
                <div>
                  <div className="admH1">Reclamations</div>
                  <div className="admH2">Manage customer reclamations and follow their status.</div>
                </div>

                <div className="admHeaderRight">
                  <div className="admSearchWrap">
                    <input
                      className="admSearch"
                      value={reclamationQ}
                      onChange={(e) => setReclamationQ(e.target.value)}
                      placeholder="Search reclamations"
                    />
                  </div>
                  <button className="admBtn" onClick={() => loadReclamations()}>
                    Refresh
                  </button>
                </div>
              </div>

              {reclamationsError ? <div className="admAlert">{reclamationsError}</div> : null}

              <div className="admGrid">
                <div className="admCard">
                  <div className="admCardTop">
                    <div className="admCardTitle">{filteredReclamations.length} reclamations</div>
                  </div>

                  <div className="admTable">
                    <div className="admTr head">
                      <div>Title</div>
                      <div>Author</div>
                      <div>Status</div>
                      <div>Date</div>
                    </div>

                    {reclamationsLoading ? (
                      <div className="admEmpty">Loading reclamations...</div>
                    ) : !filteredReclamations.length ? (
                      <div className="admEmpty">No reclamations found.</div>
                    ) : (
                      filteredReclamations.map((r, index) => {
                        const rowId = r.id || r.reclamationId || index;
                        const selectedId =
                          selectedReclamation?.id ||
                          selectedReclamation?.reclamationId ||
                          null;

                        return (
                          <div
                            key={rowId}
                            className={`admTr row ${selectedId === rowId ? "active" : ""}`}
                            onClick={() => setSelectedReclamation(r)}
                          >
                            <div>
                              <div className="admName">{getReclamationTitle(r)}</div>
                              <div className="admRole">#{rowId}</div>
                            </div>

                            <div>{getReclamationAuthor(r)}</div>

                            <div>
                              <span className="admBadge ok">{getReclamationStatus(r)}</span>
                            </div>

                            <div>{fmt(getReclamationDate(r))}</div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="admCard side">
                  {!selectedReclamation ? (
                    <div className="admEmpty">Select a reclamation</div>
                  ) : (
                    <>
                      <div className="admSideTop">
                        <div className="admAvatar big">
                          {String(getReclamationAuthor(selectedReclamation)).slice(0, 1).toUpperCase() || "R"}
                        </div>
                        <div>
                          <div className="admSideName">{getReclamationTitle(selectedReclamation)}</div>
                          <div className="admSideRole">{getReclamationStatus(selectedReclamation)}</div>
                        </div>
                      </div>

                      <div className="admDivider" />

                      <div className="admInfo">
                        <div className="admInfoRow">
                          <span>Author</span>
                          <span>{getReclamationAuthor(selectedReclamation)}</span>
                        </div>
                        <div className="admInfoRow">
                          <span>Status</span>
                          <span>{getReclamationStatus(selectedReclamation)}</span>
                        </div>
                        <div className="admInfoRow">
                          <span>Date</span>
                          <span>{fmt(getReclamationDate(selectedReclamation))}</span>
                        </div>
                        <div className="admInfoRow">
                          <span>ID</span>
                          <span className="mono">
                            {selectedReclamation.id || selectedReclamation.reclamationId || "-"}
                          </span>
                        </div>
                      </div>

                      <div className="admDivider" />

                      <div className="admCardTitle" style={{ marginBottom: 12 }}>
                        Message
                      </div>
                      <div className="admInfo">
                        <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                          {getReclamationMessage(selectedReclamation)}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {section === "dashboard" && isAdminGeneral && (
          <div className="fadeInUp">
            <div className="admPage">
              <div className="admHeader">
                <div>
                  <div className="admH1">Dashboard</div>
                  <div className="admH2">Store overview</div>
                </div>
              </div>

              {catalogError && <div className="admAlert">{catalogError}</div>}

              <div className="admGrid dashboardTopGrid">
                <div className="admCard statCard">
                  <div className="admCardTitle">Customers</div>
                  <div className="statValue">{rows.length}</div>
                </div>

                <div className="admCard statCard">
                  <div className="admCardTitle">Articles</div>
                  <div className="statValue">{articles.length}</div>
                </div>

                <div className="admCard statCard">
                  <div className="admCardTitle">Categories</div>
                  <div className="statValue">{categories.length}</div>
                </div>

                <div className="admCard statCard">
                  <div className="admCardTitle">Recommended</div>
                  <div className="statValue">{articles.filter((a) => !!a.recommended).length}</div>
                </div>
              </div>

              <div className="admCard">
                <div className="admCardTop">
                  <div className="admCardTitle">Recommendation Settings</div>
                  <button className="admBtn primary" onClick={saveRecommendationConfig}>
                    Save
                  </button>
                </div>

                <div className="productForm admDialogBody">
                  <label>
                    <span>Strategy</span>
                    <select
                      value={recConfig.strategy}
                      onChange={(e) => setRecConfig({ ...recConfig, strategy: e.target.value })}
                    >
                      <option value="FAVORITE_CATEGORY">Favorite category</option>
                      <option value="CLICK_CATEGORY">Click category</option>
                      <option value="OLD_ARTICLES">Old articles</option>
                      <option value="BEST_SELLERS">Best sellers</option>
                      <option value="HYBRID">Hybrid</option>
                    </select>
                  </label>

                  <label>
                    <span>Favorite weight</span>
                    <input
                      type="number"
                      value={recConfig.favoriteWeight}
                      onChange={(e) =>
                        setRecConfig({ ...recConfig, favoriteWeight: Number(e.target.value) })
                      }
                    />
                  </label>

                  <label>
                    <span>Click weight</span>
                    <input
                      type="number"
                      value={recConfig.clickWeight}
                      onChange={(e) =>
                        setRecConfig({ ...recConfig, clickWeight: Number(e.target.value) })
                      }
                    />
                  </label>

                  <label>
                    <span>Old article weight</span>
                    <input
                      type="number"
                      value={recConfig.oldArticleWeight}
                      onChange={(e) =>
                        setRecConfig({ ...recConfig, oldArticleWeight: Number(e.target.value) })
                      }
                    />
                  </label>

                  <label>
                    <span>Best seller weight</span>
                    <input
                      type="number"
                      value={recConfig.bestSellerWeight}
                      onChange={(e) =>
                        setRecConfig({ ...recConfig, bestSellerWeight: Number(e.target.value) })
                      }
                    />
                  </label>

                  <label>
                    <span>Old article days</span>
                    <input
                      type="number"
                      value={recConfig.oldArticleDays}
                      onChange={(e) =>
                        setRecConfig({ ...recConfig, oldArticleDays: Number(e.target.value) })
                      }
                    />
                  </label>

                  <label>
                    <span>Limit</span>
                    <input
                      type="number"
                      value={recConfig.limitCount}
                      onChange={(e) =>
                        setRecConfig({ ...recConfig, limitCount: Number(e.target.value) })
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="admCard powerbiCard">
                <div className="admCardTop">
                  <div className="admCardTitle">Power BI</div>
                </div>

                <iframe
                  title="Power BI Dashboard"
                  src="PASTE_YOUR_POWER_BI_EMBED_URL_HERE"
                  width="100%"
                  height="720"
                  frameBorder="0"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        )}

        <dialog ref={clientDialogRef} className="admDialog">
          <div className="admDialogHead">
            <div className="admDialogTitle">Customer profile</div>
            <button className="admBtn mini" type="button" onClick={() => closeDialog(clientDialogRef)}>
              Close
            </button>
          </div>

          {!selected ? (
            <div className="admDialogBody">No customer selected</div>
          ) : (
            <div className="admDialogBody">
              <div className="admSideTop">
                <div className="admAvatar big">{initials(selected.nom, selected.prenom)}</div>
                <div>
                  <div className="admSideName">
                    {selected.prenom} {selected.nom}
                  </div>
                  <div className="admSideRole">
                    {selected.role} • {selected.statutCompte}
                  </div>
                </div>
              </div>

              <div className="admDivider" />

              <div className="admInfo">
                <div className="admInfoRow">
                  <span>Email</span>
                  <span className="mono">{selected.email}</span>
                </div>
                <div className="admInfoRow">
                  <span>Status</span>
                  <span>{selected.statutCompte}</span>
                </div>
                <div className="admInfoRow">
                  <span>Created</span>
                  <span>{fmt(selected.dateDeCreation)}</span>
                </div>
                <div className="admInfoRow">
                  <span>ID</span>
                  <span className="mono">{selected.id}</span>
                </div>
              </div>
            </div>
          )}
        </dialog>
      </main>
    </div>
  );
}