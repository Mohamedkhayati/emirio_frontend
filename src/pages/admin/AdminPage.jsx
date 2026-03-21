import { useEffect, useMemo, useRef, useState } from "react";
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

const fullImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
  return `${base}${path}`;
};

const toInputDateTime = (v) => {
  if (!v) return "";
  try {
    const d = new Date(v);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
  imageFile1: null,
  imageFile2: null,
  imageFile3: null,
  imageFile4: null,
  salePrice: "",
  saleStartAt: "",
  saleEndAt: "",
  recommended: false
};

const emptyVariationForm = {
  prix: "",
  quantiteStock: "",
  couleurId: "",
  tailleId: ""
};

const emptyCategoryForm = { nom: "", description: "" };
const emptyColorForm = { nom: "", codeHex: "#000000" };
const emptySizeForm = { pointure: "" };

export default function AdminPage() {
  const [section, setSection] = useState("customers");

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

  const [categories, setCategories] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [variations, setVariations] = useState([]);

  const [articleForm, setArticleForm] = useState(emptyArticleForm);
  const [variationForm, setVariationForm] = useState(emptyVariationForm);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [colorForm, setColorForm] = useState(emptyColorForm);
  const [sizeForm, setSizeForm] = useState(emptySizeForm);

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

  async function loadList(pickFirst = false) {
    setError("");
    const res = await api.get("/api/admin/clients");
    const list = res.data || [];
    setRows(list);

    if (pickFirst && list.length) {
      const firstId = selected?.id ?? list[0].id;
      const d = await api.get(`/api/admin/clients/${firstId}`);
      setSelected(d.data);
    } else if (!list.length) {
      setSelected(null);
    }
  }

  async function selectClient(id) {
    setError("");
    const d = await api.get(`/api/admin/clients/${id}`);
    setSelected(d.data);
  }

  async function setStatus(id, statutCompte) {
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
    if (!window.confirm("Delete this client?")) return;
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

  async function loadCatalogBaseData() {
    const [a, c, co, s] = await Promise.all([
      api.get("/api/admin/articles"),
      api.get("/api/admin/categories"),
      api.get("/api/admin/colors"),
      api.get("/api/admin/sizes")
    ]);
    setArticles(a.data || []);
    setCategories(c.data || []);
    setColors(co.data || []);
    setSizes(s.data || []);
  }

  async function loadArticleDetails(id) {
    const [res, vr] = await Promise.all([
      api.get(`/api/articles/${id}`),
      api.get(`/api/admin/articles/${id}/variations`)
    ]);
    setSelectedArticle(res.data);
    setVariations(vr.data || []);
  }

  async function refreshCatalog(pickFirst = false) {
    await loadCatalogBaseData();
    if (pickFirst) {
      const res = await api.get("/api/admin/articles");
      const list = res.data || [];
      if (list.length) {
        const firstId = selectedArticle?.id ?? list[0].id;
        await loadArticleDetails(firstId);
      } else {
        setSelectedArticle(null);
        setVariations([]);
      }
    }
  }

  useEffect(() => {
    loadList(true).catch((e) => setError(e?.response?.data?.message || e.message));
    refreshCatalog(true).catch((e) => setCatalogError(e?.response?.data?.message || e.message));
  }, []);

  const filteredCustomers = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((u) => `${u.nom} ${u.prenom} ${u.email}`.toLowerCase().includes(s));
  }, [q, rows]);

  const filteredArticles = useMemo(() => {
    const s = catalogQ.trim().toLowerCase();
    if (!s) return articles;
    return articles.filter((a) =>
      `${a.nom} ${a.description || ""} ${a.categorieNom || ""} ${a.marque || ""} ${a.sku || ""}`
        .toLowerCase()
        .includes(s)
    );
  }, [catalogQ, articles]);

  function openCreateArticle() {
    setEditingArticleId(null);
    setArticleForm(emptyArticleForm);
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
      imageFile1: null,
      imageFile2: null,
      imageFile3: null,
      imageFile4: null,
      salePrice: article.salePrice ?? "",
      saleStartAt: toInputDateTime(article.saleStartAt),
      saleEndAt: toInputDateTime(article.saleEndAt),
      recommended: !!article.recommended
    });
    articleDialogRef.current?.showModal();
  }

  async function saveArticle(e) {
    e.preventDefault();
    setBusyCatalog(true);
    setCatalogError("");

    try {
      const payload = {
        nom: articleForm.nom,
        description: articleForm.description,
        details: articleForm.details,
        prix: Number(articleForm.prix),
        actif: !!articleForm.actif,
        categorieId: Number(articleForm.categorieId),
        marque: articleForm.marque,
        matiere: articleForm.matiere,
        sku: articleForm.sku,
        salePrice: articleForm.salePrice ? Number(articleForm.salePrice) : null,
        saleStartAt: articleForm.saleStartAt || null,
        saleEndAt: articleForm.saleEndAt || null,
        recommended: !!articleForm.recommended
      };

      const fd = new FormData();
      fd.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
      if (articleForm.imageFile1) fd.append("image1", articleForm.imageFile1);
      if (articleForm.imageFile2) fd.append("image2", articleForm.imageFile2);
      if (articleForm.imageFile3) fd.append("image3", articleForm.imageFile3);
      if (articleForm.imageFile4) fd.append("image4", articleForm.imageFile4);

      if (editingArticleId) {
        await api.put(`/api/admin/articles/${editingArticleId}`, fd, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } else {
        await api.post("/api/admin/articles", fd, {
          headers: { "Content-Type": "multipart/form-data" }
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
    try {
      await api.delete(`/api/admin/articles/${id}`);
      setSelectedArticle(null);
      setVariations([]);
      await refreshCatalog(true);
    } catch (e) {
      setCatalogError(e?.response?.data?.message || "Delete article failed");
    } finally {
      setBusyCatalog(false);
    }
  }

  function openCreateVariation() {
    if (!selectedArticle) return;
    setEditingVariationId(null);
    setVariationForm(emptyVariationForm);
    variationDialogRef.current?.showModal();
  }

  function openEditVariation(v) {
    setEditingVariationId(v.id);
    setVariationForm({
      prix: v.prix ?? "",
      quantiteStock: v.quantiteStock ?? "",
      couleurId: v.couleurId || "",
      tailleId: v.tailleId || ""
    });
    variationDialogRef.current?.showModal();
  }

  async function saveVariation(e) {
    e.preventDefault();
    if (!selectedArticle) return;

    setBusyCatalog(true);
    try {
      const payload = {
        prix: Number(variationForm.prix),
        quantiteStock: Number(variationForm.quantiteStock),
        couleurId: Number(variationForm.couleurId),
        tailleId: Number(variationForm.tailleId)
      };

      if (editingVariationId) {
        await api.put(`/api/admin/variations/${editingVariationId}`, payload);
      } else {
        await api.post(`/api/admin/articles/${selectedArticle.id}/variations`, payload);
      }

      variationDialogRef.current?.close();
      await loadArticleDetails(selectedArticle.id);
    } catch (e) {
      setCatalogError(e?.response?.data?.message || "Save variation failed");
    } finally {
      setBusyCatalog(false);
    }
  }

  async function deleteVariation(id) {
    if (!window.confirm("Delete this variation?")) return;
    setBusyCatalog(true);
    try {
      await api.delete(`/api/admin/variations/${id}`);
      await loadArticleDetails(selectedArticle.id);
    } catch (e) {
      setCatalogError(e?.response?.data?.message || "Delete variation failed");
    } finally {
      setBusyCatalog(false);
    }
  }

  function openCreateCategory() {
    setEditingCategoryId(null);
    setCategoryForm(emptyCategoryForm);
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
    try {
      if (editingCategoryId) await api.put(`/api/admin/categories/${editingCategoryId}`, categoryForm);
      else await api.post("/api/admin/categories", categoryForm);
      categoryDialogRef.current?.close();
      await refreshCatalog(false);
    } catch (e) {
      setCatalogError(e?.response?.data?.message || "Save category failed");
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
    setColorForm(emptyColorForm);
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
    try {
      if (editingColorId) await api.put(`/api/admin/colors/${editingColorId}`, colorForm);
      else await api.post("/api/admin/colors", colorForm);
      colorDialogRef.current?.close();
      await refreshCatalog(false);
    } catch (e) {
      setCatalogError(e?.response?.data?.message || "Save color failed");
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
    setSizeForm(emptySizeForm);
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
    try {
      if (editingSizeId) await api.put(`/api/admin/sizes/${editingSizeId}`, sizeForm);
      else await api.post("/api/admin/sizes", sizeForm);
      sizeDialogRef.current?.close();
      await refreshCatalog(false);
    } catch (e) {
      setCatalogError(e?.response?.data?.message || "Save size failed");
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

  return (
    <div className="adminLayout">
      <aside className="adminSidebar clean">
        <div className="adminMenu onlyMenu">
          <button className={`adminMenuItem ${section === "customers" ? "active" : ""}`} onClick={() => setSection("customers")}>
            Customers List
          </button>
          <button className={`adminMenuItem ${section === "catalog" ? "active" : ""}`} onClick={() => setSection("catalog")}>
            Catalog Manager
          </button>
          <button
  className={`adminMenuItem ${section === "dashboard" ? "active" : ""}`}
  onClick={() => setSection("dashboard")}
>
  Dashboard
</button>

        </div>
      </aside>

      <main className="adminContent">
        {section === "customers" && (
          <div className="fadeInUp">
            <div className="admPage">
              <div className="admHeader">
                <div>
                  <div className="admH1">Customer List</div>
                  <div className="admH2">Manage client accounts</div>
                </div>

                <div className="admHeaderRight">
                  <div className="admSearchWrap">
                    <input className="admSearch" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name / email..." />
                  </div>
                  <button className="admBtn primary" onClick={() => selected && clientDialogRef.current?.showModal()} disabled={!selected}>
                    See profile
                  </button>
                </div>
              </div>

              {error && <div className="admAlert">{error}</div>}

              <div className="admGrid">
                <div className="admCard">
                  <div className="admCardTop">
                    <div className="admCardTitle">{filteredCustomers.length} customers</div>
                    <button className="admBtn" onClick={() => loadList(false)}>Refresh</button>
                  </div>

                  <div className="admTable">
                    <div className="admTr head">
                      <div>Name</div>
                      <div>Email</div>
                      <div>Status</div>
                      <div style={{ textAlign: "right" }}>Actions</div>
                    </div>

                    {filteredCustomers.map((u) => (
                      <div
                        key={u.id}
                        className={`admTr row ${selected?.id === u.id ? "active" : ""}`}
                        onClick={() => selectClient(u.id).catch((e) => setError(e.message))}
                      >
                        <div className="admNameCell">
                          <div className="admAvatar">{initials(u.nom, u.prenom)}</div>
                          <div>
                            <div className="admName">{u.prenom} {u.nom}</div>
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
                          <button className="admBtn mini" disabled={busyId === u.id} onClick={() => setStatus(u.id, "ACTIVE")}>Enable</button>
                          <button className="admBtn mini" disabled={busyId === u.id} onClick={() => setStatus(u.id, "BLOCKED")}>Block</button>
                          <button className="admBtn mini danger" disabled={busyId === u.id} onClick={() => deleteClient(u.id)}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="admCard side">
                  {!selected ? (
                    <div className="admEmpty">Select a client</div>
                  ) : (
                    <>
                      <div className="admSideTop">
                        <div className="admAvatar big">{initials(selected.nom, selected.prenom)}</div>
                        <div>
                          <div className="admSideName">{selected.prenom} {selected.nom}</div>
                          <div className="admSideRole">{selected.role}</div>
                        </div>
                      </div>

                      <div className="admDivider" />
                      <div className="admInfo">
                        <div className="admInfoRow"><span>Email</span><span className="mono">{selected.email}</span></div>
                        <div className="admInfoRow"><span>Status</span><span>{selected.statutCompte}</span></div>
                        <div className="admInfoRow"><span>Created</span><span>{fmt(selected.dateDeCreation)}</span></div>
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
                  <div className="admH1">Catalog Manager</div>
                  <div className="admH2">Manage articles, sales, recommendations, variations and references</div>
                </div>

                <div className="admHeaderRight">
                  <div className="admSearchWrap">
                    <input className="admSearch" value={catalogQ} onChange={(e) => setCatalogQ(e.target.value)} placeholder="Search article / category / brand..." />
                  </div>
                  <button className="admBtn" onClick={() => refreshCatalog(false)}>Refresh</button>
                  <button className="admBtn" onClick={openCreateCategory}>Add category</button>
                  <button className="admBtn" onClick={openCreateColor}>Add color</button>
                  <button className="admBtn" onClick={openCreateSize}>Add size</button>
                  <button className="admBtn primary" onClick={openCreateArticle}>Add article</button>
                </div>
              </div>

              {catalogError && <div className="admAlert">{catalogError}</div>}

              <div className="admGrid">
                <div className="admCard">
                  <div className="admCardTop">
                    <div className="admCardTitle">{filteredArticles.length} articles</div>
                  </div>

                  <div className="admTable">
                    <div className="admTr head articleRow">
                      <div>Article</div>
                      <div>Category</div>
                      <div>Price</div>
                      <div>Status</div>
                      <div style={{ textAlign: "right" }}>Actions</div>
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
                              {a.imageUrl ? <img src={fullImageUrl(a.imageUrl)} alt={a.nom} className="articleThumb" /> : <div className="articleThumb empty">No image</div>}
                            </div>
                            <div>
                              <div className="admName">{a.nom}</div>
                              <div className="admRole">
                                #{a.id}
                                {a.recommended ? " • Recommended" : ""}
                                {saleLive ? ` • Sale -${salePercent(a)}%` : ""}
                              </div>
                            </div>
                          </div>
                          <div>{a.categorieNom}</div>
                          <div>{saleLive ? `${fmtPrice(a.salePrice)} / ${fmtPrice(a.prix)}` : fmtPrice(a.prix)}</div>
                          <div>
                            <span className={`admBadge ${a.actif ? "ok" : "bad"}`}>{a.actif ? "ACTIVE" : "INACTIVE"}</span>
                          </div>
                          <div className="admRowActions" onClick={(e) => e.stopPropagation()}>
                            <button className="admBtn mini" onClick={() => openEditArticle(a)}>Edit</button>
                            <button className="admBtn mini danger" onClick={() => deleteArticle(a.id)}>Delete</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="admCard side">
                  {!selectedArticle ? (
                    <div className="admEmpty">Select an article</div>
                  ) : (
                    <>
                      <div className="admSideTop articleSideTop">
                        {selectedArticle.imageUrl ? (
                          <img src={fullImageUrl(selectedArticle.imageUrl)} alt={selectedArticle.nom} className="selectedArticleImage" />
                        ) : (
                          <div className="selectedArticleImage empty">No image</div>
                        )}

                        <div>
                          <div className="admSideName">{selectedArticle.nom}</div>
                          <div className="admSideRole">{selectedArticle.categorieNom}</div>
                        </div>
                      </div>

                      <div className="admDivider" />
                      <div className="admInfo">
                        <div className="admInfoRow"><span>Price</span><span>{fmtPrice(selectedArticle.prix)}</span></div>
                        <div className="admInfoRow"><span>Sale price</span><span>{fmtPrice(selectedArticle.salePrice)}</span></div>
                        <div className="admInfoRow"><span>Sale start</span><span>{fmt(selectedArticle.saleStartAt)}</span></div>
                        <div className="admInfoRow"><span>Sale end</span><span>{fmt(selectedArticle.saleEndAt)}</span></div>
                        <div className="admInfoRow"><span>On sale now</span><span>{isSaleActive(selectedArticle) ? "YES" : "NO"}</span></div>
                        <div className="admInfoRow"><span>Recommended</span><span>{selectedArticle.recommended ? "YES" : "NO"}</span></div>
                        <div className="admInfoRow"><span>Brand</span><span>{selectedArticle.marque || "-"}</span></div>
                        <div className="admInfoRow"><span>Material</span><span>{selectedArticle.matiere || "-"}</span></div>
                        <div className="admInfoRow"><span>SKU</span><span>{selectedArticle.sku || "-"}</span></div>
                      </div>

                      <div className="admDivider" />
                      <div className="admCardTop">
                        <div className="admCardTitle">Variations</div>
                        <button className="admBtn mini primary" onClick={openCreateVariation}>Add variation</button>
                      </div>

                      <div className="admTable compact">
                        {variations.map((v) => (
                          <div key={v.id} className="admTr row varRow">
                            <div>
                              <div className="admName">{v.couleurNom} / {v.taillePointure}</div>
                              <div className="admRole">Stock: {v.quantiteStock}</div>
                            </div>
                            <div>{fmtPrice(v.prix)}</div>
                            <div className="admRowActions">
                              <button className="admBtn mini" onClick={() => openEditVariation(v)}>Edit</button>
                              <button className="admBtn mini danger" onClick={() => deleteVariation(v.id)}>Delete</button>
                            </div>
                          </div>
                        ))}
                        {!variations.length && <div className="admEmpty">No variations yet</div>}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="admGrid refsGrid">
                <div className="admCard">
                  <div className="admCardTop">
                    <div className="admCardTitle">Categories</div>
                    <button className="admBtn mini" onClick={openCreateCategory}>Add category</button>
                  </div>
                  <div className="admTable compact">
                    {categories.map((c) => (
                      <div key={c.id} className="admTr row">
                        <div>
                          <div className="admName">{c.nom}</div>
                          <div className="admRole">{c.description || "-"}</div>
                        </div>
                        <div className="admRowActions">
                          <button className="admBtn mini" onClick={() => openEditCategory(c)}>Edit</button>
                          <button className="admBtn mini danger" onClick={() => deleteCategory(c.id)}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="admCard">
                  <div className="admCardTop">
                    <div className="admCardTitle">Colors</div>
                    <button className="admBtn mini" onClick={openCreateColor}>Add color</button>
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
                          <button className="admBtn mini" onClick={() => openEditColor(c)}>Edit</button>
                          <button className="admBtn mini danger" onClick={() => deleteColor(c.id)}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="admCard">
                  <div className="admCardTop">
                    <div className="admCardTitle">Sizes</div>
                    <button className="admBtn mini" onClick={openCreateSize}>Add size</button>
                  </div>
                  <div className="admTable compact">
                    {sizes.map((s) => (
                      <div key={s.id} className="admTr row">
                        <div>
                          <div className="admName">{s.pointure}</div>
                        </div>
                        <div className="admRowActions">
                          <button className="admBtn mini" onClick={() => openEditSize(s)}>Edit</button>
                          <button className="admBtn mini danger" onClick={() => deleteSize(s.id)}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <dialog ref={articleDialogRef} className="admDialog productDialog">
                <div className="admDialogHead">
                  <div className="admDialogTitle">{editingArticleId ? "Edit article" : "Add article"}</div>
                  <button className="admBtn mini" type="button" onClick={() => articleDialogRef.current?.close()}>Close</button>
                </div>

                <form className="productForm admDialogBody" onSubmit={saveArticle}>
                  <label><span>Product name</span><input value={articleForm.nom} onChange={(e) => setArticleForm({ ...articleForm, nom: e.target.value })} required /></label>

                  <label>
                    <span>Category</span>
                    <select value={articleForm.categorieId} onChange={(e) => setArticleForm({ ...articleForm, categorieId: e.target.value })} required>
                      <option value="">Select category</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                    </select>
                  </label>

                  <label><span>Price</span><input type="number" step="0.001" value={articleForm.prix} onChange={(e) => setArticleForm({ ...articleForm, prix: e.target.value })} required /></label>
                  <label><span>Sale price</span><input type="number" step="0.001" value={articleForm.salePrice} onChange={(e) => setArticleForm({ ...articleForm, salePrice: e.target.value })} /></label>
                  <label><span>Sale start</span><input type="datetime-local" value={articleForm.saleStartAt} onChange={(e) => setArticleForm({ ...articleForm, saleStartAt: e.target.value })} /></label>
                  <label><span>Sale end</span><input type="datetime-local" value={articleForm.saleEndAt} onChange={(e) => setArticleForm({ ...articleForm, saleEndAt: e.target.value })} /></label>

                  <label><span>Brand</span><input value={articleForm.marque} onChange={(e) => setArticleForm({ ...articleForm, marque: e.target.value })} /></label>
                  <label><span>Material</span><input value={articleForm.matiere} onChange={(e) => setArticleForm({ ...articleForm, matiere: e.target.value })} /></label>
                  <label><span>SKU</span><input value={articleForm.sku} onChange={(e) => setArticleForm({ ...articleForm, sku: e.target.value })} /></label>

                  <label><span>Image 1</span><input type="file" accept="image/*" onChange={(e) => setArticleForm({ ...articleForm, imageFile1: e.target.files?.[0] || null })} /></label>
                  <label><span>Image 2</span><input type="file" accept="image/*" onChange={(e) => setArticleForm({ ...articleForm, imageFile2: e.target.files?.[0] || null })} /></label>
                  <label><span>Image 3</span><input type="file" accept="image/*" onChange={(e) => setArticleForm({ ...articleForm, imageFile3: e.target.files?.[0] || null })} /></label>
                  <label><span>Image 4</span><input type="file" accept="image/*" onChange={(e) => setArticleForm({ ...articleForm, imageFile4: e.target.files?.[0] || null })} /></label>

                  <label className="checkRow">
                    <input type="checkbox" checked={articleForm.actif} onChange={(e) => setArticleForm({ ...articleForm, actif: e.target.checked })} />
                    <span>Active product</span>
                  </label>

                  <label className="checkRow">
                    <input type="checkbox" checked={articleForm.recommended} onChange={(e) => setArticleForm({ ...articleForm, recommended: e.target.checked })} />
                    <span>Best choice recommendation</span>
                  </label>

                  <label className="fullCol">
                    <span>Short description</span>
                    <textarea rows="4" value={articleForm.description} onChange={(e) => setArticleForm({ ...articleForm, description: e.target.value })} />
                  </label>

                  <label className="fullCol">
                    <span>More information</span>
                    <textarea rows="6" value={articleForm.details} onChange={(e) => setArticleForm({ ...articleForm, details: e.target.value })} />
                  </label>

                  <div className="admDialogActions">
                    <button type="submit" className="admBtn primary" disabled={busyCatalog}>
                      {editingArticleId ? "Update article" : "Save article"}
                    </button>
                  </div>
                </form>
              </dialog>

              <dialog ref={variationDialogRef} className="admDialog productDialog">
                <div className="admDialogHead">
                  <div className="admDialogTitle">{editingVariationId ? "Edit variation" : "Add variation"}</div>
                  <button className="admBtn mini" type="button" onClick={() => variationDialogRef.current?.close()}>Close</button>
                </div>

                <form className="productForm admDialogBody" onSubmit={saveVariation}>
                  <label>
                    <span>Color</span>
                    <select value={variationForm.couleurId} onChange={(e) => setVariationForm({ ...variationForm, couleurId: e.target.value })} required>
                      <option value="">Select color</option>
                      {colors.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                    </select>
                  </label>

                  <label>
                    <span>Size</span>
                    <select value={variationForm.tailleId} onChange={(e) => setVariationForm({ ...variationForm, tailleId: e.target.value })} required>
                      <option value="">Select size</option>
                      {sizes.map((s) => <option key={s.id} value={s.id}>{s.pointure}</option>)}
                    </select>
                  </label>

                  <label><span>Price</span><input type="number" step="0.001" value={variationForm.prix} onChange={(e) => setVariationForm({ ...variationForm, prix: e.target.value })} required /></label>
                  <label><span>Stock</span><input type="number" value={variationForm.quantiteStock} onChange={(e) => setVariationForm({ ...variationForm, quantiteStock: e.target.value })} required /></label>

                  <div className="admDialogActions">
                    <button type="submit" className="admBtn primary" disabled={busyCatalog}>
                      {editingVariationId ? "Update variation" : "Save variation"}
                    </button>
                  </div>
                </form>
              </dialog>

              <dialog ref={categoryDialogRef} className="admDialog productDialog">
                <div className="admDialogHead">
                  <div className="admDialogTitle">{editingCategoryId ? "Edit category" : "Add category"}</div>
                  <button className="admBtn mini" type="button" onClick={() => categoryDialogRef.current?.close()}>Close</button>
                </div>
                <form className="productForm admDialogBody" onSubmit={saveCategory}>
                  <label><span>Name</span><input value={categoryForm.nom} onChange={(e) => setCategoryForm({ ...categoryForm, nom: e.target.value })} required /></label>
                  <label className="fullCol"><span>Description</span><textarea rows="4" value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} /></label>
                  <div className="admDialogActions"><button type="submit" className="admBtn primary">{editingCategoryId ? "Update category" : "Save category"}</button></div>
                </form>
              </dialog>

              <dialog ref={colorDialogRef} className="admDialog productDialog">
                <div className="admDialogHead">
                  <div className="admDialogTitle">{editingColorId ? "Edit color" : "Add color"}</div>
                  <button className="admBtn mini" type="button" onClick={() => colorDialogRef.current?.close()}>Close</button>
                </div>
                <form className="productForm admDialogBody" onSubmit={saveColor}>
                  <label><span>Name</span><input value={colorForm.nom} onChange={(e) => setColorForm({ ...colorForm, nom: e.target.value })} required /></label>
                  <label><span>Hex color</span><input value={colorForm.codeHex} onChange={(e) => setColorForm({ ...colorForm, codeHex: e.target.value })} required /></label>
                  <div className="admDialogActions"><button type="submit" className="admBtn primary">{editingColorId ? "Update color" : "Save color"}</button></div>
                </form>
              </dialog>

              <dialog ref={sizeDialogRef} className="admDialog productDialog">
                <div className="admDialogHead">
                  <div className="admDialogTitle">{editingSizeId ? "Edit size" : "Add size"}</div>
                  <button className="admBtn mini" type="button" onClick={() => sizeDialogRef.current?.close()}>Close</button>
                </div>
                <form className="productForm admDialogBody" onSubmit={saveSize}>
                  <label><span>Size</span><input value={sizeForm.pointure} onChange={(e) => setSizeForm({ ...sizeForm, pointure: e.target.value })} required /></label>
                  <div className="admDialogActions"><button type="submit" className="admBtn primary">{editingSizeId ? "Update size" : "Save size"}</button></div>
                </form>
              </dialog>

              <dialog ref={clientDialogRef} className="admDialog">
                <div className="admDialogHead">
                  <div className="admDialogTitle">Client profile</div>
                  <button className="admBtn mini" type="button" onClick={() => clientDialogRef.current?.close()}>Close</button>
                </div>
                {!selected ? (
                  <div className="admDialogBody">No client selected.</div>
                ) : (
                  <div className="admDialogBody">
                    <div className="admSideTop">
                      <div className="admAvatar big">{initials(selected.nom, selected.prenom)}</div>
                      <div>
                        <div className="admSideName">{selected.prenom} {selected.nom}</div>
                        <div className="admSideRole">{selected.role} • {selected.statutCompte}</div>
                      </div>
                    </div>

                    <div className="admDivider" />
                    <div className="admInfo">
                      <div className="admInfoRow"><span>Email</span><span className="mono">{selected.email}</span></div>
                      <div className="admInfoRow"><span>Status</span><span>{selected.statutCompte}</span></div>
                      <div className="admInfoRow"><span>Created</span><span>{fmt(selected.dateDeCreation)}</span></div>
                      <div className="admInfoRow"><span>ID</span><span className="mono">{selected.id}</span></div>
                    </div>
                  </div>
                )}
              </dialog>
            </div>
          </div>
        )}
        {section === "dashboard" && (
  <div className="fadeInUp">
    <div className="admPage">
      <div className="admHeader">
        <div>
          <div className="admH1">Statistics Dashboard</div>
          <div className="admH2">Track products, customers, stock and sales</div>
        </div>
      </div>

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

      <div className="admCard powerbiCard">
        <div className="admCardTop">
          <div className="admCardTitle">Power BI Report</div>
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

      </main>
    </div>
  );
}
