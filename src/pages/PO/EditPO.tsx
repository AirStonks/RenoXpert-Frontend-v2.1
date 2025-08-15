import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Package, POPackage, Product, PurchaseOrder, Sale, User } from "../../types";
import { KTDropdown } from '../../metronic/core/components/dropdown/dropdown';
import { fetchPO, fetchSale, fetchSales, fetchUsers, updatePurchaseOrder } from "../../services/api";
import { Slide, toast } from "react-toastify";
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { SortablePOPackage } from "./components/SortablePOPackage";
import Loading from "../../components/Loading";
import {
    ArrowLeft,
    FileText,
    User as UserIcon,
    Building2,
    Package as PackageIcon,
    Search,
    X,
    Plus,
    Save,
    Home,
    Bed,
    Bath,
    Layers
} from "lucide-react";
import { POPackageSelector } from "../RenoSales/components/po-package-selector";
import { POProductModal } from "../RenoSales/components/po-product-selector";

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

function EditPO() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const poId = id ? parseInt(id, 10) : null;
    const location = useLocation();
    const { state } = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const saleId = queryParams.get('saleId');

    const inputOrderRef = useRef(null);
    const inputVendorRef = useRef(null);
    const [searchSaleTerm, setSearchSaleTerm] = useState('');
    const [searchVendorTerm, setSearchVendorTerm] = useState('');

    const [sales, setSales] = useState<Sale[]>([]);
    const [vendors, setVendors] = useState<User[]>([]);
    const [poDetail, setPoDetail] = useState<PurchaseOrder | null>(null);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [selectedVendor, setSelectedVendor] = useState<User | null>(null);
    const [totalAmount, setTotalAmount] = useState<number>(0);

    const [selectedPOPackages, setSelectedPOPackages] = useState<POPackage[]>([]);

    const [openAccordions, setOpenAccordions] = useState<{ [key: number]: boolean }>({});
    const [isLoading, setIsLoading] = useState(false);

    // New state variables for POPackageSelector and POProductModal
    const [isPackageSelectorOpen, setIsPackageSelectorOpen] = useState(false);
    const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);
    const [activePackageId, setActivePackageId] = useState<number | null>(null);

    const handleBackClick = () => {
        if (state) {
            navigate(state.fromUrl);
        } else {
            navigate(LOCAL_PATH_PREFIX + 'purchase-orders/' + poId);
        }
    };

    const notify = (type: 'success' | 'error', message: string) => {
        (toast[type] as (message: string, options?: object) => void)(message, {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: localStorage.getItem('theme'),
            transition: Slide,
        });
    };

    useEffect(() => {
        document.title = "Edit Purchase Orders | RenoXpert";
        // Get the order
        initDropdown();
        fetchPurchaseOrderData();

        if (saleId) {
            handleSelectSale(null, saleId);
        }

    }, [saleId]);

    // Recalculate whenever selectedPOPackages changes
    useEffect(() => {
        if (selectedPOPackages.length > 0) {
            recalculateTotalAmount();
        } else {
            setTotalAmount(0);
        }
    }, [selectedPOPackages]);

    const handleOpenProductModal = (packageId: string) => {
        setActivePackageId(Number(packageId));
        setIsProductSelectorOpen(true);
    };

    const fetchPurchaseOrderData = async () => {
        setIsLoading(true);
        try {
            const response = await fetchPO(poId);
            const po = response.data;
            setPoDetail(po);
            setSelectedSale(po.sale);
            setSelectedVendor(po.vendor);
            setSelectedPOPackages(po.po_packages || []);
            setTotalAmount(po.total_amount || 0);
        } catch (error) {
            console.error('Failed to fetch purchase order:', error);
            toast.error('Error fetching purchase order data.', {
                position: "top-center",
                autoClose: 3000,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: localStorage.getItem('theme'),
                transition: Slide,
            });
            navigate(LOCAL_PATH_PREFIX + 'purchase-orders');
        } finally {
            setIsLoading(false);
        }
    };


    const initDropdown = async () => {
        const orderEl = document.querySelector('#sales_dropdown') as HTMLElement;
        const orderDropdown = KTDropdown.getInstance(orderEl);


        const vendorEl = document.querySelector('#vendors_dropdown') as HTMLElement;
        const vendorDropdown = KTDropdown.getInstance(vendorEl);

        const orderEventId = orderDropdown.on('show', async () => {
            inputOrderRef.current.focus();

            try {
                const data = await fetchSales('', 15);
                setSales(data.data);

            } catch (error) {
                console.error('Failed to fetch sale orders: ', error);
            }
        });

        const vendorEventId = vendorDropdown.on('show', async () => {
            inputVendorRef.current.focus();

            try {
                const data = await fetchUsers('', 'backend-vendor');
                setVendors(data.data);
            } catch (error) {
                console.error('Failed to fetch sale vendors: ', error);
            }
        });

        // Cleanup the event listeners when the component unmounts
        return () => {
            orderDropdown.off('show', orderEventId);
            vendorDropdown.off('show', vendorEventId);
        };
    }

    const handleSearchSale = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const term = event.target.value;

        setSearchSaleTerm(term);

        try {
            const data = await fetchSales(term, 15);
            setSales(data.data);

        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleSearchVendor = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const term = event.target.value;

        setSearchSaleTerm(term);

        try {
            const data = await fetchUsers(term, 'backend-vendor');
            setVendors(data.data);

        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleSelectSale = async (selectedSale: Sale | null, saleId?: string) => {
        if (selectedSale || saleId) {
            let updatedSale: Sale;

            if (selectedSale) {
                updatedSale = {
                    ...selectedSale,
                    order: {
                        ...selectedSale.order,
                        latest_quotation: {
                            ...selectedSale.order.latest_quotation,
                            packages: selectedSale.order.latest_quotation.packages.map((prodPackage: Package) => {
                                return {
                                    ...prodPackage,
                                    products: prodPackage.products.filter((product: Product) => product.pm_category_id !== 1)
                                };
                            })
                        }
                    }
                };
            } else if (saleId) {
                const saleIdNumber = parseInt(saleId, 10); // Convert string to number
                if (isNaN(saleIdNumber)) {
                    notify('error', 'Invalid sale ID.');
                    return;
                }
                try {
                    const response = await fetchSale(saleIdNumber);
                    updatedSale = {
                        ...response.data,
                        order: {
                            ...response.data.order,
                            latest_quotation: {
                                ...response.data.order.latest_quotation,
                                packages: response.data.order.latest_quotation.packages.map((prodPackage: Package) => {
                                    return {
                                        ...prodPackage,
                                        products: prodPackage.products.filter((product: Product) => product.pm_category_id !== 1)
                                    };
                                })
                            }
                        }
                    };
                } catch (error) {
                    notify('error', 'Error while fetching sale order.');
                    return;
                }
            } else {
                notify('error', 'Error while fetching sale order.');
                return;
            }

            // Set POPackages using calculatePackageTotal
            const poPackages: POPackage[] = updatedSale.order.latest_quotation.packages.map((prodPackage: Package) => {
                const poItems = prodPackage.products.map((product: Product) => ({
                    product_id: String(product.id),
                    product_name: product.name,
                    product_desc: product.description,
                    qty: product.pivot.quantity,
                    uom: product.uom,
                    supply: product.pivot.includeSupply,
                    install: product.pivot.includeInstall,
                    unit_price: product.provisioning.supply.cogs + product.provisioning.install.cogs,
                    supply_price: product.provisioning.supply.cogs,
                    install_price: product.provisioning.install.cogs,
                    total_price: (product.provisioning.supply.cogs + product.provisioning.install.cogs) * product.pivot.quantity,
                }));

                const newPOPackage: POPackage = {
                    package_id: String(prodPackage.id),
                    name: prodPackage.name,
                    description: prodPackage.description,
                    description_internal: prodPackage.description_internal || null,
                    category: prodPackage.category || null,
                    quantity: prodPackage.quantity || 1,
                    status: 'pending',
                    po_items: poItems
                };

                return {
                    ...newPOPackage,
                    total_price: calculatePackageTotal({ ...newPOPackage, po_items: poItems }),
                }
            });

            setSelectedPOPackages(poPackages);
            setSelectedSale(updatedSale);
            setSearchSaleTerm('');
            setSales([]);
            recalculateTotalAmount();
        } else {
            notify('error', 'Error while fetching sale order.');
        }
    };

    const handleSelectVendor = async (vendor?: User) => {
        if (vendor) {
            setSelectedVendor(vendor);
            setSearchVendorTerm('');
            setVendors([]);
        }
    }

    const handleRemoveSalesOrder = () => {
        setSelectedSale(null);
        setSearchSaleTerm('');
        setSelectedPOPackages([]);
        setTotalAmount(0);
    }

    const handleRemovePOPackage = (id: number) => {
        const packageIndex = selectedPOPackages.findIndex(pack => Number(pack.package_id) === id);

        if (packageIndex > -1) {
            const updatedPackages = selectedPOPackages.filter((pack, index) => index !== packageIndex);

            setSelectedPOPackages(updatedPackages);
        }
    };

    const handleRemovePOProduct = (packId: number, itemId: number) => {

        setSelectedPOPackages((prevSelectedPOPackages) => {
            const updatedPackages = prevSelectedPOPackages.map((packageItem) => {
                if (Number(packageItem.package_id) === packId) {
                    // Filter out the removed product
                    const updatedProducts = packageItem.po_items.filter(
                        (product) => Number(product.product_id) !== Number(itemId)
                    );

                    // Reorder the sequence starting from 1
                    const reorderedProducts = updatedProducts.map((product, index) => ({
                        ...product,
                        sequence: index + 1
                    }));

                    const newTotalPrice = calculatePackageTotal({
                        ...packageItem,
                        po_items: reorderedProducts
                    });

                    return {
                        ...packageItem,
                        po_items: reorderedProducts,
                        total_price: newTotalPrice
                    };
                }
                return packageItem;
            });
            return updatedPackages;
        });
    };

    const handleChangeQty = (e: React.ChangeEvent<HTMLInputElement>, packId: number, prodId: string) => {
        const value = Number(e.target.value);
        if (isNaN(value) || value < 1) return;

        setSelectedPOPackages((prevSelectedPOPackages) => {
            const updatedPackages = prevSelectedPOPackages.map((packageItem) => {
                if (Number(packageItem.package_id) === packId) {
                    const updatedProducts = packageItem.po_items.map((product) => {
                        if (product.product_id === prodId) {
                            const updatedProduct = {
                                ...product,
                                qty: value,
                                total_price: (
                                    (product.supply_qty || 0) * (product.supply_price || 0) +
                                    (product.install_qty || 0) * (product.install_price || 0)
                                ),
                            };
                            return updatedProduct;
                        }
                        return product;
                    });
                    const newTotalPrice = calculatePackageTotal({ ...packageItem, po_items: updatedProducts });
                    return {
                        ...packageItem,
                        po_items: updatedProducts,
                        total_price: newTotalPrice
                    };
                }
                return packageItem;
            });
            return updatedPackages;
        });
    };



    const adjustProductQty = (id: number, packId: number, action: 'increase' | 'decrease') => {
        setSelectedPOPackages((prevSelectedPOPackages) => {
            const updatedPackages = prevSelectedPOPackages.map((packageItem) => {
                if (Number(packageItem.package_id) === packId) {
                    const updatedPOProducts = packageItem.po_items.map((product) => {
                        if (Number(product.product_id) === id) {
                            const value = action === 'increase' ? product.qty + 1 : product.qty - 1;
                            if (value < 1) return product;

                            const updatedProduct = {
                                ...product,
                                qty: value,
                                total_price: (
                                    (product.supply_qty || 0) * (product.supply_price || 0) +
                                    (product.install_qty || 0) * (product.install_price || 0)
                                ),
                            };
                            return updatedProduct;
                        }
                        return product;
                    });
                    const newTotalPrice = calculatePackageTotal({ ...packageItem, po_items: updatedPOProducts });
                    return {
                        ...packageItem,
                        po_items: updatedPOProducts,
                        total_price: newTotalPrice
                    };
                }
                return packageItem;
            });
            return updatedPackages;
        });
    };

    const adjustPackageQty = (id: number, action: 'increase' | 'decrease') => {
        setSelectedPOPackages(prevPackages =>
            prevPackages.map(pkg =>
                Number(pkg.package_id) === id
                    ? {
                        ...pkg,
                        quantity: action === 'increase'
                            ? (pkg.quantity || 1) + 1
                            : Math.max(1, (pkg.quantity || 1) - 1) // Prevent going below 1
                    }
                    : pkg
            )
        );
    };



    const handleSubmit = async () => {

        setIsLoading(true);

        if (!selectedVendor) {
            notify('error', 'Please select a vendor.');
            setIsLoading(false);
            return;
        }

        if (selectedPOPackages.length < 1) {
            notify('error', 'Please select at least one package.');
            setIsLoading(false);
            return;
        }

        const updatedPO: PurchaseOrder = {
            id: poDetail.id,
            sale_id: selectedSale ? selectedSale.id : null,
            vendor_id: selectedVendor.id,
            total_amount: totalAmount,
            po_packages: selectedPOPackages,
        };

        try {
            const response = await updatePurchaseOrder(poId, updatedPO);

            if (response?.success) {
                notify('success', "PO Edited Successfully!");
                navigate(LOCAL_PATH_PREFIX + 'purchase-orders/' + poId);
            }

        } catch (error) {
            console.log(error);
            notify('error', 'Error occurred during PO creation.');
        } finally {
            setIsLoading(false);
        }

    };

    const recalculateTotalAmount = () => {
        const newTotal = selectedPOPackages.reduce((total, packageItem) => {
            const packageTotal = packageItem.po_items.reduce((packageTotal, product) => {
                                            const productTotal = (
                                (product.supply_qty || 0) * (product.supply_price || 0) +
                                (product.install_qty || 0) * (product.install_price || 0)
                            );
                return packageTotal + productTotal;
            }, 0);
            return total + (packageTotal * (packageItem.quantity || 1));
        }, 0);


        setTotalAmount(newTotal);
        return newTotal;
    };

    const calculatePackageTotal = (poPackage: POPackage): number => {
        return poPackage.po_items.reduce((total, item) => {

            const itemTotal = (
                (item.supply_qty || 0) * (item.supply_price || 0) +
                (item.install_qty || 0) * (item.install_price || 0)
            );
            return total + itemTotal;
        }, 0);
    };

    const toggleAccordion = (packageId: number) => {
        setOpenAccordions(prev => ({
            ...prev,
            [packageId]: !prev[packageId]
        }));
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        // Assert that active.id and over.id are strings
        const activeId = active.id as string;
        const overId = over.id as string;

        if (activeId.startsWith('package-') && overId.startsWith('package-')) {
            // Reorder packages
            const oldIndex = selectedPOPackages.findIndex(pkg => `package-${pkg.package_id}` === activeId);
            const newIndex = selectedPOPackages.findIndex(pkg => `package-${pkg.package_id}` === overId);
            setSelectedPOPackages(arrayMove(selectedPOPackages, oldIndex, newIndex));
        } else if (activeId.startsWith('item-') && overId.startsWith('item-')) {
            // Reorder products within the same package
            const activeParts = activeId.split('-');
            const overParts = overId.split('-');
            const activePackId = activeParts[2];
            const overPackId = overParts[2];
            if (activePackId === overPackId) {
                setSelectedPOPackages(prevPackages => {
                    const packageIndex = prevPackages.findIndex(pkg => Number(pkg.package_id) === Number(activePackId));
                    const packageItem = prevPackages[packageIndex];
                    const oldIndex = packageItem.po_items.findIndex(item => `item-${item.product_id}-${activePackId}` === activeId);
                    const newIndex = packageItem.po_items.findIndex(item => `item-${item.product_id}-${activePackId}` === overId);
                    const newPoItems = arrayMove(packageItem.po_items, oldIndex, newIndex);
                    const updatedPackage = { ...packageItem, po_items: newPoItems };
                    const newPackages = [...prevPackages];
                    newPackages[packageIndex] = updatedPackage;
                    return newPackages;
                });
            }
        }
    };

    // Helper functions for POPackageSelector and POProductModal
    const handleSelectCustomPackage = (pkg: Package) => {
        // Convert Package to POPackage format
        const poPackage: POPackage = {
            package_id: String(pkg.id),
            name: pkg.name,
            description: pkg.description,
            description_internal: pkg.description_internal || null,
            category: pkg.category || null,
            quantity: pkg.quantity || 1,
            status: 'pending',
            po_items: pkg.products?.map((product: Product) => ({
                product_id: String(product.id),
                product_name: product.name,
                product_desc: product.description,
                qty: product.pivot?.quantity || 1,
                uom: product.uom,
                                    supply_qty: product.pivot?.supply_qty || 0,
                    install_qty: product.pivot?.install_qty || 0,
                unit_price: (product.provisioning?.supply?.cogs || 0) + (product.provisioning?.install?.cogs || 0),
                supply_price: product.provisioning?.supply?.cogs || 0,
                install_price: product.provisioning?.install?.cogs || 0,
                total_price: ((product.provisioning?.supply?.cogs || 0) + (product.provisioning?.install?.cogs || 0)) * (product.pivot?.quantity || 1),
            })) || []
        };

        setSelectedPOPackages(prev => [...prev, poPackage]);
        setIsPackageSelectorOpen(false);
        recalculateTotalAmount();
    };

    const removePackage = (pkgId: number) => {
        setSelectedPOPackages(prev => prev.filter(pkg => Number(pkg.package_id) !== pkgId));
        recalculateTotalAmount();
    };

    const handleSelectCustomProduct = (product: Product) => {
        if (activePackageId) {
            setSelectedPOPackages(prev => prev.map(pkg => {
                if (Number(pkg.package_id) === activePackageId) {
                    const newPoItem = {
                        product_id: String(product.id),
                        product_name: product.name,
                        product_desc: product.description,
                        qty: 1,
                        uom: product.uom,
                        supply_qty: 0,
                        install_qty: 0,
                        unit_price: (product.provisioning?.supply?.cogs || 0) + (product.provisioning?.install?.cogs || 0),
                        supply_price: product.provisioning?.supply?.cogs || 0,
                        install_price: product.provisioning?.install?.cogs || 0,
                        total_price: (product.provisioning?.supply?.cogs || 0) + (product.provisioning?.install?.cogs || 0),
                    };
                    
                    return {
                        ...pkg,
                        po_items: [...pkg.po_items, newPoItem]
                    };
                }
                return pkg;
            }));
            recalculateTotalAmount();
        }
        setIsProductSelectorOpen(false);
    };

    const removeProduct = (productId: number) => {
        if (activePackageId) {
            setSelectedPOPackages(prev => prev.map(pkg => {
                if (Number(pkg.package_id) === activePackageId) {
                    return {
                        ...pkg,
                        po_items: pkg.po_items.filter(item => Number(item.product_id) !== productId)
                    };
                }
                return pkg;
            }));
            recalculateTotalAmount();
        }
    };

    if (selectedSale) {
        // console.log('packages:', selectedOrder.latest_quotation.packages);
        // selectedOrder.latest_quotation.quotation.packages.map((prodPackage: Package) => {


        // })
    }

    return (
        <>
            {isLoading && <Loading />}

            {/* Header */}
            <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/95 border-b border-gray-200/50 px-6 py-4 mb-8">
                <div className="flex justify-between items-center">
                    <div className="flex gap-4 items-center">
                        <button
                            className="w-10 h-10 rounded-full bg-gray-100/80 hover:bg-gray-200/80 flex items-center justify-center transition-all duration-200 active:scale-95"
                            onClick={handleBackClick}
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-700" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-full">
                                <FileText className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-semibold text-gray-900 -tracking-wide">Edit Purchase Order</h1>
                                <p className="text-sm text-gray-500 mt-1">PO #{poDetail?.po_no}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-xl transition-all duration-200 active:scale-95 shadow-sm flex items-center gap-2"
                            onClick={handleBackClick}
                        >
                            Cancel
                        </button>
                        <button
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-all duration-200 active:scale-95 shadow-sm flex items-center gap-2"
                            onClick={handleSubmit}
                        >
                            <Save className="h-4 w-4" />
                            Update PO
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="w-full mx-auto px-6 pb-8">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Left Column - Order Details */}
                    <div className="xl:col-span-3 space-y-6">
                        {/* General Card */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">General</h3>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    {/* Sales Order Section */}
                                    <div className="flex flex-col space-y-2">
                                        <label className="text-sm text-gray-900 font-semibold">
                                            Sales Order
                                        </label>

                                        <div className="flex items-center gap-2">
                                            <div className="relative w-full" data-dropdown="true" data-dropdown-trigger="click" id='sales_dropdown'>
                                                <button className="dropdown-toggle w-full flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200">
                                                    <span>{selectedSale ? selectedSale.sales_no : 'Select a Sales Order'}</span>
                                                    <Search className="w-4 h-4 text-gray-500" />
                                                </button>

                                                <div className="dropdown-content absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg hidden">
                                                    <div className="p-3">
                                                        <input
                                                            ref={inputOrderRef}
                                                            placeholder="Search Orders..."
                                                            type="text"
                                                            value={searchSaleTerm}
                                                            onChange={handleSearchSale}
                                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                    <div className="menu menu-default flex flex-col max-h-48 overflow-y-auto scrollable-y">
                                                        {sales.length > 0 ? (
                                                            sales.map((sale, key) => (
                                                                <div className="menu-item" key={key} data-id={sale.id}>
                                                                    <button
                                                                        key={key}
                                                                        className="menu-link"
                                                                        onClick={() => handleSelectSale(sale)}
                                                                    >
                                                                        {sale.sales_no} ({sale.order.property.name} {sale.order.block}-{sale.order.floor}-{sale.order.unit_no})
                                                                    </button>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="px-3 py-2 text-sm text-gray-500">
                                                                No sale orders found
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {selectedSale && (
                                                <button
                                                    className="flex items-center justify-center w-8 h-8 text-red-500 hover:text-red-600 focus:outline-none transition-colors duration-200"
                                                    onClick={handleRemoveSalesOrder}
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>

                                        <span className="text-xs text-gray-600">
                                            Duplicate from Order/Quotation
                                        </span>
                                    </div>

                                    {/* Vendor Section */}
                                    <div className="flex flex-col space-y-2">
                                        <label className="text-sm text-gray-900 font-semibold">
                                            Vendor
                                        </label>

                                        <div className="relative w-full" data-dropdown="true" data-dropdown-trigger="click" id='vendors_dropdown'>
                                            <button className="dropdown-toggle w-full flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200">
                                                <span>{selectedVendor ? selectedVendor.name : 'Select a Vendor'}</span>
                                                <Search className="w-4 h-4 text-gray-500" />
                                            </button>

                                            <div className="dropdown-content absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg hidden">
                                                <div className="p-3">
                                                    <input
                                                        ref={inputVendorRef}
                                                        placeholder="Search Vendors..."
                                                        type="text"
                                                        value={searchVendorTerm}
                                                        onChange={handleSearchVendor}
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div className="menu menu-default flex flex-col max-h-48 overflow-y-auto scrollable-y">
                                                    {vendors.length > 0 ? (
                                                        vendors.map((vendor, key) => (
                                                            <button
                                                                key={key}
                                                                className="menu-link"
                                                                onClick={() => handleSelectVendor(vendor)}
                                                            >
                                                                {vendor.name}
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="px-3 py-2 text-sm text-gray-500">
                                                            No vendors found
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <span className="text-xs text-gray-600">
                                            Select a vendor
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sales Order Detail Card */}
                        {selectedSale && (
                            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200/50 bg-gradient-to-r from-green-50/50 to-emerald-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <FileText className="h-5 w-5 text-green-600" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">Sales Order Detail</h3>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Sales No:</span>
                                            <span className="text-sm font-medium text-gray-900">{selectedSale.sales_no}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Status:</span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium
                                                ${selectedSale.status === 'issued' ? 'bg-blue-100 text-blue-800' : ''} 
                                                ${selectedSale.status === 'partial-paid' ? 'bg-yellow-100 text-yellow-800' : ''} 
                                                ${selectedSale.status === 'fully-paid' ? 'bg-green-100 text-green-800' : ''}`}
                                            >
                                                {selectedSale.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Owner Card */}
                        {selectedSale && (
                            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200/50 bg-gradient-to-r from-purple-50/50 to-violet-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-100 rounded-lg">
                                            <UserIcon className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">Owner</h3>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4">
                                        {selectedSale.order.user ?
                                            <>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Name:</span>
                                                    <span className="text-sm font-medium text-gray-900">{selectedSale.order.user.name}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Email:</span>
                                                    <span className="text-sm font-medium text-gray-900">{selectedSale.order.user.email}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Phone No.:</span>
                                                    <span className="text-sm font-medium text-gray-900">+{selectedSale.order.user.country_code} {selectedSale.order.user.phone_no}</span>
                                                </div>
                                            </>
                                            :
                                            <div className="text-sm text-gray-600">N/A</div>
                                        }
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Property Card */}
                        {selectedSale && (
                            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200/50 bg-gradient-to-r from-orange-50/50 to-amber-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-orange-100 rounded-lg">
                                            <Home className="h-5 w-5 text-orange-600" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">Property</h3>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4">
                                        {selectedSale.order.property ?
                                            <>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Property Name:</span>
                                                    <span className="text-sm font-medium text-gray-900">{selectedSale.order.property.name}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Unit:</span>
                                                    <span className="text-sm font-medium text-gray-900">{selectedSale.order.block}-{selectedSale.order.floor}-{selectedSale.order.unit_no}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Unit Type:</span>
                                                    <span className="text-sm font-medium text-gray-900">{selectedSale.order.unit_type ? selectedSale.order.unit_type : "-"}</span>
                                                </div>
                                                <div className="flex justify-between items-start">
                                                    <span className="text-sm text-gray-600">Address:</span>
                                                    <span className="text-sm font-medium text-gray-900 text-right">
                                                        {[
                                                            selectedSale.order.property.address,
                                                            selectedSale.order.property.street,
                                                            selectedSale.order.property.postcode,
                                                            selectedSale.order.property.city,
                                                            selectedSale.order.property.state,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(', ')
                                                        }
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Bedrooms:</span>
                                                    <span className="text-sm font-medium text-gray-900 flex items-center gap-1">
                                                        <Bed className="w-4 h-4" />
                                                        {selectedSale.order.bedroom_count}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Bathrooms:</span>
                                                    <span className="text-sm font-medium text-gray-900 flex items-center gap-1">
                                                        <Bath className="w-4 h-4" />
                                                        {selectedSale.order.bathroom_count}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Partition:</span>
                                                    <span className="text-sm font-medium text-gray-900 flex items-center gap-1">
                                                        <Layers className="w-4 h-4" />
                                                        {selectedSale.order.include_partition ? 'Yes' : 'No'}
                                                    </span>
                                                </div>
                                            </>
                                            :
                                            <div className="text-sm text-gray-600">N/A</div>
                                        }
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Vendor Detail Card */}
                        {selectedVendor && (
                            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200/50 bg-gradient-to-r from-indigo-50/50 to-blue-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-100 rounded-lg">
                                            <Building2 className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">Vendor Detail</h3>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Vendor Name:</span>
                                            <span className="text-sm font-medium text-gray-900">{selectedVendor.name}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Email:</span>
                                            <span className="text-sm font-medium text-gray-900">{selectedVendor.email}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Phone No.:</span>
                                            <span className="text-sm font-medium text-gray-900">+{selectedVendor.country_code} {selectedVendor.phone_no}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Items & Total */}
                    <div className="xl:col-span-9 space-y-6">
                        {/* Total Amount Card */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200/50 bg-gradient-to-r from-emerald-50/50 to-teal-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-100 rounded-lg">
                                        <FileText className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">Total Amount</h3>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="text-3xl font-bold text-gray-900">
                                    RM {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            </div>
                        </div>

                        {/* Items Card */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200/50 bg-gradient-to-r from-orange-50/50 to-amber-50/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-orange-100 rounded-lg">
                                            <PackageIcon className="h-5 w-5 text-orange-600" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">Items</h3>
                                    </div>
                                    <button
                                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-all duration-200 active:scale-95 shadow-sm flex items-center gap-2"
                                        onClick={() => setIsPackageSelectorOpen(true)}
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add Package
                                    </button>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="flex flex-col gap-4">
                                    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                        <SortableContext
                                            items={selectedPOPackages.map(pkg => `package-${pkg.package_id}`)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {selectedPOPackages.map((poPackage: POPackage) => (
                                                <SortablePOPackage
                                                    key={poPackage.package_id}
                                                    poPackage={poPackage}
                                                    adjustPackageQty={adjustPackageQty}
                                                    handleRemovePOPackage={handleRemovePOPackage}
                                                    handleOpenProductModal={handleOpenProductModal}

                                                    adjustProductQty={adjustProductQty}
                                                    handleRemovePOProduct={handleRemovePOProduct}
                                                    handleChangeQty={handleChangeQty}
                                                    openAccordions={openAccordions}
                                                    toggleAccordion={(packageId: string) => toggleAccordion(Number(packageId))}
                                                />
                                            ))}
                                        </SortableContext>
                                    </DndContext>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            <POPackageSelector
                isOpen={isPackageSelectorOpen}
                onClose={() => setIsPackageSelectorOpen(false)}
                selectedPackages={selectedPOPackages.map(poPkg => ({
                    id: Number(poPkg.package_id),
                    name: poPkg.name,
                    description: poPkg.description,
                    description_internal: poPkg.description_internal,
                    category: poPkg.category,
                    quantity: poPkg.quantity,
                    products: poPkg.po_items.map(item => ({
                        id: Number(item.product_id),
                        name: item.product_name,
                        description: item.product_desc,
                        uom: item.uom,
                        provisioning: {
                            supply: { cogs: item.supply_price },
                            install: { cogs: item.install_price }
                        },
                        pivot: {
                            quantity: item.qty,
                            supply_qty: item.supply_qty || 0,
                            install_qty: item.install_qty || 0,
                            includeSupply: (item.supply_qty || 0) > 0,
                            includeInstall: (item.install_qty || 0) > 0
                        }
                    }))
                }))}
                onSelectPackage={handleSelectCustomPackage}
                onRemovePackage={removePackage}
            />

            <POProductModal
                isOpen={isProductSelectorOpen}
                onClose={() => {
                    setIsProductSelectorOpen(false);
                    setActivePackageId(null); // Reset active package
                }}
                selectedProducts={selectedPOPackages.find(p => Number(p.package_id) === activePackageId)?.po_items.map(item => ({
                    id: Number(item.product_id),
                    name: item.product_name,
                    description: item.product_desc,
                    uom: item.uom,
                    provisioning: {
                        supply: { cogs: item.supply_price },
                        install: { cogs: item.install_price }
                    },
                    pivot: {
                        quantity: item.qty,
                        supply_qty: item.supply_qty || 0,
                        install_qty: item.install_qty || 0,
                        includeSupply: (item.supply_qty || 0) > 0,
                        includeInstall: (item.install_qty || 0) > 0
                    }
                })) || []}
                onSelectProduct={handleSelectCustomProduct}
                onRemoveProduct={removeProduct}
            />
        </>
    );
}

export default EditPO;