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

    recommended: "Recommended",
    active: "ACTIVE",
    inactive: "INACTIVE",
    edit: "Edit",
    delete: "Delete",
    noArticles: "No articles",

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
    variationImageHint:
        "Images are shared for the selected color batch in create mode. In edit mode, you update one saved variation.",
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
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [editingColorId, setEditingColorId] = useState(null);
    const [editingSizeId, setEditingSizeId] = useState(null);

    const [historyMode, setHistoryMode] = useState("article");
    const [historyRows, setHistoryRows] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [selectedVariationHistoryId, setSelectedVariationHistoryId] = useState("");

    const [stockError, setStockError] = useState("");
    const [stockForm, setStockForm] = useState({
        variationId: "",
        label: "",
        currentStock: 0,
        quantity: 1,
        mode: "decrement",
    });

    const [failedVariationImages, setFailedVariationImages] = useState({});
    const [failedHistoryActors, setFailedHistoryActors] = useState({});

    const articleDialogRef = useRef(null);
    const variationDialogRef = useRef(null);
    const categoryDialogRef = useRef(null);
    const colorDialogRef = useRef(null);
    const sizeDialogRef = useRef(null);
    const stockDialogRef = useRef(null);
    const historySectionRef = useRef(null);

    const colorNameById = useMemo(
        () => Object.fromEntries(colors.map((c) => [Number(c.id), c.nom])),
        [colors]
    );

    const sizeNameById = useMemo(
        () => Object.fromEntries(sizes.map((s) => [Number(s.id), s.pointure])),
        [sizes]
    );

    const isAccessoryCategory = useMemo(() => {
        const raw = selectedArticle?.categorieNom || "";
        const normalized = raw.trim().toLowerCase();
        return (
            normalized === "accessoire" ||
            normalized === "accessory" ||
            normalized === "accessories"
        );
    }, [selectedArticle?.categorieNom]);

    const selectedArticlePreview = useMemo(() => {
        if (!variations.length) return "";
        return firstVariationImage(variations[0]);
    }, [variations]);

    const selectedArticlePreviewVersion = useMemo(() => {
        if (!variations.length) return "";
        return variationImageVersion(variations[0]);
    }, [variations]);

    function variationDisplayName(v) {
        if (!v) return "";
        const color = v.couleurNom || UI_TEXT.colorLabel;
        const size = v.taillePointure || "";
        return size ? `${color} / ${size}` : color;
    }

    const groupedVariations = useMemo(() => {
        return variations.reduce((acc, v) => {
            const colorName = v.couleurNom || colorNameById[Number(v.couleurId)] || "Unknown";
            const sizeName =
                v.taillePointure || sizeNameById[Number(v.tailleId)] || UI_TEXT.stockOnly;

            if (!acc[colorName]) acc[colorName] = [];
            acc[colorName].push(sizeName);
            return acc;
        }, {});
    }, [variations, colorNameById, sizeNameById]);

    const filteredArticles = useMemo(() => {
        const s = catalogQ.trim().toLowerCase();
        if (!s) return articles;

        return articles.filter((a) =>
            `${a.nom || ""} ${a.description || ""} ${a.categorieNom || ""} ${a.marque || ""} ${a.sku || ""}`
                .toLowerCase()
                .includes(s)
        );
    }, [catalogQ, articles]);

    const variationSelectedCount = useMemo(
        () => (variationForm.sizeStocks || []).filter((x) => x.checked).length,
        [variationForm.sizeStocks]
    );

    const selectedStockVariation = useMemo(
        () => variations.find((v) => String(v.id) === String(stockForm.variationId)) || null,
        [variations, stockForm.variationId]
    );

    const stockNextValue = useMemo(() => {
        const qty = Number(stockForm.quantity || 0);
        const current = Number(stockForm.currentStock || 0);
        if (!Number.isFinite(qty) || qty < 0) return current;
        return stockForm.mode === "increment" ? current + qty : current - qty;
    }, [stockForm]);

    function scrollToHistory() {
        historySectionRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    }

    function normalizeVariationImageUrl(item) {
    if (!item) return "";

    if (typeof item === "string") return item.trim();

    return String(
        item.url ||
        item.imageUrl ||
        item.path ||
        item.fileUrl ||
        item.downloadUrl ||
        item.contentUrl ||
        item.src ||
        item.href ||
        item.publicUrl ||
        ""
    ).trim();
}

function getVariationImageUrls(source) {
    if (!source) return [];

    const urls = [];

    const pushValue = (value) => {
        const normalized = normalizeVariationImageUrl(value);
        if (normalized) urls.push(normalized);
    };

    if (Array.isArray(source.images)) source.images.forEach(pushValue);
    if (Array.isArray(source.imageUrls)) source.imageUrls.forEach(pushValue);
    if (Array.isArray(source.existingImageUrls)) source.existingImageUrls.forEach(pushValue);

    [
        source.image,
        source.image1,
        source.image2,
        source.image3,
        source.image4,
        source.imageUrl,
        source.imageUrl1,
        source.imageUrl2,
        source.imageUrl3,
        source.imageUrl4,
        source.previewImage,
        source.thumbnail,
    ].forEach(pushValue);

    return [...new Set(urls.filter(Boolean))];
}

function firstVariationImage(v) {
    const urls = getVariationImageUrls(v);
    return urls.length ? urls[0] : "";
}
function getVariationImageUrls(source) {
    if (!source) return [];

    const variationId = source.id;
    const urls = [];

    const pushValue = (value) => {
        const normalized = normalizeVariationImageUrl(value, variationId);
        if (normalized) urls.push(normalized);
    };

    if (Array.isArray(source.images)) {
        source.images.forEach(pushValue);
    }

    if (Array.isArray(source.imageUrls)) {
        source.imageUrls.forEach(pushValue);
    }

    if (Array.isArray(source.existingImageUrls)) {
        source.existingImageUrls.forEach(pushValue);
    }

    if (Array.isArray(source.files)) {
        source.files.forEach(pushValue);
    }

    if (Array.isArray(source.imageIds)) {
        source.imageIds.forEach((id) => {
            if (variationId && id) {
                urls.push(`/api/admin/variations/${variationId}/images/${id}`);
            }
        });
    }

    [
        source.image,
        source.image1,
        source.image2,
        source.image3,
        source.image4,
        source.imageUrl,
        source.imageUrl1,
        source.imageUrl2,
        source.imageUrl3,
        source.imageUrl4,
        source.existingImage1,
        source.existingImage2,
        source.existingImage3,
        source.existingImage4,
        source.previewImage,
        source.thumbnail,
        source.fileName,
        source.filename,
    ].forEach(pushValue);

    if (source.imageId && variationId) {
        urls.push(`/api/admin/variations/${variationId}/images/${source.imageId}`);
    }

    return [...new Set(urls.filter(Boolean))];


    
}

function firstVariationImage(v) {
    const urls = getVariationImageUrls(v);
    return urls.length ? urls[0] : "";
}
    function getVariationImageUrls(source) {
        if (!source) return [];
        const urls = [];

        if (Array.isArray(source.images)) {
            source.images.forEach((img) => {
                const value = normalizeVariationImageUrl(img);
                if (value) urls.push(value);
            });
        }

        if (Array.isArray(source.imageUrls)) {
            source.imageUrls.forEach((img) => {
                const value = normalizeVariationImageUrl(img);
                if (value) urls.push(value);
            });
        }

        if (Array.isArray(source.existingImageUrls)) {
            source.existingImageUrls.forEach((img) => {
                const value = normalizeVariationImageUrl(img);
                if (value) urls.push(value);
            });
        }

        [
            source.imageUrl,
            source.imageUrl2,
            source.imageUrl3,
            source.imageUrl4,
            source.existingImage1,
            source.existingImage2,
            source.existingImage3,
            source.existingImage4,
        ].forEach((value) => {
            if (value) urls.push(value);
        });

        return [...new Set(urls.filter(Boolean))];
    }

    function firstVariationImage(v) {
        const urls = getVariationImageUrls(v);
        return urls.length ? urls[0] : "";
    }

    function initials(name) {
        if (!name) return "?";
        return name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join("");
    }

    function variationImageKey(variationId, url) {
        return `${variationId || "new"}::${url || "no-image"}`;
    }

    function isVariationImageBroken(variationId, url) {
        return !!failedVariationImages[variationImageKey(variationId, url)];
    }

    function handleVariationImageError(variationId, url) {
        const key = variationImageKey(variationId, url);
        setFailedVariationImages((prev) => ({
            ...prev,
            [key]: true,
        }));
    }

    function historyActorKey(row) {
        return String(row?.actorUserId || row?.id || row?.actorEmail || Math.random());
    }

    function isHistoryActorBroken(row) {
        return !!failedHistoryActors[historyActorKey(row)];
    }

    function handleHistoryActorError(row) {
        const key = historyActorKey(row);
        setFailedHistoryActors((prev) => ({
            ...prev,
            [key]: true,
        }));
    }

    async function loadArticleHistory(articleId) {
        if (!articleId) {
            setHistoryRows([]);
            return;
        }

        setHistoryLoading(true);
        try {
            const res = await api.get(`/api/admin/articles/${articleId}/history`);
            setHistoryRows(res.data || []);
        } catch (e) {
            setHistoryRows([]);
            setCatalogError(
                e?.response?.data?.message || e.message || UI_TEXT.errLoadArticleHistory
            );
        } finally {
            setHistoryLoading(false);
        }
    }

    async function loadVariationHistory(variationId) {
        if (!variationId) {
            setHistoryRows([]);
            return;
        }

        setHistoryLoading(true);
        try {
            const res = await api.get(`/api/admin/variations/${variationId}/history`);
            setHistoryRows(res.data || []);
        } catch (e) {
            setHistoryRows([]);
            setCatalogError(
                e?.response?.data?.message || e.message || UI_TEXT.errLoadVariationHistory
            );
        } finally {
            setHistoryLoading(false);
        }
    }

    async function syncHistory(articleData, variationData) {
        if (!articleData) {
            setHistoryRows([]);
            return;
        }

        if (historyMode === "variation") {
            const candidateId = selectedVariationHistoryId || variationData?.[0]?.id || "";
            setSelectedVariationHistoryId(candidateId ? String(candidateId) : "");

            if (candidateId) {
                await loadVariationHistory(candidateId);
            } else {
                setHistoryRows([]);
            }
        } else {
            await loadArticleHistory(articleData.id);
        }
    }

    async function loadArticleDetails(id) {
    const [res, vr] = await Promise.all([
        api.get(`/api/articles/${id}`),
        api.get(`/api/admin/articles/${id}/variations`),
    ]);

    const articleData = res.data || {};
    const publicVariations = Array.isArray(articleData.variations) ? articleData.variations : [];
    const adminVariations = Array.isArray(vr.data) ? vr.data : [];

    const publicMap = new Map(
        publicVariations.map((v) => [String(v.id), v])
    );

    const mergedVariations = adminVariations.map((v) => {
        const pub = publicMap.get(String(v.id)) || {};

        return {
            ...pub,
            ...v,
            imageUrls:
                Array.isArray(v.imageUrls) && v.imageUrls.length
                    ? v.imageUrls
                    : Array.isArray(pub.imageUrls)
                      ? pub.imageUrls
                      : [],
            model3dUrl: v.model3dUrl || pub.model3dUrl || "",
            couleurNom: v.couleurNom || pub.couleurNom || "",
            couleurCodeHex: v.couleurCodeHex || pub.couleurCodeHex || "",
            taillePointure: v.taillePointure || pub.taillePointure || "",
        };
    });

    setSelectedArticle(articleData);
    setVariations(mergedVariations);
    setCatalogError("");

    if (historyMode === "variation") {
        const stillExists = mergedVariations.some(
            (v) => String(v.id) === String(selectedVariationHistoryId)
        );

        const nextVariationId = stillExists
            ? selectedVariationHistoryId
            : mergedVariations[0]?.id
              ? String(mergedVariations[0].id)
              : "";

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

        if (stillExists) {
            await loadArticleDetails(selectedArticle.id);
        } else {
            await loadArticleDetails(list[0].id);
        }
    }

    useEffect(() => {
        refreshCatalog(true).catch((e) =>
            setCatalogError(e?.response?.data?.message || e.message || UI_TEXT.errLoadCatalog)
        );
    }, []);

    useEffect(() => {
        setFailedVariationImages({});
        setFailedHistoryActors({});
    }, [selectedArticle?.id]);

    useEffect(() => {
        if (!selectedArticle?.id) return;

        if (historyMode === "article") {
            loadArticleHistory(selectedArticle.id).catch(() => {});
        } else if (historyMode === "variation") {
            if (selectedVariationHistoryId) {
                loadVariationHistory(selectedVariationHistoryId).catch(() => {});
            } else if (variations[0]?.id) {
                const firstId = String(variations[0].id);
                setSelectedVariationHistoryId(firstId);
                loadVariationHistory(firstId).catch(() => {});
            } else {
                setHistoryRows([]);
            }
        }
    }, [historyMode, selectedArticle?.id, selectedVariationHistoryId, variations]);

    function openCreateArticle() {
        setEditingArticleId(null);
        setArticleForm({ ...emptyArticleForm });
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
            setCatalogError(UI_TEXT.validationArticleName);
            setBusyCatalog(false);
            return;
        }

        if (!articleForm.categorieId) {
            setCatalogError(UI_TEXT.validationCategoryRequired);
            setBusyCatalog(false);
            return;
        }

        if (!Number.isFinite(prix) || prix <= 0) {
            setCatalogError(UI_TEXT.validationPriceGreaterThanZero);
            setBusyCatalog(false);
            return;
        }

        if (salePrice !== null && (!Number.isFinite(salePrice) || salePrice < 0 || salePrice >= prix)) {
            setCatalogError(UI_TEXT.validationSaleLower);
            setBusyCatalog(false);
            return;
        }

        if (articleForm.saleStartAt && articleForm.saleEndAt) {
            const start = new Date(articleForm.saleStartAt).getTime();
            const end = new Date(articleForm.saleEndAt).getTime();

            if (end < start) {
                setCatalogError(UI_TEXT.validationSaleDates);
                setBusyCatalog(false);
                return;
            }
        }

        try {
            const payload = {
                nom: articleForm.nom.trim(),
                description: articleForm.description || "",
                details: articleForm.details || "",
                prix,
                actif: !!articleForm.actif,
                categorieId: Number(articleForm.categorieId),
                marque: articleForm.marque || "",
                matiere: articleForm.matiere || "",
                sku: articleForm.sku || "",
                salePrice,
                saleStartAt: articleForm.saleStartAt || null,
                saleEndAt: articleForm.saleEndAt || null,
                recommended: !!articleForm.recommended,
            };

            const fd = new FormData();
            fd.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));

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
            setCatalogError(e2?.response?.data?.message || UI_TEXT.errSaveArticle);
        } finally {
            setBusyCatalog(false);
        }
    }

    async function deleteArticle(id) {
        if (!window.confirm(UI_TEXT.confirmDeleteArticle)) return;
        setBusyCatalog(true);
        setCatalogError("");

        try {
            await api.delete(`/api/admin/articles/${id}`);

            if (selectedArticle?.id === id) {
                setSelectedArticle(null);
                setVariations([]);
                setHistoryRows([]);
                setSelectedVariationHistoryId("");
            }

            await refreshCatalog(true);
        } catch (e) {
            setCatalogError(e?.response?.data?.message || UI_TEXT.errDeleteArticle);
        } finally {
            setBusyCatalog(false);
        }
    }

    function closeVariationDialog() {
        setVariationError("");
        variationDialogRef.current?.close();
    }

    function buildSizeStocks(defaultStock = 0, colorId = "") {
        const currentColorId = Number(colorId || 0);

        return sizes.map((s) => {
            const alreadyExists = variations.some(
                (v) =>
                    Number(v.couleurId) === currentColorId &&
                    Number(v.tailleId) === Number(s.id) &&
                    Number(v.id) !== Number(editingVariationId || 0)
            );

            return {
                tailleId: Number(s.id),
                label: s.pointure,
                checked: false,
                quantiteStock: defaultStock,
                disabled: alreadyExists,
            };
        });
    }

    function toggleVariationSize(tailleId, checked) {
        setVariationForm((prev) => ({
            ...prev,
            sizeStocks: (prev.sizeStocks || []).map((item) =>
                Number(item.tailleId) === Number(tailleId) ? { ...item, checked } : item
            ),
        }));
    }

    function changeVariationSizeStock(tailleId, value) {
        setVariationForm((prev) => ({
            ...prev,
            sizeStocks: (prev.sizeStocks || []).map((item) =>
                Number(item.tailleId) === Number(tailleId)
                    ? { ...item, quantiteStock: value }
                    : item
            ),
        }));
    }

    function handleVariationColorChange(colorId) {
        if (isAccessoryCategory) {
            setVariationForm((prev) => ({
                ...prev,
                couleurId: colorId,
            }));
            return;
        }

        setVariationForm((prev) => ({
            ...prev,
            couleurId: colorId,
            sizeStocks: sizes.map((s) => {
                const existingCurrent =
                    (prev.sizeStocks || []).find((x) => Number(x.tailleId) === Number(s.id)) || null;

                const alreadyExists = variations.some(
                    (v) =>
                        Number(v.couleurId) === Number(colorId || 0) &&
                        Number(v.tailleId) === Number(s.id) &&
                        Number(v.id) !== Number(editingVariationId || 0)
                );

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

    function openCreateVariation() {
        if (!selectedArticle) return;

        if (!colors.length) {
            setCatalogError(UI_TEXT.validationNeedColorOnly);
            return;
        }

        if (!isAccessoryCategory && !sizes.length) {
            setCatalogError(UI_TEXT.validationNeedColorAndSize);
            return;
        }

        const initialColorId = colors[0]?.id ? String(colors[0].id) : "";

        setEditingVariationId(null);
        setVariationError("");
        setVariationForm({
            ...emptyVariationForm,
            prix: selectedArticle?.prix ?? "",
            couleurId: initialColorId,
            quantiteStock: 0,
            sizeStocks: isAccessoryCategory ? [] : buildSizeStocks(0, initialColorId),
            imageFiles: [],
            existingImageUrls: [],
            model3dFile: null,
            existingModel3dUrl: "",
            existingModel3dName: "",
            existingModel3dType: "",
        });

        variationDialogRef.current?.showModal();
    }

    function openEditVariation(v) {
        setEditingVariationId(v.id);
        setVariationError("");
        setVariationForm({
            ...emptyVariationForm,
            prix: v.prix ?? "",
            couleurId: v.couleurId ? String(v.couleurId) : "",
            quantiteStock: v.quantiteStock ?? 0,
            sizeStocks: isAccessoryCategory
                ? []
                : sizes.map((s) => ({
                      tailleId: Number(s.id),
                      label: s.pointure,
                      checked: Number(s.id) === Number(v.tailleId),
                      quantiteStock:
                          Number(s.id) === Number(v.tailleId) ? (v.quantiteStock ?? 0) : 0,
                      disabled: Number(s.id) !== Number(v.tailleId),
                  })),
            imageFiles: [],
            existingImageUrls: getVariationImageUrls(v),
            model3dFile: null,
            existingModel3dUrl: v.model3dUrl || "",
            existingModel3dName: v.model3dName || "",
            existingModel3dType: v.model3dType || "",
        });

        variationDialogRef.current?.showModal();
    }

    async function saveVariation(e) {
        e.preventDefault();
        if (!selectedArticle) return;

        setCatalogError("");
        setVariationError("");

        const prix = Number(variationForm.prix);
        const couleurId = Number(variationForm.couleurId);

        if (!couleurId) {
            setVariationError(UI_TEXT.validationSelectColor);
            return;
        }

        if (!Number.isFinite(prix) || prix <= 0) {
            setVariationError(UI_TEXT.validationPriceGreaterThanZero);
            return;
        }

        setBusyCatalog(true);

        try {
            const fd = new FormData();

            if (isAccessoryCategory) {
                const stock = Number(variationForm.quantiteStock);

                if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
                    setVariationError(UI_TEXT.validationAccessoryStock);
                    setBusyCatalog(false);
                    return;
                }

                const payload = {
                    prix,
                    couleurId,
                    quantiteStock: stock,
                };

                fd.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));

                (variationForm.imageFiles || []).forEach((file) => {
                    fd.append("images", file);
                });

                if (variationForm.model3dFile) {
                    fd.append("model3d", variationForm.model3dFile);
                }

                if (editingVariationId) {
                    await api.put(`/api/admin/variations/${editingVariationId}`, fd, {
                        headers: { "Content-Type": "multipart/form-data" },
                    });
                } else {
                    await api.post(`/api/admin/articles/${selectedArticle.id}/variations`, fd, {
                        headers: { "Content-Type": "multipart/form-data" },
                    });
                }
            } else {
                const checkedSizes = (variationForm.sizeStocks || []).filter((x) => x.checked);

                if (!checkedSizes.length) {
                    setVariationError(UI_TEXT.validationSelectOneSize);
                    setBusyCatalog(false);
                    return;
                }

                for (const item of checkedSizes) {
                    const stock = Number(item.quantiteStock);
                    if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
                        setVariationError(
                            UI_TEXT.validationStockWholeNumber.replace("{{size}}", item.label)
                        );
                        setBusyCatalog(false);
                        return;
                    }
                }

                if (editingVariationId && checkedSizes.length !== 1) {
                    setVariationError(UI_TEXT.validationEditOneSize);
                    setBusyCatalog(false);
                    return;
                }

                if (editingVariationId) {
                    const selectedSize = checkedSizes[0];

                    const payload = {
                        prix,
                        quantiteStock: Number(selectedSize.quantiteStock),
                        couleurId,
                        tailleId: Number(selectedSize.tailleId),
                    };

                    fd.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
                } else {
                    const payload = {
                        prix,
                        couleurId,
                        sizes: checkedSizes.map((item) => ({
                            tailleId: Number(item.tailleId),
                            quantiteStock: Number(item.quantiteStock),
                        })),
                    };

                    fd.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
                }

                (variationForm.imageFiles || []).forEach((file) => {
                    fd.append("images", file);
                });

                if (variationForm.model3dFile) {
                    fd.append("model3d", variationForm.model3dFile);
                }

                if (editingVariationId) {
                    await api.put(`/api/admin/variations/${editingVariationId}`, fd, {
                        headers: { "Content-Type": "multipart/form-data" },
                    });
                } else {
                    await api.post(`/api/admin/articles/${selectedArticle.id}/variations`, fd, {
                        headers: { "Content-Type": "multipart/form-data" },
                    });
                }
            }

            closeVariationDialog();
            await loadArticleDetails(selectedArticle.id);
            await refreshCatalog(false);
        } catch (e2) {
            setCatalogError(e2?.response?.data?.message || UI_TEXT.errSaveVariation);
        } finally {
            setBusyCatalog(false);
        }
    }

    async function deleteVariation(id) {
        if (!window.confirm(UI_TEXT.confirmDeleteVariation)) return;
        setBusyCatalog(true);
        setCatalogError("");

        try {
            await api.delete(`/api/admin/variations/${id}`);

            if (selectedArticle?.id) {
                await loadArticleDetails(selectedArticle.id);
            }

            await refreshCatalog(false);
        } catch (e) {
            setCatalogError(e?.response?.data?.message || UI_TEXT.errDeleteVariation);
        } finally {
            setBusyCatalog(false);
        }
    }

    async function updateVariationStock(variation, nextStock) {
        const payload = {
            prix: Number(variation.prix),
            quantiteStock: Number(nextStock),
            couleurId: Number(variation.couleurId),
            tailleId: variation.tailleId != null ? Number(variation.tailleId) : null,
        };

        const fd = new FormData();
        fd.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));

        await api.put(`/api/admin/variations/${variation.id}`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    }

    async function quickSellOne(v) {
        if (!v) return;

        setCatalogError("");
        setStockError("");

        const currentStock = Number(v.quantiteStock || 0);
        if (currentStock <= 0) {
            setCatalogError(UI_TEXT.validationOutOfStock);
            return;
        }

        setBusyCatalog(true);
        try {
            await updateVariationStock(v, currentStock - 1);

            if (selectedArticle?.id) {
                await loadArticleDetails(selectedArticle.id);
            }

            await refreshCatalog(false);
        } catch (e) {
            setCatalogError(e?.response?.data?.message || UI_TEXT.errStockUpdate);
        } finally {
            setBusyCatalog(false);
        }
    }

    function openStockDialog(variation, mode = "decrement") {
        if (!variation) return;

        setStockError("");
        setStockForm({
            variationId: String(variation.id),
            label: variationDisplayName(variation),
            currentStock: Number(variation.quantiteStock || 0),
            quantity: 1,
            mode,
        });

        stockDialogRef.current?.showModal();
    }

    function closeStockDialog() {
        setStockError("");
        stockDialogRef.current?.close();
    }

    async function submitStockUpdate(e) {
        e.preventDefault();
        setStockError("");
        setCatalogError("");

        const variation = selectedStockVariation;
        const qty = Number(stockForm.quantity);

        if (!variation) {
            setStockError(UI_TEXT.validationVariationNotFound);
            return;
        }

        if (!Number.isFinite(qty) || qty <= 0 || !Number.isInteger(qty)) {
            setStockError(UI_TEXT.validationQuantityPositive);
            return;
        }

        if (stockForm.mode === "decrement" && qty > Number(stockForm.currentStock || 0)) {
            setStockError(UI_TEXT.validationCannotRemoveMore);
            return;
        }

        if (stockNextValue < 0) {
            setStockError(UI_TEXT.validationNoNegativeStock);
            return;
        }

        setBusyCatalog(true);

        try {
            await updateVariationStock(variation, stockNextValue);
            closeStockDialog();

            if (selectedArticle?.id) {
                await loadArticleDetails(selectedArticle.id);
            }

            await refreshCatalog(false);
        } catch (e2) {
            setCatalogError(e2?.response?.data?.message || UI_TEXT.errStockUpdate);
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
            setCatalogError(UI_TEXT.validationCategoryName);
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
            setCatalogError(e2?.response?.data?.message || UI_TEXT.errSaveCategory);
        } finally {
            setBusyCatalog(false);
        }
    }

    async function deleteCategory(id) {
        if (!window.confirm(UI_TEXT.confirmDeleteCategory)) return;
        setBusyCatalog(true);

        try {
            await api.delete(`/api/admin/categories/${id}`);
            await refreshCatalog(false);
        } catch (e) {
            setCatalogError(e?.response?.data?.message || UI_TEXT.errDeleteCategory);
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
            setCatalogError(UI_TEXT.validationColorName);
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
            setCatalogError(e2?.response?.data?.message || UI_TEXT.errSaveColor);
        } finally {
            setBusyCatalog(false);
        }
    }

    async function deleteColor(id) {
        if (!window.confirm(UI_TEXT.confirmDeleteColor)) return;
        setBusyCatalog(true);

        try {
            await api.delete(`/api/admin/colors/${id}`);
            await refreshCatalog(false);
        } catch (e) {
            setCatalogError(e?.response?.data?.message || UI_TEXT.errDeleteColor);
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
            setCatalogError(UI_TEXT.validationSizeRequired);
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
            setCatalogError(e2?.response?.data?.message || UI_TEXT.errSaveSize);
        } finally {
            setBusyCatalog(false);
        }
    }

    async function deleteSize(id) {
        if (!window.confirm(UI_TEXT.confirmDeleteSize)) return;
        setBusyCatalog(true);

        try {
            await api.delete(`/api/admin/sizes/${id}`);
            await refreshCatalog(false);
        } catch (e) {
            setCatalogError(e?.response?.data?.message || UI_TEXT.errDeleteSize);
        } finally {
            setBusyCatalog(false);
        }
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
                            <div className="admSearchWrap">
                                <input
                                    className="admSearch"
                                    value={catalogQ}
                                    onChange={(e) => setCatalogQ(e.target.value)}
                                    placeholder={tx("admin.catalog.searchPlaceholder", UI_TEXT.searchPlaceholder)}
                                />
                            </div>

                            <div className="catalogActionBar">
                                <button type="button" className="admBtn" onClick={() => refreshCatalog(false)}>
                                    {tx("admin.common.refresh", UI_TEXT.refresh)}
                                </button>

                                <button type="button" className="admBtn" onClick={scrollToHistory}>
                                    {UI_TEXT.history}
                                </button>

                                <button type="button" className="admBtn" onClick={openCreateSize}>
                                    {tx("admin.catalog.addSize", UI_TEXT.addSize)}
                                </button>

                                <button type="button" className="admBtn" onClick={openCreateCategory}>
                                    {tx("admin.catalog.addCategory", UI_TEXT.addCategory)}
                                </button>

                                <button type="button" className="admBtn" onClick={openCreateColor}>
                                    {tx("admin.catalog.addColor", UI_TEXT.addColor)}
                                </button>

                                <button type="button" className="admBtn primary" onClick={openCreateArticle}>
                                    {tx("admin.catalog.addArticle", UI_TEXT.addArticle)}
                                </button>
                            </div>
                        </div>
                    </div>

                    {catalogError && <div className="admAlert">{catalogError}</div>}

                    <div className="admGrid">
                        <div className="admCard">
                            <div className="admCardTop">
                                <div className="admCardTitle">
                                    {filteredArticles.length} {tx("admin.common.articlesCount", UI_TEXT.articlesCount)}
                                </div>
                            </div>

                            <div className="admTable">
                                <div className="admTr head articleRow">
                                    <div>{tx("admin.table.article", UI_TEXT.tableArticle)}</div>
                                    <div>{tx("admin.table.category", UI_TEXT.tableCategory)}</div>
                                    <div>{tx("admin.table.price", UI_TEXT.tablePrice)}</div>
                                    <div>{tx("admin.table.status", UI_TEXT.tableStatus)}</div>
                                    <div style={{ textAlign: "right" }}>
                                        {tx("admin.table.actions", UI_TEXT.tableActions)}
                                    </div>
                                </div>

                                {filteredArticles.map((a) => {
                                    const saleLive = isSaleActive(a);

                                    return (
                                        <div
                                            key={a.id}
                                            className={`admTr row articleRow ${selectedArticle?.id === a.id ? "active" : ""}`}
                                            onClick={() =>
                                                loadArticleDetails(a.id).catch((e) =>
                                                    setCatalogError(
                                                        e?.response?.data?.message || e.message || UI_TEXT.errLoadArticle
                                                    )
                                                )
                                            }
                                        >
                                            <div>
                                                <div className="admName">{a.nom}</div>
                                                <div className="admRole">
                                                    #{a.id}
                                                    {a.recommended
                                                        ? ` • ${tx("admin.catalog.recommended", UI_TEXT.recommended)}`
                                                        : ""}
                                                    {saleLive ? ` • Sale -${salePercent(a)}%` : ""}
                                                </div>
                                            </div>

                                            <div>{a.categorieNom || "-"}</div>
                                            <div>
                                                {saleLive
                                                    ? `${fmtPrice(a.salePrice)} / ${fmtPrice(a.prix)}`
                                                    : fmtPrice(a.prix)}
                                            </div>

                                            <div>
                                                <span className={`admBadge ${a.actif ? "ok" : "bad"}`}>
                                                    {a.actif ? UI_TEXT.active : UI_TEXT.inactive}
                                                </span>
                                            </div>

                                            <div className="admRowActions" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    type="button"
                                                    className="admBtn mini"
                                                    onClick={() => openEditArticle(a)}
                                                >
                                                    {tx("admin.common.edit", UI_TEXT.edit)}
                                                </button>

                                                <button
                                                    type="button"
                                                    className="admBtn mini danger"
                                                    onClick={() => deleteArticle(a.id)}
                                                >
                                                    {tx("admin.common.delete", UI_TEXT.delete)}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}

                                {!filteredArticles.length ? (
                                    <div className="admEmpty">{tx("admin.catalog.noArticles", UI_TEXT.noArticles)}</div>
                                ) : null}
                            </div>
                        </div>

                        <div className="admCard side catalogSidePanel">
                            {!selectedArticle ? (
                                <div className="admEmpty">{tx("admin.catalog.selectArticle", UI_TEXT.selectArticle)}</div>
                            ) : (
                                <>
                                    <div className="admSideTop articleSideTop">
                                        {selectedArticlePreview ? (
                                            <img
                                                src={fullImageUrl(selectedArticlePreview, selectedArticlePreviewVersion)}
                                                alt={selectedArticle.nom}
                                                className="selectedArticleImage"
                                            />
                                        ) : (
                                            <div className="selectedArticleImage empty">{UI_TEXT.noImage}</div>
                                        )}

                                        <div>
                                            <div className="admSideName">{selectedArticle.nom}</div>
                                            <div className="admSideRole">{selectedArticle.categorieNom || "-"}</div>
                                        </div>
                                    </div>

                                    <div className="admDivider" />

                                    <div className="admInfo">
                                        <div className="admInfoRow">
                                            <span>{tx("admin.catalog.price", UI_TEXT.price)}</span>
                                            <span>{fmtPrice(selectedArticle.prix)}</span>
                                        </div>

                                        <div className="admInfoRow">
                                            <span>{tx("admin.catalog.salePrice", UI_TEXT.salePrice)}</span>
                                            <span>{fmtPrice(selectedArticle.salePrice)}</span>
                                        </div>

                                        <div className="admInfoRow">
                                            <span>{tx("admin.catalog.saleStart", UI_TEXT.saleStart)}</span>
                                            <span>{fmt(selectedArticle.saleStartAt)}</span>
                                        </div>

                                        <div className="admInfoRow">
                                            <span>{tx("admin.catalog.saleEnd", UI_TEXT.saleEnd)}</span>
                                            <span>{fmt(selectedArticle.saleEndAt)}</span>
                                        </div>

                                        <div className="admInfoRow">
                                            <span>{tx("admin.catalog.onSaleNow", UI_TEXT.onSaleNow)}</span>
                                            <span>{isSaleActive(selectedArticle) ? UI_TEXT.yes : UI_TEXT.no}</span>
                                        </div>

                                        <div className="admInfoRow">
                                            <span>{tx("admin.catalog.recommended", UI_TEXT.recommended)}</span>
                                            <span>{selectedArticle.recommended ? UI_TEXT.yes : UI_TEXT.no}</span>
                                        </div>

                                        <div className="admInfoRow">
                                            <span>{tx("admin.catalog.brand", UI_TEXT.brand)}</span>
                                            <span>{selectedArticle.marque || "-"}</span>
                                        </div>

                                        <div className="admInfoRow">
                                            <span>{tx("admin.catalog.material", UI_TEXT.material)}</span>
                                            <span>{selectedArticle.matiere || "-"}</span>
                                        </div>

                                        <div className="admInfoRow">
                                            <span>{tx("admin.catalog.sku", UI_TEXT.sku)}</span>
                                            <span className="mono">{selectedArticle.sku || "-"}</span>
                                        </div>
                                    </div>

                                    <div className="admSideBtns">
                                        <button type="button" className="admBtn" onClick={() => openEditArticle(selectedArticle)}>
                                            {tx("admin.common.edit", UI_TEXT.edit)} {UI_TEXT.tableArticle.toLowerCase()}
                                        </button>

                                        <button type="button" className="admBtn primary" onClick={openCreateVariation}>
                                            {tx("admin.catalog.addVariation", UI_TEXT.addVariation)}
                                        </button>
                                    </div>

                                    <div className="admDivider" />

                                    <div className="admCardTop catalogPanelTop">
                                        <div>
                                            <div className="admCardTitle">
                                                {tx("admin.catalog.variations", UI_TEXT.variations)}
                                            </div>
                                            <div className="variationHint">
                                                {isAccessoryCategory ? UI_TEXT.variationsHintAccessory : UI_TEXT.variationsHint}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            className="admBtn mini primary"
                                            onClick={openCreateVariation}
                                        >
                                            {tx("admin.catalog.addVariation", UI_TEXT.addVariation)}
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

                                    <div className="admTable compact variationTableProfessional">
                                        {variations.map((v) => {
                                            const previewUrl = firstVariationImage(v);
                                            const imageBroken = previewUrl
                                                ? isVariationImageBroken(v.id, previewUrl)
                                                : true;

                                            return (
                                                <div key={v.id} className="variationRowCard">
                                                    <div className="variationRowMain">
                                                        <div className="variationCoverWrap">
                                                            {previewUrl && !imageBroken ? (
                                                                <img
                                                                    src={fullImageUrl(
                                                                        previewUrl,
                                                                        variationImageVersion(v)
                                                                    )}
                                                                    alt={variationDisplayName(v)}
                                                                    className="variationCover"
                                                                    onError={() => handleVariationImageError(v.id, previewUrl)}
                                                                />
                                                            ) : (
                                                                <div className="variationCover fallback">
                                                                    {UI_TEXT.noImage}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="variationContent">
                                                            <div className="variationTitleRow">
                                                                <div className="variationTitleGroup">
                                                                    <div className="admName">{variationDisplayName(v)}</div>
                                                                    <div className="admRole">
                                                                        #{v.id}{" "}
                                                                        {v.model3dUrl
                                                                            ? `• ${UI_TEXT.modelAttached}`
                                                                            : `• ${UI_TEXT.noModel}`}
                                                                    </div>
                                                                </div>

                                                                <div className="variationPricePill">
                                                                    {fmtPrice(v.prix)}
                                                                </div>
                                                            </div>

                                                            <div className="variationMetaRow">
                                                                <span
                                                                    className={`admBadge ${
                                                                        Number(v.quantiteStock) > 0 ? "ok" : "bad"
                                                                    }`}
                                                                >
                                                                    {UI_TEXT.stockLabel}: {Number(v.quantiteStock || 0)}
                                                                </span>

                                                                <span className="admBadge neutral">
                                                                    {UI_TEXT.colorLabel}: {v.couleurNom || "-"}
                                                                </span>

                                                                {v.taillePointure ? (
                                                                    <span className="admBadge neutral">
                                                                        {UI_TEXT.sizeLabel}: {v.taillePointure}
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="variationActionsLarge">
                                                        <button
                                                            type="button"
                                                            className="admBtn mini"
                                                            onClick={() => quickSellOne(v)}
                                                            disabled={busyCatalog || Number(v.quantiteStock) <= 0}
                                                            title={UI_TEXT.sellOne}
                                                        >
                                                            {UI_TEXT.sellOne}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="admBtn mini"
                                                            onClick={() => openStockDialog(v, "decrement")}
                                                            disabled={busyCatalog}
                                                        >
                                                            {UI_TEXT.useQty}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="admBtn mini"
                                                            onClick={() => openStockDialog(v, "increment")}
                                                            disabled={busyCatalog}
                                                        >
                                                            {UI_TEXT.restock}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="admBtn mini"
                                                            onClick={() => openEditVariation(v)}
                                                        >
                                                            {tx("admin.common.edit", UI_TEXT.edit)}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="admBtn mini danger"
                                                            onClick={() => deleteVariation(v.id)}
                                                        >
                                                            {tx("admin.common.delete", UI_TEXT.delete)}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {!variations.length ? (
                                            <div className="admEmpty">{UI_TEXT.noVariations}</div>
                                        ) : null}
                                    </div>

                                    <div className="admDivider" />

                                    <div ref={historySectionRef} className="catalogHistoryBlock">
                                        <div className="admCardTop historyToolbar">
                                            <div>
                                                <div className="admCardTitle">{UI_TEXT.historyTitle}</div>
                                                <div className="variationHint">{UI_TEXT.historyHint}</div>
                                            </div>

                                            <div className="historyToolbarActions">
                                                <select
                                                    className="admSearch historySelect"
                                                    value={historyMode}
                                                    onChange={(e) => setHistoryMode(e.target.value)}
                                                >
                                                    <option value="article">{UI_TEXT.articleHistory}</option>
                                                    <option value="variation">{UI_TEXT.variationHistory}</option>
                                                </select>

                                                {historyMode === "variation" ? (
                                                    <select
                                                        className="admSearch historySelectWide"
                                                        value={selectedVariationHistoryId}
                                                        onChange={(e) => {
                                                            const id = e.target.value;
                                                            setSelectedVariationHistoryId(id);

                                                            if (id) {
                                                                loadVariationHistory(id);
                                                            } else {
                                                                setHistoryRows([]);
                                                            }
                                                        }}
                                                    >
                                                        <option value="">{UI_TEXT.selectVariation}</option>
                                                        {variations.map((v) => (
                                                            <option key={v.id} value={v.id}>
                                                                {variationDisplayName(v)}
                                                            </option>
                                                        ))}
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
                                                                    <img
                                                                        src={fullImageUrl(
                                                                            row.actorPhotoUrl,
                                                                            row.actorUserId || row.id
                                                                        )}
                                                                        alt={row.actorName || "User"}
                                                                        className="admAvatar"
                                                                        onError={() => handleHistoryActorError(row)}
                                                                    />
                                                                ) : (
                                                                    <div className="admAvatar fallback">
                                                                        {initials(row.actorName)}
                                                                    </div>
                                                                )}

                                                                <div>
                                                                    <div className="admName">{row.actorName || "-"}</div>
                                                                    <div className="admRole">{row.actorEmail || "-"}</div>
                                                                </div>
                                                            </div>

                                                            <span
                                                                className={`admBadge ${
                                                                    row.action === "CREATE"
                                                                        ? "ok"
                                                                        : row.action === "DELETE"
                                                                          ? "bad"
                                                                          : "neutral"
                                                                }`}
                                                            >
                                                                {row.action}
                                                            </span>
                                                        </div>

                                                        <div className="admHistoryText">{row.summary || "-"}</div>
                                                        <div className="admHistoryMeta">{fmt(row.actionAt)}</div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="admGrid refsGrid">
                        <div className="admCard">
                            <div className="admCardTop">
                                <div className="admCardTitle">{tx("admin.catalog.categories", UI_TEXT.categories)}</div>
                                <button type="button" className="admBtn mini" onClick={openCreateCategory}>
                                    {tx("admin.catalog.addCategory", UI_TEXT.addCategory)}
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
                                            <button
                                                type="button"
                                                className="admBtn mini"
                                                onClick={() => openEditCategory(c)}
                                            >
                                                {tx("admin.common.edit", UI_TEXT.edit)}
                                            </button>

                                            <button
                                                type="button"
                                                className="admBtn mini danger"
                                                onClick={() => deleteCategory(c.id)}
                                            >
                                                {tx("admin.common.delete", UI_TEXT.delete)}
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {!categories.length ? <div className="admEmpty">{UI_TEXT.noCategories}</div> : null}
                            </div>
                        </div>

                        <div className="admCard">
                            <div className="admCardTop">
                                <div className="admCardTitle">{tx("admin.catalog.colors", UI_TEXT.colors)}</div>
                                <button type="button" className="admBtn mini" onClick={openCreateColor}>
                                    {tx("admin.catalog.addColor", UI_TEXT.addColor)}
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
                                            <button
                                                type="button"
                                                className="admBtn mini"
                                                onClick={() => openEditColor(c)}
                                            >
                                                {tx("admin.common.edit", UI_TEXT.edit)}
                                            </button>

                                            <button
                                                type="button"
                                                className="admBtn mini danger"
                                                onClick={() => deleteColor(c.id)}
                                            >
                                                {tx("admin.common.delete", UI_TEXT.delete)}
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {!colors.length ? <div className="admEmpty">{UI_TEXT.noColors}</div> : null}
                            </div>
                        </div>

                        <div className="admCard">
                            <div className="admCardTop">
                                <div className="admCardTitle">{tx("admin.catalog.sizes", UI_TEXT.sizes)}</div>
                                <button type="button" className="admBtn mini" onClick={openCreateSize}>
                                    {tx("admin.catalog.addSize", UI_TEXT.addSize)}
                                </button>
                            </div>

                            <div className="admTable compact">
                                {sizes.map((s) => (
                                    <div key={s.id} className="admTr row">
                                        <div>
                                            <div className="admName">{s.pointure}</div>
                                        </div>

                                        <div className="admRowActions">
                                            <button
                                                type="button"
                                                className="admBtn mini"
                                                onClick={() => openEditSize(s)}
                                            >
                                                {tx("admin.common.edit", UI_TEXT.edit)}
                                            </button>

                                            <button
                                                type="button"
                                                className="admBtn mini danger"
                                                onClick={() => deleteSize(s.id)}
                                            >
                                                {tx("admin.common.delete", UI_TEXT.delete)}
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {!sizes.length ? <div className="admEmpty">{UI_TEXT.noSizes}</div> : null}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <dialog ref={articleDialogRef} className="admDialog productDialog">
                <div className="admDialogHead">
                    <div className="admDialogTitle">
                        {editingArticleId ? UI_TEXT.articleDialogEdit : UI_TEXT.articleDialogAdd}
                    </div>
                    <button type="button" className="admBtn mini" onClick={() => articleDialogRef.current?.close()}>
                        {tx("admin.common.close", UI_TEXT.close)}
                    </button>
                </div>

                <form className="productForm admDialogBody" onSubmit={saveArticle}>
                    <label>
                        <span>{UI_TEXT.productName}</span>
                        <input
                            value={articleForm.nom}
                            onChange={(e) => setArticleForm({ ...articleForm, nom: e.target.value })}
                            required
                        />
                    </label>

                    <label>
                        <span>{UI_TEXT.tableCategory}</span>
                        <select
                            value={articleForm.categorieId}
                            onChange={(e) => setArticleForm({ ...articleForm, categorieId: e.target.value })}
                            required
                        >
                            <option value="">{UI_TEXT.selectCategory}</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.nom}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        <span>{UI_TEXT.price}</span>
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
                        <span>{UI_TEXT.salePrice}</span>
                        <input
                            type="number"
                            step="0.001"
                            min="0"
                            value={articleForm.salePrice}
                            onChange={(e) => setArticleForm({ ...articleForm, salePrice: e.target.value })}
                        />
                    </label>

                    <label>
                        <span>{UI_TEXT.saleStart}</span>
                        <input
                            type="datetime-local"
                            value={articleForm.saleStartAt}
                            onChange={(e) => setArticleForm({ ...articleForm, saleStartAt: e.target.value })}
                        />
                    </label>

                    <label>
                        <span>{UI_TEXT.saleEnd}</span>
                        <input
                            type="datetime-local"
                            value={articleForm.saleEndAt}
                            onChange={(e) => setArticleForm({ ...articleForm, saleEndAt: e.target.value })}
                        />
                    </label>

                    <label>
                        <span>{UI_TEXT.brand}</span>
                        <input
                            value={articleForm.marque}
                            onChange={(e) => setArticleForm({ ...articleForm, marque: e.target.value })}
                        />
                    </label>

                    <label>
                        <span>{UI_TEXT.material}</span>
                        <input
                            value={articleForm.matiere}
                            onChange={(e) => setArticleForm({ ...articleForm, matiere: e.target.value })}
                        />
                    </label>

                    <label>
                        <span>{UI_TEXT.sku}</span>
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
                        <span>{UI_TEXT.activeProduct}</span>
                    </label>

                    <label className="checkRow">
                        <input
                            type="checkbox"
                            checked={articleForm.recommended}
                            onChange={(e) => setArticleForm({ ...articleForm, recommended: e.target.checked })}
                        />
                        <span>{UI_TEXT.bestChoice}</span>
                    </label>

                    <label className="fullCol">
                        <span>{UI_TEXT.shortDescription}</span>
                        <textarea
                            rows="4"
                            value={articleForm.description}
                            onChange={(e) => setArticleForm({ ...articleForm, description: e.target.value })}
                        />
                    </label>

                    <label className="fullCol">
                        <span>{UI_TEXT.moreInformations}</span>
                        <textarea
                            rows="6"
                            value={articleForm.details}
                            onChange={(e) => setArticleForm({ ...articleForm, details: e.target.value })}
                        />
                    </label>

                    <div className="admDialogActions fullCol">
                        <button type="submit" className="admBtn primary" disabled={busyCatalog}>
                            {editingArticleId ? UI_TEXT.updateArticle : UI_TEXT.saveArticle}
                        </button>
                    </div>
                </form>
            </dialog>

            <dialog ref={variationDialogRef} className="admDialog admDialogWide">
                <div className="admDialogHead">
                    <div className="admDialogTitle">
                        {editingVariationId ? UI_TEXT.variationDialogEdit : UI_TEXT.variationDialogAdd}
                    </div>
                    <button type="button" className="admBtn mini" onClick={closeVariationDialog}>
                        {UI_TEXT.close}
                    </button>
                </div>

                <form className="productForm admDialogBody" onSubmit={saveVariation}>
                    <div className="variationHelp fullCol">
                        {isAccessoryCategory
                            ? !editingVariationId
                                ? UI_TEXT.accessoryVariationCreateHelp
                                : UI_TEXT.accessoryVariationEditHelp
                            : !editingVariationId
                              ? UI_TEXT.variationCreateHelp
                              : UI_TEXT.variationEditHelp}
                    </div>

                    {variationError ? <div className="admAlert fullCol">{variationError}</div> : null}

                    <label>
                        <span>{UI_TEXT.colorLabel}</span>
                        <select
                            value={variationForm.couleurId}
                            onChange={(e) => handleVariationColorChange(e.target.value)}
                            required
                            disabled={!colors.length}
                        >
                            <option value="">{UI_TEXT.selectColor}</option>
                            {colors.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.nom}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        <span>{UI_TEXT.price}</span>
                        <input
                            type="number"
                            min="0.001"
                            step="0.001"
                            value={variationForm.prix}
                            onChange={(e) => setVariationForm({ ...variationForm, prix: e.target.value })}
                            required
                        />
                    </label>

                    {isAccessoryCategory ? (
    <label className="fullCol">
        <span>Stock</span>
        <input
            type="number"
            min="0"
            step="1"
            value={variationForm.quantiteStock ?? 0}
            onChange={(e) =>
                setVariationForm({
                    ...variationForm,
                    quantiteStock: e.target.value,
                })
            }
            required
        />
    </label>
) : (
    <div className="fullCol variationCurrentImages">
        <div className="variationHelp">Selected sizes: {variationSelectedCount}</div>
        <div className="sizeStockGrid">
            {(variationForm.sizeStocks || []).map((item) => (
                <label
                    key={item.tailleId}
                    className={`sizeStockCard ${item.checked ? "active" : item.disabled ? "disabled" : ""}`}
                >
                    <div className="sizeStockTop">
                        <div className="sizeStockCheck">
                            <input
                                type="checkbox"
                                checked={!!item.checked}
                                disabled={!!item.disabled}
                                onChange={(e) =>
                                    toggleVariationSize(item.tailleId, e.target.checked)
                                }
                            />
                            <span>Size {item.label}</span>
                        </div>

                        {item.disabled ? <span className="admBadge bad">Already exists</span> : null}
                    </div>

                    <div className="sizeStockBody">
                        <span>Stock</span>
                        <input
                            type="number"
                            min="0"
                            step="1"
                            value={item.quantiteStock}
                            disabled={!item.checked}
                            onChange={(e) =>
                                changeVariationSizeStock(item.tailleId, e.target.value)
                            }
                        />
                    </div>
                </label>
            ))}
        </div>
    </div>
)}

                    <label className="fullCol">
                        <span>{UI_TEXT.variationImages}</span>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) =>
                                setVariationForm({
                                    ...variationForm,
                                    imageFiles: Array.from(e.target.files || []),
                                })
                            }
                        />
                    </label>

                    {!!variationForm.imageFiles?.length && (
                        <div className="fullCol variationCurrentImages">
                            <div className="variationHelp">{UI_TEXT.newSelectedImages}</div>

                            <div className="variationPreviewGrid">
                                {variationForm.imageFiles.map((file, index) => (
                                    <div key={`${file.name}-${index}`} className="variationPreviewItem">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={file.name}
                                            className="variationPreviewThumb"
                                        />
                                        <div className="variationPreviewName">{file.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!!variationForm.existingImageUrls?.length && (
                        <div className="fullCol variationCurrentImages">
                            <div className="variationHelp">{UI_TEXT.savedVariationImages}</div>

                            <div className="variationPreviewGrid">
                                {variationForm.existingImageUrls.map((url, index) => (
                                    <div key={`${url}-${index}`} className="variationPreviewItem">
                                        <img
                                            src={fullImageUrl(
                                                url,
                                                `${editingVariationId || "variation"}-${index}`
                                            )}
                                            alt={`Variation ${index + 1}`}
                                            className="variationPreviewThumb"
                                            onError={(e) => {
                                                e.currentTarget.style.opacity = "0.35";
                                            }}
                                        />
                                        <div className="variationPreviewName">
                                            {UI_TEXT.savedImage} {index + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <label className="fullCol">
                        <span>{UI_TEXT.model3d}</span>
                        <input
                            type="file"
                            accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
                            onChange={(e) =>
                                setVariationForm({
                                    ...variationForm,
                                    model3dFile: e.target.files?.[0] || null,
                                })
                            }
                        />
                    </label>

                    {(variationForm.existingModel3dUrl || variationForm.model3dFile) && (
                        <div className="fullCol variationCurrentImages">
                            <div className="variationHelp">{UI_TEXT.currentModel}</div>

                            <div className="variationModelBox">
                                {variationForm.model3dFile ? (
                                    <div className="variationModelMeta">
                                        <strong>{UI_TEXT.newFile}:</strong> {variationForm.model3dFile.name}
                                    </div>
                                ) : null}

                                {variationForm.existingModel3dUrl ? (
                                    <div className="variationModelMeta">
                                        <strong>{UI_TEXT.savedFile}:</strong>{" "}
                                        <a
                                            href={fullImageUrl(
                                                variationForm.existingModel3dUrl,
                                                editingVariationId || "model"
                                            )}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            {variationForm.existingModel3dName || UI_TEXT.openCurrentModel}
                                        </a>
                                        {variationForm.existingModel3dType
                                            ? ` (${variationForm.existingModel3dType})`
                                            : ""}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    )}

                    <div className="fullCol variationHelp">{UI_TEXT.variationImageHint}</div>

                    <div className="admDialogActions fullCol">
                        <button
                            type="submit"
                            className="admBtn primary"
                            disabled={busyCatalog || !colors.length || (!isAccessoryCategory && !sizes.length)}
                        >
                            {editingVariationId ? UI_TEXT.updateVariation : UI_TEXT.saveVariation}
                        </button>
                    </div>
                </form>
            </dialog>

            <dialog ref={stockDialogRef} className="admDialog productDialog">
                <div className="admDialogHead">
                    <div className="admDialogTitle">
                        {stockForm.mode === "increment" ? UI_TEXT.stockDialogRestock : UI_TEXT.stockDialogUse}
                    </div>
                    <button type="button" className="admBtn mini" onClick={closeStockDialog}>
                        {UI_TEXT.close}
                    </button>
                </div>

                <form className="productForm admDialogBody" onSubmit={submitStockUpdate}>
                    {stockError ? <div className="admAlert fullCol">{stockError}</div> : null}

                    <label className="fullCol">
                        <span>{UI_TEXT.variationField}</span>
                        <input value={stockForm.label} disabled />
                    </label>

                    <label>
                        <span>{UI_TEXT.currentStock}</span>
                        <input value={stockForm.currentStock} disabled />
                    </label>

                    <label>
                        <span>{stockForm.mode === "increment" ? UI_TEXT.addQuantity : UI_TEXT.removeQuantity}</span>
                        <input
                            type="number"
                            min="1"
                            step="1"
                            value={stockForm.quantity}
                            onChange={(e) =>
                                setStockForm((prev) => ({
                                    ...prev,
                                    quantity: e.target.value,
                                }))
                            }
                            required
                        />
                    </label>

                    <label className="fullCol">
                        <span>{UI_TEXT.newStockAfterUpdate}</span>
                        <input
                            value={Number.isFinite(stockNextValue) ? stockNextValue : stockForm.currentStock}
                            disabled
                        />
                    </label>

                    <div className="admDialogActions fullCol">
                        <button type="submit" className="admBtn primary" disabled={busyCatalog}>
                            {stockForm.mode === "increment"
                                ? UI_TEXT.confirmRestock
                                : UI_TEXT.confirmStockRemoval}
                        </button>
                    </div>
                </form>
            </dialog>

            <dialog ref={categoryDialogRef} className="admDialog productDialog">
                <div className="admDialogHead">
                    <div className="admDialogTitle">
                        {editingCategoryId ? UI_TEXT.categoryDialogEdit : UI_TEXT.categoryDialogAdd}
                    </div>
                    <button
                        type="button"
                        className="admBtn mini"
                        onClick={() => categoryDialogRef.current?.close()}
                    >
                        {UI_TEXT.close}
                    </button>
                </div>

                <form className="productForm admDialogBody" onSubmit={saveCategory}>
                    <label>
                        <span>{UI_TEXT.categoryName}</span>
                        <input
                            value={categoryForm.nom}
                            onChange={(e) => setCategoryForm({ ...categoryForm, nom: e.target.value })}
                            required
                        />
                    </label>

                    <label className="fullCol">
                        <span>{UI_TEXT.description}</span>
                        <textarea
                            rows="4"
                            value={categoryForm.description}
                            onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                        />
                    </label>

                    <div className="admDialogActions fullCol">
                        <button type="submit" className="admBtn primary" disabled={busyCatalog}>
                            {editingCategoryId ? UI_TEXT.updateCategory : UI_TEXT.saveCategory}
                        </button>
                    </div>
                </form>
            </dialog>

            <dialog ref={colorDialogRef} className="admDialog productDialog">
                <div className="admDialogHead">
                    <div className="admDialogTitle">
                        {editingColorId ? UI_TEXT.colorDialogEdit : UI_TEXT.colorDialogAdd}
                    </div>
                    <button type="button" className="admBtn mini" onClick={() => colorDialogRef.current?.close()}>
                        {UI_TEXT.close}
                    </button>
                </div>

                <form className="productForm admDialogBody" onSubmit={saveColor}>
                    <label>
                        <span>{UI_TEXT.colorName}</span>
                        <input
                            value={colorForm.nom}
                            onChange={(e) => setColorForm({ ...colorForm, nom: e.target.value })}
                            required
                        />
                    </label>

                    <label>
                        <span>{UI_TEXT.hexColor}</span>
                        <input
                            type="color"
                            value={colorForm.codeHex || "#000000"}
                            onChange={(e) => setColorForm({ ...colorForm, codeHex: e.target.value })}
                        />
                    </label>

                    <div className="admDialogActions fullCol">
                        <button type="submit" className="admBtn primary" disabled={busyCatalog}>
                            {editingColorId ? UI_TEXT.updateColor : UI_TEXT.saveColor}
                        </button>
                    </div>
                </form>
            </dialog>

            <dialog ref={sizeDialogRef} className="admDialog productDialog">
                <div className="admDialogHead">
                    <div className="admDialogTitle">
                        {editingSizeId ? UI_TEXT.sizeDialogEdit : UI_TEXT.sizeDialogAdd}
                    </div>
                    <button type="button" className="admBtn mini" onClick={() => sizeDialogRef.current?.close()}>
                        {UI_TEXT.close}
                    </button>
                </div>

                <form className="productForm admDialogBody" onSubmit={saveSize}>
                    <label>
                        <span>{UI_TEXT.sizeLabel}</span>
                        <input
                            value={sizeForm.pointure}
                            onChange={(e) => setSizeForm({ ...sizeForm, pointure: e.target.value })}
                            required
                        />
                    </label>

                    <div className="admDialogActions fullCol">
                        <button type="submit" className="admBtn primary" disabled={busyCatalog}>
                            {editingSizeId ? UI_TEXT.updateSize : UI_TEXT.saveSize}
                        </button>
                    </div>
                </form>
            </dialog>
        </>
    );
}