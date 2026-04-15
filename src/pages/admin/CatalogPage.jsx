import { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";

import {
    emptyArticleForm,
    emptyCategoryForm,
    emptyColorForm,
    emptySizeForm,
    emptyVariationForm,
    fmt,
    fmtPrice,
    fullImageUrl,
    isSaleActive,
    salePercent,
    toInputDateTime,
    variationImageVersion,
} from "./adminShared";

const UI_TEXT = {
    accessDenied: "Access denied.",
    headerTitle: "Catalog",
    headerSubtitle: "Manage products, categories, colors and sizes",
    searchPlaceholder: "Search articles",
    filterCategory: "Filter by category",
    allCategories: "All categories",
    refresh: "Refresh",
    history: "History",
    addSize: "Add size",
    addCategory: "Add category",
    addColor: "Add color",
    addArticle: "Add article",
    articlesCount: "articles",
    tableArticle: "Article",
    tableCategory: "Category",
    tablePrice: "Price",
    tableStatus: "Status",
    tableActions: "Actions",
    tableDetails: "Details",
    tableColor: "Color",
    tableSize: "Size",
    tableStock: "Stock",
    tableModel: "3D Model",
    recommended: "Recommended",
    active: "ACTIVE",
    inactive: "INACTIVE",
    edit: "Edit",
    delete: "Delete",
    details: "See details",
    noArticles: "No articles",
    bulkEditVariation: "Edit color variations",
    sizesAndStock: "Sizes & stock",
    saveAllSizes: "Save all sizes",
    colorGroup: "Color group",
    noSizesInColor: "No sizes for this color",
    selectArticle: "Select an article",
    noImage: "No image",
    price: "Price",
    salePrice: "Sale price",
    saleStart: "Sale start",
    saleEnd: "Sale end",
    onSaleNow: "On sale now",
    brand: "Brand",
    material: "Material",
    sku: "SKU",
    yes: "Yes",
    no: "No",
    editArticle: "Edit article",
    addVariation: "Add variation",
    variations: "Variations",
    variationsHint: "One article can have many combinations like Black 41, Black 42, White 41, White 42.",
    variationsHintAccessory: "Accessory articles use one stock field per color variation, without sizes.",
    stockOnly: "Stock only",
    stockLabel: "Stock",
    colorLabel: "Color",
    sizeLabel: "Size",
    modelAttached: "3D model attached",
    noModel: "No 3D model",
    sellOne: "Sell 1",
    useQty: "Use qty",
    restock: "Restock",
    historyTitle: "History",
    historyHint: "Track create, update, delete, and stock changes for the selected item.",
    articleHistory: "Article history",
    variationHistory: "Variation history",
    selectVariation: "Select variation",
    loadingHistory: "Loading history...",
    noHistory: "No history",
    categories: "Categories",
    colors: "Colors",
    sizes: "Sizes",
    noCategories: "No categories",
    noColors: "No colors",
    noSizes: "No sizes",
    close: "Close",
    articleDialogAdd: "Add article",
    articleDialogEdit: "Edit article",
    productName: "Product name",
    selectCategory: "Select category",
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
    noVariations: "No variations",
    stockDialogRestock: "Restock variation",
    stockDialogUse: "Use / sell variation",
    variationField: "Variation",
    currentStock: "Current stock",
    addQuantity: "Add quantity",
    removeQuantity: "Remove quantity",
    newStockAfterUpdate: "New stock after update",
    confirmRestock: "Confirm restock",
    confirmStockRemoval: "Confirm stock removal",
    categoryDialogAdd: "Add category",
    categoryDialogEdit: "Edit category",
    categoryName: "Category name",
    description: "Description",
    saveCategory: "Save category",
    updateCategory: "Update category",
    colorDialogAdd: "Add color",
    colorDialogEdit: "Edit color",
    colorName: "Color name",
    hexColor: "Hex color",
    saveColor: "Save color",
    updateColor: "Update color",
    sizeDialogAdd: "Add size",
    sizeDialogEdit: "Edit size",
    saveSize: "Save size",
    updateSize: "Update size",
    errLoadCatalog: "Cannot load catalog",
    errLoadArticle: "Cannot load article",
    errLoadArticleHistory: "Cannot load article history",
    errLoadVariationHistory: "Cannot load variation history",
    errSaveArticle: "Save article failed",
    errDeleteArticle: "Delete article failed",
    errSaveVariation: "Save variation failed",
    errDeleteVariation: "Delete variation failed",
    errStockUpdate: "Stock update failed",
    errSaveCategory: "Save category failed",
    errDeleteCategory: "Delete category failed",
    errSaveColor: "Save color failed",
    errDeleteColor: "Delete color failed",
    errSaveSize: "Save size failed",
    errDeleteSize: "Delete size failed",
    validationArticleName: "Article name is required.",
    validationCategoryRequired: "Category is required.",
    validationPriceGreaterThanZero: "Price must be greater than 0.",
    validationSaleLower: "Sale price must be lower than the main price.",
    validationSaleDates: "Sale end date must be after sale start date.",
    validationNeedColorOnly: "Create at least one color before adding a variation.",
    validationNeedColorAndSize: "Create at least one color and one size before adding a variation.",
    validationSelectColor: "Please select a color.",
    validationSelectOneSize: "Please select at least one size.",
    validationEditOneSize: "Edit mode supports one size only.",
    validationAccessoryStock: "Stock must be a whole number equal to or greater than 0.",
    validationStockWholeNumber: "Stock for size {{size}} must be a whole number equal to or greater than 0.",
    validationOutOfStock: "This variation is already out of stock.",
    validationVariationNotFound: "Variation not found.",
    validationQuantityPositive: "Quantity must be a whole number greater than 0.",
    validationCannotRemoveMore: "Cannot remove more than the current stock.",
    validationNoNegativeStock: "Resulting stock cannot be negative.",
    validationCategoryName: "Category name is required.",
    validationColorName: "Color name is required.",
    validationSizeRequired: "Size is required.",
    confirmDeleteArticle: "Delete this article?",
    confirmDeleteVariation: "Delete this variation?",
    confirmDeleteCategory: "Delete this category?",
    confirmDeleteColor: "Delete this color?",
    confirmDeleteSize: "Delete this size?",
};

function TablePager({ total, page, setPage, rows, setRows, rowsOptions = [3, 5, 10, 25, 50] }) {
    const totalPages = Math.max(1, Math.ceil(total / rows));

    useEffect(() => {
        if (page > totalPages) setPage(1);
    }, [page, totalPages, setPage]);

    const start = total === 0 ? 0 : (page - 1) * rows + 1;
    const end = Math.min(page * rows, total);
    return (
        <div className="tablePager">
            <div className="tablePagerLeft">
                <button type="button" className="admBtn mini" onClick={() => setPage(1)} disabled={page === 1}>{"<<"}</button>
                <button type="button" className="admBtn mini" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>{"<"}</button>
                <span className="tablePagerReport">{start} to {end} of {total}</span>
                <button type="button" className="admBtn mini" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>{">"}</button>
                <button type="button" className="admBtn mini" onClick={() => setPage(totalPages)} disabled={page === totalPages}>{">>"}</button>
            </div>
            <div className="tablePagerRight">
                <span>Rows</span>
                <select className="admSearch pagerSelect" value={rows} onChange={(e) => { setRows(Number(e.target.value)); setPage(1); }}>
                    {rowsOptions.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
            </div>
        </div>
    );
}

export default function CatalogPage() {
    const { t } = useTranslation();
    const { isAdminGeneral, isVendeur } = useOutletContext();

    const tx = (key, fallback) => {
        const value = t(key);
        return !value || value === key ? fallback : value;
    };

    const [articles, setArticles] = useState([]);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [catalogQ, setCatalogQ] = useState("");
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("");
    const [catalogError, setCatalogError] = useState("");
    const [busyCatalog, setBusyCatalog] = useState(false);

    const [categories, setCategories] = useState([]);
    const [colors, setColors] = useState([]);
    const [sizes, setSizes] = useState([]);
    const [variations, setVariations] = useState([]);

    const [articleForm, setArticleForm] = useState({ ...emptyArticleForm });
    const [variationForm, setVariationForm] = useState({ ...emptyVariationForm });
    const [variationError, setVariationError] = useState("");
    const [categoryForm, setCategoryForm] = useState({ ...emptyCategoryForm });
    const [colorForm, setColorForm] = useState({ ...emptyColorForm });
    const [sizeForm, setSizeForm] = useState({ ...emptySizeForm });

    const [editingArticleId, setEditingArticleId] = useState(null);
    const [editingVariationId, setEditingVariationId] = useState(null);
    const [editingVariationGroup, setEditingVariationGroup] = useState(null);
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [editingColorId, setEditingColorId] = useState(null);
    const [editingSizeId, setEditingSizeId] = useState(null);

    const [variationGroupForm, setVariationGroupForm] = useState({
        couleurId: "",
        couleurNom: "",
        prix: "",
        rows: [],
        imageFiles: [],
        existingImageUrls: [],
        model3dFile: null,
        existingModel3dUrl: "",
        existingModel3dName: "",
        existingModel3dType: "",
    });

    const [historyMode, setHistoryMode] = useState("article");
    const [historyRows, setHistoryRows] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [selectedVariationHistoryId, setSelectedVariationHistoryId] = useState("");

    const [stockError, setStockError] = useState("");
    const [stockForm, setStockForm] = useState({ variationId: "", label: "", currentStock: 0, quantity: 1, mode: "decrement" });

    const [failedVariationImages, setFailedVariationImages] = useState({});
    const [failedHistoryActors, setFailedHistoryActors] = useState({});

    const [articlePage, setArticlePage] = useState(1);
    const [articleRows, setArticleRows] = useState(5);
    const [variationPage, setVariationPage] = useState(1);
    const [variationRows, setVariationRows] = useState(3);
    const [categoryPage, setCategoryPage] = useState(1);
    const [categoryRows, setCategoryRows] = useState(3);
    const [colorPage, setColorPage] = useState(1);
    const [colorRows, setColorRows] = useState(3);
    const [sizePage, setSizePage] = useState(1);
    const [sizeRows, setSizeRows] = useState(3);

    const articleDialogRef = useRef(null);
    const variationDialogRef = useRef(null);
    const categoryDialogRef = useRef(null);
    const colorDialogRef = useRef(null);
    const sizeDialogRef = useRef(null);
    const stockDialogRef = useRef(null);
    const historySectionRef = useRef(null);

    const colorNameById = useMemo(() => Object.fromEntries(colors.map((c) => [Number(c.id), c.nom])), [colors]);

    const isAccessoryCategory = useMemo(() => {
        const raw = selectedArticle?.categorieNom || "";
        const normalized = raw.trim().toLowerCase();
        return normalized === "accessoire" || normalized === "accessory" || normalized === "accessories";
    }, [selectedArticle?.categorieNom]);

    function variationDisplayName(v) {
        if (!v) return "";
        const color = v.couleurNom || UI_TEXT.colorLabel;
        const size = v.taillePointure || "";
        return size ? `${color} / ${size}` : color;
    }

    function normalizeVariationImageUrl(item) {
        if (!item) return "";
        if (typeof item === "string") return item.trim();
        return String(item.url || item.imageUrl || item.path || item.fileUrl || item.downloadUrl || item.contentUrl || item.src || item.href || item.publicUrl || "").trim();
    }

    function getVariationImageUrls(source) {
        if (!source) return [];
        const variationId = source.id;
        const urls = [];

        const pushValue = (value) => {
            const normalized = normalizeVariationImageUrl(value);
            if (normalized) urls.push(normalized);
        };

        if (Array.isArray(source.images)) source.images.forEach(pushValue);
        if (Array.isArray(source.imageUrls)) source.imageUrls.forEach(pushValue);
        if (Array.isArray(source.existingImageUrls)) source.existingImageUrls.forEach(pushValue);
        if (Array.isArray(source.files)) source.files.forEach(pushValue);

        if (Array.isArray(source.imageIds)) {
            source.imageIds.forEach((id) => {
                if (variationId && id) urls.push(`/api/catalog/variations/${variationId}/images/${id}`);
            });
        }

        [source.image, source.image1, source.image2, source.image3, source.image4, source.imageUrl, source.imageUrl1, source.imageUrl2, source.imageUrl3, source.imageUrl4, source.existingImage1, source.existingImage2, source.existingImage3, source.existingImage4, source.previewImage, source.thumbnail, source.fileName, source.filename].forEach(pushValue);

        if (source.imageId && variationId) urls.push(`/api/catalog/variations/${variationId}/images/${source.imageId}`);
        return [...new Set(urls.filter(Boolean))];
    }

    function removeExistingVariationImage(indexToRemove) {
        if (editingVariationGroup) {
            setVariationGroupForm((prev) => ({
                ...prev,
                existingImageUrls: (prev.existingImageUrls || []).filter((_, index) => index !== indexToRemove),
            }));
            return;
        }

        setVariationForm((prev) => ({
            ...prev,
            existingImageUrls: (prev.existingImageUrls || []).filter((_, index) => index !== indexToRemove),
        }));
    }

    const groupedVariationRows = useMemo(() => {
        const map = new Map();
        for (const v of variations) {
            const colorKey = String(v.couleurId || v.couleurNom || v.id);

            if (!map.has(colorKey)) {
                map.set(colorKey, {
                    key: colorKey,
                    couleurId: v.couleurId,
                    couleurNom: v.couleurNom || colorNameById[Number(v.couleurId)] || "-",
                    couleurCodeHex: v.couleurCodeHex || "",
                    prix: v.prix,
                    quantiteStock: 0,
                    model3dUrl: v.model3dUrl || "",
                    model3dName: v.model3dName || "",
                    model3dType: v.model3dType || "",
                    imageUrls: getVariationImageUrls(v),
                    items: [],
                });
            }

            const group = map.get(colorKey);
            group.items.push(v);
            group.quantiteStock += Number(v.quantiteStock || 0);

            if (!group.model3dUrl && v.model3dUrl) {
                group.model3dUrl = v.model3dUrl;
                group.model3dName = v.model3dName || "";
                group.model3dType = v.model3dType || "";
            }

            const currentImages = getVariationImageUrls(v);
            if (!group.imageUrls?.length && currentImages.length) {
                group.imageUrls = currentImages;
            }
        }

        return Array.from(map.values()).map((group) => ({
            ...group,
            sizesLabel: group.items.length
                ? group.items.map((item) => `${item.taillePointure || UI_TEXT.stockOnly}: ${Number(item.quantiteStock || 0)}`).join(" | ")
                : UI_TEXT.noSizesInColor,
        }));
    }, [variations, colorNameById]);

    const filteredArticles = useMemo(() => {
        const s = catalogQ.trim().toLowerCase();
        return articles.filter((a) => {
            const matchesText = !s ? true : `${a.nom || ""} ${a.description || ""} ${a.categorieNom || ""} ${a.marque || ""} ${a.sku || ""}`.toLowerCase().includes(s);
            const matchesCategory = !selectedCategoryFilter ? true : String(a.categorieId) === String(selectedCategoryFilter);
            return matchesText && matchesCategory;
        });
    }, [catalogQ, selectedCategoryFilter, articles]);

    const pagedArticles = useMemo(() => filteredArticles.slice((articlePage - 1) * articleRows, (articlePage - 1) * articleRows + articleRows), [filteredArticles, articlePage, articleRows]);
    const pagedVariations = useMemo(() => groupedVariationRows.slice((variationPage - 1) * variationRows, (variationPage - 1) * variationRows + variationRows), [groupedVariationRows, variationPage, variationRows]);
    const pagedCategories = useMemo(() => categories.slice((categoryPage - 1) * categoryRows, (categoryPage - 1) * categoryRows + categoryRows), [categories, categoryPage, categoryRows]);
    const pagedColors = useMemo(() => colors.slice((colorPage - 1) * colorRows, (colorPage - 1) * colorRows + colorRows), [colors, colorPage, colorRows]);
    const pagedSizes = useMemo(() => sizes.slice((sizePage - 1) * sizeRows, (sizePage - 1) * sizeRows + sizeRows), [sizes, sizePage, sizeRows]);

    const variationSelectedCount = useMemo(() => (variationForm.sizeStocks || []).filter((x) => x.checked).length, [variationForm.sizeStocks]);
    const selectedStockVariation = useMemo(() => variations.find((v) => String(v.id) === String(stockForm.variationId)) || null, [variations, stockForm.variationId]);

    const stockNextValue = useMemo(() => {
        const qty = Number(stockForm.quantity || 0);
        const current = Number(stockForm.currentStock || 0);
        if (!Number.isFinite(qty) || qty < 0) return current;
        return stockForm.mode === "increment" ? current + qty : current - qty;
    }, [stockForm]);

    function scrollToHistory() { historySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }
    function variationImageKey(variationId, url) { return `${variationId || "new"}::${url || "no-image"}`; }
    function isVariationImageBroken(variationId, url) { return !!failedVariationImages[variationImageKey(variationId, url)]; }
    function handleVariationImageError(variationId, url) { setFailedVariationImages((prev) => ({ ...prev, [variationImageKey(variationId, url)]: true })); }
    function historyActorKey(row) { return String(row?.actorUserId || row?.id || row?.actorEmail || Math.random()); }
    function isHistoryActorBroken(row) { return !!failedHistoryActors[historyActorKey(row)]; }
    function handleHistoryActorError(row) { setFailedHistoryActors((prev) => ({ ...prev, [historyActorKey(row)]: true })); }

    function initials(name) {
        if (!name) return "?";
        return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
    }

    async function loadArticleHistory(articleId) {
        if (!articleId) return setHistoryRows([]);
        setHistoryLoading(true);
        try {
            const res = await api.get(`/api/admin/articles/${articleId}/history`);
            setHistoryRows(res.data || []);
        } catch (e) {
            setHistoryRows([]);
            setCatalogError(e?.response?.data?.message || e.message || UI_TEXT.errLoadArticleHistory);
        } finally {
            setHistoryLoading(false);
        }
    }

    async function loadVariationHistory(variationId) {
        if (!variationId) return setHistoryRows([]);
        setHistoryLoading(true);
        try {
            const res = await api.get(`/api/admin/variations/${variationId}/history`);
            setHistoryRows(res.data || []);
        } catch (e) {
            setHistoryRows([]);
            setCatalogError(e?.response?.data?.message || e.message || UI_TEXT.errLoadVariationHistory);
        } finally {
            setHistoryLoading(false);
        }
    }

    async function syncHistory(articleData, variationData) {
        if (!articleData) return setHistoryRows([]);
        if (historyMode === "variation") {
            const candidateId = selectedVariationHistoryId || variationData?.[0]?.id || "";
            setSelectedVariationHistoryId(candidateId ? String(candidateId) : "");
            if (candidateId) await loadVariationHistory(candidateId);
            else setHistoryRows([]);
        } else {
            await loadArticleHistory(articleData.id);
        }
    }

    async function loadArticleDetails(id) {
        const [res, vr] = await Promise.all([api.get(`/api/articles/${id}`), api.get(`/api/admin/articles/${id}/variations`)]);
        const articleData = res.data || {};
        const publicVariations = Array.isArray(articleData.variations) ? articleData.variations : [];
        const adminVariations = Array.isArray(vr.data) ? vr.data : [];
        const publicMap = new Map(publicVariations.map((v) => [String(v.id), v]));

        const mergedVariations = adminVariations.map((v) => {
            const pub = publicMap.get(String(v.id)) || {};
            return {
                ...pub,
                ...v,
                imageUrls: Array.isArray(v.imageUrls) && v.imageUrls.length ? v.imageUrls : Array.isArray(pub.imageUrls) ? pub.imageUrls : [],
                model3dUrl: v.model3dUrl || pub.model3dUrl || "",
                couleurNom: v.couleurNom || pub.couleurNom || "",
                couleurCodeHex: v.couleurCodeHex || pub.couleurCodeHex || "",
                taillePointure: v.taillePointure || pub.taillePointure || "",
            };
        });

        setSelectedArticle(articleData);
        setVariations(mergedVariations);
        setVariationPage(1);
        setCatalogError("");

        if (historyMode === "variation") {
            const stillExists = mergedVariations.some((v) => String(v.id) === String(selectedVariationHistoryId));
            const nextVariationId = stillExists ? selectedVariationHistoryId : mergedVariations[0]?.id ? String(mergedVariations[0].id) : "";
            setSelectedVariationHistoryId(nextVariationId);
        }

        await syncHistory(articleData, mergedVariations);
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
            setHistoryRows([]);
            setSelectedVariationHistoryId("");
            return;
        }

        if (pickFirst) {
            await loadArticleDetails(list[0].id);
            return;
        }

        const stillExists = selectedArticle && list.some((x) => x.id === selectedArticle.id);
        if (stillExists) await loadArticleDetails(selectedArticle.id);
        else await loadArticleDetails(list[0].id);
    }

    useEffect(() => { refreshCatalog(true).catch((e) => setCatalogError(e?.response?.data?.message || e.message || UI_TEXT.errLoadCatalog)); }, []);
    useEffect(() => { setFailedVariationImages({}); setFailedHistoryActors({}); }, [selectedArticle?.id]);

    useEffect(() => {
        if (!selectedArticle?.id) return;
        if (historyMode === "article") {
            loadArticleHistory(selectedArticle.id).catch(() => { });
        } else if (historyMode === "variation") {
            if (selectedVariationHistoryId) loadVariationHistory(selectedVariationHistoryId).catch(() => { });
            else if (variations[0]?.id) {
                const firstId = String(variations[0].id);
                setSelectedVariationHistoryId(firstId);
                loadVariationHistory(firstId).catch(() => { });
            } else setHistoryRows([]);
        }
    }, [historyMode, selectedArticle?.id, selectedVariationHistoryId, variations]);

    function buildSizeStocks(defaultStock = 0, colorId = "") {
        const currentColorId = Number(colorId || 0);
        return sizes.map((s) => {
            const alreadyExists = variations.some((v) => Number(v.couleurId) === currentColorId && Number(v.tailleId) === Number(s.id) && Number(v.id) !== Number(editingVariationId || 0));
            return { tailleId: Number(s.id), label: s.pointure, checked: false, quantiteStock: defaultStock, disabled: alreadyExists };
        });
    }

    function toggleVariationSize(tailleId, checked) {
        setVariationForm((prev) => ({
            ...prev,
            sizeStocks: (prev.sizeStocks || []).map((item) => Number(item.tailleId) === Number(tailleId) ? { ...item, checked } : item),
        }));
    }

    function changeVariationSizeStock(tailleId, value) {
        setVariationForm((prev) => ({
            ...prev,
            sizeStocks: (prev.sizeStocks || []).map((item) => Number(item.tailleId) === Number(tailleId) ? { ...item, quantiteStock: value } : item),
        }));
    }

    function handleVariationColorChange(colorId) {
        if (isAccessoryCategory) {
            setVariationForm((prev) => ({ ...prev, couleurId: colorId }));
            return;
        }

        setVariationForm((prev) => ({
            ...prev,
            couleurId: colorId,
            sizeStocks: sizes.map((s) => {
                const existingCurrent = (prev.sizeStocks || []).find((x) => Number(x.tailleId) === Number(s.id)) || null;
                const alreadyExists = variations.some((v) => Number(v.couleurId) === Number(colorId || 0) && Number(v.tailleId) === Number(s.id) && Number(v.id) !== Number(editingVariationId || 0));
                return {
                    tailleId: Number(s.id),
                    label: s.pointure,
                    checked: alreadyExists ? false : existingCurrent?.checked || false,
                    quantiteStock: existingCurrent?.quantiteStock ?? 0,
                    disabled: alreadyExists,
                };
            }),
        }));
    }

    function openCreateArticle() { setEditingArticleId(null); setArticleForm({ ...emptyArticleForm }); articleDialogRef.current?.showModal(); }

    function openEditArticle(article = selectedArticle) {
        if (!article) return;
        setEditingArticleId(article.id);
        setArticleForm({
            nom: article.nom || "", description: article.description || "", details: article.details || "", prix: article.prix ?? "", actif: !!article.actif,
            categorieId: article.categorieId || "", marque: article.marque || "", matiere: article.matiere || "", sku: article.sku || "", salePrice: article.salePrice ?? "",
            saleStartAt: toInputDateTime(article.saleStartAt), saleEndAt: toInputDateTime(article.saleEndAt), recommended: !!article.recommended,
        });
        articleDialogRef.current?.showModal();
    }

    async function saveArticle(e) {
        e.preventDefault();
        setBusyCatalog(true);
        setCatalogError("");
        const prix = Number(articleForm.prix);
        const salePrice = articleForm.salePrice !== "" ? Number(articleForm.salePrice) : null;

        if (!articleForm.nom.trim()) { setCatalogError(UI_TEXT.validationArticleName); setBusyCatalog(false); return; }
        if (!articleForm.categorieId) { setCatalogError(UI_TEXT.validationCategoryRequired); setBusyCatalog(false); return; }
        if (!Number.isFinite(prix) || prix <= 0) { setCatalogError(UI_TEXT.validationPriceGreaterThanZero); setBusyCatalog(false); return; }
        if (salePrice !== null && (!Number.isFinite(salePrice) || salePrice < 0 || salePrice >= prix)) { setCatalogError(UI_TEXT.validationSaleLower); setBusyCatalog(false); return; }
        
        if (articleForm.saleStartAt && articleForm.saleEndAt) {
            if (new Date(articleForm.saleEndAt).getTime() < new Date(articleForm.saleStartAt).getTime()) { setCatalogError(UI_TEXT.validationSaleDates); setBusyCatalog(false); return; }
        }

        try {
            const payload = {
                nom: articleForm.nom.trim(), description: articleForm.description || "", details: articleForm.details || "", prix, actif: !!articleForm.actif,
                categorieId: Number(articleForm.categorieId), marque: articleForm.marque || "", matiere: articleForm.matiere || "", sku: articleForm.sku || "",
                salePrice, saleStartAt: articleForm.saleStartAt || null, saleEndAt: articleForm.saleEndAt || null, recommended: !!articleForm.recommended,
            };

            const fd = new FormData();
            fd.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
            if (editingArticleId) await api.put(`/api/admin/articles/${editingArticleId}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
            else await api.post("/api/admin/articles", fd, { headers: { "Content-Type": "multipart/form-data" } });

            articleDialogRef.current?.close();
            await refreshCatalog(true);
        } catch (e2) { setCatalogError(e2?.response?.data?.message || UI_TEXT.errSaveArticle); } finally { setBusyCatalog(false); }
    }

    async function deleteArticle(id) {
        if (!window.confirm(UI_TEXT.confirmDeleteArticle)) return;
        setBusyCatalog(true); setCatalogError("");
        try {
            await api.delete(`/api/admin/articles/${id}`);
            if (selectedArticle?.id === id) { setSelectedArticle(null); setVariations([]); setHistoryRows([]); setSelectedVariationHistoryId(""); }
            await refreshCatalog(true);
        } catch (e) { setCatalogError(e?.response?.data?.message || UI_TEXT.errDeleteArticle); } finally { setBusyCatalog(false); }
    }

    function closeVariationDialog() { setVariationError(""); setEditingVariationId(null); setEditingVariationGroup(null); variationDialogRef.current?.close(); }

    function openCreateVariation() {
        if (!selectedArticle) return;
        if (!colors.length) return setCatalogError(UI_TEXT.validationNeedColorOnly);
        if (!isAccessoryCategory && !sizes.length) return setCatalogError(UI_TEXT.validationNeedColorAndSize);

        const initialColorId = colors[0]?.id ? String(colors[0].id) : "";
        setEditingVariationId(null); setEditingVariationGroup(null); setVariationError("");
        setVariationForm({
            ...emptyVariationForm, prix: selectedArticle?.prix ?? "", couleurId: initialColorId, quantiteStock: 0,
            sizeStocks: isAccessoryCategory ? [] : buildSizeStocks(0, initialColorId),
            imageFiles: [], existingImageUrls: [], model3dFile: null, existingModel3dUrl: "", existingModel3dName: "", existingModel3dType: "",
        });
        variationDialogRef.current?.showModal();
    }

    function openEditVariationGroup(group) {
        if (!group) return;
        setEditingVariationId(null); setEditingVariationGroup(group); setVariationError("");

        if (isAccessoryCategory) {
            const accessoryItem = group.items?.[0] || null;
            setVariationGroupForm({
                couleurId: String(group.couleurId || ""), couleurNom: group.couleurNom || "",
                prix: accessoryItem?.prix ?? group.prix ?? selectedArticle?.prix ?? "",
                rows: [{ tailleId: null, label: UI_TEXT.stockOnly, variationId: accessoryItem?.id || null, checked: true, quantiteStock: accessoryItem?.quantiteStock ?? 0, prix: accessoryItem?.prix ?? group.prix ?? selectedArticle?.prix ?? "" }],
                imageFiles: [], existingImageUrls: group.imageUrls || [], model3dFile: null, existingModel3dUrl: group.model3dUrl || "", existingModel3dName: group.model3dName || "", existingModel3dType: group.model3dType || "",
            });
            variationDialogRef.current?.showModal();
            return;
        }

        const rows = sizes.map((s) => {
            const found = group.items.find((item) => Number(item.tailleId) === Number(s.id));
            return { tailleId: Number(s.id), label: s.pointure, variationId: found?.id || null, checked: !!found, quantiteStock: found?.quantiteStock ?? 0, prix: found?.prix ?? group.prix ?? selectedArticle?.prix ?? "" };
        });

        setVariationGroupForm({
            couleurId: String(group.couleurId || ""), couleurNom: group.couleurNom || "", prix: group.prix ?? selectedArticle?.prix ?? "", rows,
            imageFiles: [], existingImageUrls: group.imageUrls || [], model3dFile: null, existingModel3dUrl: group.model3dUrl || "", existingModel3dName: group.model3dName || "", existingModel3dType: group.model3dType || "",
        });
        variationDialogRef.current?.showModal();
    }

    async function saveVariation(e) {
        e.preventDefault();
        if (!selectedArticle) return;
        setCatalogError(""); setVariationError("");
        const couleurId = Number(variationForm.couleurId);

        if (!couleurId) return setVariationError(UI_TEXT.validationSelectColor);

        if (isAccessoryCategory) {
            const stock = Number(variationForm.quantiteStock);
            const prix = Number(variationForm.prix ?? selectedArticle?.prix);

            if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) return setVariationError(UI_TEXT.validationAccessoryStock);
            if (!Number.isFinite(prix) || prix <= 0) return setVariationError(UI_TEXT.validationPriceGreaterThanZero);

            setBusyCatalog(true);
            try {
                const fd = new FormData();
                const payload = { prix, couleurId, quantiteStock: stock, existingImageUrls: variationForm.existingImageUrls || [] };
                fd.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
                if (variationForm.imageFiles?.length) variationForm.imageFiles.forEach((file) => fd.append("images", file));
                if (variationForm.model3dFile) fd.append("model3d", variationForm.model3dFile);

                if (editingVariationId) await api.put(`/api/admin/variations/${editingVariationId}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
                else await api.post(`/api/admin/articles/${selectedArticle.id}/variations`, fd, { headers: { "Content-Type": "multipart/form-data" } });

                closeVariationDialog(); await loadArticleDetails(selectedArticle.id); await refreshCatalog(false);
            } catch (e2) { setCatalogError(e2?.response?.data?.message || UI_TEXT.errSaveVariation); } finally { setBusyCatalog(false); }
            return;
        }

        const activeRows = (variationForm.sizeStocks || []).filter((row) => row.checked);
        if (!activeRows.length) return setVariationError(UI_TEXT.validationSelectOneSize);

        for (const row of activeRows) {
            const stock = Number(row.quantiteStock);
            if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) return setVariationError(UI_TEXT.validationStockWholeNumber.replace("{{size}}", row.label));
        }

        const prix = Number(variationForm.prix ?? selectedArticle?.prix);
        if (!Number.isFinite(prix) || prix <= 0) return setVariationError(UI_TEXT.validationPriceGreaterThanZero);

        setBusyCatalog(true);
        try {
            const fd = new FormData();
            const payload = { prix, couleurId, sizes: activeRows.map((row) => ({ tailleId: Number(row.tailleId), quantiteStock: Number(row.quantiteStock) })), existingImageUrls: variationForm.existingImageUrls || [] };
            fd.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
            if (variationForm.imageFiles?.length) variationForm.imageFiles.forEach((file) => fd.append("images", file));
            if (variationForm.model3dFile) fd.append("model3d", variationForm.model3dFile);

            if (editingVariationId) await api.put(`/api/admin/variations/${editingVariationId}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
            else await api.post(`/api/admin/articles/${selectedArticle.id}/variations`, fd, { headers: { "Content-Type": "multipart/form-data" } });

            closeVariationDialog(); await loadArticleDetails(selectedArticle.id); await refreshCatalog(false);
        } catch (e2) { setCatalogError(e2?.response?.data?.message || UI_TEXT.errSaveVariation); } finally { setBusyCatalog(false); }
    }

    async function saveVariationGroup(e) {
        e.preventDefault();
        if (!selectedArticle) return;
        setCatalogError(""); setVariationError("");
        const couleurId = Number(variationGroupForm.couleurId);

        if (isAccessoryCategory) {
            const stock = Number(variationGroupForm.rows[0]?.quantiteStock ?? 0);
            const prix = Number(variationGroupForm.rows[0]?.prix ?? variationGroupForm.prix);
            const variationId = variationGroupForm.rows[0]?.variationId;

            if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) return setVariationError(UI_TEXT.validationAccessoryStock);
            if (!Number.isFinite(prix) || prix <= 0) return setVariationError(UI_TEXT.validationPriceGreaterThanZero);

            setBusyCatalog(true);
            try {
                const fd = new FormData();
                const payload = { prix, couleurId, quantiteStock: stock, existingImageUrls: variationGroupForm.existingImageUrls || [] };
                fd.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
                if (variationGroupForm.imageFiles?.length) variationGroupForm.imageFiles.forEach((file) => fd.append("images", file));
                if (variationGroupForm.model3dFile) fd.append("model3d", variationGroupForm.model3dFile);

                if (variationId) await api.put(`/api/admin/variations/${variationId}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
                else await api.post(`/api/admin/articles/${selectedArticle.id}/variations`, fd, { headers: { "Content-Type": "multipart/form-data" } });

                setEditingVariationGroup(null); variationDialogRef.current?.close(); await loadArticleDetails(selectedArticle.id); await refreshCatalog(false);
            } catch (e2) { setCatalogError(e2?.response?.data?.message || UI_TEXT.errSaveVariation); } finally { setBusyCatalog(false); }
            return;
        }

        const allRows = variationGroupForm.rows || [];
        const activeRows = allRows.filter((row) => row.checked);
        const existingRows = activeRows.filter((row) => row.variationId);
        const newRows = activeRows.filter((row) => !row.variationId);
        const removedRows = allRows.filter((row) => !row.checked && row.variationId);

        if (!activeRows.length) return setVariationError(UI_TEXT.validationSelectOneSize);

        for (const row of activeRows) {
            const stock = Number(row.quantiteStock);
            const prix = Number(row.prix);
            if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) return setVariationError(UI_TEXT.validationStockWholeNumber.replace("{{size}}", row.label));
            if (!Number.isFinite(prix) || prix <= 0) return setVariationError(UI_TEXT.validationPriceGreaterThanZero);
        }

        setBusyCatalog(true);
        try {
            for (const row of removedRows) await api.delete(`/api/admin/variations/${row.variationId}`);
            for (const row of existingRows) {
                const fd = new FormData();
                const payload = { prix: Number(row.prix), quantiteStock: Number(row.quantiteStock), couleurId, tailleId: Number(row.tailleId), existingImageUrls: variationGroupForm.existingImageUrls || [] };
                fd.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
                if (variationGroupForm.imageFiles?.length) variationGroupForm.imageFiles.forEach((file) => fd.append("images", file));
                if (variationGroupForm.model3dFile) fd.append("model3d", variationGroupForm.model3dFile);
                await api.put(`/api/admin/variations/${row.variationId}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
            }

            if (newRows.length) {
                const fd = new FormData();
                const payload = { prix: Number(newRows[0].prix), couleurId, sizes: newRows.map((row) => ({ tailleId: Number(row.tailleId), quantiteStock: Number(row.quantiteStock) })) };
                fd.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
                if (variationGroupForm.imageFiles?.length) variationGroupForm.imageFiles.forEach((file) => fd.append("images", file));
                if (variationGroupForm.model3dFile) fd.append("model3d", variationGroupForm.model3dFile);
                await api.post(`/api/admin/articles/${selectedArticle.id}/variations`, fd, { headers: { "Content-Type": "multipart/form-data" } });
            }

            setEditingVariationGroup(null); variationDialogRef.current?.close(); await loadArticleDetails(selectedArticle.id); await refreshCatalog(false);
        } catch (e2) { setCatalogError(e2?.response?.data?.message || UI_TEXT.errSaveVariation); } finally { setBusyCatalog(false); }
    }

    async function deleteVariation(id) {
        if (!window.confirm(UI_TEXT.confirmDeleteVariation)) return;
        setBusyCatalog(true); setCatalogError("");
        try {
            await api.delete(`/api/admin/variations/${id}`);
            if (selectedArticle?.id) await loadArticleDetails(selectedArticle.id);
            await refreshCatalog(false);
        } catch (e) { setCatalogError(e?.response?.data?.message || UI_TEXT.errDeleteVariation); } finally { setBusyCatalog(false); }
    }

    async function updateVariationStock(variation, nextStock) {
        const payload = { prix: Number(variation.prix), quantiteStock: Number(nextStock), couleurId: Number(variation.couleurId), tailleId: variation.tailleId != null ? Number(variation.tailleId) : null };
        const fd = new FormData();
        fd.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
        await api.put(`/api/admin/variations/${variation.id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
    }

    function openStockDialog(variation, mode = "decrement") {
        if (!variation) return;
        setStockError("");
        setStockForm({ variationId: String(variation.id), label: variationDisplayName(variation), currentStock: Number(variation.quantiteStock || 0), quantity: 1, mode });
        stockDialogRef.current?.showModal();
    }

    function closeStockDialog() { setStockError(""); stockDialogRef.current?.close(); }

    async function submitStockUpdate(e) {
        e.preventDefault(); setStockError(""); setCatalogError("");
        const variation = selectedStockVariation; const qty = Number(stockForm.quantity);
        if (!variation) return setStockError(UI_TEXT.validationVariationNotFound);
        if (!Number.isFinite(qty) || qty <= 0 || !Number.isInteger(qty)) return setStockError(UI_TEXT.validationQuantityPositive);
        if (stockForm.mode === "decrement" && qty > Number(stockForm.currentStock || 0)) return setStockError(UI_TEXT.validationCannotRemoveMore);
        if (stockNextValue < 0) return setStockError(UI_TEXT.validationNoNegativeStock);

        setBusyCatalog(true);
        try {
            await updateVariationStock(variation, stockNextValue);
            closeStockDialog();
            if (selectedArticle?.id) await loadArticleDetails(selectedArticle.id);
            await refreshCatalog(false);
        } catch (e2) { setCatalogError(e2?.response?.data?.message || UI_TEXT.errStockUpdate); } finally { setBusyCatalog(false); }
    }

    function openCreateCategory() { setEditingCategoryId(null); setCategoryForm({ nom: "", description: "" }); categoryDialogRef.current?.showModal(); }
    function openEditCategory(c) { setEditingCategoryId(c.id); setCategoryForm({ nom: c.nom || "", description: c.description || "" }); categoryDialogRef.current?.showModal(); }

    async function saveCategory(e) {
        e.preventDefault(); setBusyCatalog(true); setCatalogError("");
        if (!categoryForm.nom.trim()) { setCatalogError(UI_TEXT.validationCategoryName); setBusyCatalog(false); return; }
        try {
            const payload = { nom: categoryForm.nom.trim(), description: categoryForm.description?.trim() || "" };
            if (editingCategoryId) await api.put(`/api/admin/categories/${editingCategoryId}`, payload);
            else await api.post("/api/admin/categories", payload);
            categoryDialogRef.current?.close(); setCategoryForm({ nom: "", description: "" }); await refreshCatalog(false);
        } catch (e2) { setCatalogError(e2?.response?.data?.message || UI_TEXT.errSaveCategory); } finally { setBusyCatalog(false); }
    }

    async function deleteCategory(id) {
        if (!window.confirm(UI_TEXT.confirmDeleteCategory)) return;
        setBusyCatalog(true);
        try { await api.delete(`/api/admin/categories/${id}`); await refreshCatalog(false); } catch (e) { setCatalogError(e?.response?.data?.message || UI_TEXT.errDeleteCategory); } finally { setBusyCatalog(false); }
    }

    function openCreateColor() { setEditingColorId(null); setColorForm({ nom: "", codeHex: "#000000" }); colorDialogRef.current?.showModal(); }
    function openEditColor(c) { setEditingColorId(c.id); setColorForm({ nom: c.nom || "", codeHex: c.codeHex || "#000000" }); colorDialogRef.current?.showModal(); }

    async function saveColor(e) {
        e.preventDefault(); setBusyCatalog(true); setCatalogError("");
        if (!colorForm.nom.trim()) { setCatalogError(UI_TEXT.validationColorName); setBusyCatalog(false); return; }
        try {
            const payload = { nom: colorForm.nom.trim(), codeHex: colorForm.codeHex || "#000000" };
            if (editingColorId) await api.put(`/api/admin/colors/${editingColorId}`, payload);
            else await api.post("/api/admin/colors", payload);
            colorDialogRef.current?.close(); setColorForm({ nom: "", codeHex: "#000000" }); await refreshCatalog(false);
        } catch (e2) { setCatalogError(e2?.response?.data?.message || UI_TEXT.errSaveColor); } finally { setBusyCatalog(false); }
    }

    async function deleteColor(id) {
        if (!window.confirm(UI_TEXT.confirmDeleteColor)) return;
        setBusyCatalog(true);
        try { await api.delete(`/api/admin/colors/${id}`); await refreshCatalog(false); } catch (e) { setCatalogError(e?.response?.data?.message || UI_TEXT.errDeleteColor); } finally { setBusyCatalog(false); }
    }

    function openCreateSize() { setEditingSizeId(null); setSizeForm({ pointure: "" }); sizeDialogRef.current?.showModal(); }
    function openEditSize(s) { setEditingSizeId(s.id); setSizeForm({ pointure: s.pointure || "" }); sizeDialogRef.current?.showModal(); }

    async function saveSize(e) {
        e.preventDefault(); setBusyCatalog(true); setCatalogError("");
        if (!String(sizeForm.pointure).trim()) { setCatalogError(UI_TEXT.validationSizeRequired); setBusyCatalog(false); return; }
        try {
            const payload = { pointure: String(sizeForm.pointure).trim() };
            if (editingSizeId) await api.put(`/api/admin/sizes/${editingSizeId}`, payload);
            else await api.post("/api/admin/sizes", payload);
            sizeDialogRef.current?.close(); setSizeForm({ pointure: "" }); await refreshCatalog(false);
        } catch (e2) { setCatalogError(e2?.response?.data?.message || UI_TEXT.errSaveSize); } finally { setBusyCatalog(false); }
    }

    async function deleteSize(id) {
        if (!window.confirm(UI_TEXT.confirmDeleteSize)) return;
        setBusyCatalog(true);
        try { await api.delete(`/api/admin/sizes/${id}`); await refreshCatalog(false); } catch (e) { setCatalogError(e?.response?.data?.message || UI_TEXT.errDeleteSize); } finally { setBusyCatalog(false); }
    }

    if (!isAdminGeneral && !isVendeur) {
        return (
            <div className="fadeInUp">
                <div className="admPage">
                    <div className="admAlert">{UI_TEXT.accessDenied}</div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="fadeInUp">
                <div className="admPage">
                    <div className="admHeader">
                        <div>
                            <div className="admH1">{tx("admin.catalog.title", UI_TEXT.headerTitle)}</div>
                            <div className="admH2">{tx("admin.catalog.subtitle", UI_TEXT.headerSubtitle)}</div>
                        </div>

                        <div className="admHeaderRight">
                            <div className="catalogFiltersRow">
                                <div className="admSearchWrap">
                                    <input className="admSearch" value={catalogQ} onChange={(e) => { setCatalogQ(e.target.value); setArticlePage(1); }} placeholder={tx("admin.catalog.searchPlaceholder", UI_TEXT.searchPlaceholder)} />
                                </div>
                                <select className="admSearch filterSelect" value={selectedCategoryFilter} onChange={(e) => { setSelectedCategoryFilter(e.target.value); setArticlePage(1); }}>
                                    <option value="">{UI_TEXT.allCategories}</option>
                                    {categories.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                                </select>
                            </div>

                            <div className="catalogActionBar">
                                <button type="button" className="admBtn" onClick={() => refreshCatalog(false)}>{tx("admin.common.refresh", UI_TEXT.refresh)}</button>
                                <button type="button" className="admBtn" onClick={scrollToHistory}>{UI_TEXT.history}</button>
                                <button type="button" className="admBtn" onClick={openCreateSize}>{tx("admin.catalog.addSize", UI_TEXT.addSize)}</button>
                                <button type="button" className="admBtn" onClick={openCreateCategory}>{tx("admin.catalog.addCategory", UI_TEXT.addCategory)}</button>
                                <button type="button" className="admBtn" onClick={openCreateColor}>{tx("admin.catalog.addColor", UI_TEXT.addColor)}</button>
                                <button type="button" className="admBtn primary" onClick={openCreateArticle}>{tx("admin.catalog.addArticle", UI_TEXT.addArticle)}</button>
                            </div>
                        </div>
                    </div>

                    {catalogError && <div className="admAlert">{catalogError}</div>}

                    <div className="admCard">
                        <div className="admCardTop">
                            <div className="admCardTitle">{filteredArticles.length} {tx("admin.common.articlesCount", UI_TEXT.articlesCount)}</div>
                        </div>

                        <div className="adminDataTableWrap">
                            <table className="adminDataTable">
                                <thead>
                                    <tr>
                                        <th>{tx("admin.table.article", UI_TEXT.tableArticle)}</th>
                                        <th>{tx("admin.table.category", UI_TEXT.tableCategory)}</th>
                                        <th>{UI_TEXT.brand}</th>
                                        <th>{tx("admin.table.price", UI_TEXT.tablePrice)}</th>
                                        <th>{tx("admin.table.status", UI_TEXT.tableStatus)}</th>
                                        <th>{tx("admin.table.actions", UI_TEXT.tableActions)}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagedArticles.map((a) => {
                                        const saleLive = isSaleActive(a);
                                        return (
                                            <tr key={a.id} className={selectedArticle?.id === a.id ? "isSelectedRow" : ""}>
                                                <td>
                                                    <div className="tablePrimaryCell">
                                                        <div className="admName">{a.nom}</div>
                                                        <div className="admRole">
                                                            #{a.id} {a.recommended ? ` • ${tx("admin.catalog.recommended", UI_TEXT.recommended)}` : ""} {saleLive ? ` • Sale -${salePercent(a)}%` : ""}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{a.categorieNom || "-"}</td>
                                                <td>{a.marque || "-"}</td>
                                                <td>{saleLive ? `${fmtPrice(a.salePrice)} / ${fmtPrice(a.prix)}` : fmtPrice(a.prix)}</td>
                                                <td><span className={`admBadge ${a.actif ? "ok" : "bad"}`}>{a.actif ? UI_TEXT.active : UI_TEXT.inactive}</span></td>
                                                <td>
                                                    <div className="admRowActions">
                                                        <button type="button" className="admBtn mini" onClick={() => loadArticleDetails(a.id).catch((e) => setCatalogError(e?.response?.data?.message || e.message || UI_TEXT.errLoadArticle))}>{UI_TEXT.details}</button>
                                                        <button type="button" className="admBtn mini" onClick={() => openEditArticle(a)}>{tx("admin.common.edit", UI_TEXT.edit)}</button>
                                                        <button type="button" className="admBtn mini danger" onClick={() => deleteArticle(a.id)}>{tx("admin.common.delete", UI_TEXT.delete)}</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {!pagedArticles.length && (
                                        <tr><td colSpan="6"><div className="admEmpty">{tx("admin.catalog.noArticles", UI_TEXT.noArticles)}</div></td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <TablePager total={filteredArticles.length} page={articlePage} setPage={setArticlePage} rows={articleRows} setRows={setArticleRows} rowsOptions={[5, 10, 25, 50]} />
                    </div>

                    <div className="admGrid singleCol">
                        <div className="admCard">
                            <div className="admCardTop catalogPanelTop">
                                <div>
                                    <div className="admCardTitle">
                                        {tx("admin.catalog.variations", UI_TEXT.variations)}
                                        {selectedArticle ? ` — ${selectedArticle.nom}` : ""}
                                    </div>
                                    <div className="variationHint">
                                        {!selectedArticle ? UI_TEXT.selectArticle : isAccessoryCategory ? UI_TEXT.variationsHintAccessory : UI_TEXT.variationsHint}
                                    </div>
                                </div>
                                <div className="admRowActions">
                                    {selectedArticle ? (
                                        <>
                                            <button type="button" className="admBtn" onClick={() => openEditArticle(selectedArticle)}>{tx("admin.common.edit", UI_TEXT.edit)} {UI_TEXT.tableArticle.toLowerCase()}</button>
                                            <button type="button" className="admBtn primary" onClick={openCreateVariation}>{tx("admin.catalog.addVariation", UI_TEXT.addVariation)}</button>
                                        </>
                                    ) : null}
                                </div>
                            </div>

                            {!selectedArticle ? (
                                <div className="admEmpty">{tx("admin.catalog.selectArticle", UI_TEXT.selectArticle)}</div>
                            ) : (
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
                                                    <th>{UI_TEXT.tableDetails}</th>
                                                    <th>{UI_TEXT.tableColor}</th>
                                                    <th>{UI_TEXT.sizesAndStock}</th>
                                                    <th>{UI_TEXT.tablePrice}</th>
                                                    <th>{UI_TEXT.tableStock}</th>
                                                    <th>{UI_TEXT.tableModel}</th>
                                                    <th>{UI_TEXT.tableActions}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pagedVariations.map((group) => {
                                                    const rawPreviewUrl = group.imageUrls?.[0] || "";
                                                    const previewSrc = rawPreviewUrl ? fullImageUrl(rawPreviewUrl, variationImageVersion(group.items?.[0] || {})) : "";
                                                    const imageBroken = previewSrc ? isVariationImageBroken(group.key, previewSrc) : true;

                                                    return (
                                                        <tr key={group.key}>
                                                            <td>
                                                                <div className="variationTableInfo">
                                                                    <div className="variationThumbWrap">
                                                                        {previewSrc && !imageBroken ? (
                                                                            <img src={previewSrc} alt={group.couleurNom || "Variation image"} className="variationTableThumb" onError={() => handleVariationImageError(group.key, previewSrc)} />
                                                                        ) : (
                                                                            <div className="variationTableThumb fallback">{UI_TEXT.noImage}</div>
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <div className="admName">{group.couleurNom}</div>
                                                                        <div className="admRole">{group.items.length} size{group.items.length > 1 ? "s" : ""}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className="colorCell">
                                                                    {group.couleurCodeHex ? <span className="colorDot" style={{ background: group.couleurCodeHex }} /> : null}
                                                                    <span>{group.couleurNom || "-"}</span>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className="sizesStockList">
                                                                    {group.items.length ? (
                                                                        group.items.map((item) => (
                                                                            <span key={item.id} className="sizeStockBadge">{item.taillePointure || UI_TEXT.stockOnly}: {Number(item.quantiteStock || 0)}</span>
                                                                        ))
                                                                    ) : (
                                                                        <span className="admRole">{UI_TEXT.noSizesInColor}</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td>{fmtPrice(group.prix)}</td>
                                                            <td><span className={`admBadge ${Number(group.quantiteStock) > 0 ? "ok" : "bad"}`}>{Number(group.quantiteStock || 0)}</span></td>
                                                            <td>{group.model3dUrl ? UI_TEXT.yes : UI_TEXT.no}</td>
                                                            <td>
                                                                <div className="admRowActions wrap">
                                                                    <button type="button" className="admBtn mini" onClick={() => openEditVariationGroup(group)}>{UI_TEXT.bulkEditVariation}</button>
                                                                    {group.items[0] ? (
                                                                        <>
                                                                            <button type="button" className="admBtn mini" onClick={() => openStockDialog(group.items[0], "increment")}>{UI_TEXT.restock}</button>
                                                                            <button type="button" className="admBtn mini" onClick={() => openStockDialog(group.items[0], "decrement")}>{UI_TEXT.useQty}</button>
                                                                            <button type="button" className="admBtn mini danger" onClick={() => deleteVariation(group.items[0].id)}>{UI_TEXT.delete}</button>
                                                                        </>
                                                                    ) : null}
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
                                    <TablePager total={groupedVariationRows.length} page={variationPage} setPage={setVariationPage} rows={variationRows} setRows={setVariationRows} rowsOptions={[3, 5, 10, 25]} />
                                </>
                            )}
                        </div>

                        <div ref={historySectionRef} className="admCard">
                            <div className="admCardTop historyToolbar">
                                <div>
                                    <div className="admCardTitle">{UI_TEXT.historyTitle}</div>
                                    <div className="variationHint">{UI_TEXT.historyHint}</div>
                                </div>
                                <div className="historyToolbarActions">
                                    <select className="admSearch historySelect" value={historyMode} onChange={(e) => setHistoryMode(e.target.value)}>
                                        <option value="article">{UI_TEXT.articleHistory}</option>
                                        <option value="variation">{UI_TEXT.variationHistory}</option>
                                    </select>
                                    {historyMode === "variation" ? (
                                        <select className="admSearch historySelectWide" value={selectedVariationHistoryId} onChange={(e) => { const id = e.target.value; setSelectedVariationHistoryId(id); if (id) { loadVariationHistory(id); } else { setHistoryRows([]); } }}>
                                            <option value="">{UI_TEXT.selectVariation}</option>
                                            {variations.map((v) => <option key={v.id} value={v.id}>{variationDisplayName(v)}</option>)}
                                        </select>
                                    ) : null}
                                </div>
                            </div>
                            <div className="admHistoryList">
                                {historyLoading ? (
                                    <div className="admEmpty">{UI_TEXT.loadingHistory}</div>
                                ) : !historyRows.length ? (
                                    <div className="admEmpty slim">{UI_TEXT.noHistory}</div>
                                ) : (
                                    historyRows.map((row) => (
                                        <div key={row.id} className="admHistoryItem">
                                            <div className="admHistoryTop">
                                                <div className="admProfileTop">
                                                    {row.actorPhotoUrl && !isHistoryActorBroken(row) ? (
                                                        <img src={fullImageUrl(row.actorPhotoUrl, row.actorUserId || row.id)} alt={row.actorName || "User"} className="admAvatar" onError={() => handleHistoryActorError(row)} />
                                                    ) : (
                                                        <div className="admAvatar fallback">{initials(row.actorName)}</div>
                                                    )}
                                                    <div>
                                                        <div className="admName">{row.actorName || "-"}</div>
                                                        <div className="admRole">{row.actorEmail || "-"}</div>
                                                    </div>
                                                </div>
                                                <span className={`admBadge ${row.action === "CREATE" ? "ok" : row.action === "DELETE" ? "bad" : "neutral"}`}>{row.action}</span>
                                            </div>
                                            <div className="admHistoryText">{row.summary || "-"}</div>
                                            <div className="admHistoryMeta">{fmt(row.actionAt)}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="admGrid refsGrid">
                        <div className="admCard">
                            <div className="admCardTop">
                                <div className="admCardTitle">{tx("admin.catalog.categories", UI_TEXT.categories)}</div>
                                <button type="button" className="admBtn mini" onClick={openCreateCategory}>{tx("admin.catalog.addCategory", UI_TEXT.addCategory)}</button>
                            </div>
                            <div className="adminDataTableWrap">
                                <table className="adminDataTable compactTable">
                                    <thead><tr><th>{UI_TEXT.categories}</th><th>{UI_TEXT.tableActions}</th></tr></thead>
                                    <tbody>
                                        {pagedCategories.map((c) => (
                                            <tr key={c.id}>
                                                <td><div className="admName">{c.nom}</div><div className="admRole">{c.description || "-"}</div></td>
                                                <td>
                                                    <div className="admRowActions">
                                                        <button type="button" className="admBtn mini" onClick={() => openEditCategory(c)}>{tx("admin.common.edit", UI_TEXT.edit)}</button>
                                                        <button type="button" className="admBtn mini danger" onClick={() => deleteCategory(c.id)}>{tx("admin.common.delete", UI_TEXT.delete)}</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {!pagedCategories.length && (<tr><td colSpan="2"><div className="admEmpty">{UI_TEXT.noCategories}</div></td></tr>)}
                                    </tbody>
                                </table>
                            </div>
                            <TablePager total={categories.length} page={categoryPage} setPage={setCategoryPage} rows={categoryRows} setRows={setCategoryRows} rowsOptions={[3, 5, 10]} />
                        </div>

                        <div className="admCard">
                            <div className="admCardTop">
                                <div className="admCardTitle">{tx("admin.catalog.colors", UI_TEXT.colors)}</div>
                                <button type="button" className="admBtn mini" onClick={openCreateColor}>{tx("admin.catalog.addColor", UI_TEXT.addColor)}</button>
                            </div>
                            <div className="adminDataTableWrap">
                                <table className="adminDataTable compactTable">
                                    <thead><tr><th>{UI_TEXT.colors}</th><th>{UI_TEXT.tableActions}</th></tr></thead>
                                    <tbody>
                                        {pagedColors.map((c) => (
                                            <tr key={c.id}>
                                                <td>
                                                    <div className="colorCell">
                                                        <span className="colorDot" style={{ background: c.codeHex }} />
                                                        <div><div className="admName">{c.nom}</div><div className="admRole">{c.codeHex}</div></div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="admRowActions">
                                                        <button type="button" className="admBtn mini" onClick={() => openEditColor(c)}>{tx("admin.common.edit", UI_TEXT.edit)}</button>
                                                        <button type="button" className="admBtn mini danger" onClick={() => deleteColor(c.id)}>{tx("admin.common.delete", UI_TEXT.delete)}</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {!pagedColors.length && (<tr><td colSpan="2"><div className="admEmpty">{UI_TEXT.noColors}</div></td></tr>)}
                                    </tbody>
                                </table>
                            </div>
                            <TablePager total={colors.length} page={colorPage} setPage={setColorPage} rows={colorRows} setRows={setColorRows} rowsOptions={[3, 5, 10]} />
                        </div>

                        <div className="admCard">
                            <div className="admCardTop">
                                <div className="admCardTitle">{tx("admin.catalog.sizes", UI_TEXT.sizes)}</div>
                                <button type="button" className="admBtn mini" onClick={openCreateSize}>{tx("admin.catalog.addSize", UI_TEXT.addSize)}</button>
                            </div>
                            <div className="adminDataTableWrap">
                                <table className="adminDataTable compactTable">
                                    <thead><tr><th>{UI_TEXT.sizes}</th><th>{UI_TEXT.tableActions}</th></tr></thead>
                                    <tbody>
                                        {pagedSizes.map((s) => (
                                            <tr key={s.id}>
                                                <td><div className="admName">{s.pointure}</div></td>
                                                <td>
                                                    <div className="admRowActions">
                                                        <button type="button" className="admBtn mini" onClick={() => openEditSize(s)}>{tx("admin.common.edit", UI_TEXT.edit)}</button>
                                                        <button type="button" className="admBtn mini danger" onClick={() => deleteSize(s.id)}>{tx("admin.common.delete", UI_TEXT.delete)}</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {!pagedSizes.length && (<tr><td colSpan="2"><div className="admEmpty">{UI_TEXT.noSizes}</div></td></tr>)}
                                    </tbody>
                                </table>
                            </div>
                            <TablePager total={sizes.length} page={sizePage} setPage={setSizePage} rows={sizeRows} setRows={setSizeRows} rowsOptions={[3, 5, 10]} />
                        </div>
                    </div>
                </div>
            </div>

            <dialog ref={articleDialogRef} className="admDialog productDialog">
                <div className="admDialogHead">
                    <div className="admDialogTitle">{editingArticleId ? UI_TEXT.articleDialogEdit : UI_TEXT.articleDialogAdd}</div>
                    <button type="button" className="admBtn mini" onClick={() => articleDialogRef.current?.close()}>{tx("admin.common.close", UI_TEXT.close)}</button>
                </div>
                <form className="productForm admDialogBody" onSubmit={saveArticle}>
                    <label><span>{UI_TEXT.productName}</span><input value={articleForm.nom} onChange={(e) => setArticleForm({ ...articleForm, nom: e.target.value })} required /></label>
                    <label><span>{UI_TEXT.tableCategory}</span><select value={articleForm.categorieId} onChange={(e) => setArticleForm({ ...articleForm, categorieId: e.target.value })} required><option value="">{UI_TEXT.selectCategory}</option>{categories.map((c) => (<option key={c.id} value={c.id}>{c.nom}</option>))}</select></label>
                    <label><span>{UI_TEXT.price}</span><input type="number" step="0.001" min="0.001" value={articleForm.prix} onChange={(e) => setArticleForm({ ...articleForm, prix: e.target.value })} required /></label>
                    <label><span>{UI_TEXT.salePrice}</span><input type="number" step="0.001" min="0" value={articleForm.salePrice} onChange={(e) => setArticleForm({ ...articleForm, salePrice: e.target.value })} /></label>
                    <label><span>{UI_TEXT.saleStart}</span><input type="datetime-local" value={articleForm.saleStartAt} onChange={(e) => setArticleForm({ ...articleForm, saleStartAt: e.target.value })} /></label>
                    <label><span>{UI_TEXT.saleEnd}</span><input type="datetime-local" value={articleForm.saleEndAt} onChange={(e) => setArticleForm({ ...articleForm, saleEndAt: e.target.value })} /></label>
                    <label><span>{UI_TEXT.brand}</span><input value={articleForm.marque} onChange={(e) => setArticleForm({ ...articleForm, marque: e.target.value })} /></label>
                    <label><span>{UI_TEXT.material}</span><input value={articleForm.matiere} onChange={(e) => setArticleForm({ ...articleForm, matiere: e.target.value })} /></label>
                    <label><span>{UI_TEXT.sku}</span><input value={articleForm.sku} onChange={(e) => setArticleForm({ ...articleForm, sku: e.target.value })} /></label>
                    <label className="checkRow"><input type="checkbox" checked={articleForm.actif} onChange={(e) => setArticleForm({ ...articleForm, actif: e.target.checked })} /><span>{UI_TEXT.activeProduct}</span></label>
                    <label className="checkRow"><input type="checkbox" checked={articleForm.recommended} onChange={(e) => setArticleForm({ ...articleForm, recommended: e.target.checked })} /><span>{UI_TEXT.bestChoice}</span></label>
                    <label className="fullCol"><span>{UI_TEXT.shortDescription}</span><textarea rows="4" value={articleForm.description} onChange={(e) => setArticleForm({ ...articleForm, description: e.target.value })} /></label>
                    <label className="fullCol"><span>{UI_TEXT.moreInformations}</span><textarea rows="6" value={articleForm.details} onChange={(e) => setArticleForm({ ...articleForm, details: e.target.value })} /></label>
                    <div className="admDialogActions fullCol"><button type="submit" className="admBtn primary" disabled={busyCatalog}>{editingArticleId ? UI_TEXT.updateArticle : UI_TEXT.saveArticle}</button></div>
                </form>
            </dialog>

            <dialog ref={variationDialogRef} className="admDialog admDialogWide">
                <div className="admDialogHead">
                    <div className="admDialogTitle">
                        {editingVariationGroup ? UI_TEXT.bulkEditVariation : editingVariationId ? UI_TEXT.variationDialogEdit : UI_TEXT.variationDialogAdd}
                    </div>
                    <button type="button" className="admBtn mini" onClick={closeVariationDialog}>{UI_TEXT.close}</button>
                </div>

                <form className="productForm admDialogBody" onSubmit={editingVariationGroup ? saveVariationGroup : saveVariation}>
                    <div className="variationHelp fullCol">
                        {editingVariationGroup ? `${UI_TEXT.colorGroup}: ${variationGroupForm.couleurNom}` : isAccessoryCategory ? UI_TEXT.accessoryVariationCreateHelp : UI_TEXT.variationCreateHelp}
                    </div>

                    {variationError ? <div className="admAlert fullCol">{variationError}</div> : null}

                    {!editingVariationGroup ? (
                        <>
                            <label>
                                <span>{UI_TEXT.colorLabel}</span>
                                <select value={variationForm.couleurId} onChange={(e) => handleVariationColorChange(e.target.value)} required disabled={!colors.length}>
                                    <option value="">{UI_TEXT.selectColor}</option>
                                    {colors.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                                </select>
                            </label>
                            <label><span>{UI_TEXT.price}</span><input type="number" min="0.001" step="0.001" value={variationForm.prix} onChange={(e) => setVariationForm({ ...variationForm, prix: e.target.value })} required /></label>
                        </>
                    ) : (
                        <>
                            <label><span>{UI_TEXT.colorLabel}</span><input value={variationGroupForm.couleurNom} disabled /></label>
                            <label><span>{UI_TEXT.price}</span><input value={variationGroupForm.prix} disabled /></label>
                        </>
                    )}

                    {isAccessoryCategory ? (
                        <div className="fullCol variationAccessoryBox">
                            <div className="variationHelp">{editingVariationGroup ? UI_TEXT.accessoryVariationEditHelp : UI_TEXT.accessoryVariationCreateHelp}</div>
                            <label className="fullCol">
                                <span>{UI_TEXT.stockLabel}</span>
                                <input type="number" min="0" step="1" value={editingVariationGroup ? variationGroupForm.rows?.[0]?.quantiteStock ?? 0 : variationForm.quantiteStock ?? 0} onChange={(e) => {
                                    const value = e.target.value;
                                    if (editingVariationGroup) {
                                        setVariationGroupForm((prev) => ({ ...prev, rows: (prev.rows || []).length ? prev.rows.map((row, index) => index === 0 ? { ...row, quantiteStock: value } : row) : [{ tailleId: null, label: UI_TEXT.stockOnly, variationId: null, checked: true, quantiteStock: value, prix: prev.prix ?? selectedArticle?.prix ?? "" }] }));
                                    } else {
                                        setVariationForm((prev) => ({ ...prev, quantiteStock: value }));
                                    }
                                }} required />
                            </label>
                        </div>
                    ) : (
                        <div className="fullCol variationCurrentImages">
                            <div className="variationHelp">{editingVariationGroup ? `${UI_TEXT.colorGroup}: ${variationGroupForm.couleurNom}` : `${UI_TEXT.selectedSizes}: ${variationSelectedCount}`}</div>
                            <div className="sizeStockGrid">
                                {(editingVariationGroup ? variationGroupForm.rows : variationForm.sizeStocks || []).map((item) => (
                                    <label key={item.tailleId} className={`sizeStockCard ${item.checked ? "active" : ""} ${item.disabled ? "disabled" : ""}`}>
                                        <div className="sizeStockTop">
                                            <div className="sizeStockCheck">
                                                <input type="checkbox" checked={!!item.checked} disabled={!editingVariationGroup && item.disabled} onChange={(e) => {
                                                    if (editingVariationGroup) {
                                                        setVariationGroupForm((prev) => ({ ...prev, rows: prev.rows.map((row) => Number(row.tailleId) === Number(item.tailleId) ? { ...row, checked: e.target.checked } : row) }));
                                                    } else {
                                                        toggleVariationSize(item.tailleId, e.target.checked);
                                                    }
                                                }} />
                                                <span>{UI_TEXT.sizeLabel} {item.label} {!editingVariationGroup && item.disabled ? ` • ${UI_TEXT.alreadyExists}` : ""}</span>
                                            </div>
                                        </div>
                                        <div className="sizeStockBody">
                                            <span>{UI_TEXT.stockLabel}</span>
                                            <input type="number" min="0" step="1" value={item.quantiteStock} disabled={!item.checked} onChange={(e) => {
                                                if (editingVariationGroup) {
                                                    setVariationGroupForm((prev) => ({ ...prev, rows: prev.rows.map((row) => Number(row.tailleId) === Number(item.tailleId) ? { ...row, quantiteStock: e.target.value } : row) }));
                                                } else {
                                                    changeVariationSizeStock(item.tailleId, e.target.value);
                                                }
                                            }} />
                                        </div>
                                        {editingVariationGroup ? (
                                            <div className="sizeStockBody">
                                                <span>{UI_TEXT.price}</span>
                                                <input type="number" min="0.001" step="0.001" value={item.prix} disabled={!item.checked} onChange={(e) => {
                                                    setVariationGroupForm((prev) => ({ ...prev, rows: prev.rows.map((row) => Number(row.tailleId) === Number(item.tailleId) ? { ...row, prix: e.target.value } : row) }));
                                                }} />
                                            </div>
                                        ) : null}
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    <label className="fullCol">
                        <span>{UI_TEXT.variationImages}</span>
                        <input type="file" accept="image/*" multiple onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            if (editingVariationGroup) setVariationGroupForm((prev) => ({ ...prev, imageFiles: files }));
                            else setVariationForm((prev) => ({ ...prev, imageFiles: files }));
                        }} />
                    </label>

                    {!!(editingVariationGroup ? variationGroupForm.existingImageUrls : variationForm.existingImageUrls)?.length && (
                        <div className="fullCol variationCurrentImages">
                            <div className="variationHelp">{UI_TEXT.savedVariationImages}</div>
                            <div className="variationPreviewGrid">
                                {(editingVariationGroup ? variationGroupForm.existingImageUrls : variationForm.existingImageUrls).map((url, index) => {
                                    const imgSrc = fullImageUrl(url, `${editingVariationGroup?.key || editingVariationId || "variation"}-${index}`);
                                    return (
                                        <div key={`${url}-${index}`} className="variationPreviewItem">
                                            <button type="button" className="variationPreviewRemove" onClick={() => removeExistingVariationImage(index)} title="Remove image">×</button>
                                            {imgSrc ? (
                                                <img src={imgSrc} alt={`Variation ${index + 1}`} className="variationPreviewThumb" onError={(e) => { e.currentTarget.style.display = "none"; const fallback = e.currentTarget.nextElementSibling; if (fallback) fallback.style.display = "flex"; }} />
                                            ) : null}
                                            <div className="variationPreviewThumb fallback" style={{ display: imgSrc ? "none" : "flex" }}>{UI_TEXT.noImage}</div>
                                            <div className="variationPreviewName">{UI_TEXT.savedImage} {index + 1}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <label className="fullCol">
                        <span>{UI_TEXT.model3d}</span>
                        <input type="file" accept=".glb,.gltf,model/gltf-binary,model/gltf+json" onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            if (editingVariationGroup) setVariationGroupForm((prev) => ({ ...prev, model3dFile: file }));
                            else setVariationForm((prev) => ({ ...prev, model3dFile: file }));
                        }} />
                    </label>

                    {(editingVariationGroup ? variationGroupForm.existingModel3dUrl || variationGroupForm.model3dFile : variationForm.existingModel3dUrl || variationForm.model3dFile) && (
                        <div className="fullCol variationCurrentImages">
                            <div className="variationHelp">{UI_TEXT.currentModel}</div>
                            <div className="variationModelBox">
                                {(editingVariationGroup ? variationGroupForm.model3dFile : variationForm.model3dFile) ? (
                                    <div className="variationModelMeta"><strong>{UI_TEXT.newFile}:</strong> {(editingVariationGroup ? variationGroupForm.model3dFile : variationForm.model3dFile)?.name}</div>
                                ) : null}
                                {(editingVariationGroup ? variationGroupForm.existingModel3dUrl : variationForm.existingModel3dUrl) ? (
                                    <div className="variationModelMeta">
                                        <strong>{UI_TEXT.savedFile}:</strong>{" "}
                                        <a href={fullImageUrl(editingVariationGroup ? variationGroupForm.existingModel3dUrl : variationForm.existingModel3dUrl, editingVariationGroup?.key || editingVariationId || "model")} target="_blank" rel="noreferrer">
                                            {(editingVariationGroup ? variationGroupForm.existingModel3dName : variationForm.existingModel3dName) || UI_TEXT.openCurrentModel}
                                        </a>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    )}

                    <div className="fullCol variationHelp">{UI_TEXT.variationImageHint}</div>

                    <div className="admDialogActions fullCol">
                        <button type="submit" className="admBtn primary" disabled={busyCatalog || !colors.length || (!isAccessoryCategory && !sizes.length)}>
                            {editingVariationGroup ? UI_TEXT.saveAllSizes : editingVariationId ? UI_TEXT.updateVariation : UI_TEXT.saveVariation}
                        </button>
                    </div>
                </form>
            </dialog>

            <dialog ref={stockDialogRef} className="admDialog productDialog">
                <div className="admDialogHead">
                    <div className="admDialogTitle">{stockForm.mode === "increment" ? UI_TEXT.stockDialogRestock : UI_TEXT.stockDialogUse}</div>
                    <button type="button" className="admBtn mini" onClick={closeStockDialog}>{UI_TEXT.close}</button>
                </div>
                <form className="productForm admDialogBody" onSubmit={submitStockUpdate}>
                    <div className="variationHelp fullCol">{UI_TEXT.variationField}: {stockForm.label}</div>
                    <div className="variationHelp fullCol"><strong>{UI_TEXT.currentStock}:</strong> {stockForm.currentStock}</div>
                    {stockError && <div className="admAlert fullCol">{stockError}</div>}

                    <label className="fullCol">
                        <span>{stockForm.mode === "increment" ? UI_TEXT.addQuantity : UI_TEXT.removeQuantity}</span>
                        <input type="number" min="1" step="1" value={stockForm.quantity} onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })} required />
                    </label>

                    <div className="variationHelp fullCol" style={{ marginTop: "8px", fontWeight: "bold", color: stockNextValue < 0 ? "#c62828" : "inherit" }}>
                        {UI_TEXT.newStockAfterUpdate}: {stockNextValue}
                    </div>

                    <div className="admDialogActions fullCol">
                        <button type="submit" className="admBtn primary" disabled={busyCatalog || stockNextValue < 0}>
                            {stockForm.mode === "increment" ? UI_TEXT.confirmRestock : UI_TEXT.confirmStockRemoval}
                        </button>
                    </div>
                </form>
            </dialog>

            <dialog ref={categoryDialogRef} className="admDialog productDialog">
                <div className="admDialogHead">
                    <div className="admDialogTitle">{editingCategoryId ? UI_TEXT.categoryDialogEdit : UI_TEXT.categoryDialogAdd}</div>
                    <button type="button" className="admBtn mini" onClick={() => categoryDialogRef.current?.close()}>{UI_TEXT.close}</button>
                </div>
                <form className="productForm admDialogBody" onSubmit={saveCategory}>
                    <label><span>{UI_TEXT.categoryName}</span><input value={categoryForm.nom} onChange={(e) => setCategoryForm({ ...categoryForm, nom: e.target.value })} required /></label>
                    <label className="fullCol"><span>{UI_TEXT.description}</span><textarea rows="3" value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} /></label>
                    <div className="admDialogActions fullCol"><button type="submit" className="admBtn primary" disabled={busyCatalog}>{editingCategoryId ? UI_TEXT.updateCategory : UI_TEXT.saveCategory}</button></div>
                </form>
            </dialog>

            <dialog ref={colorDialogRef} className="admDialog productDialog">
                <div className="admDialogHead">
                    <div className="admDialogTitle">{editingColorId ? UI_TEXT.colorDialogEdit : UI_TEXT.colorDialogAdd}</div>
                    <button type="button" className="admBtn mini" onClick={() => colorDialogRef.current?.close()}>{UI_TEXT.close}</button>
                </div>
                <form className="productForm admDialogBody" onSubmit={saveColor}>
                    <label><span>{UI_TEXT.colorName}</span><input value={colorForm.nom} onChange={(e) => setColorForm({ ...colorForm, nom: e.target.value })} required /></label>
                    <label><span>{UI_TEXT.hexColor}</span><input type="color" value={colorForm.codeHex} onChange={(e) => setColorForm({ ...colorForm, codeHex: e.target.value })} required /></label>
                    <div className="admDialogActions fullCol"><button type="submit" className="admBtn primary" disabled={busyCatalog}>{editingColorId ? UI_TEXT.updateColor : UI_TEXT.saveColor}</button></div>
                </form>
            </dialog>

            <dialog ref={sizeDialogRef} className="admDialog productDialog">
                <div className="admDialogHead">
                    <div className="admDialogTitle">{editingSizeId ? UI_TEXT.sizeDialogEdit : UI_TEXT.sizeDialogAdd}</div>
                    <button type="button" className="admBtn mini" onClick={() => sizeDialogRef.current?.close()}>{UI_TEXT.close}</button>
                </div>
                <form className="productForm admDialogBody" onSubmit={saveSize}>
                    <label><span>{UI_TEXT.sizeLabel}</span><input value={sizeForm.pointure} onChange={(e) => setSizeForm({ ...sizeForm, pointure: e.target.value })} required /></label>
                    <div className="admDialogActions fullCol"><button type="submit" className="admBtn primary" disabled={busyCatalog}>{editingSizeId ? UI_TEXT.updateSize : UI_TEXT.saveSize}</button></div>
                </form>
            </dialog>
        </>
    );
}