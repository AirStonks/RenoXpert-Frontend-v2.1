import ClipboardJS from "clipboard";
import { useEffect, useState, useRef, useCallback } from "react";
import { Inventory } from "../../types";
import { inventoryIndex } from "../../services/api";
import Loading from "../../components/Loading";
import { Link, useNavigate } from "react-router-dom";
import { DEBOUNCE_DELAY, INVENTORY_STATUS } from "../../constants/inventory";
import { logError } from "../../utils/errorHandling";
import { 
    Plus, 
    Package, 
    CheckCircle2, 
    AlertOctagon, 
    Banknote, 
    TrendingUp,
    Search,
    SlidersHorizontal,
    AlertCircle,
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    SearchX
} from "lucide-react";

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

function InventoryMain() {
    const navigate = useNavigate();
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
    const filterDropdownRef = useRef<HTMLDivElement>(null);
    const filterButtonRef = useRef<HTMLButtonElement>(null);

    const [inventories, setInventories] = useState<Inventory[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(1);
    const [size, setSize] = useState<number>(10);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterType, setFilterType] = useState<string>('');
    const [selectedStatusFilters, setSelectedStatusFilters] = useState<string[]>([]);
    const [selectedTypeFilters, setSelectedTypeFilters] = useState<string[]>([]);
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

    useEffect(() => {
        document.title = "Inventory | RenoXpert";
        initInventoryTable(page, size, searchTerm, { status: filterStatus, type: filterType });

        const clipboard = new ClipboardJS('.copy-link');
        clipboard.on('success', function (e) {
            e.clearSelection();
        });
        return () => {
            clipboard.destroy();
        };
    }, [page, size]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                filterDropdownRef.current &&
                filterButtonRef.current &&
                !filterDropdownRef.current.contains(event.target as Node) &&
                !filterButtonRef.current.contains(event.target as Node)
            ) {
                setIsFilterDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const initInventoryTable = async (
        page: number, 
        size: number, 
        searchTerm?: string, 
        filters?: { status?: string; type?: string }
    ) => {
        try {
            setIsLoading(true);
            const filterParams: { [key: string]: string } = {};
            if (filters?.status) filterParams.status = filters.status;
            if (filters?.type) filterParams.type = filters.type;
            
            const response = await inventoryIndex(size, page, searchTerm, undefined, undefined, filterParams);
            const data = response?.data || [];
            setInventories(data);
            setTotalItems(response?.totalCount || 0);
            setError(null);
        } catch (error) {
            logError('fetching inventories', error);
            setError('Failed to load inventories');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefreshTable = useCallback(() => {
        initInventoryTable(page, size, searchTerm, { status: filterStatus, type: filterType });
    }, [page, size, searchTerm, filterStatus, filterType]);

    const handleSearch = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchTerm(value);

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(() => {
            setPage(1);
            initInventoryTable(1, size, value, { status: filterStatus, type: filterType });
        }, DEBOUNCE_DELAY);
    }, [size, filterStatus, filterType]);

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > Math.ceil(totalItems / size)) return;
        setPage(newPage);
    };

    const handleSizeChange = useCallback((newSize: number) => {
        setSize(newSize);
        setPage(1);
        initInventoryTable(1, newSize, searchTerm, { status: filterStatus, type: filterType });
    }, [searchTerm, filterStatus, filterType]);

    const handleFilterStatusChange = useCallback((status: string) => {
        setSelectedStatusFilters(prev => {
            const newFilters = prev.includes(status)
                ? prev.filter(s => s !== status)
                : [...prev, status];
            
            setFilterStatus(newFilters.join(','));
            setPage(1);
            initInventoryTable(1, size, searchTerm, { status: newFilters.join(','), type: selectedTypeFilters.join(',') });
            return newFilters;
        });
    }, [size, searchTerm, selectedTypeFilters]);

    const handleFilterTypeChange = useCallback((type: string) => {
        setSelectedTypeFilters(prev => {
            const newFilters = prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type];
            
            setFilterType(newFilters.join(','));
            setPage(1);
            initInventoryTable(1, size, searchTerm, { status: selectedStatusFilters.join(','), type: newFilters.join(',') });
            return newFilters;
        });
    }, [size, searchTerm, selectedStatusFilters]);

    const handleResetFilters = () => {
        setSelectedStatusFilters([]);
        setSelectedTypeFilters([]);
        setFilterStatus('');
        setFilterType('');
        setSearchTerm('');
        setPage(1);
        initInventoryTable(1, size, '', {});
    };

    const totalPages = Math.ceil(totalItems / size);
    const activeFilterCount = selectedStatusFilters.length + selectedTypeFilters.length;

    // Calculate KPI values
    const totalInStock = inventories.reduce((acc, inv) => acc + (inv.total_balance || 0), 0);
    const lowStockCount = inventories.filter(inv => (inv.total_balance || 0) <= (inv.alert_level || 0)).length;
    const criticalItemsCount = inventories.filter(inv => inv.stock_health === 'critical').length;

    return (
        <>
            {isLoading && <Loading />}

            <div className="max-w-[1400px] mx-auto min-h-screen flex flex-col bg-slate-50">
                {/* Sticky Glass Header */}
                <header className="glass-header sticky top-0 z-50 px-8 py-5 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Inventory</h1>
                        <p className="text-sm font-medium text-slate-500 mt-0.5">Global warehouse overview</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg text-sm hover:bg-slate-50 transition-colors shadow-sm">
                            Export
                        </button>
                        <Link to={LOCAL_PATH_PREFIX + 'inventory/create'} className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-colors flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Add Item
                        </Link>
                    </div>
                </header>

                <main className="flex-1 px-8 py-8 space-y-8">
                    {/* KPI Cards */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-100 overflow-hidden">
                        {/* KPI 1: Total Items */}
                        <div className="p-6 group relative overflow-hidden">
                            <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-50 transition-opacity"></div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Items</span>
                                    <div className="p-2 bg-blue-100/50 text-blue-600 rounded-lg"><Package className="w-5 h-5" /></div>
                                </div>
                                <div className="flex items-baseline gap-3">
                                    <span className="text-3xl font-extrabold font-display text-slate-900">{totalItems.toLocaleString()}</span>
                                    <span className="text-xs font-bold text-blue-700 bg-blue-100/50 px-2 py-0.5 rounded-full flex items-center gap-1"><TrendingUp className="w-3 h-3" /> 12%</span>
                                </div>
                            </div>
                        </div>
                        {/* KPI 2: In Stock */}
                        <div className="p-6 group relative overflow-hidden">
                            <div className="absolute inset-0 bg-emerald-50 opacity-0 group-hover:opacity-50 transition-opacity"></div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">In Stock</span>
                                    <div className="p-2 bg-emerald-100/50 text-emerald-600 rounded-lg"><CheckCircle2 className="w-5 h-5" /></div>
                                </div>
                                <div className="flex items-baseline gap-3">
                                    <span className="text-3xl font-extrabold font-display text-slate-900">{totalInStock.toLocaleString()}</span>
                                    <span className="text-xs font-bold text-emerald-700">{totalItems > 0 ? Math.round((totalInStock / totalItems) * 100) : 0}% capacity</span>
                                </div>
                            </div>
                        </div>
                        {/* KPI 3: Low Stock */}
                        <div className="p-6 group relative overflow-hidden">
                            <div className="absolute inset-0 bg-rose-50 opacity-0 group-hover:opacity-50 transition-opacity"></div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Low Stock</span>
                                    <div className="p-2 bg-rose-100/50 text-rose-600 rounded-lg"><AlertOctagon className="w-5 h-5" /></div>
                                </div>
                                <div className="flex items-baseline gap-3">
                                    <span className="text-3xl font-extrabold font-display text-slate-900">{lowStockCount}</span>
                                    <span className="text-xs font-bold text-rose-700 bg-rose-100/50 px-2 py-0.5 rounded-full animate-pulse">Action Req.</span>
                                </div>
                            </div>
                        </div>
                        {/* KPI 4: Critical Items */}
                        <div className="p-6 group relative overflow-hidden border-l border-red-200">
                            <div className="absolute inset-0 bg-red-50 opacity-0 group-hover:opacity-50 transition-opacity"></div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Critical Items</span>
                                    <div className="p-2 bg-red-100/50 text-red-600 rounded-lg"><AlertTriangle className="w-5 h-5" /></div>
                                </div>
                                <div className="flex items-baseline gap-3">
                                    <span className="text-3xl font-extrabold font-display text-slate-900">{criticalItemsCount}</span>
                                    <span className="text-xs font-bold text-red-700 bg-red-100/50 px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Urgent</span>
                                </div>
                            </div>
                        </div>
                        {/* KPI 5: Total Value */}
                        <div className="p-6 group relative overflow-hidden">
                            <div className="absolute inset-0 bg-violet-50 opacity-0 group-hover:opacity-50 transition-opacity"></div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Value</span>
                                    <div className="p-2 bg-violet-100/50 text-violet-600 rounded-lg"><Banknote className="w-5 h-5" /></div>
                                </div>
                                <div className="flex items-baseline gap-3">
                                    <span className="text-3xl font-extrabold font-display text-slate-900">RM 0</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Unified Table Surface */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-visible">
                        {/* Toolbar */}
                        <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-white rounded-t-2xl relative z-20">
                            <div className="flex items-center gap-2">
                                <h2 className="font-display font-bold text-slate-800">Overview</h2>
                                <span id="totalCount" className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full font-bold">{totalItems} Items</span>
                            </div>
                            
                            <div className="flex w-full md:w-auto gap-3">
                                {/* Search Input */}
                                <div className="relative group w-full md:w-72">
                                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                    <input
                                        type="text"
                                        id="searchInput"
                                        placeholder="Search items..."
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-transparent rounded-lg text-sm font-medium focus:bg-white focus:border-indigo-200 focus:ring-2 focus:ring-indigo-50 outline-none transition-all"
                                        value={searchTerm}
                                        onChange={handleSearch}
                                    />
                                </div>
                                
                                {/* Filter Dropdown */}
                                <div className="relative">
                                    <button
                                        ref={filterButtonRef}
                                        onClick={() => setIsFilterDropdownOpen(prev => !prev)}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-sm ${
                                            activeFilterCount > 0
                                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:border-indigo-300'
                                                : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
                                        }`}
                                    >
                                        <SlidersHorizontal className="w-4 h-4" /> 
                                        <span id="filterBtnText">Filter {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
                                    </button>

                                    {isFilterDropdownOpen && (
                                        <div ref={filterDropdownRef} className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 p-5 z-50 dropdown-enter">
                                            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-50">
                                                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Filters</span>
                                                <button onClick={handleResetFilters} className="text-xs text-indigo-600 font-bold hover:text-indigo-800 hover:underline">Reset All</button>
                                            </div>

                                            {/* Status Filter */}
                                            <div className="mb-5">
                                                <p className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wide">Status</p>
                                                <div className="space-y-3">
                                                    <label className="flex items-center gap-3 cursor-pointer group p-1 hover:bg-slate-50 rounded-lg transition-colors -ml-1">
                                                        <input
                                                            type="checkbox"
                                                            name="status"
                                                            value={INVENTORY_STATUS.ACTIVE}
                                                            className="custom-checkbox"
                                                            checked={selectedStatusFilters.includes(INVENTORY_STATUS.ACTIVE)}
                                                            onChange={() => handleFilterStatusChange(INVENTORY_STATUS.ACTIVE)}
                                                        />
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                                            <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">Active</span>
                                                        </div>
                                                    </label>
                                                    <label className="flex items-center gap-3 cursor-pointer group p-1 hover:bg-slate-50 rounded-lg transition-colors -ml-1">
                                                        <input
                                                            type="checkbox"
                                                            name="status"
                                                            value={INVENTORY_STATUS.INACTIVE}
                                                            className="custom-checkbox"
                                                            checked={selectedStatusFilters.includes(INVENTORY_STATUS.INACTIVE)}
                                                            onChange={() => handleFilterStatusChange(INVENTORY_STATUS.INACTIVE)}
                                                        />
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                                                            <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">Inactive</span>
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Category Filter */}
                                            <div className="mb-2">
                                                <p className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wide">Category</p>
                                                <div className="space-y-3">
                                                    {['renovation', 'carpentry', 'furniture', 'electrical_appliances', 'iot', 'project_management', 'loose_items', 'roundup'].map(type => (
                                                        <label key={type} className="flex items-center gap-3 cursor-pointer group p-1 hover:bg-slate-50 rounded-lg transition-colors -ml-1">
                                                            <input
                                                                type="checkbox"
                                                                name="category"
                                                                value={type}
                                                                className="custom-checkbox"
                                                                checked={selectedTypeFilters.includes(type)}
                                                                onChange={() => handleFilterTypeChange(type)}
                                                            />
                                                            <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 capitalize">{type.replace(/_/g, ' ')}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto relative z-10">
                            <table className="w-full text-left border-collapse font-inter" id="inventoryTable">
                                <thead className="bg-slate-50/80 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Item Name</th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Type</th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Zone</th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Var</th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Balance</th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {inventories.length > 0 ? (
                                        inventories
                                            .filter((inventory) => inventory != null)
                                            .map((inventory, invIndex) => {
                                                const itemName = inventory.product?.name || inventory.name || 'N/A';
                                                const itemDisplayName = itemName.length > 50 ? itemName.substring(0, 50) + '...' : itemName;
                                                const isAlert = (inventory.total_balance || 0) <= (inventory.alert_level || 0);
                                                const isCritical = inventory.stock_health === 'critical';

                                                return (
                                                    <tr
                                                        key={invIndex}
                                                        className={`group transition-colors cursor-pointer ${
                                                            isCritical 
                                                                ? 'bg-red-100 border-l-4 border-red-500 hover:bg-red-200' 
                                                                : isAlert 
                                                                    ? 'table-row-alert bg-rose-50/30' 
                                                                    : 'table-row-hover'
                                                        }`}
                                                        onClick={() => navigate(LOCAL_PATH_PREFIX + `inventory/${inventory.id}`)}
                                                    >
                                                        <td className="px-6 py-4">
                                                            <div className={`font-bold flex items-center gap-2 ${
                                                                isCritical ? 'text-slate-900' : 'text-slate-900'
                                                            }`}>
                                                                {isCritical && <AlertTriangle className="w-4 h-4 text-red-600 fill-red-100" />}
                                                                {!isCritical && isAlert && <AlertCircle className="w-4 h-4 text-rose-500 fill-rose-100" />}
                                                                <span className="hover:text-indigo-600 transition-colors">{itemDisplayName}</span>
                                                            </div>
                                                            {(inventory.sku || inventory.product?.SKU) && (
                                                                <span className={`text-xs block mt-0.5 ${
                                                                    isCritical ? 'text-slate-600' : 'text-slate-500'
                                                                }`}>
                                                                    SKU: {inventory.sku || inventory.product?.SKU}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-medium text-slate-500 capitalize">{inventory.type?.replace(/_/g, ' ') || '-'}</td>
                                                        <td className="px-6 py-4">
                                                            {inventory.zone ? (
                                                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded ${
                                                                    isCritical 
                                                                        ? 'bg-white border border-red-200 text-red-600' 
                                                                        : isAlert 
                                                                            ? 'bg-white border border-rose-100 text-rose-600' 
                                                                            : 'bg-slate-100 text-xs font-bold text-slate-600'
                                                                }`}>
                                                                    {inventory.zone}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-300 text-xl font-light">-</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2 justify-center">
                                                                <span className={`w-2 h-2 rounded-full ${
                                                                    inventory.status === INVENTORY_STATUS.ACTIVE ? 'bg-emerald-500 pulse-dot-emerald' :
                                                                    'bg-slate-300'
                                                                }`}></span>
                                                                <span className={`text-sm font-bold ${
                                                                    inventory.status === INVENTORY_STATUS.ACTIVE ? 'text-slate-700' :
                                                                    'text-slate-500'
                                                                }`}>
                                                                    {inventory.status === INVENTORY_STATUS.ACTIVE ? 'Active' : 'Inactive'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-medium text-slate-500 text-center">{inventory.variants ? inventory.variants.length : 0}</td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className={`font-extrabold font-display ${isCritical ? 'text-red-600' : isAlert ? 'text-rose-600' : 'text-slate-900'}`}>
                                                                {inventory.total_balance !== undefined && inventory.total_balance !== null ? inventory.total_balance : '-'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <Link
                                                                to={LOCAL_PATH_PREFIX + `inventory/edit/${inventory.id}`}
                                                                className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                Edit
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                    ) : error ? (
                                        <tr>
                                            <td colSpan={7} className="p-12 text-center">
                                                <div className="inline-flex p-4 rounded-full bg-red-50 text-red-400 mb-3"><AlertCircle className="w-8 h-8" /></div>
                                                <h3 className="text-sm font-bold text-red-900">Error loading inventories</h3>
                                                <p className="text-xs text-red-500 mt-1">{error}</p>
                                                <button
                                                    onClick={handleRefreshTable}
                                                    className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                                                >
                                                    Retry
                                                </button>
                                            </td>
                                        </tr>
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="p-12 text-center">
                                                <div className="inline-flex p-4 rounded-full bg-slate-50 text-slate-400 mb-3"><SearchX className="w-8 h-8" /></div>
                                                <h3 className="text-sm font-bold text-slate-900">No items found</h3>
                                                <p className="text-xs text-slate-500 mt-1">Try adjusting your filters</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-6 py-4 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-3 text-slate-600 text-sm font-medium">
                            <div className="flex items-center gap-2">
                                Show
                                <select
                                    className="select select-sm w-16 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:bg-white focus:border-indigo-200 focus:ring-2 focus:ring-indigo-50 outline-none transition-all"
                                    name="perpage"
                                    value={size}
                                    onChange={(e) => handleSizeChange(parseInt(e.target.value))}
                                >
                                    <option value="5">5</option>
                                    <option value="10">10</option>
                                    <option value="20">20</option>
                                    <option value="30">30</option>
                                    <option value="50">50</option>
                                </select>
                                per page
                            </div>
                            <div className="flex items-center gap-4">
                                <span>{(page - 1) * size + 1}-{Math.min(page * size, totalItems)} of {totalItems}</span>
                                <div className="flex gap-1">
                                    {/* Previous Page Button */}
                                    <button
                                        className={`btn btn-sm px-3 py-1 rounded-lg ${page === 1 ? 'opacity-50 cursor-not-allowed' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                        onClick={() => handlePageChange(page - 1)}
                                        disabled={page === 1}
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                    </button>

                                    {/* Page Number Buttons with Ellipses */}
                                    {totalPages > 0 && (
                                        <>
                                            {page > 3 && (
                                                <>
                                                    <button
                                                        className="btn btn-sm px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                                                        onClick={() => handlePageChange(1)}
                                                    >
                                                        1
                                                    </button>
                                                    <span className="px-3 py-1 text-slate-400">...</span>
                                                </>
                                            )}

                                            {Array.from({
                                                length: Math.min(3, totalPages)
                                            }, (_, index) => {
                                                const startPage = Math.max(1, Math.min(page - 1, totalPages - 2));
                                                const currentPage = startPage + index;
                                                return (
                                                    <button
                                                        key={currentPage}
                                                        className={`btn btn-sm px-3 py-1 rounded-lg ${page === currentPage ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                                        onClick={() => handlePageChange(currentPage)}
                                                    >
                                                        {currentPage}
                                                    </button>
                                                );
                                            })}

                                            {page < totalPages - 2 && (
                                                <>
                                                    <span className="px-3 py-1 text-slate-400">...</span>
                                                    <button
                                                        className="btn btn-sm px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                                                        onClick={() => handlePageChange(totalPages)}
                                                    >
                                                        {totalPages}
                                                    </button>
                                                </>
                                            )}
                                        </>
                                    )}

                                    {/* Next Page Button */}
                                    <button
                                        className={`btn btn-sm px-3 py-1 rounded-lg ${page === totalPages ? 'opacity-50 cursor-not-allowed' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                        onClick={() => handlePageChange(page + 1)}
                                        disabled={page === totalPages}
                                    >
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    )
}

export default InventoryMain;
