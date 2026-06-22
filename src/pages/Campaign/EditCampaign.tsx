import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Save,
    Calendar,
    FileText,
    Settings,
    Users,
    AlertCircle,
    X,
    Plus,
    Package,
    Trash2,
    ChevronDown,
    ChevronUp,
    Link,
    Edit3
} from 'lucide-react';
import {
    orderIndex,
    updateCampaign,
    uploadCampaignThumbnailVideo,
    deleteCampaignThumbnailVideo,
    uploadCampaignLayoutTypeRentalProjection,
    deleteCampaignLayoutTypeRentalProjection,
    uploadCampaignLayoutTypeRenderings,
    deleteCampaignLayoutTypeRendering,
} from '../../services/api';
import useFetchCampaign from '../../hook/useFetchCampaign';
import { Attachment, CampaignLayoutType, CampaignPackage, Order } from '../../types';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable';
import { SortableCampaignItem, DragHandle } from './components/SortableCampaignItems';

// Shape of a rendering image entry kept in local state / returned by the layout image API.
type LayoutRenderingImage = { file_url?: string; path?: string };

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

export default function EditCampaign() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        description: '',
        internal_description: '',
        order_id: '',
        start_date: '',
        end_date: '',
        slot_total: 0,
        base_amount: 0,
        booking_amount: 0,
        thumbnail: null as File | null
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [existingVideoUrl, setExistingVideoUrl] = useState<string | null>(null);
    const [videoUploading, setVideoUploading] = useState<boolean>(false);
    const [videoError, setVideoError] = useState<string | null>(null);
    const [packages, setPackages] = useState<CampaignPackage[]>([]);
    const [packageErrors, setPackageErrors] = useState<Record<string, Record<string, string>>>({});
    const [campaignMode, setCampaignMode] = useState<'single' | 'packages'>('single');
    const [packageValueSources, setPackageValueSources] = useState<Record<string, {
        slot_total: 'fixed' | 'custom';
        base_amount: 'fixed' | 'custom';
        booking_amount: 'fixed' | 'custom';
    }>>({});
    const [collapsedPackages, setCollapsedPackages] = useState<Record<number, boolean>>({});
    const [collapsedLayoutTypes, setCollapsedLayoutTypes] = useState<Record<number, boolean>>({});
    const [orderSearch, setOrderSearch] = useState<string>('');
    const [orderOptions, setOrderOptions] = useState<Order[]>([]);
    const [orderLoading, setOrderLoading] = useState<boolean>(false);
    const [activePackageOrderIndex, setActivePackageOrderIndex] = useState<number | null>(null);
    const [selectedPackageOrderTemplates, setSelectedPackageOrderTemplates] = useState<Record<string, Order | null>>({});

    // Layout Type state (nested-under-layouts UX; off = today's flat behavior)
    const [useLayoutTypes, setUseLayoutTypes] = useState<boolean>(false);
    const [layoutTypes, setLayoutTypes] = useState<{ id?: number | string; name: string; description?: string }[]>([]);
    const [packageLayoutIndex, setPackageLayoutIndex] = useState<Record<number, number>>({});
    const [layoutProjectionUrl, setLayoutProjectionUrl] = useState<Record<number, string | null>>({});
    const [layoutRenderingImgs, setLayoutRenderingImgs] = useState<Record<number, LayoutRenderingImage[]>>({});
    const [layoutUploading, setLayoutUploading] = useState<Record<number, boolean>>({});
    const [layoutError, setLayoutError] = useState<string | null>(null);
    // Pending files for newly-added layouts (no id yet) — uploaded after the next save.
    const [pendingLayoutProjectionFile, setPendingLayoutProjectionFile] = useState<Record<number, File>>({});
    const [pendingLayoutRenderingFiles, setPendingLayoutRenderingFiles] = useState<Record<number, File[]>>({});

    const campaignId = id ? parseInt(id, 10) : null;
    const { campaign, loading, error: fetchError } = useFetchCampaign(campaignId);

    // @dnd-kit sensors (pointer + keyboard) for drag-reorder of packages & layouts
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    // Handle thumbnail preview URL
    useEffect(() => {
        if (formData.thumbnail) {
            const url = URL.createObjectURL(formData.thumbnail);
            setThumbnailPreview(url);

            return () => {
                URL.revokeObjectURL(url);
            };
        } else {
            setThumbnailPreview(null);
        }
    }, [formData.thumbnail]);

    useEffect(() => {
        if (campaign) {
            setFormData({
                title: campaign.title || '',
                slug: campaign.slug || '',
                description: campaign.description || '',
                internal_description: campaign.internal_description || '',
                order_id: campaign.order_id || '',
                start_date: campaign.start_date ? campaign.start_date.split('T')[0] : '',
                end_date: campaign.end_date ? campaign.end_date.split('T')[0] : '',
                slot_total: campaign.slot_total || 0,
                base_amount: campaign.base_amount || 0,
                booking_amount: campaign.booking_amount || 0,
                thumbnail: null
            });

            setExistingVideoUrl((campaign.thumbnail_video as Attachment)?.file_url ?? null);

            // Set packages if they exist
            if (campaign.packages && campaign.packages.length > 0) {
                setPackages(campaign.packages);
                setCampaignMode('packages');

                // Preload template order display labels if backend includes them
                const selected: Record<string, Order | null> = {};
                campaign.packages.forEach((pkg, index) => {
                    selected[String(index)] = (pkg.order as Order) || null;
                });
                setSelectedPackageOrderTemplates(selected);

                // Initialize package value sources
                const sources: Record<string, { slot_total: 'fixed' | 'custom'; base_amount: 'fixed' | 'custom'; booking_amount: 'fixed' | 'custom' }> = {};
                campaign.packages.forEach((pkg, index) => {
                    sources[index.toString()] = {
                        slot_total: pkg.slot_total === campaign.slot_total ? 'fixed' : 'custom',
                        base_amount: pkg.base_amount === campaign.base_amount ? 'fixed' : 'custom',
                        booking_amount: pkg.booking_amount === campaign.booking_amount ? 'fixed' : 'custom'
                    };
                });
                setPackageValueSources(sources);
            }

            // Load existing layout types (images come from campaign.layout_types, NOT packages)
            if (campaign.layout_types && campaign.layout_types.length > 0) {
                setUseLayoutTypes(true);
                setLayoutTypes(campaign.layout_types.map((lt) => ({ id: lt.id, name: lt.name || '', description: lt.description || '' })));

                const projUrls: Record<number, string | null> = {};
                const renderImgs: Record<number, LayoutRenderingImage[]> = {};
                campaign.layout_types.forEach((lt, i) => {
                    projUrls[i] = (lt.rental_projection as Attachment | null)?.file_url ?? null;
                    renderImgs[i] = (lt.rendering_images as (Attachment & { path?: string })[] | null)?.map((r) => ({ file_url: r.file_url, path: r.path })) ?? [];
                });
                setLayoutProjectionUrl(projUrls);
                setLayoutRenderingImgs(renderImgs);

                // Map each loaded package to its layout index by matching layout_type_id
                const idToIndex: Record<string, number> = {};
                campaign.layout_types.forEach((lt, i) => { if (lt.id != null) idToIndex[String(lt.id)] = i; });
                const pkgLayout: Record<number, number> = {};
                (campaign.packages || []).forEach((pkg, pIdx) => {
                    if (pkg.layout_type_id != null && idToIndex[String(pkg.layout_type_id)] !== undefined) {
                        pkgLayout[pIdx] = idToIndex[String(pkg.layout_type_id)];
                    }
                });
                setPackageLayoutIndex(pkgLayout);
            }
        }
    }, [campaign]);

    // Template order search (simple debounce)
    useEffect(() => {
        let cancelled = false;
        const t = setTimeout(async () => {
            const q = orderSearch.trim();
            if (!q) {
                setOrderOptions([]);
                return;
            }
            try {
                setOrderLoading(true);
                const res = await orderIndex(8, 1, q, undefined, undefined, [{ field: 'status', value: 'template' }]);
                const data = (res?.data || []) as Order[];
                if (!cancelled) setOrderOptions(data);
            } catch (e) {
                console.error(e);
                if (!cancelled) setOrderOptions([]);
            } finally {
                if (!cancelled) setOrderLoading(false);
            }
        }, 350);
        return () => {
            cancelled = true;
            clearTimeout(t);
        };
    }, [orderSearch]);

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = {
                ...prev,
                [name]: (name === 'slot_total' || name === 'base_amount' || name === 'booking_amount') ? Number(value) : value
            };

            // Auto-generate slug when title changes
            if (name === 'title') {
                newData.slug = generateSlug(value);
            }

            return newData;
        });

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSelectTemplateOrder = (o: Order) => {
        if (activePackageOrderIndex == null) return;
        updatePackage(activePackageOrderIndex, 'order_id', String(o.id || ''));
        setSelectedPackageOrderTemplates((prev) => ({
            ...prev,
            [String(activePackageOrderIndex)]: o,
        }));
        setOrderSearch('');
        setOrderOptions([]);
    };

    const handleClearTemplateOrder = () => {
        // no-op (campaign-level selector removed)
        setOrderSearch('');
        setOrderOptions([]);
    };

    const handleClearPackageTemplateOrder = (packageIndex: number) => {
        updatePackage(packageIndex, 'order_id', '');
        setSelectedPackageOrderTemplates((prev) => {
            const next = { ...prev };
            delete next[String(packageIndex)];
            return next;
        });
        if (activePackageOrderIndex === packageIndex) {
            setOrderSearch('');
            setOrderOptions([]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                thumbnail: file
            }));
        }
    };

    const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setVideoError(null);
        if (file.size > 50 * 1024 * 1024) {
            setVideoError('Video must be 50MB or smaller.');
            return;
        }
        setVideoUploading(true);
        try {
            const res = await uploadCampaignThumbnailVideo(campaignId!, file);
            setExistingVideoUrl(res?.data?.thumbnail_video?.file_url ?? null);
        } catch (err) {
            console.error('Thumbnail video upload failed:', err);
            setVideoError('Upload failed. Please try again.');
        } finally {
            setVideoUploading(false);
        }
    };

    const handleVideoRemove = async () => {
        setVideoError(null);
        setVideoUploading(true);
        try {
            await deleteCampaignThumbnailVideo(campaignId!);
            setExistingVideoUrl(null);
        } catch (err) {
            console.error('Thumbnail video removal failed:', err);
            setVideoError('Removal failed. Please try again.');
        } finally {
            setVideoUploading(false);
        }
    };

    // Package management functions
    const addPackage = () => {
        const newPackage: CampaignPackage = {
            name: '',
            description: '',
            internal_description: '',
            base_amount: 0,
            booking_amount: 0,
            slot_total: 0,
            start_date: '',
            end_date: '',
            status: 'draft'
        };
        setPackages(prev => [...prev, newPackage]);

        // Initialize value sources for the new package
        const packageIndex = packages.length;
        setPackageValueSources(prev => ({
            ...prev,
            [packageIndex.toString()]: {
                slot_total: 'fixed',
                base_amount: 'fixed',
                booking_amount: 'fixed'
            }
        }));

        // Initialize collapsed state for new package (expanded by default)
        setCollapsedPackages(prev => ({
            ...prev,
            [packageIndex]: false
        }));
    };

    // Helper: drop the removed key and shift all higher keys down by 1
    const shiftIndexMap = <T,>(map: Record<string, T>, removed: number): Record<string, T> => {
        const next: Record<string, T> = {};
        Object.entries(map).forEach(([k, v]) => {
            const i = Number(k);
            if (i === removed) return;
            next[String(i > removed ? i - 1 : i)] = v;
        });
        return next;
    };

    // Same as shiftIndexMap but for maps keyed by number (Record<number, ...>)
    const shiftNumericIndexMap = <T,>(map: Record<number, T>, removed: number): Record<number, T> => {
        const next: Record<number, T> = {};
        Object.entries(map).forEach(([k, v]) => {
            const i = Number(k);
            if (i === removed) return;
            next[i > removed ? i - 1 : i] = v;
        });
        return next;
    };

    const removePackage = (index: number) => {
        setPackages(prev => prev.filter((_, i) => i !== index));
        // Reindex all per-package maps: drop the removed key, shift higher keys down
        setPackageErrors(prev => shiftIndexMap(prev, index));
        setPackageValueSources(prev => shiftIndexMap(prev, index));
        setCollapsedPackages(prev => shiftNumericIndexMap(prev, index));
        setSelectedPackageOrderTemplates(prev => shiftIndexMap(prev, index));
        setPackageLayoutIndex(prev => shiftNumericIndexMap(prev, index));
    };

    const updatePackage = (index: number, field: keyof CampaignPackage, value: string | number) => {
        setPackages(prev => prev.map((pkg, i) =>
            i === index ? { ...pkg, [field]: value } : pkg
        ));

        // Clear error when user starts typing
        if (packageErrors[index.toString()]?.[field]) {
            setPackageErrors(prev => ({
                ...prev,
                [index.toString()]: {
                    ...prev[index.toString()],
                    [field]: ''
                }
            }));
        }
    };

    const handleModeChange = (mode: 'single' | 'packages') => {
        setCampaignMode(mode);
        if (mode === 'single') {
            // Clear packages when switching to single mode
            setPackages([]);
            setPackageErrors({});
            setPackageValueSources({});
        }
    };

    const handleValueSourceChange = (packageIndex: number, field: 'slot_total' | 'base_amount' | 'booking_amount', source: 'fixed' | 'custom') => {
        setPackageValueSources(prev => ({
            ...prev,
            [packageIndex.toString()]: {
                ...prev[packageIndex.toString()],
                [field]: source
            }
        }));

        // If switching to fixed, set the value from campaign
        if (source === 'fixed') {
            const value = field === 'slot_total' ? formData.slot_total : 
                         field === 'base_amount' ? formData.base_amount : 
                         formData.booking_amount;
            updatePackage(packageIndex, field, value);
        }
    };

    const togglePackageCollapse = (index: number) => {
        setCollapsedPackages(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const toggleLayoutCollapse = (idx: number) => setCollapsedLayoutTypes(prev => ({ ...prev, [idx]: !prev[idx] }));

    // Layout Type management functions
    const addLayoutType = () => {
        setLayoutTypes(prev => [...prev, { name: '', description: '' }]);
    };

    const updateLayoutType = (idx: number, field: 'name' | 'description', value: string) => {
        setLayoutTypes(prev => prev.map((lt, i) => (i === idx ? { ...lt, [field]: value } : lt)));
    };

    const removeLayoutType = (idx: number) => {
        // remove the layout's sub-packages, then the layout; reindex packageLayoutIndex + image maps
        const pkgIdxToRemove = Object.entries(packageLayoutIndex)
            .filter(([, lIdx]) => lIdx === idx)
            .map(([pIdx]) => Number(pIdx))
            .sort((a, b) => b - a);
        pkgIdxToRemove.forEach(p => removePackage(p));
        setLayoutTypes(prev => prev.filter((_, i) => i !== idx));
        setPackageLayoutIndex(prev => {
            const next: Record<number, number> = {};
            Object.entries(prev).forEach(([pIdx, lIdx]) => {
                if (lIdx === idx) return;
                next[Number(pIdx)] = lIdx > idx ? lIdx - 1 : lIdx;
            });
            return next;
        });
        setLayoutProjectionUrl(prev => shiftNumericIndexMap(prev, idx));
        setLayoutRenderingImgs(prev => shiftNumericIndexMap(prev, idx));
        setLayoutUploading(prev => shiftNumericIndexMap(prev, idx));
        setPendingLayoutProjectionFile(prev => shiftNumericIndexMap(prev, idx));
        setPendingLayoutRenderingFiles(prev => shiftNumericIndexMap(prev, idx));
        setCollapsedLayoutTypes(prev => shiftNumericIndexMap(prev, idx));
    };

    const addSubPackage = (layoutIdx: number) => {
        const newPkgIndex = packages.length;
        addPackage();
        setPackageLayoutIndex(prev => ({ ...prev, [newPkgIndex]: layoutIdx }));
    };

    // Stable sortable ids (indices shift on reorder, so never use the index as the dnd id)
    const packageDndId = (pkg: CampaignPackage, i: number) => String(pkg.id ?? `new-pkg-${i}`);
    const layoutDndId = (lt: { id?: number | string }, i: number) => String(lt.id ?? `new-lt-${i}`);

    // Bundle every per-index package map, arrayMove, then rebuild EACH map keyed by the new index.
    // `from`/`to` are absolute indices into the full `packages` array.
    const reorderPackages = (from: number, to: number) => {
        if (from === to || from < 0 || to < 0 || from >= packages.length || to >= packages.length) return;
        const desc = packages.map((pkg, i) => ({
            pkg,
            vs: packageValueSources[String(i)],
            col: collapsedPackages[i],
            tmpl: selectedPackageOrderTemplates[String(i)],
            err: packageErrors[String(i)],
            layoutIdx: packageLayoutIndex[i],
        }));
        const moved = arrayMove(desc, from, to);
        setPackages(moved.map(d => d.pkg));
        setPackageValueSources(Object.fromEntries(
            moved.map((d, i) => [String(i), d.vs] as const).filter(([, v]) => v !== undefined),
        ));
        setSelectedPackageOrderTemplates(Object.fromEntries(
            moved.map((d, i) => [String(i), d.tmpl] as const).filter(([, v]) => v !== undefined),
        ));
        setPackageErrors(Object.fromEntries(
            moved.map((d, i) => [String(i), d.err] as const).filter(([, v]) => v !== undefined),
        ));
        setCollapsedPackages(Object.fromEntries(
            moved.map((d, i) => [i, d.col] as const).filter(([, v]) => v !== undefined),
        ));
        setPackageLayoutIndex(Object.fromEntries(
            moved.map((d, i) => [i, d.layoutIdx] as const).filter(([, v]) => v !== undefined),
        ));
        // The active template-search row is keyed by index; drop it to avoid pointing at the wrong card.
        setActivePackageOrderIndex(null);
    };

    // Reorder LAYOUT TYPES: arrayMove layoutTypes, rebuild ALL layout-index-keyed maps, AND remap
    // packageLayoutIndex VALUES (each package's layoutIdx -> its layout's NEW position).
    const reorderLayouts = (from: number, to: number) => {
        if (from === to || from < 0 || to < 0 || from >= layoutTypes.length || to >= layoutTypes.length) return;
        const desc = layoutTypes.map((lt, i) => ({
            lt,
            col: collapsedLayoutTypes[i],
            projUrl: layoutProjectionUrl[i],
            rendImgs: layoutRenderingImgs[i],
            uploading: layoutUploading[i],
            pendProj: pendingLayoutProjectionFile[i],
            pendRend: pendingLayoutRenderingFiles[i],
            oldIdx: i,
        }));
        const moved = arrayMove(desc, from, to);
        // oldToNew[oldLayoutIdx] = newLayoutIdx
        const oldToNew: number[] = new Array(layoutTypes.length);
        moved.forEach((d, newIdx) => { oldToNew[d.oldIdx] = newIdx; });

        setLayoutTypes(moved.map(d => d.lt));
        setCollapsedLayoutTypes(Object.fromEntries(
            moved.map((d, i) => [i, d.col] as const).filter(([, v]) => v !== undefined),
        ));
        setLayoutProjectionUrl(Object.fromEntries(
            moved.map((d, i) => [i, d.projUrl] as const).filter(([, v]) => v !== undefined),
        ));
        setLayoutRenderingImgs(Object.fromEntries(
            moved.map((d, i) => [i, d.rendImgs] as const).filter(([, v]) => v !== undefined),
        ));
        setLayoutUploading(Object.fromEntries(
            moved.map((d, i) => [i, d.uploading] as const).filter(([, v]) => v !== undefined),
        ));
        setPendingLayoutProjectionFile(Object.fromEntries(
            moved.map((d, i) => [i, d.pendProj] as const).filter(([, v]) => v !== undefined),
        ));
        setPendingLayoutRenderingFiles(Object.fromEntries(
            moved.map((d, i) => [i, d.pendRend] as const).filter(([, v]) => v !== undefined),
        ));
        // Remap each package's layout VALUE through the permutation.
        setPackageLayoutIndex(prev => {
            const next: Record<number, number> = {};
            Object.entries(prev).forEach(([pIdx, lIdx]) => {
                const mapped = oldToNew[lIdx];
                next[Number(pIdx)] = mapped === undefined ? lIdx : mapped;
            });
            return next;
        });
    };

    const handleFlatPackageDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const from = packages.findIndex((pkg, i) => packageDndId(pkg, i) === String(active.id));
        const to = packages.findIndex((pkg, i) => packageDndId(pkg, i) === String(over.id));
        reorderPackages(from, to);
    };

    // Packages WITHIN one layout's sub-list — ids map back to absolute `packages` indices;
    // descriptors carry layoutIdx so grouping by packageLayoutIndex still renders correctly.
    const handleLayoutPackageDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const from = packages.findIndex((pkg, i) => packageDndId(pkg, i) === String(active.id));
        const to = packages.findIndex((pkg, i) => packageDndId(pkg, i) === String(over.id));
        reorderPackages(from, to);
    };

    const handleLayoutDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const from = layoutTypes.findIndex((lt, i) => layoutDndId(lt, i) === String(active.id));
        const to = layoutTypes.findIndex((lt, i) => layoutDndId(lt, i) === String(over.id));
        reorderLayouts(from, to);
    };

    // Immediate image upload/remove (Edit: layout ids exist for loaded layouts).
    // Newly-added layouts have no id yet — their images are deferred until after the next save.
    const handleEditLayoutProjection = async (layoutIdx: number, file: File | null) => {
        setLayoutError(null);
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { setLayoutError('Image must be 10MB or smaller.'); return; }
        const layoutId = layoutTypes[layoutIdx]?.id;
        if (!layoutId) {
            // New layout (no id yet): hold the file until the next save.
            setPendingLayoutProjectionFile(prev => ({ ...prev, [layoutIdx]: file }));
            return;
        }
        setLayoutUploading(prev => ({ ...prev, [layoutIdx]: true }));
        try {
            const res = await uploadCampaignLayoutTypeRentalProjection(layoutId, file);
            setLayoutProjectionUrl(prev => ({ ...prev, [layoutIdx]: res?.data?.rental_projection?.file_url ?? null }));
        } catch (e) { console.error(e); setLayoutError('Upload failed.'); }
        finally { setLayoutUploading(prev => ({ ...prev, [layoutIdx]: false })); }
    };

    const handleEditLayoutRenderings = async (layoutIdx: number, files: FileList | null) => {
        setLayoutError(null);
        if (!files || !files.length) return;
        const arr = Array.from(files);
        if (arr.some(f => f.size > 10 * 1024 * 1024)) { setLayoutError('Each image must be 10MB or smaller.'); return; }
        const layoutId = layoutTypes[layoutIdx]?.id;
        if (!layoutId) {
            // New layout (no id yet): hold the files until the next save.
            setPendingLayoutRenderingFiles(prev => ({ ...prev, [layoutIdx]: [...(prev[layoutIdx] || []), ...arr] }));
            return;
        }
        setLayoutUploading(prev => ({ ...prev, [layoutIdx]: true }));
        try {
            const res = await uploadCampaignLayoutTypeRenderings(layoutId, arr);
            setLayoutRenderingImgs(prev => ({ ...prev, [layoutIdx]: (res?.data?.rendering_images ?? []).map((r: LayoutRenderingImage) => ({ file_url: r.file_url, path: r.path })) }));
        } catch (e) { console.error(e); setLayoutError('Upload failed.'); }
        finally { setLayoutUploading(prev => ({ ...prev, [layoutIdx]: false })); }
    };

    const handleEditRemoveProjection = async (layoutIdx: number) => {
        const layoutId = layoutTypes[layoutIdx]?.id;
        if (!layoutId) return;
        setLayoutUploading(prev => ({ ...prev, [layoutIdx]: true }));
        try { await deleteCampaignLayoutTypeRentalProjection(layoutId); setLayoutProjectionUrl(prev => ({ ...prev, [layoutIdx]: null })); }
        catch (e) { console.error(e); setLayoutError('Remove failed.'); }
        finally { setLayoutUploading(prev => ({ ...prev, [layoutIdx]: false })); }
    };

    const handleEditRemoveRendering = async (layoutIdx: number, path: string) => {
        const layoutId = layoutTypes[layoutIdx]?.id;
        if (!layoutId || !path) return;
        setLayoutUploading(prev => ({ ...prev, [layoutIdx]: true }));
        try { const res = await deleteCampaignLayoutTypeRendering(layoutId, path); setLayoutRenderingImgs(prev => ({ ...prev, [layoutIdx]: (res?.data?.rendering_images ?? []).map((r: LayoutRenderingImage) => ({ file_url: r.file_url, path: r.path })) })); }
        catch (e) { console.error(e); setLayoutError('Remove failed.'); }
        finally { setLayoutUploading(prev => ({ ...prev, [layoutIdx]: false })); }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        const newPackageErrors: Record<string, Record<string, string>> = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Campaign Title is required';
        }

        if (!formData.slug.trim()) {
            newErrors.slug = 'Slug is required';
        }

        // If either date is filled, both are required
        if (formData.start_date || formData.end_date) {
            if (!formData.start_date) {
                newErrors.start_date = 'Start Date is required when End Date is provided';
            }
            if (!formData.end_date) {
                newErrors.end_date = 'End Date is required when Start Date is provided';
            }
        }

        // If both dates are provided, validate the date range
        if (formData.start_date && formData.end_date && formData.start_date >= formData.end_date) {
            newErrors.end_date = 'End Date must be after Start Date';
        }

        if (formData.slot_total <= 0) {
            newErrors.slot_total = 'Slot number must be greater than 0';
        }

        if (formData.base_amount < 0) {
            newErrors.base_amount = 'Base amount cannot be negative';
        }

        if (formData.booking_amount < 0) {
            newErrors.booking_amount = 'Booking amount cannot be negative';
        }

        // Validate packages only if packages mode is enabled
        if (campaignMode === 'packages') {
            if (packages.length === 0) {
                newErrors.packages = 'At least one package is required when using packages mode';
            }

            packages.forEach((pkg, index) => {
                const packageError: Record<string, string> = {};

                if (!pkg.name?.trim()) {
                    packageError.name = 'Package Name is required';
                }

                // Validate slot_total based on value source
                const slotValue = packageValueSources[index.toString()]?.slot_total === 'fixed'
                    ? formData.slot_total
                    : pkg.slot_total;

                if (slotValue && slotValue <= 0) {
                    packageError.slot_total = 'Slot number must be greater than 0';
                }

                // Validate base_amount based on value source
                const baseValue = packageValueSources[index.toString()]?.base_amount === 'fixed'
                    ? formData.base_amount
                    : pkg.base_amount;

                if (baseValue && baseValue < 0) {
                    packageError.base_amount = 'Base amount cannot be negative';
                }

                // Validate booking_amount based on value source
                const bookingValue = packageValueSources[index.toString()]?.booking_amount === 'fixed'
                    ? formData.booking_amount
                    : pkg.booking_amount;

                if (bookingValue && bookingValue < 0) {
                    packageError.booking_amount = 'Booking amount cannot be negative';
                }

                if (Object.keys(packageError).length > 0) {
                    newPackageErrors[index.toString()] = packageError;
                }
            });
        }

        setErrors(newErrors);
        setPackageErrors(newPackageErrors);
        return Object.keys(newErrors).length === 0 && Object.keys(newPackageErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            // Process packages for submission
            const processedPackages = campaignMode === 'packages'
                ? packages
                    // In layout mode, exclude packages that have no layout assignment
                    // (e.g. flat packages added before the toggle was turned on) — payload only.
                    .filter((_, index) => !useLayoutTypes || packageLayoutIndex[index] !== undefined)
                    .map((pkg) => {
                        // Look up the original index so per-package maps (keyed by original position) stay correct.
                        const index = packages.indexOf(pkg);
                        const valueSources = packageValueSources[index.toString()];
                        const processedPkg: CampaignPackage = {
                            ...pkg,
                            slot_total: valueSources?.slot_total === 'fixed' ? formData.slot_total : pkg.slot_total,
                            base_amount: valueSources?.base_amount === 'fixed' ? formData.base_amount : pkg.base_amount,
                            booking_amount: valueSources?.booking_amount === 'fixed' ? formData.booking_amount : pkg.booking_amount,
                        };

                        // Normalise order_id: backend accepts null/omitted, but not the string "null"
                        if (processedPkg.order_id === 'null' || processedPkg.order_id === '' || processedPkg.order_id == null) {
                            delete processedPkg.order_id;
                        }

                        // Thread the layout assignment (0-based index into submitted layout_types) + existing id
                        if (useLayoutTypes) {
                            const layoutIdx = packageLayoutIndex[index];
                            if (layoutIdx !== undefined) {
                                processedPkg.layout_type_index = layoutIdx;
                                const existingLayoutId = layoutTypes[layoutIdx]?.id;
                                if (existingLayoutId != null) {
                                    processedPkg.layout_type_id = existingLayoutId;
                                }
                            }
                        }

                        return processedPkg;
                    })
                : undefined;

            const campaignData = {
                ...formData,
                packages: campaignMode === 'packages' ? processedPackages : undefined,
                // Nested layout types (only when the toggle is on)
                layout_types: (campaignMode === 'packages' && useLayoutTypes)
                    ? layoutTypes.map((lt, i) => ({ id: lt.id, name: lt.name, description: lt.description ?? '', sort: i }))
                    : undefined,
                // Package-level template linkage only
                order_id: undefined as string | undefined,
                status: 'draft' // Default status for new campaigns
            };

            const updated = await updateCampaign(campaignId!, campaignData);

            // For newly-added layouts (no prior id) the images were held back; upload them now
            // using the ids returned by updateCampaign, matched by index/sort.
            if (campaignMode === 'packages' && useLayoutTypes && updated?.data?.layout_types?.length) {
                const savedLayouts = updated.data.layout_types as CampaignLayoutType[];
                try {
                    for (let i = 0; i < layoutTypes.length; i++) {
                        // Only handle layouts that were new (had no id before this save)
                        if (layoutTypes[i]?.id != null) continue;
                        const savedId = savedLayouts[i]?.id;
                        if (savedId == null) continue;
                        const pendingProjection = pendingLayoutProjectionFile[i];
                        const pendingRenderings = pendingLayoutRenderingFiles[i];
                        if (pendingProjection) {
                            await uploadCampaignLayoutTypeRentalProjection(savedId, pendingProjection);
                        }
                        if (pendingRenderings?.length) {
                            await uploadCampaignLayoutTypeRenderings(savedId, pendingRenderings);
                        }
                    }
                } catch (imgErr) {
                    console.error('Layout image upload failed:', imgErr);
                    setError('Campaign updated, but some new layout images failed to upload — add them by editing again.');
                }
            }

            // Navigate back to campaigns list
            navigate(`${LOCAL_PATH_PREFIX}campaigns`);
        } catch (err) {
            console.error('Error updating campaign:', err);
            setError('Failed to update campaign. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBackClick = () => {
        navigate(`${LOCAL_PATH_PREFIX}campaigns`);
    };

    // Reusable per-package card (used by the flat list and inside each layout section)
    const renderPackageCard = (pkg: CampaignPackage, index: number) => (
        <SortableCampaignItem
            key={packageDndId(pkg, index)}
            id={packageDndId(pkg, index)}
            className="border border-gray-200 rounded-xl bg-white/50 overflow-hidden"
        >
            {({ handleProps }) => (<>
            <div className="flex items-center justify-between p-4 bg-gray-50/50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <DragHandle handleProps={handleProps} label={`Drag to reorder package ${index + 1}`} />
                    <button
                        type="button"
                        onClick={() => togglePackageCollapse(index)}
                        className="p-1 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                        disabled={campaignMode !== 'packages'}
                    >
                        {collapsedPackages[index] ? (
                            <ChevronDown className="h-4 w-4 text-gray-600" />
                        ) : (
                            <ChevronUp className="h-4 w-4 text-gray-600" />
                        )}
                    </button>
                    <h3 className="font-semibold text-gray-900">
                        Package {index + 1}
                        {pkg.name && (
                            <span className="ml-2 text-sm font-normal text-gray-600">
                                - {pkg.name}
                            </span>
                        )}
                    </h3>
                </div>
                <button
                    type="button"
                    onClick={() => removePackage(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    disabled={campaignMode !== 'packages'}
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>

            {!collapsedPackages[index] && (
                <div className="p-4">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Linked Template Order (per package) */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Linked Template Order (Optional)
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={
                                        activePackageOrderIndex === index
                                            ? orderSearch
                                            : (selectedPackageOrderTemplates[String(index)]?.order_no || '')
                                    }
                                    onFocus={() => {
                                        setActivePackageOrderIndex(index);
                                        setOrderSearch('');
                                        setOrderOptions([]);
                                    }}
                                    onChange={(e) => {
                                        setActivePackageOrderIndex(index);
                                        setOrderSearch(e.target.value);
                                    }}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white/70 focus:outline-none focus:ring-0 focus:border-blue-500 transition-all duration-200"
                                    placeholder="Search template orders by order no..."
                                    disabled={campaignMode !== 'packages'}
                                />
                                {(pkg.order_id || selectedPackageOrderTemplates[String(index)]) && (
                                    <button
                                        type="button"
                                        onClick={() => handleClearPackageTemplateOrder(index)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-red-600 hover:text-red-800"
                                        disabled={campaignMode !== 'packages'}
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                            <p className="mt-1 text-sm text-gray-500">
                                {selectedPackageOrderTemplates[String(index)]
                                    ? `Selected: ${selectedPackageOrderTemplates[String(index)]?.order_no || selectedPackageOrderTemplates[String(index)]?.id}`
                                    : (pkg.order_id ? `Selected order id: ${pkg.order_id}` : 'Type to search and select an existing template order.')}
                            </p>
                            {activePackageOrderIndex === index && orderLoading && (
                                <div className="mt-2 text-sm text-gray-500">Searching…</div>
                            )}
                            {activePackageOrderIndex === index && !orderLoading && orderOptions.length > 0 && (
                                <div className="mt-2 border border-gray-200 rounded-xl bg-white shadow-lg overflow-hidden">
                                    {orderOptions.map((o) => (
                                        <button
                                            key={String(o.id)}
                                            type="button"
                                            onClick={() => handleSelectTemplateOrder(o)}
                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between"
                                        >
                                            <div>
                                                <div className="font-medium text-gray-900">{o.order_no || `Order #${o.id}`}</div>
                                                <div className="text-xs text-gray-500">ID: {o.id}</div>
                                            </div>
                                            {typeof o.total_amount === 'number' && (
                                                <div className="text-sm font-semibold text-gray-900">
                                                    RM {o.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Package Name */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Package Name *
                            </label>
                            <input
                                type="text"
                                value={pkg.name || ''}
                                onChange={(e) => updatePackage(index, 'name', e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${packageErrors[index.toString()]?.name
                                    ? 'border-red-300 bg-red-50 focus:border-red-500'
                                    : 'border-gray-200 bg-white/70 focus:border-blue-500'
                                    }`}
                                placeholder="Enter package name"
                                disabled={campaignMode !== 'packages'}
                            />
                            {packageErrors[index.toString()]?.name && (
                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    {packageErrors[index.toString()].name}
                                </p>
                            )}
                        </div>

                        {/* Package Description */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                value={pkg.description || ''}
                                onChange={(e) => updatePackage(index, 'description', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-white/70 focus:outline-none focus:ring-0 focus:border-blue-500 transition-all duration-200"
                                placeholder="Enter package description"
                                disabled={campaignMode !== 'packages'}
                            />
                        </div>

                        {/* Internal Description */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Internal Description
                            </label>
                            <textarea
                                value={pkg.internal_description || ''}
                                onChange={(e) => updatePackage(index, 'internal_description', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-white/70 focus:outline-none focus:ring-0 focus:border-blue-500 transition-all duration-200"
                                placeholder="Internal notes (optional)"
                                disabled={campaignMode !== 'packages'}
                            />
                        </div>

                        {/* Slot Total */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Slot Number
                                </label>
                                <div className="flex items-center space-x-2">
                                    <label className="flex items-center text-xs cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`slot_source_${index}`}
                                            checked={packageValueSources[index.toString()]?.slot_total === 'fixed'}
                                            onChange={() => handleValueSourceChange(index, 'slot_total', 'fixed')}
                                            className="w-3 h-3 text-blue-600"
                                            disabled={campaignMode !== 'packages'}
                                        />
                                        <Link className="ml-1 h-3 w-3 text-blue-600" />
                                        <span className="ml-1 text-gray-600">Fixed</span>
                                    </label>
                                    <label className="flex items-center text-xs cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`slot_source_${index}`}
                                            checked={packageValueSources[index.toString()]?.slot_total === 'custom'}
                                            onChange={() => handleValueSourceChange(index, 'slot_total', 'custom')}
                                            className="w-3 h-3 text-blue-600"
                                            disabled={campaignMode !== 'packages'}
                                        />
                                        <Edit3 className="ml-1 h-3 w-3 text-green-600" />
                                        <span className="ml-1 text-gray-600">Custom</span>
                                    </label>
                                </div>
                            </div>
                            <input
                                type="number"
                                min="0"
                                value={packageValueSources[index.toString()]?.slot_total === 'fixed' ? formData.slot_total : (pkg.slot_total || '')}
                                onChange={(e) => updatePackage(index, 'slot_total', Number(e.target.value))}
                                className={`w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${packageErrors[index.toString()]?.slot_total
                                    ? 'border-red-300 bg-red-50 focus:border-red-500'
                                    : 'border-gray-200 bg-white/70 focus:border-blue-500'
                                    }`}
                                placeholder="0"
                                disabled={campaignMode !== 'packages' || packageValueSources[index.toString()]?.slot_total === 'fixed'}
                            />
                            {packageValueSources[index.toString()]?.slot_total === 'fixed' && (
                                <p className="mt-1 text-xs text-blue-600">
                                    Using campaign value: {formData.slot_total}
                                </p>
                            )}
                            {packageErrors[index.toString()]?.slot_total && (
                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    {packageErrors[index.toString()].slot_total}
                                </p>
                            )}
                        </div>

                        {/* Base Amount */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Base Amount (RM)
                                </label>
                                <div className="flex items-center space-x-2">
                                    <label className="flex items-center text-xs cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`base_source_${index}`}
                                            checked={packageValueSources[index.toString()]?.base_amount === 'fixed'}
                                            onChange={() => handleValueSourceChange(index, 'base_amount', 'fixed')}
                                            className="w-3 h-3 text-blue-600"
                                            disabled={campaignMode !== 'packages'}
                                        />
                                        <Link className="ml-1 h-3 w-3 text-blue-600" />
                                        <span className="ml-1 text-gray-600">Fixed</span>
                                    </label>
                                    <label className="flex items-center text-xs cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`base_source_${index}`}
                                            checked={packageValueSources[index.toString()]?.base_amount === 'custom'}
                                            onChange={() => handleValueSourceChange(index, 'base_amount', 'custom')}
                                            className="w-3 h-3 text-blue-600"
                                            disabled={campaignMode !== 'packages'}
                                        />
                                        <Edit3 className="ml-1 h-3 w-3 text-green-600" />
                                        <span className="ml-1 text-gray-600">Custom</span>
                                    </label>
                                </div>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm">RM</span>
                                </div>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={packageValueSources[index.toString()]?.base_amount === 'fixed' ? formData.base_amount : (pkg.base_amount || '')}
                                    onChange={(e) => updatePackage(index, 'base_amount', Number(e.target.value))}
                                    className={`w-full pl-10 pr-3 py-2 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${packageErrors[index.toString()]?.base_amount
                                        ? 'border-red-300 bg-red-50 focus:border-red-500'
                                        : 'border-gray-200 bg-white/70 focus:border-blue-500'
                                        }`}
                                    placeholder="0.00"
                                    disabled={campaignMode !== 'packages' || packageValueSources[index.toString()]?.base_amount === 'fixed'}
                                />
                            </div>
                            {packageValueSources[index.toString()]?.base_amount === 'fixed' && (
                                <p className="mt-1 text-xs text-blue-600">
                                    Using campaign value: RM {formData.base_amount}
                                </p>
                            )}
                            {packageErrors[index.toString()]?.base_amount && (
                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    {packageErrors[index.toString()].base_amount}
                                </p>
                            )}
                        </div>

                        {/* Booking Amount */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Booking Amount (RM)
                                </label>
                                <div className="flex items-center space-x-2">
                                    <label className="flex items-center text-xs cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`booking_source_${index}`}
                                            checked={packageValueSources[index.toString()]?.booking_amount === 'fixed'}
                                            onChange={() => handleValueSourceChange(index, 'booking_amount', 'fixed')}
                                            className="w-3 h-3 text-blue-600"
                                            disabled={campaignMode !== 'packages'}
                                        />
                                        <Link className="ml-1 h-3 w-3 text-blue-600" />
                                        <span className="ml-1 text-gray-600">Fixed</span>
                                    </label>
                                    <label className="flex items-center text-xs cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`booking_source_${index}`}
                                            checked={packageValueSources[index.toString()]?.booking_amount === 'custom'}
                                            onChange={() => handleValueSourceChange(index, 'booking_amount', 'custom')}
                                            className="w-3 h-3 text-blue-600"
                                            disabled={campaignMode !== 'packages'}
                                        />
                                        <Edit3 className="ml-1 h-3 w-3 text-green-600" />
                                        <span className="ml-1 text-gray-600">Custom</span>
                                    </label>
                                </div>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm">RM</span>
                                </div>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={packageValueSources[index.toString()]?.booking_amount === 'fixed' ? formData.booking_amount : (pkg.booking_amount || '')}
                                    onChange={(e) => updatePackage(index, 'booking_amount', Number(e.target.value))}
                                    className={`w-full pl-10 pr-3 py-2 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${packageErrors[index.toString()]?.booking_amount
                                        ? 'border-red-300 bg-red-50 focus:border-red-500'
                                        : 'border-gray-200 bg-white/70 focus:border-blue-500'
                                        }`}
                                    placeholder="0.00"
                                    disabled={campaignMode !== 'packages' || packageValueSources[index.toString()]?.booking_amount === 'fixed'}
                                />
                            </div>
                            {packageValueSources[index.toString()]?.booking_amount === 'fixed' && (
                                <p className="mt-1 text-xs text-blue-600">
                                    Using campaign value: RM {formData.booking_amount}
                                </p>
                            )}
                            {packageErrors[index.toString()]?.booking_amount && (
                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    {packageErrors[index.toString()].booking_amount}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
            </>)}
        </SortableCampaignItem>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
                <div className="backdrop-blur-xl bg-white/90 rounded-3xl p-8 shadow-xl border border-white/20">
                    <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="text-gray-600">Loading campaign...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (fetchError || !campaign) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
                <div className="max-w-4xl mx-auto">
                    <div className="backdrop-blur-xl bg-white/90 rounded-3xl p-8 shadow-xl border border-white/20 text-center">
                        <div className="text-red-600 mb-4">
                            <AlertCircle className="mx-auto h-12 w-12" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Campaign</h3>
                        <p className="text-gray-600 mb-4">{fetchError || 'Campaign not found'}</p>
                        <button
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 hover:scale-105 shadow-lg"
                            onClick={handleBackClick}
                        >
                            Back to Campaigns
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            {/* Header */}
            <div className="sticky top-0 z-10 backdrop-blur-xl bg-white/80 border-b border-white/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={handleBackClick}
                                className="p-2 rounded-xl bg-white/70 hover:bg-white/90 transition-all duration-200 hover:scale-105 shadow-sm border border-white/20"
                            >
                                <ArrowLeft className="h-5 w-5 text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Edit Campaign</h1>
                                <p className="text-sm text-gray-600">Update campaign information</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={handleBackClick}
                                className="px-4 py-2 text-gray-600 bg-white/70 hover:bg-white/90 rounded-xl transition-all duration-200 hover:scale-105 shadow-sm border border-white/20"
                            >
                                <X className="h-4 w-4 inline mr-2" />
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="h-4 w-4 inline mr-2" />
                                {isSubmitting ? 'Updating...' : 'Update Campaign'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Enhanced Grid Layout */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    {/* Left Column - Main Form Content */}
                    <div className="xl:col-span-8 space-y-6">
                        <div className="backdrop-blur-xl bg-white/90 rounded-3xl p-8 shadow-xl border border-white/20">
                            <div className="flex items-center mb-6">
                                <div className="p-3 bg-blue-100 rounded-2xl mr-4">
                                    <FileText className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">Campaign Details</h2>
                                    <p className="text-sm text-gray-600">Basic information about the campaign</p>
                                </div>
                            </div>

                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <AlertCircle className="h-5 w-5 text-red-400" />
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-red-800">Error</h3>
                                            <div className="mt-2 text-sm text-red-700">
                                                <p>{error}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-6">
                                {/* Campaign Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Campaign Title *
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${errors.title
                                            ? 'border-red-300 bg-red-50 focus:border-red-500'
                                            : 'border-gray-200 bg-white/70 focus:border-blue-500'
                                            }`}
                                        placeholder="Enter campaign title"
                                    />
                                    {errors.title && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center">
                                            <AlertCircle className="h-4 w-4 mr-1" />
                                            {errors.title}
                                        </p>
                                    )}
                                </div>

                                {/* Campaign Slug */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Campaign Slug *
                                    </label>
                                    <input
                                        type="text"
                                        name="slug"
                                        value={formData.slug}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${errors.slug
                                            ? 'border-red-300 bg-red-50 focus:border-red-500'
                                            : 'border-gray-200 bg-white/70 focus:border-blue-500'
                                            }`}
                                        placeholder="campaign-slug"
                                    />
                                    {errors.slug && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center">
                                            <AlertCircle className="h-4 w-4 mr-1" />
                                            {errors.slug}
                                        </p>
                                    )}
                                    <p className="mt-1 text-sm text-gray-500">
                                        URL-friendly version of the title. Auto-generated from title.
                                    </p>
                                </div>

                                {/* Campaign Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Campaign Description (Optional)
                                    </label>
                                    <textarea
                                        name="description"
                                        rows={4}
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white/70 focus:outline-none focus:ring-0 focus:border-blue-500 transition-all duration-200"
                                        placeholder="Enter campaign description"
                                    />
                                </div>

                                {/* Campaign Thumbnail */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Campaign Thumbnail (Optional)
                                    </label>
                                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-gray-400 transition-colors duration-200">
                                        <div className="space-y-1 text-center">
                                            <svg
                                                className="mx-auto h-12 w-12 text-gray-400"
                                                stroke="currentColor"
                                                fill="none"
                                                viewBox="0 0 48 48"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                                    strokeWidth={2}
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                            <div className="flex text-sm text-gray-600">
                                                <label
                                                    htmlFor="thumbnail-upload"
                                                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                                                >
                                                    <span>Upload a file</span>
                                                    <input
                                                        id="thumbnail-upload"
                                                        name="thumbnail"
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleFileChange}
                                                        className="sr-only"
                                                    />
                                                </label>
                                                <p className="pl-1">or drag and drop</p>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                PNG, JPG, GIF up to 10MB
                                            </p>
                                        </div>
                                    </div>
                                    {formData.thumbnail && (
                                        <div className="mt-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <svg className="flex-shrink-0 mr-1.5 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                    {formData.thumbnail.name}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData(prev => ({ ...prev, thumbnail: null }));
                                                        setThumbnailPreview(null);
                                                    }}
                                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                            <div className="relative">
                                                <img
                                                    src={thumbnailPreview || ''}
                                                    alt="Thumbnail preview"
                                                    className="w-full h-48 object-cover rounded-lg border border-gray-200"
                                                />
                                                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                                                    <div className="opacity-0 hover:opacity-100 transition-opacity duration-200">
                                                        <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Campaign Thumbnail Video */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Campaign Thumbnail Video (Optional)
                                    </label>
                                    {existingVideoUrl ? (
                                        <div className="mt-1">
                                            <video src={existingVideoUrl} controls className="w-full h-48 object-cover rounded-lg border border-gray-200 bg-black" />
                                            <div className="mt-2 flex items-center gap-4">
                                                <label htmlFor="thumbnail-video-replace" className="cursor-pointer text-blue-600 hover:text-blue-500 text-sm font-medium">
                                                    {videoUploading ? 'Uploading…' : 'Replace video'}
                                                    <input
                                                        id="thumbnail-video-replace"
                                                        type="file"
                                                        accept="video/mp4,video/webm,video/quicktime"
                                                        onChange={handleVideoChange}
                                                        disabled={videoUploading}
                                                        className="sr-only"
                                                    />
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={handleVideoRemove}
                                                    disabled={videoUploading}
                                                    className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                                                >
                                                    {videoUploading ? 'Removing…' : 'Remove video'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-gray-400 transition-colors duration-200">
                                            <div className="space-y-1 text-center">
                                                <div className="flex text-sm text-gray-600 justify-center">
                                                    <label htmlFor="thumbnail-video-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                                                        <span>{videoUploading ? 'Uploading…' : 'Upload a video'}</span>
                                                        <input
                                                            id="thumbnail-video-upload"
                                                            name="thumbnail_video"
                                                            type="file"
                                                            accept="video/mp4,video/webm,video/quicktime"
                                                            onChange={handleVideoChange}
                                                            disabled={videoUploading}
                                                            className="sr-only"
                                                        />
                                                    </label>
                                                </div>
                                                <p className="text-xs text-gray-500">MP4, WebM, MOV up to 50MB</p>
                                            </div>
                                        </div>
                                    )}
                                    {videoError && <p className="mt-2 text-sm text-red-600">{videoError}</p>}
                                </div>

                                {/* Date Range */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Start Date
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                name="start_date"
                                                value={formData.start_date}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-3 pl-12 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${errors.start_date
                                                    ? 'border-red-300 bg-red-50 focus:border-red-500'
                                                    : 'border-gray-200 bg-white/70 focus:border-blue-500'
                                                    }`}
                                            />
                                            <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        </div>
                                        {errors.start_date && (
                                            <p className="mt-1 text-sm text-red-600 flex items-center">
                                                <AlertCircle className="h-4 w-4 mr-1" />
                                                {errors.start_date}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            End Date
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                name="end_date"
                                                value={formData.end_date}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-3 pl-12 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${errors.end_date
                                                    ? 'border-red-300 bg-red-50 focus:border-red-500'
                                                    : 'border-gray-200 bg-white/70 focus:border-blue-500'
                                                    }`}
                                            />
                                            <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        </div>
                                        {errors.end_date && (
                                            <p className="mt-1 text-sm text-red-600 flex items-center">
                                                <AlertCircle className="h-4 w-4 mr-1" />
                                                {errors.end_date}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Campaign Packages Section */}
                        <div className="backdrop-blur-xl bg-white/90 rounded-3xl p-6 shadow-xl border border-white/20">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-xl">
                                        <Package className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">Campaign Packages</h2>
                                        <p className="text-sm text-gray-600">Add packages for this campaign</p>
                                        {campaignMode === 'packages' && (
                                            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                                                <span>Campaign Values:</span>
                                                <span className="flex items-center gap-1">
                                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                    Slots: {formData.slot_total}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                    Base: RM {formData.base_amount}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={addPackage}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={campaignMode !== 'packages' || useLayoutTypes}
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Package
                                </button>
                            </div>

                            {/* Use layout types toggle */}
                            {campaignMode === 'packages' && (
                                <div className="mb-6 flex items-start justify-between gap-4 p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl">
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-900">Use layout types</h3>
                                        <p className="text-xs text-gray-600">
                                            Group packages under layout types, each with its own renderings &amp; rental projection.
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={useLayoutTypes}
                                            onChange={(e) => setUseLayoutTypes(e.target.checked)}
                                        />
                                        <div className="w-11 h-6 bg-gray-300 peer-checked:bg-indigo-600 rounded-full transition-colors duration-200 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
                                    </label>
                                </div>
                            )}

                            {useLayoutTypes && campaignMode === 'packages' ? (
                                /* Nested Layout Type UI */
                                <div className="space-y-6">
                                    <button
                                        type="button"
                                        onClick={addLayoutType}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 flex items-center gap-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add Layout Type
                                    </button>

                                    {layoutTypes.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                            <p>No layout types added yet</p>
                                            <p className="text-sm">Click "Add Layout Type" to get started</p>
                                        </div>
                                    ) : (
                                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleLayoutDragEnd}>
                                            <SortableContext
                                                items={layoutTypes.map((lt, i) => layoutDndId(lt, i))}
                                                strategy={verticalListSortingStrategy}
                                            >
                                        {layoutTypes.map((lt, layoutIdx) => (
                                            <SortableCampaignItem
                                                key={layoutDndId(lt, layoutIdx)}
                                                id={layoutDndId(lt, layoutIdx)}
                                                className="border-2 border-indigo-200 rounded-2xl bg-indigo-50/30 p-5 space-y-5"
                                            >
                                            {({ handleProps }) => (<>
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <DragHandle
                                                            handleProps={handleProps}
                                                            label={`Drag to reorder layout type ${layoutIdx + 1}`}
                                                            className="p-1 hover:bg-indigo-100 rounded-lg text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing transition-colors duration-200 shrink-0"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleLayoutCollapse(layoutIdx)}
                                                            className="p-1 hover:bg-indigo-100 rounded-lg transition-colors duration-200 shrink-0"
                                                        >
                                                            {collapsedLayoutTypes[layoutIdx] ? (
                                                                <ChevronDown className="h-4 w-4 text-gray-600" />
                                                            ) : (
                                                                <ChevronUp className="h-4 w-4 text-gray-600" />
                                                            )}
                                                        </button>
                                                        <div className="flex flex-col min-w-0 flex-1">
                                                            <span className="text-xs font-medium text-indigo-500 leading-none mb-1">
                                                                Layout Type {layoutIdx + 1}{lt.id == null && <span className="ml-1 text-amber-600">(unsaved)</span>}
                                                            </span>
                                                            <input
                                                                type="text"
                                                                value={lt.name}
                                                                onChange={(e) => updateLayoutType(layoutIdx, 'name', e.target.value)}
                                                                className="w-full px-2 py-1 rounded-md border border-gray-300 bg-white/80 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-0 focus:border-indigo-500 transition-all duration-200"
                                                                placeholder="Layout name (e.g. Type A)"
                                                            />
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (window.confirm('Remove this layout type and all its sub-packages?')) {
                                                                removeLayoutType(layoutIdx);
                                                            }
                                                        }}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>

                                                {!collapsedLayoutTypes[layoutIdx] && (<>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Description
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={lt.description || ''}
                                                        onChange={(e) => updateLayoutType(layoutIdx, 'description', e.target.value)}
                                                        className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-white/70 focus:outline-none focus:ring-0 focus:border-indigo-500 transition-all duration-200"
                                                        placeholder="Short description (optional)"
                                                    />
                                                </div>

                                                {/* Rental Projection (single image) */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Rental Projection (single image)
                                                    </label>
                                                    {layoutProjectionUrl[layoutIdx] ? (
                                                        <div className="mt-1">
                                                            <img
                                                                src={layoutProjectionUrl[layoutIdx] || ''}
                                                                alt="Rental projection"
                                                                className="w-full h-48 object-cover rounded-lg border border-gray-200"
                                                            />
                                                            <div className="mt-2 flex items-center gap-4">
                                                                <label className="cursor-pointer text-indigo-600 hover:text-indigo-500 text-sm font-medium">
                                                                    {layoutUploading[layoutIdx] ? 'Uploading…' : 'Replace image'}
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        onChange={(e) => handleEditLayoutProjection(layoutIdx, e.target.files?.[0] ?? null)}
                                                                        disabled={layoutUploading[layoutIdx]}
                                                                        className="sr-only"
                                                                    />
                                                                </label>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleEditRemoveProjection(layoutIdx)}
                                                                    disabled={layoutUploading[layoutIdx]}
                                                                    className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                                                                >
                                                                    {layoutUploading[layoutIdx] ? 'Removing…' : 'Remove image'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => handleEditLayoutProjection(layoutIdx, e.target.files?.[0] ?? null)}
                                                                disabled={layoutUploading[layoutIdx]}
                                                                className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200"
                                                            />
                                                            {pendingLayoutProjectionFile[layoutIdx] && (
                                                                <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
                                                                    <span>{pendingLayoutProjectionFile[layoutIdx].name} (uploads on save)</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setPendingLayoutProjectionFile(prev => { const n = { ...prev }; delete n[layoutIdx]; return n; })}
                                                                        className="text-red-600 hover:text-red-800 font-medium"
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>

                                                {/* Renderings (multiple images) */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Renderings (multiple images)
                                                    </label>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        multiple
                                                        onChange={(e) => handleEditLayoutRenderings(layoutIdx, e.target.files)}
                                                        disabled={layoutUploading[layoutIdx]}
                                                        className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200"
                                                    />
                                                    {layoutUploading[layoutIdx] && (
                                                        <p className="mt-2 text-xs text-indigo-600">Uploading…</p>
                                                    )}
                                                    {(layoutRenderingImgs[layoutIdx]?.length ?? 0) > 0 && (
                                                        <div className="mt-3 grid grid-cols-3 gap-3">
                                                            {layoutRenderingImgs[layoutIdx].map((img, imgIdx) => (
                                                                <div key={img.path || img.file_url || imgIdx} className="relative group">
                                                                    <img
                                                                        src={img.file_url || ''}
                                                                        alt={`Rendering ${imgIdx + 1}`}
                                                                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                                                                    />
                                                                    {img.path && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleEditRemoveRendering(layoutIdx, img.path as string)}
                                                                            disabled={layoutUploading[layoutIdx]}
                                                                            className="absolute top-1 right-1 p-1 bg-white/90 text-red-600 rounded-full shadow hover:bg-white disabled:opacity-50"
                                                                        >
                                                                            <X className="h-3 w-3" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {pendingLayoutRenderingFiles[layoutIdx]?.length > 0 && (
                                                        <ul className="mt-2 space-y-1">
                                                            {pendingLayoutRenderingFiles[layoutIdx].map((f, fIdx) => (
                                                                <li key={fIdx} className="flex items-center justify-between text-sm text-gray-600">
                                                                    <span>{f.name} (uploads on save)</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setPendingLayoutRenderingFiles(prev => ({
                                                                            ...prev,
                                                                            [layoutIdx]: (prev[layoutIdx] || []).filter((_, i) => i !== fIdx),
                                                                        }))}
                                                                        className="text-red-600 hover:text-red-800 font-medium"
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>

                                                {/* Sub-packages for this layout */}
                                                <div className="space-y-4 pt-2 border-t border-indigo-200">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-sm font-semibold text-gray-900">Sub-packages</h4>
                                                        <button
                                                            type="button"
                                                            onClick={() => addSubPackage(layoutIdx)}
                                                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 text-sm"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                            Add sub-package
                                                        </button>
                                                    </div>
                                                    {(() => {
                                                        const layoutPkgs = packages
                                                            .map((pkg, index) => ({ pkg, index }))
                                                            .filter(({ index }) => packageLayoutIndex[index] === layoutIdx);
                                                        return (
                                                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleLayoutPackageDragEnd}>
                                                                <SortableContext
                                                                    items={layoutPkgs.map(({ pkg, index }) => packageDndId(pkg, index))}
                                                                    strategy={verticalListSortingStrategy}
                                                                >
                                                                    {layoutPkgs.map(({ pkg, index }) => renderPackageCard(pkg, index))}
                                                                </SortableContext>
                                                            </DndContext>
                                                        );
                                                    })()}
                                                </div>

                                                <p className="text-xs text-gray-500">
                                                    {lt.id == null
                                                        ? 'Images for unsaved layouts upload after you save the campaign.'
                                                        : 'PNG/JPG up to 10MB · images upload immediately.'}
                                                </p>
                                                </>)}
                                            </>)}
                                            </SortableCampaignItem>
                                        ))}
                                            </SortableContext>
                                        </DndContext>
                                    )}
                                    {layoutError && <p className="text-sm text-red-600">{layoutError}</p>}
                                </div>
                            ) : packages.length === 0 && campaignMode === 'packages' ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p>No packages added yet</p>
                                    <p className="text-sm">Click "Add Package" to get started</p>
                                </div>
                            ) : (
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleFlatPackageDragEnd}>
                                    <SortableContext
                                        items={packages.map((pkg, index) => packageDndId(pkg, index))}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="space-y-6">
                                            {packages.map((pkg, index) => renderPackageCard(pkg, index))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            )}
                        </div>
                    </div>
                    {/* Right Sidebar - Settings and Configuration */}
                    <div className="xl:col-span-4 space-y-6">
                        {/* Campaign Mode Selection */}
                        <div className="backdrop-blur-xl bg-white/90 rounded-3xl p-6 shadow-xl border border-white/20">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-indigo-100 rounded-xl">
                                    <Settings className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Campaign Mode</h2>
                                    <p className="text-sm text-gray-600">Choose between single campaign or packages</p>
                                </div>
                            </div>


                            <div className="space-y-4">
                                {/* Single Campaign Option */}
                                <label className="flex items-center p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors duration-200">
                                    <input
                                        type="radio"
                                        name="campaignMode"
                                        value="single"
                                        checked={campaignMode === 'single'}
                                        onChange={(e) => handleModeChange(e.target.value as 'single' | 'packages')}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                                    />
                                    <div className="ml-4 flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <FileText className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900">Single Campaign</h3>
                                            <p className="text-sm text-gray-600">Simple campaign with basic settings</p>
                                        </div>
                                    </div>
                                </label>

                                {/* Campaign Packages Option */}
                                <label className="flex items-center p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors duration-200">
                                    <input
                                        type="radio"
                                        name="campaignMode"
                                        value="packages"
                                        checked={campaignMode === 'packages'}
                                        onChange={(e) => handleModeChange(e.target.value as 'single' | 'packages')}
                                        className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500"
                                    />
                                    <div className="ml-4 flex items-center gap-3">
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <Package className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900">Campaign Packages</h3>
                                            <p className="text-sm text-gray-600">Advanced campaign with multiple packages</p>
                                        </div>
                                    </div>
                                </label>
                            </div>

                            {campaignMode === 'packages' && (
                                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <p className="text-sm text-green-700">
                                            Packages mode enabled. You can now add multiple packages to this campaign.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Internal Details */}
                        <div className="backdrop-blur-xl bg-white/90 rounded-3xl p-6 shadow-xl border border-white/20">
                            <div className="flex items-center mb-4">
                                <div className="p-2 bg-purple-100 rounded-xl mr-3">
                                    <Settings className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Internal Details</h3>
                                    <p className="text-xs text-gray-600">For internal use only</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Internal Description
                                    </label>
                                    <textarea
                                        name="internal_description"
                                        rows={4}
                                        value={formData.internal_description}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white/70 focus:outline-none focus:ring-0 focus:border-purple-500 transition-all duration-200"
                                        placeholder="Enter internal notes or description"
                                    />
                                    <p className="mt-1 text-sm text-gray-500">
                                        This description is for internal use only and will not be visible to external users.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Configuration */}
                        <div className="backdrop-blur-xl bg-white/90 rounded-3xl p-6 shadow-xl border border-white/20">
                            <div className="flex items-center mb-4">
                                <div className="p-2 bg-green-100 rounded-xl mr-3">
                                    <Users className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Configuration</h3>
                                    <p className="text-xs text-gray-600">Campaign settings</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Slot Number *
                                    </label>
                                    <input
                                        type="number"
                                        name="slot_total"
                                        min="1"
                                        value={formData.slot_total}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${errors.slot_total
                                            ? 'border-red-300 bg-red-50 focus:border-red-500'
                                            : 'border-gray-200 bg-white/70 focus:border-green-500'
                                            }`}
                                        placeholder="Enter total number of slots"
                                    />
                                    {errors.slot_total && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center">
                                            <AlertCircle className="h-4 w-4 mr-1" />
                                            {errors.slot_total}
                                        </p>
                                    )}
                                    <p className="mt-1 text-sm text-gray-500">
                                        Total number of slots available for this campaign.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Base Amount (RM)
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 sm:text-sm">RM</span>
                                        </div>
                                        <input
                                            type="number"
                                            name="base_amount"
                                            min="0"
                                            step="0.01"
                                            value={formData.base_amount}
                                            onChange={handleInputChange}
                                            className={`w-full pl-10 pr-3 py-2 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${errors.base_amount
                                                ? 'border-red-300 bg-red-50 focus:border-red-500'
                                                : 'border-gray-200 bg-white/70 focus:border-green-500'
                                                }`}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    {errors.base_amount && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center">
                                            <AlertCircle className="h-4 w-4 mr-1" />
                                            {errors.base_amount}
                                        </p>
                                    )}
                                    <p className="mt-1 text-sm text-gray-500">
                                        Base amount for this campaign in Malaysian Ringgit (optional).
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Booking Amount (RM)
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 sm:text-sm">RM</span>
                                        </div>
                                        <input
                                            type="number"
                                            name="booking_amount"
                                            min="0"
                                            step="0.01"
                                            value={formData.booking_amount}
                                            onChange={handleInputChange}
                                            className={`w-full pl-10 pr-3 py-2 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${errors.booking_amount
                                                ? 'border-red-300 bg-red-50 focus:border-red-500'
                                                : 'border-gray-200 bg-white/70 focus:border-green-500'
                                                }`}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    {errors.booking_amount && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center">
                                            <AlertCircle className="h-4 w-4 mr-1" />
                                            {errors.booking_amount}
                                        </p>
                                    )}
                                    <p className="mt-1 text-sm text-gray-500">
                                        Booking amount for this campaign in Malaysian Ringgit (optional).
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}