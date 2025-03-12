import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Package, POPackage, Product, PurchaseOrder, Sale, User } from "../../types";
import { KTDropdown } from '../../metronic/core/components/dropdown/dropdown';
import { createPurchaseOrder, fetchSale, fetchSales, fetchUsers } from "../../services/api";
import IncludePOItemsModal from "./components/IncludePOItemsModal";
import { Slide, toast } from "react-toastify";
import IncludePOPackageModal from "./components/IncludePOPackageModal";
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { SortablePOPackage } from "./components/SortablePOPackage";

function CreatePO() {
    const navigate = useNavigate();
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
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [selectedVendor, setSelectedVendor] = useState<User | null>(null);
    const [totalAmount, setTotalAmount] = useState<number>(0);
    const [selectedPOPackages, setSelectedPOPackages] = useState<POPackage[]>([]);
    const [selectedPOPackageId, setSelectedPOPackageId] = useState('');
    const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [openAccordions, setOpenAccordions] = useState({});

    const handleBackClick = () => {
        if (state) {
            navigate(state.fromUrl);
        } else {
            navigate('/purchase-orders');
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
        document.title = "Create Purchase Orders | RenoXpert";
        initDropdown();
        if (saleId) {
            handleSelectSale(null, saleId);
        }
    }, [saleId]);

    useEffect(() => {
        if (selectedPOPackages.length > 0) {
            recalculateTotalAmount();
        } else {
            setTotalAmount(0);
        }
        console.log(selectedPOPackages);

    }, [selectedPOPackages]);

    const handleOpenPackageModal = () => {
        setIsPackageModalOpen(true);
    };

    const handleOpenProductModal = (packageId: string) => {
        setIsProductModalOpen(true);
        setSelectedPOPackageId(packageId);
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

        return () => {
            orderDropdown.off('show', orderEventId);
            vendorDropdown.off('show', vendorEventId);
        };
    };

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
                            packages: selectedSale.order.latest_quotation.packages.map((prodPackage: Package) => ({
                                ...prodPackage,
                                products: prodPackage.products.filter((product: Product) => product.pm_category_id !== 1)
                            }))
                        }
                    }
                };
            } else if (saleId) {
                try {
                    const response = await fetchSale(saleId);
                    updatedSale = {
                        ...response.data,
                        order: {
                            ...response.data.order,
                            latest_quotation: {
                                ...response.data.order.latest_quotation,
                                packages: response.data.order.latest_quotation.packages.map((prodPackage: Package) => ({
                                    ...prodPackage,
                                    products: prodPackage.products.filter((product: Product) => product.pm_category_id !== 1)
                                }))
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
                };
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

    const handleSelectVendor = async (vendor?: User, vendorId?: string) => {
        if (vendor) {
            setSelectedVendor(vendor);
            setSearchVendorTerm('');
            setVendors([]);
        }
    };

    const handleRemoveSalesOrder = () => {
        setSelectedSale(null);
        setSearchSaleTerm('');
        setSelectedPOPackages([]);
        setTotalAmount(0);
    };

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
                                total_price: value * (
                                    (product.supply ? product.supply_price : 0) +
                                    (product.install ? product.install_price : 0)
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
                                total_price: (value * (
                                    (product.supply ? product.supply_price : 0) +
                                    (product.install ? product.install_price : 0)
                                )),
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
                            : Math.max(1, (pkg.quantity || 1) - 1)
                    }
                    : pkg
            )
        );
    };

    const toggleProperty = (id: number, packId: number, property: 'supply' | 'install') => {
        setSelectedPOPackages((prevSelectedPOPackages) => {
            const updatedPackages = prevSelectedPOPackages.map((packageItem) => {
                if (Number(packageItem.package_id) === packId) {
                    const updatedProducts = packageItem.po_items.map((product) => {
                        if (Number(product.product_id) === id) {
                            const updatedProduct = { ...product };
                            if (property === 'supply') {
                                updatedProduct.supply = !product.supply;
                            } else if (property === 'install') {
                                updatedProduct.install = !product.install;
                            }
                            updatedProduct.total_price = updatedProduct.qty * (
                                (updatedProduct.supply ? updatedProduct.supply_price : 0) +
                                (updatedProduct.install ? updatedProduct.install_price : 0)
                            );
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

    const handleSubmit = async () => {
        if (!selectedVendor) {
            notify('error', 'Please select a vendor.');
            return;
        }
        if (selectedPOPackages.length < 1) {
            notify('error', 'Please select at least one package.');
            return;
        }
        const updatedPO: PurchaseOrder = {
            sale_id: selectedSale ? selectedSale.id : null,
            vendor_id: selectedVendor.id,
            total_amount: totalAmount,
            po_packages: selectedPOPackages,
        };
        try {
            const response = await createPurchaseOrder(updatedPO);
            if (response?.success) {
                notify('success', "PO Created Successfully!");
                navigate('/purchase-orders');
            }
        } catch (error) {
            console.log(error);
            notify('error', 'Error occurred during PO creation.');
        }
    };

    const recalculateTotalAmount = () => {
        const newTotal = selectedPOPackages.reduce((total, packageItem) => {
            const packageTotal = packageItem.po_items.reduce((packageTotal, product) => {
                const productTotal = product.qty * (
                    (product.supply ? product.supply_price : 0) +
                    (product.install ? product.install_price : 0)
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
            const itemTotal = item.qty * (
                (item.supply ? item.supply_price : 0) +
                (item.install ? item.supply_price : 0)
            );
            return total + itemTotal;
        }, 0);
    };

    const toggleAccordion = (packageId: string) => {
        setOpenAccordions(prev => ({
            ...prev,
            [packageId]: !prev[packageId]
        }));
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            if (active.id.startsWith('package-') && over.id.startsWith('package-')) {
                // Reorder packages
                const oldIndex = selectedPOPackages.findIndex(pkg => `package-${pkg.package_id}` === active.id);
                const newIndex = selectedPOPackages.findIndex(pkg => `package-${pkg.package_id}` === over.id);
                setSelectedPOPackages(prevPackages => {
                    const reorderedPackages = arrayMove(prevPackages, oldIndex, newIndex);
                    // Update sequence for all packages
                    return reorderedPackages.map((pkg, index) => ({
                        ...pkg,
                        sequence: index
                    }));
                });
            } else if (active.id.startsWith('item-') && over.id.startsWith('item-')) {
                // Reorder products within the same package
                const activeParts = active.id.split('-');
                const overParts = over.id.split('-');
                const activePackId = activeParts[2];
                const overPackId = overParts[2];
                if (activePackId === overPackId) {
                    setSelectedPOPackages(prevPackages => {
                        const packageIndex = prevPackages.findIndex(pkg => pkg.package_id === activePackId);
                        const packageItem = prevPackages[packageIndex];
                        const oldIndex = packageItem.po_items.findIndex(item => `item-${item.product_id}-${activePackId}` === active.id);
                        const newIndex = packageItem.po_items.findIndex(item => `item-${item.product_id}-${activePackId}` === over.id);
                        const reorderedItems = arrayMove(packageItem.po_items, oldIndex, newIndex);
                        // Update sequence for all items in the package
                        const updatedItems = reorderedItems.map((item, index) => ({
                            ...item,
                            sequence: index
                        }));
                        const updatedPackage = { ...packageItem, po_items: updatedItems };
                        const newPackages = [...prevPackages];
                        newPackages[packageIndex] = updatedPackage;
                        return newPackages;
                    });
                }
            }
        }
    };

    return (
        <>
            <div className="flex justify-between items-center flex-wrap mb-6">
                <div className="flex gap-4 items-center">
                    <button className='text-gray-800 dark:text-gray-400' onClick={handleBackClick}>
                        <i className="ki-solid ki-arrow-left"></i>
                    </button>
                    <span className="text-2xl font-bold text-gray-900">
                        Create New Purchase Order
                    </span>
                </div>
            </div>

            <div className="flex gap-8 mb-4">
                <div className="flex flex-col gap-4 flex-1">
                    <div className="card flex w-full">
                        <div className="card-header">
                            <span className="font-semibold">General</span>
                        </div>
                        <div className="card-body py-6 px-4 lg:px-6 bg-white rounded-lg shadow-sm">
                            <div className="grid grid-rows-1 md:grid-rows-2 gap-6">
                                <div className="flex flex-col space-y-2">
                                    <label className="text-sm text-gray-900 font-semibold">Sales Order</label>
                                    <div className="flex items-center gap-2">
                                        <div className="relative w-full max-w-md" data-dropdown="true" data-dropdown-trigger="click" id='sales_dropdown'>
                                            <button className="dropdown-toggle w-full flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                                <span>{selectedSale ? selectedSale.sales_no : 'Select a Sales Order'}</span>
                                                <i className="ki-filled ki-down w-4 h-4 text-gray-500"></i>
                                            </button>
                                            <div className="dropdown-content absolute z-10 mt-1 w-full max-w-80 bg-white border border-gray-200 rounded-md shadow-lg hidden">
                                                <div className="p-3">
                                                    <input
                                                        ref={inputOrderRef}
                                                        placeholder="Search Orders..."
                                                        type="text"
                                                        value={searchSaleTerm}
                                                        onChange={handleSearchSale}
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                                className="flex items-center justify-center w-8 h-8 text-red-500 hover:text-red-600 focus:outline-none"
                                                onClick={handleRemoveSalesOrder}
                                            >
                                                <i className="ki-filled ki-cross w-5 h-5"></i>
                                            </button>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-600">Duplicate from Order/Quotation</span>
                                </div>
                                <div className="flex flex-col space-y-2">
                                    <label className="text-sm text-gray-900 font-semibold">Vendor</label>
                                    <div className="relative w-full max-w-md" data-dropdown="true" data-dropdown-trigger="click" id='vendors_dropdown'>
                                        <button className="dropdown-toggle w-full flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                            <span>{selectedVendor ? selectedVendor.name : 'Select a Vendor'}</span>
                                            <i className="ki-filled ki-down w-4 h-4 text-gray-500"></i>
                                        </button>
                                        <div className="dropdown-content absolute z-10 mt-1 w-full max-w-80 bg-white border border-gray-200 rounded-md shadow-lg hidden">
                                            <div className="p-3">
                                                <input
                                                    ref={inputVendorRef}
                                                    placeholder="Search Vendors..."
                                                    type="text"
                                                    value={searchVendorTerm}
                                                    onChange={handleSearchVendor}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                    <span className="text-xs text-gray-600">Select a vendor</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {selectedSale && (
                        <>
                            <div className="card flex w-full">
                                <div className="card-header">
                                    <span className="font-semibold">Sales Order Detail</span>
                                </div>
                                <div className="card-body">
                                    <table className="table-auto">
                                        <tbody>
                                            <tr>
                                                <td className="text-xs text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">Sales No:</td>
                                                <td className="text-xs text-gray-900 pb-3">{selectedSale.sales_no}</td>
                                            </tr>
                                            <tr>
                                                <td className="text-xs text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">Status:</td>
                                                <td className="text-xs text-gray-900 pb-3">
                                                    <span className={`badge badge-pill cursor-default
                                                        ${selectedSale.status === 'issued' ? 'badge-primary' : ''} 
                                                        ${selectedSale.status === 'partial-paid' ? 'badge-info' : ''} 
                                                        ${selectedSale.status === 'fully-paid' ? 'badge-success' : ''} 
                                                        badge-outline`}
                                                    >
                                                        {selectedSale.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="card w-full">
                                <div className="card-header flex justify-between items-center">
                                    <h3 className="card-title">Owner</h3>
                                </div>
                                <div className="card-body pt-3.5 pb-3.5">
                                    <table className="table-auto">
                                        <tbody>
                                            {selectedSale.order.user ? (
                                                <>
                                                    <tr>
                                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Name:</td>
                                                        <td className="text-sm text-gray-900 pb-3">{selectedSale.order.user.name}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Email:</td>
                                                        <td className="text-sm text-gray-900 pb-3">{selectedSale.order.user.email}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Phone No.:</td>
                                                        <td className="text-sm text-gray-900 pb-3">+{selectedSale.order.user.country_code} {selectedSale.order.user.phone_no}</td>
                                                    </tr>
                                                </>
                                            ) : (
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">N/A</td>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="card w-full">
                                <div className="card-header flex justify-between items-center">
                                    <h3 className="card-title">Property</h3>
                                </div>
                                <div className="card-body pt-3.5 pb-3.5">
                                    <table className="table-auto">
                                        <tbody>
                                            {selectedSale.order.property ? (
                                                <>
                                                    <tr>
                                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Property Name:</td>
                                                        <td className="text-sm text-gray-900 pb-3">{selectedSale.order.property.name}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Unit:</td>
                                                        <td className="text-sm text-gray-900 pb-3">{selectedSale.order.block}-{selectedSale.order.floor}-{selectedSale.order.unit_no}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Unit Type:</td>
                                                        <td className="text-sm text-gray-900 pb-3">{selectedSale.order.unit_type ? selectedSale.order.unit_type : "-"}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Address:</td>
                                                        <td className="text-sm text-gray-900 pb-3">
                                                            {[
                                                                selectedSale.order.property.address,
                                                                selectedSale.order.property.street,
                                                                selectedSale.order.property.postcode,
                                                                selectedSale.order.property.city,
                                                                selectedSale.order.property.state,
                                                            ].filter(Boolean).join(', ')}
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Total Bedroom:</td>
                                                        <td className="text-sm text-gray-900 pb-3">{selectedSale.order.bedroom_count}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Total Bathroom:</td>
                                                        <td className="text-sm text-gray-900 pb-3">{selectedSale.order.bathroom_count}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Partition:</td>
                                                        <td className="text-sm text-gray-900 pb-3">{selectedSale.order.include_partition ? 'Yes' : 'No'}</td>
                                                    </tr>
                                                </>
                                            ) : (
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">N/A</td>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {selectedVendor && (
                        <div className="card flex flex-auto w-full">
                            <div className="card-header">
                                <span className="font-semibold">Vendor Detail</span>
                            </div>
                            <div className="card-body">
                                <table className="table-auto">
                                    <tbody>
                                        <tr>
                                            <td className="text-xs text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">Vendor Name:</td>
                                            <td className="text-xs text-gray-900 pb-3">{selectedVendor.name}</td>
                                        </tr>
                                        <tr>
                                            <td className="text-xs text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">Email:</td>
                                            <td className="text-xs text-gray-900 pb-3">{selectedVendor.email}</td>
                                        </tr>
                                        <tr>
                                            <td className="text-xs text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">Phone No.:</td>
                                            <td className="text-xs text-gray-900 pb-3">+{selectedVendor.country_code} {selectedVendor.phone_no}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-4 flex-[4]">
                    <div className="card flex w-full">
                        <div className="card-header">
                            <span className="font-semibold">Total Amount</span>
                        </div>
                        <div className="card-body">
                            <span>RM {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    <div className="card w-full">
                        <div className="card-body flex flex-col">
                            <div className="flex flex-col">
                                <div className="flex justify-between">
                                    <h2 className="text-lg font-semibold mb-4">Items</h2>
                                    <div className="flex gap-4">
                                        <button
                                            className="btn btn-primary btn-sm"
                                            data-modal-toggle="#add_package_modal"
                                            onClick={handleOpenPackageModal}
                                        >
                                            Add Package
                                        </button>
                                    </div>
                                </div>
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
                                                    toggleProperty={toggleProperty}
                                                    adjustProductQty={adjustProductQty}
                                                    handleRemovePOProduct={handleRemovePOProduct}
                                                    handleChangeQty={handleChangeQty}
                                                    openAccordions={openAccordions}
                                                    toggleAccordion={toggleAccordion}
                                                />
                                            ))}
                                        </SortableContext>
                                    </DndContext>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4">
                        <button className="btn btn-lg btn-light">Cancel</button>
                        <button className="btn btn-lg btn-primary" onClick={handleSubmit}>Create</button>
                    </div>
                </div>
            </div>

            <IncludePOPackageModal
                selectedPOPackages={selectedPOPackages}
                setSelectedPOPackages={setSelectedPOPackages}
                isOpen={isPackageModalOpen}
                setIsOpen={setIsPackageModalOpen}
                recalculateTotalAmount={recalculateTotalAmount}
            />

            <IncludePOItemsModal
                selectedPOPackageId={selectedPOPackageId}
                setSelectedPOPackageId={setSelectedPOPackageId}
                selectedPOPackages={selectedPOPackages}
                setSelectedPOPackages={setSelectedPOPackages}
                isOpen={isProductModalOpen}
                setIsOpen={setIsProductModalOpen}
                recalculateTotalAmount={recalculateTotalAmount}
            />
        </>
    );
}

export default CreatePO;