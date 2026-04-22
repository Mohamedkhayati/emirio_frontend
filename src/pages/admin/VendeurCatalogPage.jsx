// src/pages/admin/VendeurCatalogPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../../lib/api";
import {
  emptyArticleForm,
  emptyVariationForm,
  fmtPrice,
  fullImageUrl,
  isSaleActive,
  salePercent,
  toInputDateTime,
  variationImageVersion,
} from "./adminShared";

const UI_TEXT = {
  headerTitle: "My Catalog",
  headerSubtitle: "Manage your products, variations and stock",
  searchPlaceholder: "Search my articles",
  addArticle: "Add article",
  articlesCount: "articles",
  tableArticle: "Article",
  tableCategory: "Category",
  tablePrice: "Price",
  tableStatus: "Status",
  tableActions: "Actions",
  details: "Details",
  active: "ACTIVE",
  inactive: "INACTIVE",
  edit: "Edit",
  delete: "Delete",
  noArticles: "No articles found",
  variations: "Variations",
  variationsHint: "Manage colors, sizes and stock for this article",
  addVariation: "Add variation",
  bulkEditVariation: "Edit color group",
  colorLabel: "Color",
  sizeLabel: "Size",
  stockLabel: "Stock",
  price: "Price",
  salePrice: "Sale price",
  brand: "Brand",
  material: "Material",
  sku: "SKU",
  recommended: "Recommended",
  onSaleNow: "On sale now",
  yes: "Yes",
  no: "No",
  selectArticle: "Select an article from the list",
  noVariations: "No variations yet",
  restock: "Restock",
  useQty: "Use qty",
  articleDialogAdd: "Add article",
  articleDialogEdit: "Edit article",
  productName: "Product name",
  selectCategory: "Category",
  shortDescription: "Short description",
  moreInformations: "More informations",
  activeProduct: "Active product",
  bestChoice: "Best choice",
  saveArticle: "Save article",
  updateArticle: "Update article",
  variationDialogAdd: "Add variation",
  variationDialogEdit: "Edit variation",
  variationCreateHelp: "Choose one color, check all sizes you want, and enter stock for each size.",
  variationEditHelp: "Edit one saved variation. In edit mode, only one size is active.",
  accessoryVariationCreateHelp: "Choose one color and enter one stock value. No sizes are required for accessories.",
  accessoryVariationEditHelp: "Edit one accessory variation with one stock field only.",
  selectColor: "Select color",
  selectedSizes: "Selected sizes",
  alreadyExists: "Already exists",
  variationImages: "Variation images",
  newSelectedImages: "New selected images",
  savedVariationImages: "Saved variation images",
  savedImage: "Saved image",
  model3d: "3D model (.glb or .gltf)",
  currentModel: "Current 3D model",
  newFile: "New file",
  savedFile: "Saved file",
  openCurrentModel: "Open current 3D model",
  variationImageHint: "Images are shared for the selected color batch in create mode. In edit mode, you update one saved variation.",
  saveVariation: "Save variation",
  updateVariation: "Update variation",
  stockDialogRestock: "Restock variation",
  stockDialogUse: "Use / sell variation",
  variationField: "Variation",
  currentStock: "Current stock",
  addQuantity: "Add quantity",
  removeQuantity: "Remove quantity",
  newStockAfterUpdate: "New stock after update",
  confirmRestock: "Confirm restock",
  confirmStockRemoval: "Confirm stock removal",
  close: "Close",
  errLoadCatalog: "Cannot load your articles",
  errSaveArticle: "Save article failed",
  errDeleteArticle: "Delete article failed",
  errSaveVariation: "Save variation failed",
  errDeleteVariation: "Delete variation failed",
  errStockUpdate: "Stock update failed",
  validationArticleName: "Article name is required.",
  validationCategoryRequired: "Please select a complete category path (Main > Sub > Product Type)",
  validationPriceGreaterThanZero: "Price must be greater than 0.",
  validationSaleLower: "Sale price must be lower than the main price.",
  validationSaleDates: "Sale end date must be after sale start date.",
  validationNeedColorOnly: "Create at least one color before adding a variation.",
  validationNeedColorAndSize: "Create at least one color and one size before adding a variation.",
  validationSelectColor: "Please select a color.",
  validationSelectOneSize: "Please select at least one size.",
  validationAccessoryStock: "Stock must be a whole number equal to or greater than 0.",
  validationStockWholeNumber: "Stock for size {{size}} must be a whole number equal to or greater than 0.",
  validationVariationNotFound: "Variation not found.",
  validationQuantityPositive: "Quantity must be a whole number greater than 0.",
  validationCannotRemoveMore: "Cannot remove more than the current stock.",
  validationNoNegativeStock: "Resulting stock cannot be negative.",
  confirmDeleteArticle: "Delete this article?",
  confirmDeleteVariation: "Delete this variation?",
  mainCategoryLabel: "Main Category",
  subCategoryLabel: "Sub Category",
  subSubCategoryLabel: "Product Type",
  selectMainCategory: "Select main category",
  selectSubCategory: "Select sub category",
  selectProductType: "Select product type",
};

function TablePager({ total, page, setPage, rows, setRows, rowsOptions = [3, 5, 10, 25, 50] }) {
  const totalPages = Math.max(1, Math.ceil(total / rows));
  useEffect(() => { if (page > totalPages) setPage(1); }, [page, totalPages, setPage]);
  const start = total === 0 ? 0 : (page - 1) * rows + 1;
  const end = Math.min(page * rows, total);
  return (
    <div className="tablePager">
      <div className="tablePagerLeft">
        <button type="button" className="admBtn mini" onClick={() => setPage(1)} disabled={page === 1}>{"<<"}</button>
        <button type="button" className="admBtn mini" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>{"<"}</button>
        <span className="tablePagerReport">{start} to {end} of {total}</span>
        <button type="button" className="admBtn mini" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}>{">"}</button>
        <button type="button" className="admBtn mini" onClick={() => setPage(totalPages)} disabled={page === totalPages}>{">>"}</button>
      </div>
      <div className="tablePagerRight">
        <span>Rows</span>
        <select className="admSearch pagerSelect" value={rows} onChange={(e) => { setRows(Number(e.target.value)); setPage(1); }}>
          {rowsOptions.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
    </div>
  );
}

export default function VendeurCatalogPage() {
 const { isCatalogManager, isAdminGeneral } = useOutletContext();
  const isVendeur = isCatalogManager || isAdminGeneral;
    const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [searchQ, setSearchQ] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [articlePage, setArticlePage] = useState(1);
  const [articleRows, setArticleRows] = useState(5);

  // Variations state
  const [variations, setVariations] = useState([]);
  const [variationPage, setVariationPage] = useState(1);
  const [variationRows, setVariationRows] = useState(3);

  // Form states
  const [articleForm, setArticleForm] = useState({ ...emptyArticleForm });
  const [variationForm, setVariationForm] = useState({ ...emptyVariationForm });
  const [variationGroupForm, setVariationGroupForm] = useState(null);
  const [editingArticleId, setEditingArticleId] = useState(null);
  const [editingVariationId, setEditingVariationId] = useState(null);
  const [editingVariationGroup, setEditingVariationGroup] = useState(null);
  const [variationError, setVariationError] = useState("");

  // Stock dialog
  const [stockForm, setStockForm] = useState({ variationId: "", label: "", currentStock: 0, quantity: 1, mode: "decrement" });
  const [stockError, setStockError] = useState("");

  // References for dialogs
  const articleDialogRef = useRef(null);
  const variationDialogRef = useRef(null);
  const stockDialogRef = useRef(null);

  // Global lists (read‑only)
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [subSubCategories, setSubSubCategories] = useState([]);

  // Category selection state
  const [selectedMainCat, setSelectedMainCat] = useState("");
  const [selectedSubCat, setSelectedSubCat] = useState("");
  const [selectedSubSubCat, setSelectedSubSubCat] = useState("");

  // Helper: is accessory category? (checks main category name or any category name that indicates accessory)
  const isAccessoryCategory = useMemo(() => {
    const raw = selectedArticle?.categorieNom || "";
    const normalized = raw.trim().toLowerCase();
    return normalized === "accessoire" ||
           normalized === "accessoires" ||
           normalized === "accessory" ||
           normalized === "sac a main" ||
           normalized === "sac à main" ||
           normalized === "pochette de soirée";
  }, [selectedArticle]);

  // Load my articles
  async function loadMyArticles() {
    setError("");
    try {
      const res = await api.get("/api/vendeur/articles");
      setArticles(res.data || []);
      if (!selectedArticle && res.data?.length) await loadArticleDetails(res.data[0].id);
    } catch (e) {
      setError(e?.response?.data?.message || UI_TEXT.errLoadCatalog);
    }
  }

  async function loadArticleDetails(id) {
    try {
      const res = await api.get(`/api/vendeur/articles/${id}`);
      const articleData = res.data;
      setSelectedArticle(articleData);
      setVariations(articleData.variations || []);
      setVariationPage(1);
    } catch (e) {
      setError(e?.response?.data?.message || "Cannot load article details");
    }
  }

  async function refresh() {
    await loadMyArticles();
  }

  // Category hierarchy functions
  async function loadSubCategories(mainCategoryId) {
    if (!mainCategoryId) {
      setSubCategories([]);
      return;
    }
    try {
      const res = await api.get(`/api/categories/parent/${mainCategoryId}/children`);
      setSubCategories(res.data || []);
    } catch (error) {
      setSubCategories([]);
    }
  }

  async function loadSubSubCategories(subCategoryId) {
    if (!subCategoryId) {
      setSubSubCategories([]);
      return;
    }
    try {
      const res = await api.get(`/api/categories/parent/${subCategoryId}/children`);
      setSubSubCategories(res.data || []);
    } catch (error) {
      setSubSubCategories([]);
    }
  }

  useEffect(() => {
    if (!isVendeur) return;
    Promise.all([
      api.get("/api/categories/main").catch(() => ({ data: [] })),
      api.get("/api/admin/colors").catch(() => ({ data: [] })),
      api.get("/api/admin/sizes").catch(() => ({ data: [] })),
      api.get("/api/admin/categories").catch(() => ({ data: [] })),
    ]).then(([mainCatRes, colRes, sizeRes, allCatRes]) => {
      setMainCategories(mainCatRes.data || []);
      setColors(colRes.data || []);
      setSizes(sizeRes.data || []);
      setAllCategories(allCatRes.data || []);
    });
    loadMyArticles();
  }, [isVendeur]);

  function resetCategorySelections() {
    setSelectedMainCat("");
    setSelectedSubCat("");
    setSelectedSubSubCat("");
    setSubCategories([]);
    setSubSubCategories([]);
    setArticleForm(prev => ({ ...prev, categorieId: "" }));
  }

  const filteredArticles = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter(a => `${a.nom} ${a.description} ${a.categorieNom} ${a.marque} ${a.sku}`.toLowerCase().includes(q));
  }, [articles, searchQ]);

  const pagedArticles = useMemo(() => filteredArticles.slice((articlePage-1)*articleRows, (articlePage-1)*articleRows+articleRows), [filteredArticles, articlePage, articleRows]);
  const pagedVariations = useMemo(() => variations.slice((variationPage-1)*variationRows, (variationPage-1)*variationRows+variationRows), [variations, variationPage, variationRows]);

  function buildSizeStocks(defaultStock = 0, colorId = "") {
    const currentColorId = Number(colorId || 0);
    return sizes.map(s => {
      const alreadyExists = variations.some(v => Number(v.couleurId) === currentColorId && Number(v.tailleId) === Number(s.id) && Number(v.id) !== Number(editingVariationId || 0));
      return { tailleId: Number(s.id), label: s.pointure, checked: false, quantiteStock: defaultStock, disabled: alreadyExists };
    });
  }

  function openCreateArticle() {
    setEditingArticleId(null);
    resetCategorySelections();
    setArticleForm({ ...emptyArticleForm, categorieId: "" });
    articleDialogRef.current?.showModal();
  }

  function openEditArticle(article) {
    setEditingArticleId(article.id);
    const category = allCategories.find(c => c.id === article.categorieId);
    if (category) {
      if (category.parentId) {
        const parent = allCategories.find(c => c.id === category.parentId);
        if (parent && parent.parentId) {
          const grandParent = allCategories.find(c => c.id === parent.parentId);
          setSelectedMainCat(grandParent?.id || "");
          setSelectedSubCat(parent.id);
          setSelectedSubSubCat(category.id);
          loadSubCategories(grandParent?.id);
          loadSubSubCategories(parent.id);
        } else if (parent) {
          setSelectedMainCat(parent.id);
          setSelectedSubCat(category.id);
          setSelectedSubSubCat("");
          loadSubCategories(parent.id);
        }
      } else {
        setSelectedMainCat(category.id);
        setSelectedSubCat("");
        setSelectedSubSubCat("");
      }
    }
    setArticleForm({
      nom: article.nom, description: article.description || "", details: article.details || "",
      prix: article.prix, actif: article.actif, categorieId: article.categorieId || "",
      marque: article.marque || "", matiere: article.matiere || "", sku: article.sku || "",
      salePrice: article.salePrice ?? "", saleStartAt: toInputDateTime(article.saleStartAt),
      saleEndAt: toInputDateTime(article.saleEndAt), recommended: article.recommended,
    });
    articleDialogRef.current?.showModal();
  }

  async function saveArticle(e) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const prix = Number(articleForm.prix);
    const salePrice = articleForm.salePrice !== "" ? Number(articleForm.salePrice) : null;

    if (!articleForm.nom.trim()) {
      setError(UI_TEXT.validationArticleName);
      setBusy(false);
      return;
    }
    if (!articleForm.categorieId) {
      setError(UI_TEXT.validationCategoryRequired);
      setBusy(false);
      return;
    }
    if (!Number.isFinite(prix) || prix <= 0) {
      setError(UI_TEXT.validationPriceGreaterThanZero);
      setBusy(false);
      return;
    }
    if (salePrice !== null && (!Number.isFinite(salePrice) || salePrice >= prix)) {
      setError(UI_TEXT.validationSaleLower);
      setBusy(false);
      return;
    }

    const payload = {
      nom: articleForm.nom.trim(),
      description: articleForm.description || "",
      details: articleForm.details || "",
      prix,
      actif: articleForm.actif,
      categorieId: Number(articleForm.categorieId),
      marque: articleForm.marque || "",
      matiere: articleForm.matiere || "",
      sku: articleForm.sku || "",
      salePrice,
      saleStartAt: articleForm.saleStartAt || null,
      saleEndAt: articleForm.saleEndAt || null,
      recommended: articleForm.recommended,
    };

    const fd = new FormData();
    fd.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));

    try {
      if (editingArticleId) {
        await api.put(`/api/vendeur/articles/${editingArticleId}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/api/vendeur/articles", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      articleDialogRef.current?.close();
      resetCategorySelections();
      await refresh();
      if (selectedArticle?.id) await loadArticleDetails(selectedArticle.id);
    } catch (e2) {
      setError(e2?.response?.data?.message || UI_TEXT.errSaveArticle);
    } finally {
      setBusy(false);
    }
  }

  async function deleteArticle(id) {
    if (!window.confirm(UI_TEXT.confirmDeleteArticle)) return;
    setBusy(true);
    try {
      await api.delete(`/api/vendeur/articles/${id}`);
      if (selectedArticle?.id === id) setSelectedArticle(null);
      await refresh();
    } catch (e) {
      setError(e?.response?.data?.message || UI_TEXT.errDeleteArticle);
    } finally {
      setBusy(false);
    }
  }

  function handleVariationColorChange(colorId) {
    if (isAccessoryCategory) {
      setVariationForm(prev => ({ ...prev, couleurId: colorId }));
      return;
    }
    setVariationForm(prev => ({
      ...prev,
      couleurId: colorId,
      sizeStocks: buildSizeStocks(0, colorId),
    }));
  }

  function openCreateVariation() {
    if (!selectedArticle) return;
    if (!colors.length) { setError(UI_TEXT.validationNeedColorOnly); return; }
    if (!isAccessoryCategory && !sizes.length) { setError(UI_TEXT.validationNeedColorAndSize); return; }
    const initialColorId = colors[0]?.id ? String(colors[0].id) : "";
    setEditingVariationId(null); setEditingVariationGroup(null); setVariationError("");
    setVariationForm({
      ...emptyVariationForm,
      prix: selectedArticle?.prix ?? "",
      couleurId: initialColorId,
      quantiteStock: 0,
      sizeStocks: isAccessoryCategory ? [] : buildSizeStocks(0, initialColorId),
      imageFiles: [],
      existingImageUrls: [],
      model3dFile: null,
    });
    variationDialogRef.current?.showModal();
  }

  function openEditVariationGroup(group) {
    if (!group) return;
    setEditingVariationId(null); setEditingVariationGroup(group); setVariationError("");
    if (isAccessoryCategory) {
      const item = group.items?.[0] || null;
      setVariationGroupForm({
        couleurId: String(group.couleurId), couleurNom: group.couleurNom,
        prix: item?.prix ?? group.prix ?? selectedArticle?.prix,
        rows: [{ tailleId: null, label: "Stock only", variationId: item?.id || null, checked: true, quantiteStock: item?.quantiteStock ?? 0, prix: item?.prix ?? group.prix }],
        imageFiles: [],
        existingImageUrls: group.imageUrls || [],
        model3dFile: null,
      });
    } else {
      const rows = sizes.map(s => {
        const found = group.items.find(item => Number(item.tailleId) === Number(s.id));
        return { tailleId: Number(s.id), label: s.pointure, variationId: found?.id || null, checked: !!found, quantiteStock: found?.quantiteStock ?? 0, prix: found?.prix ?? group.prix };
      });
      setVariationGroupForm({
        couleurId: String(group.couleurId), couleurNom: group.couleurNom, prix: group.prix ?? selectedArticle?.prix,
        rows,
        imageFiles: [],
        existingImageUrls: group.imageUrls || [],
        model3dFile: null,
      });
    }
    variationDialogRef.current?.showModal();
  }

  async function saveVariation(e) {
    e.preventDefault();
    if (!selectedArticle) return;
    setError(""); setVariationError("");
    const couleurId = Number(variationForm.couleurId);
    if (!couleurId) return setVariationError(UI_TEXT.validationSelectColor);

    if (isAccessoryCategory) {
      const stock = Number(variationForm.quantiteStock);
      const prix = Number(variationForm.prix ?? selectedArticle?.prix);
      if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) return setVariationError(UI_TEXT.validationAccessoryStock);
      if (!Number.isFinite(prix) || prix <= 0) return setVariationError(UI_TEXT.validationPriceGreaterThanZero);
      setBusy(true);
      try {
        const fd = new FormData();
        const payload = { prix, couleurId, quantiteStock: stock, existingImageUrls: variationForm.existingImageUrls || [] };
        fd.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
        if (variationForm.imageFiles?.length) variationForm.imageFiles.forEach(f => fd.append("images", f));
        if (variationForm.model3dFile) fd.append("model3d", variationForm.model3dFile);
        if (editingVariationId) {
          await api.put(`/api/vendeur/articles/variations/${editingVariationId}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        } else {
          await api.post(`/api/vendeur/articles/${selectedArticle.id}/variations`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        }
        variationDialogRef.current?.close();
        await loadArticleDetails(selectedArticle.id);
        await refresh();
      } catch (e2) { setError(e2?.response?.data?.message || UI_TEXT.errSaveVariation); } finally { setBusy(false); }
      return;
    }

    const activeRows = (variationForm.sizeStocks || []).filter(r => r.checked);
    if (!activeRows.length) return setVariationError(UI_TEXT.validationSelectOneSize);
    for (const row of activeRows) {
      const stock = Number(row.quantiteStock);
      if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) return setVariationError(UI_TEXT.validationStockWholeNumber.replace("{{size}}", row.label));
    }
    const prix = Number(variationForm.prix ?? selectedArticle?.prix);
    if (!Number.isFinite(prix) || prix <= 0) return setVariationError(UI_TEXT.validationPriceGreaterThanZero);
    setBusy(true);
    try {
      const fd = new FormData();
      const payload = { prix, couleurId, sizes: activeRows.map(r => ({ tailleId: Number(r.tailleId), quantiteStock: Number(r.quantiteStock) })), existingImageUrls: variationForm.existingImageUrls || [] };
      fd.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
      if (variationForm.imageFiles?.length) variationForm.imageFiles.forEach(f => fd.append("images", f));
      if (variationForm.model3dFile) fd.append("model3d", variationForm.model3dFile);
      if (editingVariationId) {
        await api.put(`/api/vendeur/articles/variations/${editingVariationId}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await api.post(`/api/vendeur/articles/${selectedArticle.id}/variations`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      }
      variationDialogRef.current?.close();
      await loadArticleDetails(selectedArticle.id);
      await refresh();
    } catch (e2) { setError(e2?.response?.data?.message || UI_TEXT.errSaveVariation); } finally { setBusy(false); }
  }

  async function saveVariationGroup(e) {
    e.preventDefault();
    if (!selectedArticle) return;
    setError(""); setVariationError("");
    const couleurId = Number(variationGroupForm.couleurId);
    if (isAccessoryCategory) {
      const stock = Number(variationGroupForm.rows[0]?.quantiteStock ?? 0);
      const prix = Number(variationGroupForm.rows[0]?.prix ?? variationGroupForm.prix);
      const variationId = variationGroupForm.rows[0]?.variationId;
      if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) return setVariationError(UI_TEXT.validationAccessoryStock);
      if (!Number.isFinite(prix) || prix <= 0) return setVariationError(UI_TEXT.validationPriceGreaterThanZero);
      setBusy(true);
      try {
        const fd = new FormData();
        const payload = { prix, couleurId, quantiteStock: stock, existingImageUrls: variationGroupForm.existingImageUrls || [] };
        fd.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
        if (variationGroupForm.imageFiles?.length) variationGroupForm.imageFiles.forEach(f => fd.append("images", f));
        if (variationGroupForm.model3dFile) fd.append("model3d", variationGroupForm.model3dFile);
        if (variationId) {
          await api.put(`/api/vendeur/articles/variations/${variationId}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        } else {
          await api.post(`/api/vendeur/articles/${selectedArticle.id}/variations`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        }
        variationDialogRef.current?.close();
        await loadArticleDetails(selectedArticle.id);
        await refresh();
      } catch (e2) { setError(e2?.response?.data?.message || UI_TEXT.errSaveVariation); } finally { setBusy(false); }
      return;
    }
    const allRows = variationGroupForm.rows || [];
    const activeRows = allRows.filter(r => r.checked);
    const existingRows = activeRows.filter(r => r.variationId);
    const newRows = activeRows.filter(r => !r.variationId);
    const removedRows = allRows.filter(r => !r.checked && r.variationId);
    if (!activeRows.length) return setVariationError(UI_TEXT.validationSelectOneSize);
    for (const row of activeRows) {
      const stock = Number(row.quantiteStock);
      const price = Number(row.prix);
      if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) return setVariationError(UI_TEXT.validationStockWholeNumber.replace("{{size}}", row.label));
      if (!Number.isFinite(price) || price <= 0) return setVariationError(UI_TEXT.validationPriceGreaterThanZero);
    }
    setBusy(true);
    try {
      for (const row of removedRows) await api.delete(`/api/vendeur/articles/variations/${row.variationId}`);
      for (const row of existingRows) {
        const fd = new FormData();
        const payload = { prix: Number(row.prix), quantiteStock: Number(row.quantiteStock), couleurId, tailleId: Number(row.tailleId), existingImageUrls: variationGroupForm.existingImageUrls || [] };
        fd.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
        if (variationGroupForm.imageFiles?.length) variationGroupForm.imageFiles.forEach(f => fd.append("images", f));
        if (variationGroupForm.model3dFile) fd.append("model3d", variationGroupForm.model3dFile);
        await api.put(`/api/vendeur/articles/variations/${row.variationId}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      }
      if (newRows.length) {
        const fd = new FormData();
        const payload = { prix: Number(newRows[0].prix), couleurId, sizes: newRows.map(r => ({ tailleId: Number(r.tailleId), quantiteStock: Number(r.quantiteStock) })) };
        fd.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
        if (variationGroupForm.imageFiles?.length) variationGroupForm.imageFiles.forEach(f => fd.append("images", f));
        if (variationGroupForm.model3dFile) fd.append("model3d", variationGroupForm.model3dFile);
        await api.post(`/api/vendeur/articles/${selectedArticle.id}/variations`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      }
      variationDialogRef.current?.close();
      await loadArticleDetails(selectedArticle.id);
      await refresh();
    } catch (e2) { setError(e2?.response?.data?.message || UI_TEXT.errSaveVariation); } finally { setBusy(false); }
  }

  async function deleteVariation(id) {
    if (!window.confirm(UI_TEXT.confirmDeleteVariation)) return;
    setBusy(true);
    try {
      await api.delete(`/api/vendeur/articles/variations/${id}`);
      await loadArticleDetails(selectedArticle.id);
      await refresh();
    } catch (e) { setError(e?.response?.data?.message || UI_TEXT.errDeleteVariation); } finally { setBusy(false); }
  }

  // Stock management
  function openStockDialog(variation, mode = "decrement") {
    if (!variation) return;
    setStockError("");
    setStockForm({ variationId: String(variation.id), label: `${variation.couleurNom}${variation.taillePointure ? ` / ${variation.taillePointure}` : ""}`, currentStock: Number(variation.quantiteStock || 0), quantity: 1, mode });
    stockDialogRef.current?.showModal();
  }

  async function submitStockUpdate(e) {
    e.preventDefault(); setStockError(""); setError("");
    const variation = variations.find(v => String(v.id) === stockForm.variationId);
    const qty = Number(stockForm.quantity);
    if (!variation) return setStockError(UI_TEXT.validationVariationNotFound);
    if (!Number.isFinite(qty) || qty <= 0 || !Number.isInteger(qty)) return setStockError(UI_TEXT.validationQuantityPositive);
    if (stockForm.mode === "decrement" && qty > stockForm.currentStock) return setStockError(UI_TEXT.validationCannotRemoveMore);
    const nextStock = stockForm.mode === "increment" ? stockForm.currentStock + qty : stockForm.currentStock - qty;
    if (nextStock < 0) return setStockError(UI_TEXT.validationNoNegativeStock);
    setBusy(true);
    try {
      const fd = new FormData();
      const payload = { prix: Number(variation.prix), quantiteStock: nextStock, couleurId: Number(variation.couleurId), tailleId: variation.tailleId != null ? Number(variation.tailleId) : null };
      fd.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
      await api.put(`/api/vendeur/articles/variations/${variation.id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      stockDialogRef.current?.close();
      await loadArticleDetails(selectedArticle.id);
      await refresh();
    } catch (e2) { setError(e2?.response?.data?.message || UI_TEXT.errStockUpdate); } finally { setBusy(false); }
  }

  if (!isVendeur) return <div className="admAlert">Access denied</div>;

  return (
    <div className="fadeInUp">
      <div className="admPage">
        <div className="admHeader">
          <div>
            <div className="admH1">{UI_TEXT.headerTitle}</div>
            <div className="admH2">{UI_TEXT.headerSubtitle}</div>
          </div>
          <div className="admHeaderRight">
            <div className="admSearchWrap">
              <input className="admSearch" value={searchQ} onChange={e => { setSearchQ(e.target.value); setArticlePage(1); }} placeholder={UI_TEXT.searchPlaceholder} />
            </div>
            <div className="catalogActionBar">
              <button type="button" className="admBtn" onClick={refresh}>Refresh</button>
              <button type="button" className="admBtn primary" onClick={openCreateArticle}>{UI_TEXT.addArticle}</button>
            </div>
          </div>
        </div>
        {error && <div className="admAlert">{error}</div>}
        <div className="admCard">
          <div className="admCardTop">
            <div className="admCardTitle">{filteredArticles.length} {UI_TEXT.articlesCount}</div>
          </div>
          <div className="adminDataTableWrap">
            <table className="adminDataTable">
              <thead>
                <tr>
                  <th>{UI_TEXT.tableArticle}</th>
                  <th>{UI_TEXT.tableCategory}</th>
                  <th>{UI_TEXT.brand}</th>
                  <th>{UI_TEXT.tablePrice}</th>
                  <th>{UI_TEXT.tableStatus}</th>
                  <th>{UI_TEXT.tableActions}</th>
                </tr>
              </thead>
              <tbody>
                {pagedArticles.map(a => {
                  const saleLive = isSaleActive(a);
                  return (
                    <tr key={a.id} className={selectedArticle?.id === a.id ? "isSelectedRow" : ""}>
                      <td>
                        <div className="tablePrimaryCell">
                          <div className="admName">{a.nom}</div>
                          <div className="admRole">#{a.id} {a.recommended ? ` • ${UI_TEXT.recommended}` : ""} {saleLive ? ` • Sale -${salePercent(a)}%` : ""}</div>
                        </div>
                      </td>
                      <td>{a.categorieNom || "-"}</td>
                      <td>{a.marque || "-"}</td>
                      <td>{saleLive ? `${fmtPrice(a.salePrice)} / ${fmtPrice(a.prix)}` : fmtPrice(a.prix)}</td>
                      <td><span className={`admBadge ${a.actif ? "ok" : "bad"}`}>{a.actif ? UI_TEXT.active : UI_TEXT.inactive}</span></td>
                      <td>
                        <div className="admRowActions">
                          <button className="admBtn mini" onClick={() => loadArticleDetails(a.id)}>{UI_TEXT.details}</button>
                          <button className="admBtn mini" onClick={() => openEditArticle(a)}>{UI_TEXT.edit}</button>
                          <button className="admBtn mini danger" onClick={() => deleteArticle(a.id)}>{UI_TEXT.delete}</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!pagedArticles.length && (
                  <tr><td colSpan="6"><div className="admEmpty">{UI_TEXT.noArticles}</div></td></tr>
                )}
              </tbody>
            </table>
          </div>
          <TablePager total={filteredArticles.length} page={articlePage} setPage={setArticlePage} rows={articleRows} setRows={setArticleRows} rowsOptions={[5,10,25,50]} />
        </div>

        <div className="admCard">
          <div className="admCardTop catalogPanelTop">
            <div><div className="admCardTitle">{UI_TEXT.variations}{selectedArticle ? ` — ${selectedArticle.nom}` : ""}</div><div className="variationHint">{!selectedArticle ? UI_TEXT.selectArticle : isAccessoryCategory ? UI_TEXT.accessoryVariationCreateHelp : UI_TEXT.variationsHint}</div></div>
            {selectedArticle && <div className="admRowActions"><button className="admBtn primary" onClick={openCreateVariation}>{UI_TEXT.addVariation}</button></div>}
          </div>
          {!selectedArticle ? <div className="admEmpty">{UI_TEXT.selectArticle}</div> : (
            <>
              <div className="selectedArticleSummary">
                <div className="summaryBlock"><strong>{UI_TEXT.price}:</strong> {fmtPrice(selectedArticle.prix)}</div>
                <div className="summaryBlock"><strong>{UI_TEXT.salePrice}:</strong> {fmtPrice(selectedArticle.salePrice)}</div>
                <div className="summaryBlock"><strong>{UI_TEXT.brand}:</strong> {selectedArticle.marque || "-"}</div>
                <div className="summaryBlock"><strong>{UI_TEXT.material}:</strong> {selectedArticle.matiere || "-"}</div>
                <div className="summaryBlock"><strong>{UI_TEXT.sku}:</strong> {selectedArticle.sku || "-"}</div>
                <div className="summaryBlock"><strong>{UI_TEXT.onSaleNow}:</strong> {isSaleActive(selectedArticle) ? UI_TEXT.yes : UI_TEXT.no}</div>
              </div>
              <div className="adminDataTableWrap">
                <table className="adminDataTable">
                  <thead>
                    <tr>
                      <th>Details</th>
                      <th>Color</th>
                      <th>Sizes & stock</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>3D Model</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedVariations.map(v => {
                      const previewUrl = v.imageUrls?.[0] ? fullImageUrl(v.imageUrls[0], variationImageVersion(v)) : "";
                      return (
                        <tr key={v.id}>
                          <td>
                            <div className="variationTableInfo">
                              <div className="variationThumbWrap">
                                {previewUrl ? <img src={previewUrl} className="variationTableThumb" alt="" /> : <div className="variationTableThumb fallback">No image</div>}
                              </div>
                              <div>
                                <div className="admName">{v.couleurNom}</div>
                                <div className="admRole">{v.taillePointure ? `${v.taillePointure}` : "Accessory"}</div>
                              </div>
                            </div>
                          </td>
                          <td><div className="colorCell">{v.couleurCodeHex && <span className="colorDot" style={{ background: v.couleurCodeHex }} />}{v.couleurNom}</div></td>
                          <td><span className="sizeStockBadge">{v.taillePointure || "Stock"}: {v.quantiteStock}</span></td>
                          <td>{fmtPrice(v.prix)}</td>
                          <td><span className={`admBadge ${v.quantiteStock > 0 ? "ok" : "bad"}`}>{v.quantiteStock}</span></td>
                          <td>{v.model3dUrl ? "Yes" : "No"}</td>
                          <td>
                            <div className="admRowActions wrap">
                              <button className="admBtn mini" onClick={() => openEditVariationGroup({ couleurId: v.couleurId, couleurNom: v.couleurNom, prix: v.prix, imageUrls: v.imageUrls, items: [v] })}>{UI_TEXT.bulkEditVariation}</button>
                              <button className="admBtn mini" onClick={() => openStockDialog(v, "increment")}>{UI_TEXT.restock}</button>
                              <button className="admBtn mini" onClick={() => openStockDialog(v, "decrement")}>{UI_TEXT.useQty}</button>
                              <button className="admBtn mini danger" onClick={() => deleteVariation(v.id)}>{UI_TEXT.delete}</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {!pagedVariations.length && (
                      <tr><td colSpan="7"><div className="admEmpty">{UI_TEXT.noVariations}</div></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <TablePager total={variations.length} page={variationPage} setPage={setVariationPage} rows={variationRows} setRows={setVariationRows} rowsOptions={[3,5,10,25]} />
            </>
          )}
        </div>
      </div>

      {/* Article Dialog with 3-level category selection */}
      <dialog ref={articleDialogRef} className="admDialog productDialog">
        <div className="admDialogHead">
          <div className="admDialogTitle">{editingArticleId ? UI_TEXT.articleDialogEdit : UI_TEXT.articleDialogAdd}</div>
          <button className="admBtn mini" onClick={() => articleDialogRef.current?.close()}>{UI_TEXT.close}</button>
        </div>
        <form className="productForm admDialogBody" onSubmit={saveArticle}>
          <label><span>{UI_TEXT.productName}</span><input value={articleForm.nom} onChange={e => setArticleForm({...articleForm, nom: e.target.value})} required /></label>

          <label><span>{UI_TEXT.mainCategoryLabel}</span>
            <select value={selectedMainCat} onChange={async (e) => {
              const mainId = e.target.value;
              setSelectedMainCat(mainId);
              setSelectedSubCat("");
              setSelectedSubSubCat("");
              setArticleForm({ ...articleForm, categorieId: "" });
              if (mainId) await loadSubCategories(mainId);
              else { setSubCategories([]); setSubSubCategories([]); }
            }} required>
              <option value="">{UI_TEXT.selectMainCategory}</option>
              {mainCategories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </label>

          {subCategories.length > 0 && (
            <label><span>{UI_TEXT.subCategoryLabel}</span>
              <select value={selectedSubCat} onChange={async (e) => {
                const subId = e.target.value;
                setSelectedSubCat(subId);
                setSelectedSubSubCat("");
                if (subSubCategories.length === 0) setArticleForm({ ...articleForm, categorieId: subId });
                else setArticleForm({ ...articleForm, categorieId: "" });
                if (subId) await loadSubSubCategories(subId);
                else setSubSubCategories([]);
              }} required>
                <option value="">{UI_TEXT.selectSubCategory}</option>
                {subCategories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </label>
          )}

          {subSubCategories.length > 0 && (
            <label><span>{UI_TEXT.subSubCategoryLabel}</span>
              <select value={selectedSubSubCat} onChange={(e) => {
                const subSubId = e.target.value;
                setSelectedSubSubCat(subSubId);
                setArticleForm({ ...articleForm, categorieId: subSubId });
              }} required>
                <option value="">{UI_TEXT.selectProductType}</option>
                {subSubCategories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </label>
          )}

          <label><span>{UI_TEXT.price}</span><input type="number" step="0.001" min="0.001" value={articleForm.prix} onChange={e => setArticleForm({...articleForm, prix: e.target.value})} required /></label>
          <label><span>{UI_TEXT.salePrice}</span><input type="number" step="0.001" min="0" value={articleForm.salePrice} onChange={e => setArticleForm({...articleForm, salePrice: e.target.value})} /></label>
          <label><span>{UI_TEXT.saleStart}</span><input type="datetime-local" value={articleForm.saleStartAt} onChange={e => setArticleForm({...articleForm, saleStartAt: e.target.value})} /></label>
          <label><span>{UI_TEXT.saleEnd}</span><input type="datetime-local" value={articleForm.saleEndAt} onChange={e => setArticleForm({...articleForm, saleEndAt: e.target.value})} /></label>
          <label><span>{UI_TEXT.brand}</span><input value={articleForm.marque} onChange={e => setArticleForm({...articleForm, marque: e.target.value})} /></label>
          <label><span>{UI_TEXT.material}</span><input value={articleForm.matiere} onChange={e => setArticleForm({...articleForm, matiere: e.target.value})} /></label>
          <label><span>{UI_TEXT.sku}</span><input value={articleForm.sku} onChange={e => setArticleForm({...articleForm, sku: e.target.value})} /></label>
          <label className="checkRow"><input type="checkbox" checked={articleForm.actif} onChange={e => setArticleForm({...articleForm, actif: e.target.checked})} /><span>{UI_TEXT.activeProduct}</span></label>
          <label className="checkRow"><input type="checkbox" checked={articleForm.recommended} onChange={e => setArticleForm({...articleForm, recommended: e.target.checked})} /><span>{UI_TEXT.bestChoice}</span></label>
          <label className="fullCol"><span>{UI_TEXT.shortDescription}</span><textarea rows="4" value={articleForm.description} onChange={e => setArticleForm({...articleForm, description: e.target.value})} /></label>
          <label className="fullCol"><span>{UI_TEXT.moreInformations}</span><textarea rows="6" value={articleForm.details} onChange={e => setArticleForm({...articleForm, details: e.target.value})} /></label>
          <div className="admDialogActions fullCol"><button type="submit" className="admBtn primary" disabled={busy}>{editingArticleId ? UI_TEXT.updateArticle : UI_TEXT.saveArticle}</button></div>
        </form>
      </dialog>

      {/* Variation Dialog - Accessory shows only color + stock, no sizes */}
      <dialog ref={variationDialogRef} className="admDialog admDialogWide">
        <div className="admDialogHead">
          <div className="admDialogTitle">{editingVariationGroup ? UI_TEXT.bulkEditVariation : editingVariationId ? UI_TEXT.variationDialogEdit : UI_TEXT.variationDialogAdd}</div>
          <button className="admBtn mini" onClick={() => variationDialogRef.current?.close()}>{UI_TEXT.close}</button>
        </div>
        <form className="productForm admDialogBody" onSubmit={editingVariationGroup ? saveVariationGroup : saveVariation}>
          <div className="variationHelp fullCol">{editingVariationGroup ? `Color group: ${variationGroupForm?.couleurNom}` : isAccessoryCategory ? UI_TEXT.accessoryVariationCreateHelp : UI_TEXT.variationCreateHelp}</div>
          {variationError && <div className="admAlert fullCol">{variationError}</div>}
          {!editingVariationGroup ? (
            <>
              <label><span>{UI_TEXT.colorLabel}</span>
                <select value={variationForm.couleurId} onChange={e => handleVariationColorChange(e.target.value)} required>
                  <option value="">{UI_TEXT.selectColor}</option>
                  {colors.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </label>
              <label><span>{UI_TEXT.price}</span><input type="number" min="0.001" step="0.001" value={variationForm.prix} onChange={e => setVariationForm({...variationForm, prix: e.target.value})} required /></label>
            </>
          ) : (
            <>
              <label><span>{UI_TEXT.colorLabel}</span><input value={variationGroupForm.couleurNom} disabled /></label>
              <label><span>{UI_TEXT.price}</span><input value={variationGroupForm.prix} disabled /></label>
            </>
          )}

          {isAccessoryCategory ? (
            <div className="fullCol variationAccessoryBox">
              <label><span>{UI_TEXT.stockLabel}</span>
                <input type="number" min="0" step="1" value={editingVariationGroup ? variationGroupForm.rows[0]?.quantiteStock ?? 0 : variationForm.quantiteStock ?? 0}
                  onChange={e => {
                    const val = e.target.value;
                    if (editingVariationGroup) {
                      setVariationGroupForm(prev => ({...prev, rows: prev.rows.map((r,i) => i===0 ? {...r, quantiteStock: val} : r)}));
                    } else {
                      setVariationForm({...variationForm, quantiteStock: val});
                    }
                  }} required />
              </label>
            </div>
          ) : (
            <div className="fullCol variationCurrentImages">
              <div className="variationHelp">Selected sizes: {(editingVariationGroup ? variationGroupForm.rows : variationForm.sizeStocks || []).filter(r => r.checked).length}</div>
              <div className="sizeStockGrid">
                {(editingVariationGroup ? variationGroupForm.rows : variationForm.sizeStocks || []).map(item => (
                  <label key={item.tailleId} className={`sizeStockCard ${item.checked ? "active" : ""} ${item.disabled ? "disabled" : ""}`}>
                    <div className="sizeStockTop">
                      <div className="sizeStockCheck">
                        <input type="checkbox" checked={!!item.checked} disabled={!editingVariationGroup && item.disabled}
                          onChange={e => {
                            if (editingVariationGroup) {
                              setVariationGroupForm(prev => ({...prev, rows: prev.rows.map(r => r.tailleId === item.tailleId ? {...r, checked: e.target.checked} : r)}));
                            } else {
                              setVariationForm(prev => ({...prev, sizeStocks: prev.sizeStocks.map(s => s.tailleId === item.tailleId ? {...s, checked: e.target.checked} : s)}));
                            }
                          }} />
                        <span>{UI_TEXT.sizeLabel} {item.label} {!editingVariationGroup && item.disabled ? ` • ${UI_TEXT.alreadyExists}` : ""}</span>
                      </div>
                    </div>
                    <div className="sizeStockBody">
                      <span>{UI_TEXT.stockLabel}</span>
                      <input type="number" min="0" step="1" value={item.quantiteStock} disabled={!item.checked}
                        onChange={e => {
                          if (editingVariationGroup) {
                            setVariationGroupForm(prev => ({...prev, rows: prev.rows.map(r => r.tailleId === item.tailleId ? {...r, quantiteStock: e.target.value} : r)}));
                          } else {
                            setVariationForm(prev => ({...prev, sizeStocks: prev.sizeStocks.map(s => s.tailleId === item.tailleId ? {...s, quantiteStock: e.target.value} : s)}));
                          }
                        }} />
                    </div>
                    {editingVariationGroup && (
                      <div className="sizeStockBody">
                        <span>{UI_TEXT.price}</span>
                        <input type="number" min="0.001" step="0.001" value={item.prix} disabled={!item.checked}
                          onChange={e => setVariationGroupForm(prev => ({...prev, rows: prev.rows.map(r => r.tailleId === item.tailleId ? {...r, prix: e.target.value} : r)}))} />
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          <label className="fullCol"><span>{UI_TEXT.variationImages}</span><input type="file" accept="image/*" multiple onChange={e => { const files = Array.from(e.target.files || []); if (editingVariationGroup) setVariationGroupForm(prev => ({...prev, imageFiles: files})); else setVariationForm(prev => ({...prev, imageFiles: files})); }} /></label>
          <label className="fullCol"><span>{UI_TEXT.model3d}</span><input type="file" accept=".glb,.gltf" onChange={e => { const file = e.target.files?.[0] || null; if (editingVariationGroup) setVariationGroupForm(prev => ({...prev, model3dFile: file})); else setVariationForm(prev => ({...prev, model3dFile: file})); }} /></label>
          <div className="fullCol variationHelp">{UI_TEXT.variationImageHint}</div>
          <div className="admDialogActions fullCol"><button type="submit" className="admBtn primary" disabled={busy}>{editingVariationGroup ? "Save all sizes" : editingVariationId ? UI_TEXT.updateVariation : UI_TEXT.saveVariation}</button></div>
        </form>
      </dialog>

      {/* Stock Dialog */}
      <dialog ref={stockDialogRef} className="admDialog productDialog">
        <div className="admDialogHead">
          <div className="admDialogTitle">{stockForm.mode === "increment" ? UI_TEXT.stockDialogRestock : UI_TEXT.stockDialogUse}</div>
          <button className="admBtn mini" onClick={() => stockDialogRef.current?.close()}>{UI_TEXT.close}</button>
        </div>
        <form className="productForm admDialogBody" onSubmit={submitStockUpdate}>
          <div className="variationHelp fullCol">{UI_TEXT.variationField}: {stockForm.label}</div>
          <div className="variationHelp fullCol"><strong>{UI_TEXT.currentStock}:</strong> {stockForm.currentStock}</div>
          {stockError && <div className="admAlert fullCol">{stockError}</div>}
          <label className="fullCol"><span>{stockForm.mode === "increment" ? UI_TEXT.addQuantity : UI_TEXT.removeQuantity}</span><input type="number" min="1" step="1" value={stockForm.quantity} onChange={e => setStockForm({...stockForm, quantity: e.target.value})} required /></label>
          <div className="variationHelp fullCol" style={{ marginTop: "8px", fontWeight: "bold" }}>{UI_TEXT.newStockAfterUpdate}: {stockForm.mode === "increment" ? stockForm.currentStock + Number(stockForm.quantity) : stockForm.currentStock - Number(stockForm.quantity)}</div>
          <div className="admDialogActions fullCol"><button type="submit" className="admBtn primary" disabled={busy}>{stockForm.mode === "increment" ? UI_TEXT.confirmRestock : UI_TEXT.confirmStockRemoval}</button></div>
        </form>
      </dialog>
    </div>
  );
}