import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    Link,
    Edit3,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import {
    createCampaign,
    orderIndex,
    uploadCampaignThumbnailVideo,
    uploadCampaignLayoutTypeRentalProjection,
    uploadCampaignLayoutTypeRenderings,
} from '../../services/api';
import { Order, CampaignPackage } from '../../types';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

export default function AddCampaign() {
    const navigate = useNavigate();
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

    const [orderSearch, setOrderSearch] = useState<string>('');
    const [orderOptions, setOrderOptions] = useState<Order[]>([]);
    const [orderLoading, setOrderLoading] = useState<boolean>(false);
    const [activePackageOrderIndex, setActivePackageOrderIndex] = useState<number | null>(null);
    const [selectedPackageOrderTemplates, setSelectedPackageOrderTemplates] = useState<Record<string, Order | null>>({});

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [packages, setPackages] = useState<CampaignPackage[]>([]);
    const [packageErrors, setPackageErrors] = useState<Record<string, Record<string, string>>>({});
    const [campaignMode, setCampaignMode] = useState<'single' | 'packages'>('single');
    const [packageValueSources, setPackageValueSources] = useState<Record<string, {
        slot_total: 'fixed' | 'custom';
        base_amount: 'fixed' | 'custom';
        booking_amount: 'fixed' | 'custom';
    }>>({});
    const [collapsedPackages, setCollapsedPackages] = useState<Record<number, boolean>>({});
    const [useLayoutTypes, setUseLayoutTypes] = useState<boolean>(false);
    const [layoutTypes, setLayoutTypes] = useState<{ id?: number | string; name: string; description?: string }[]>([]);
    const [packageLayoutIndex, setPackageLayoutIndex] = useState<Record<number, number>>({});
    const [layoutProjectionFile, setLayoutProjectionFile] = useState<Record<number, File>>({});
    const [layoutRenderingFiles, setLayoutRenderingFiles] = useState<Record<number, File[]>>({});
    const [layoutError, setLayoutError] = useState<string | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoError, setVideoError] = useState<string | null>(null);

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

    // Template Order search (simple debounce)
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
        // Campaign-level linkage is deprecated; attach to a package instead.
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

    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setVideoError(null);
        if (file.size > 50 * 1024 * 1024) {
            setVideoError('Video must be 50MB or smaller.');
            return;
        }
        setVideoFile(file);
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

    const removePackage = (index: number) => {
        setPackages(prev => prev.filter((_, i) => i !== index));
        // Clear errors for removed package
        setPackageErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[index.toString()];
            return newErrors;
        });
        // Clear value sources for removed package
        setPackageValueSources(prev => {
            const newSources = { ...prev };
            delete newSources[index.toString()];
            return newSources;
        });
        // Clear collapsed state for removed package
        setCollapsedPackages(prev => {
            const newCollapsed = { ...prev };
            delete newCollapsed[index];
            return newCollapsed;
        });
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

    // Layout Type management functions
    const addLayoutType = () => {
        setLayoutTypes(prev => [...prev, { name: '', description: '' }]);
    };

    const updateLayoutType = (idx: number, field: 'name' | 'description', value: string) => {
        setLayoutTypes(prev => prev.map((lt, i) => (i === idx ? { ...lt, [field]: value } : lt)));
    };

    const removeLayoutType = (idx: number) => {
        // remove the layout's sub-packages, then the layout; reindex packageLayoutIndex
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
        setLayoutProjectionFile(prev => { const n = { ...prev }; delete n[idx]; return n; });
        setLayoutRenderingFiles(prev => { const n = { ...prev }; delete n[idx]; return n; });
    };

    const addSubPackage = (layoutIdx: number) => {
        const newPkgIndex = packages.length;
        addPackage();
        setPackageLayoutIndex(prev => ({ ...prev, [newPkgIndex]: layoutIdx }));
    };

    const handleLayoutProjectionChange = (layoutIdx: number, file: File | null) => {
        setLayoutError(null);
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { setLayoutError('Image must be 10MB or smaller.'); return; }
        setLayoutProjectionFile(prev => ({ ...prev, [layoutIdx]: file }));
    };

    const handleLayoutRenderingsChange = (layoutIdx: number, files: FileList | null) => {
        setLayoutError(null);
        if (!files || !files.length) return;
        const arr = Array.from(files);
        if (arr.some(f => f.size > 10 * 1024 * 1024)) { setLayoutError('Each image must be 10MB or smaller.'); return; }
        setLayoutRenderingFiles(prev => ({ ...prev, [layoutIdx]: [...(prev[layoutIdx] || []), ...arr] }));
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

        // order_id is optional; no validation required.

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

                // If either date is filled, both are required
                if (pkg.start_date || pkg.end_date) {
                    if (!pkg.start_date) {
                        packageError.start_date = 'Start Date is required when End Date is provided';
                    }
                    if (!pkg.end_date) {
                        packageError.end_date = 'End Date is required when Start Date is provided';
                    }
                }

                // If both dates are provided, validate the date range
                if (pkg.start_date && pkg.end_date && pkg.start_date >= pkg.end_date) {
                    packageError.end_date = 'End Date must be after Start Date';
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

            // Process packages with proper values based on source
            const processedPackages = campaignMode === 'packages'
                ? packages.map((pkg, index) => {
                    const valueSource = packageValueSources[index.toString()];
                    const processed: CampaignPackage = {
                        ...pkg,
                        slot_total: valueSource?.slot_total === 'fixed' ? formData.slot_total : pkg.slot_total,
                        base_amount: valueSource?.base_amount === 'fixed' ? formData.base_amount : pkg.base_amount,
                        booking_amount: valueSource?.booking_amount === 'fixed' ? formData.booking_amount : pkg.booking_amount,
                    };

                    // Normalise order_id: backend accepts null/omitted, but not the string "null"
                    if (processed.order_id === 'null' || processed.order_id === '' || processed.order_id == null) {
                        delete (processed as any).order_id;
                    }

                    // Thread the layout assignment (0-based index into submitted layout_types)
                    if (useLayoutTypes) {
                        const layoutIdx = packageLayoutIndex[index];
                        if (layoutIdx !== undefined) {
                            processed.layout_type_index = layoutIdx;
                        }
                    }

                    return processed;
                })
                : undefined;

            const campaignData = {
                ...formData,
                packages: campaignMode === 'packages' ? processedPackages : undefined,
                // Nested layout types (only when the toggle is on)
                layout_types: (campaignMode === 'packages' && useLayoutTypes)
                    ? layoutTypes.map((lt, i) => ({ name: lt.name, description: lt.description ?? '', sort: i }))
                    : undefined,
                // Package-level template linkage only
                order_id: undefined as string | undefined,
                status: 'draft' // Default status for new campaigns
            };

            const created = await createCampaign(campaignData);
            const newCampaignId = created?.data?.id;
            if (videoFile && newCampaignId) {
                try {
                    await uploadCampaignThumbnailVideo(newCampaignId, videoFile);
                } catch (videoErr) {
                    console.error('Thumbnail video upload failed:', videoErr);
                    setError('Campaign created, but the video upload failed — add it later from Edit.');
                }
            } else if (videoFile && !newCampaignId) {
                setError('Campaign created, but the video could not be uploaded — add it later from Edit.');
            }

            if (useLayoutTypes && created?.data?.layout_types?.length) {
                try {
                    for (let i = 0; i < created.data.layout_types.length; i++) {
                        const layoutId = created.data.layout_types[i]?.id;
                        if (!layoutId) continue;
                        if (layoutProjectionFile[i]) {
                            await uploadCampaignLayoutTypeRentalProjection(layoutId, layoutProjectionFile[i]);
                        }
                        if (layoutRenderingFiles[i]?.length) {
                            await uploadCampaignLayoutTypeRenderings(layoutId, layoutRenderingFiles[i]);
                        }
                    }
                } catch (imgErr) {
                    console.error('Layout image upload failed:', imgErr);
                    setError('Campaign created, but some layout images failed to upload — add them from Edit.');
                }
            }

            // Navigate back to campaigns list
            navigate(`${LOCAL_PATH_PREFIX}campaigns`);
        } catch (err) {
            console.error('Error creating campaign:', err);
            setError('Failed to create campaign. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBackClick = () => {
        navigate(`${LOCAL_PATH_PREFIX}campaigns`);
    };

    // Reusable per-package card (used by the flat list and inside each layout section)
    const renderPackageCard = (pkg: CampaignPackage, index: number) => (
        <div key={index} className="border border-gray-200 rounded-xl bg-white/50 overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-gray-50/50 border-b border-gray-200">
                <div className="flex items-center gap-3">
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

                        {/* Start Date */}
                        {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date
                    </label>
                    <div className="relative">
                        <input
                            type="date"
                            value={pkg.start_date || ''}
                            onChange={(e) => updatePackage(index, 'start_date', e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${packageErrors[index.toString()]?.start_date
                                ? 'border-red-300 bg-red-50 focus:border-red-500'
                                : 'border-gray-200 bg-white/70 focus:border-blue-500'
                                }`}
                            disabled={campaignMode !== 'packages'}
                        />
                        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                    {packageErrors[index.toString()]?.start_date && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {packageErrors[index.toString()].start_date}
                        </p>
                    )}
                </div> */}

                        {/* End Date */}
                        {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date
                    </label>
                    <div className="relative">
                        <input
                            type="date"
                            value={pkg.end_date || ''}
                            onChange={(e) => updatePackage(index, 'end_date', e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${packageErrors[index.toString()]?.end_date
                                ? 'border-red-300 bg-red-50 focus:border-red-500'
                                : 'border-gray-200 bg-white/70 focus:border-blue-500'
                                }`}
                            disabled={campaignMode !== 'packages'}
                        />
                        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                    {packageErrors[index.toString()]?.end_date && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {packageErrors[index.toString()].end_date}
                        </p>
                    )}
                </div> */}
                    </div>
                </div>
            )}
        </div>
    );

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
                                <h1 className="text-2xl font-bold text-gray-900">Add New Campaign</h1>
                                <p className="text-sm text-gray-600">Create a new marketing campaign</p>
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
                                {isSubmitting ? 'Creating...' : 'Create Campaign'}
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
                        {/* Campaign Details */}
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

                            {errors.packages && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <AlertCircle className="h-5 w-5 text-red-400" />
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-red-800">Validation Error</h3>
                                            <div className="mt-2 text-sm text-red-700">
                                                <p>{errors.packages}</p>
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
                                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-gray-400 transition-colors duration-200">
                                        <div className="space-y-1 text-center">
                                            <div className="flex text-sm text-gray-600 justify-center">
                                                <label htmlFor="thumbnail-video-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                                                    <span>Upload a video</span>
                                                    <input
                                                        id="thumbnail-video-upload"
                                                        name="thumbnail_video"
                                                        type="file"
                                                        accept="video/mp4,video/webm,video/quicktime"
                                                        onChange={handleVideoChange}
                                                        className="sr-only"
                                                    />
                                                </label>
                                            </div>
                                            <p className="text-xs text-gray-500">MP4, WebM, MOV up to 50MB · uploaded after the campaign is created</p>
                                        </div>
                                    </div>
                                    {videoFile && (
                                        <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
                                            <span>{videoFile.name}</span>
                                            <button type="button" onClick={() => setVideoFile(null)} className="text-red-600 hover:text-red-800 font-medium">Remove</button>
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

                        {/* Campaign Packages */}
                        <div className="backdrop-blur-xl bg-white/90 rounded-3xl p-8 shadow-xl border border-white/20">
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
                                        layoutTypes.map((lt, layoutIdx) => (
                                            <div key={layoutIdx} className="border-2 border-indigo-200 rounded-2xl bg-indigo-50/30 p-5 space-y-5">
                                                <div className="flex items-start justify-between gap-4">
                                                    <h3 className="text-base font-semibold text-gray-900">
                                                        Layout Type {layoutIdx + 1}
                                                        {lt.name && (
                                                            <span className="ml-2 text-sm font-normal text-gray-600">- {lt.name}</span>
                                                        )}
                                                    </h3>
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

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Layout Name *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={lt.name}
                                                            onChange={(e) => updateLayoutType(layoutIdx, 'name', e.target.value)}
                                                            className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-white/70 focus:outline-none focus:ring-0 focus:border-indigo-500 transition-all duration-200"
                                                            placeholder="e.g. Type A"
                                                        />
                                                    </div>
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
                                                </div>

                                                {/* Rental Projection (single image) */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Rental Projection (single image)
                                                    </label>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleLayoutProjectionChange(layoutIdx, e.target.files?.[0] ?? null)}
                                                        className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200"
                                                    />
                                                    {layoutProjectionFile[layoutIdx] && (
                                                        <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
                                                            <span>{layoutProjectionFile[layoutIdx].name}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => setLayoutProjectionFile(prev => { const n = { ...prev }; delete n[layoutIdx]; return n; })}
                                                                className="text-red-600 hover:text-red-800 font-medium"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
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
                                                        onChange={(e) => handleLayoutRenderingsChange(layoutIdx, e.target.files)}
                                                        className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200"
                                                    />
                                                    {layoutRenderingFiles[layoutIdx]?.length > 0 && (
                                                        <ul className="mt-2 space-y-1">
                                                            {layoutRenderingFiles[layoutIdx].map((f, fIdx) => (
                                                                <li key={fIdx} className="flex items-center justify-between text-sm text-gray-600">
                                                                    <span>{f.name}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setLayoutRenderingFiles(prev => ({
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
                                                    {packages
                                                        .map((pkg, index) => ({ pkg, index }))
                                                        .filter(({ index }) => packageLayoutIndex[index] === layoutIdx)
                                                        .map(({ pkg, index }) => renderPackageCard(pkg, index))}
                                                </div>

                                                <p className="text-xs text-gray-500">
                                                    MP4/PNG/JPG up to 10MB · images upload after the campaign is created
                                                </p>
                                            </div>
                                        ))
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
                                <div className="space-y-6">
                                    {packages.map((pkg, index) => renderPackageCard(pkg, index))}
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Right Sidebar - Settings and Configuration */}
                    <div className="xl:col-span-4 space-y-6">
                        {/* Campaign Mode Toggle */}
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
