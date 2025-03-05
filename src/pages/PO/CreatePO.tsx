import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Package, POItem, POPackage, Product, PurchaseOrder, Sale, User } from "../../types";
import { KTDropdown } from '../../metronic/core/components/dropdown/dropdown';
import { createPurchaseOrder, fetchSale, fetchSales, fetchUser, fetchUsers } from "../../services/api";
import IncludePOItemsModal from "./Components/IncludePOItemsModal";
import { Slide, toast } from "react-toastify";
import IncludePOPackageModal from "./Components/IncludePOPackageModal";

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
        // Get the order
        initDropdown();

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

    const handleOpenPackageModal = () => {
        setIsPackageModalOpen(true);
    };

    const handleOpenProductModal = (packageId: string) => {
        setIsProductModalOpen(true);
        console.log(packageId);

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
                const data = await fetchUsers('', 'vendor');
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
            const data = await fetchUsers(term, 'vendor');
            setVendors(data.data);

        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleSelectSale = async (selectedSale: Sale) => {
        if (selectedSale) {
            const updatedSale: Sale = {
                ...selectedSale, // Spread the existing sale object to preserve other properties
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

            // Set POPackages
            const poPackages: POPackage[] = updatedSale.order.latest_quotation.packages.map((prodPackage: Package) => ({
                package_id: String(prodPackage.id),
                name: prodPackage.name,
                description: prodPackage.description,
                description_internal: prodPackage.description_internal,
                category: prodPackage.category,
                quantity: prodPackage.quantity,
                total_price: prodPackage.total_price,
                status: 'pending',
                po_items: prodPackage.products.map((product: Product) => ({
                    product_id: String(product.id),
                    product_name: product.name,
                    qty: product.pivot.quantity,
                    uom: product.uom,
                    supply: product.pivot.includeSupply,
                    install: product.pivot.includeInstall,
                    unit_price: product.provisioning.supply.cogs + product.provisioning.install.cogs,
                    supply_price: product.provisioning.supply.cogs,
                    install_price: product.provisioning.install.cogs,
                    total_price: (product.provisioning.supply.cogs + product.provisioning.install.cogs) * product.pivot.quantity,
                }))
            }))

            setSelectedPOPackages(poPackages);

            setTotalAmount(totalAmount);
            setSelectedSale(updatedSale);
            setSearchSaleTerm('');
            setSales([]);
        } else {
            notify('error', 'Error while fetching sale order.');
        }

    }

    const handleSelectVendor = async (vendor?: User, vendorId?: string) => {
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

    const handleRemovePOProduct = (id: number, packId: number) => {
        setSelectedPOPackages((prevSelectedPOPackages) => {
            const updatedPackages = prevSelectedPOPackages.map((packageItem) => {
                if (Number(packageItem.package_id) === packId) {
                    const updatedProducts = packageItem.po_items.filter((product) => product.product_id !== String(id));
                    return { ...packageItem, po_items: updatedProducts };
                }
                return packageItem;
            })

            return updatedPackages;
        })
    };

    const handleChangeQty = (e: React.ChangeEvent<HTMLInputElement>, prodId: string) => {
        const value = Number(e.target.value);
        if (isNaN(value) || value < 1) return; // Prevent invalid values

        const productIndex = selectedPOProducts.findIndex(product => Number(product.product_id) === Number(prodId));
        if (productIndex > -1) {
            const updatedProducts = selectedPOProducts.map((product, index) => {
                if (index === productIndex) {
                    return {
                        ...product,
                        qty: value,
                        total_price: (value * (product.supply ? product.supply_price : 0)) +
                            (value * (product.install ? product.install_price : 0)),
                    };
                }
                return product;
            });
        }
    };

    const adjustProductQty = (id: number, packId: number, action: 'increase' | 'decrease') => {
        setSelectedPOPackages((prevSelectedPOPackages) => {
            const updatedPackages = prevSelectedPOPackages.map((packageItem) => {
                if (Number(packageItem.package_id) === packId) {
                    const updatedPOProducts = packageItem.po_items.map((product) => {
                        if (Number(product.product_id) === id) {


                            const value = action === 'increase' ? product.qty + 1 : product.qty - 1


                            if (value < 1) return product;

                            return {
                                ...product,
                                qty: value,
                                total_price: (value * (product.supply ? product.supply_price : 0)) +
                                    (value * (product.install ? product.install_price : 0)),
                            };
                        }
                        return product;
                    });
                    return { ...packageItem, po_items: updatedPOProducts };
                }
                return packageItem;
            });

            console.log(updatedPackages);

            return updatedPackages;
        });
    }

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

    const toggleProperty = (id: number, packId: number, property: 'supply' | 'install') => {
        setSelectedPOPackages((prevSelectedPOPackages) => {
            const updatedPackages = prevSelectedPOPackages.map((packageItem) => {
                if (Number(packageItem.package_id) === packId) {
                    const updatedProducts = packageItem.po_items.map((product) => {
                        if (Number(product.product_id) === id) {
                            if (property === 'supply') {
                                product.supply = !product.supply;
                            } else if (property === 'install') {
                                product.install = !product.install;
                            }
                        }
                        return product;
                    });
                    return { ...packageItem, products: updatedProducts };
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
            return total + (packageTotal * packageItem.quantity);
        }, 0);

        setTotalAmount(newTotal);
        return newTotal;
    };

    const toggleAccordion = (packageId) => {
        setOpenAccordions(prev => ({
            ...prev,
            [packageId]: !prev[packageId]
        }));
    };

    if (selectedSale) {
        // console.log('packages:', selectedOrder.latest_quotation.packages);
        // selectedOrder.latest_quotation.quotation.packages.map((prodPackage: Package) => {


        // })
    }

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

            <div className="flex flex-col gap-8 mb-4">
                <div className="flex flex-wrap gap-4">
                    <div className="card flex flex-auto">
                        <div className="card-header">
                            <span className="font-semibold">General</span>
                        </div>

                        <div className="card-body py-6 px-4 lg:px-6 bg-white rounded-lg shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Sales Order Section */}
                                <div className="flex flex-col space-y-2">
                                    <label className="text-sm text-gray-900 font-semibold">
                                        Sales Order
                                    </label>

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
                                                                    {sale.sales_no}
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

                                    <span className="text-xs text-gray-600">
                                        Duplicate from Order/Quotation
                                    </span>
                                </div>

                                {/* Vendor Section */}
                                <div className="flex flex-col space-y-2">
                                    <label className="text-sm text-gray-900 font-semibold">
                                        Vendor
                                    </label>

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

                                    <span className="text-xs text-gray-600">
                                        Select a vendor
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {selectedSale && (
                        <div className="card flex flex-auto">
                            <div className="card-header">
                                <span className="font-semibold">Sales Order Detail</span>
                            </div>
                            <div className="card-body">
                                <table className="table-auto">
                                    <tbody>
                                        <tr>
                                            <td className="text-xs text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                                Sales No:
                                            </td>
                                            <td className="text-xs text-gray-900 pb-3">
                                                {selectedSale.sales_no}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="text-xs text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                                Status:
                                            </td>
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
                    )}

                    {selectedVendor && (
                        <div className="card flex flex-auto">
                            <div className="card-header">
                                <span className="font-semibold">Vendor Detail</span>
                            </div>
                            <div className="card-body">
                                <table className="table-auto">
                                    <tbody>
                                        <tr>
                                            <td className="text-xs text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                                Vendor Name:
                                            </td>
                                            <td className="text-xs text-gray-900 pb-3">
                                                {selectedVendor.name}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="text-xs text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                                Email:
                                            </td>
                                            <td className="text-xs text-gray-900 pb-3">
                                                {selectedVendor.email}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="text-xs text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                                Phone No.:
                                            </td>
                                            <td className="text-xs text-gray-900 pb-3">
                                                +{selectedVendor.country_code} {selectedVendor.phone_no}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="card flex flex-auto">
                        <div className="card-header">
                            <span className="font-semibold">Total Amount</span>
                        </div>
                        <div className="card-body">
                            <span>RM {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4 max-h-[600px]">
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
                                <div className="overflow-y-auto max-h-[500px] scrollable-y">
                                    <div className="flex flex-col gap-4">
                                        {selectedPOPackages.map((poPackage: POPackage, index) => (
                                            <div
                                                key={index}
                                                className="accordion rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 bg-white"
                                            >
                                                {/* Accordion Header */}
                                                <div
                                                    className="accordion-header flex items-center justify-between w-full p-5 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                                                    onClick={() => toggleAccordion(poPackage.package_id)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            className="btn btn-icon btn-sm hover:bg-red-100 rounded-full transition-colors duration-200"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRemovePOPackage(Number(poPackage.package_id));
                                                            }}
                                                        >
                                                            <i className="ki-filled ki-cross text-red-500 text-lg"></i>
                                                        </button>
                                                        <span className="text-gray-800 font-semibold text-sm">{poPackage.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        {/* Package Quantity Input */}
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                className="btn btn-icon btn-sm hover:bg-gray-200 rounded-full transition-colors duration-200"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    adjustPackageQty(Number(poPackage.package_id), 'decrease');
                                                                }}
                                                            >
                                                                <i className="ki-solid ki-minus-squared text-gray-600"></i>
                                                            </button>
                                                            <input
                                                                type="text"
                                                                className="input input-sm text-center px-2 w-12 border-gray-200 focus:border-primary focus:ring focus:ring-primary/20 transition-all duration-200 disabled"
                                                                value={poPackage.quantity || 1} // Assuming package has a qty property, default to 1
                                                                // onChange={(e) => handleChangePackageQty(e, poPackage.package_id)}
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                            <button
                                                                className="btn btn-icon btn-sm hover:bg-gray-200 rounded-full transition-colors duration-200"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    adjustPackageQty(Number(poPackage.package_id), 'increase');
                                                                }}
                                                            >
                                                                <i className="ki-solid ki-plus-squared text-gray-600"></i>
                                                            </button>
                                                        </div>
                                                        <i className={`ki-solid ki-down text-gray-600 transition-transform duration-300 ease-in-out ${openAccordions[poPackage.package_id] ? 'rotate-180' : ''}`}></i>
                                                    </div>
                                                </div>

                                                {/* Accordion Content */}
                                                <div
                                                    className={`accordion-content overflow-hidden transition-all duration-300 ease-in-out ${openAccordions[poPackage.package_id]
                                                        ? 'max-h-[1000px] opacity-100'
                                                        : 'max-h-0 opacity-0 p-0'
                                                        }`}
                                                >
                                                    <div className="flex justify-end mb-2 p-4">
                                                        <button
                                                            className="btn btn-success btn-sm"
                                                            data-modal-toggle="#add_item_modal"
                                                            onClick={() => handleOpenProductModal(poPackage.package_id)}
                                                        >
                                                            Add Product
                                                        </button>
                                                    </div>
                                                    <table className="table align-middle text-gray-700 font-medium text-2xs w-full">
                                                        <thead className="bg-gray-100 rounded-t">
                                                            <tr className="text-gray-600">
                                                                <th className="w-[10px] p-3"></th>
                                                                <th className="w-[180px] p-3">Item</th>
                                                                <th className="w-[180px] p-3">Description</th>
                                                                <th className="w-[100px] p-3 text-center">Supply Price</th>
                                                                <th className="w-[100px] p-3 text-center">Install Price</th>
                                                                <th className="w-[70px] p-3 text-center">Qty</th>
                                                                <th className="w-[100px] p-3 text-center">Total Supply</th>
                                                                <th className="w-[100px] p-3 text-center">Total Install</th>
                                                                <th className="w-[100px] p-3 text-center">Total Price</th>
                                                                <th className="w-[10px] p-3 text-center">Supply</th>
                                                                <th className="w-[10px] p-3 text-center">Install</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {poPackage.po_items.map((poProd: POItem, index) => (
                                                                <tr
                                                                    key={index}
                                                                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150 ${!poProd.supply && !poProd.install ? 'bg-orange-50' : ''
                                                                        }`}
                                                                >
                                                                    <td className="p-3">
                                                                        <button
                                                                            className="btn btn-icon btn-sm hover:bg-red-100 rounded-full transition-colors duration-200"
                                                                            onClick={() => handleRemovePOProduct(Number(poProd.product_id), Number(poPackage.package_id))}
                                                                        >
                                                                            <i className="ki-filled ki-cross text-red-500"></i>
                                                                        </button>
                                                                    </td>
                                                                    <td className="p-3">{poProd.product_name}</td>
                                                                    <td className="p-3 text-gray-600">{poProd.product_desc}</td>
                                                                    <td className="p-3 text-center">RM {poProd.supply_price}</td>
                                                                    <td className="p-3 text-center">RM {poProd.install_price}</td>
                                                                    <td className="p-3 text-center">
                                                                        <div className="flex items-center justify-center gap-2">
                                                                            <button
                                                                                className="btn btn-icon btn-sm hover:bg-gray-200 rounded-full transition-colors duration-200"
                                                                                onClick={() => adjustProductQty(Number(poProd.product_id), Number(poPackage.package_id), 'decrease')}
                                                                            >
                                                                                <i className="ki-solid ki-minus-squared text-gray-600"></i>
                                                                            </button>
                                                                            <input
                                                                                type="text"
                                                                                className="input input-sm text-center px-2 w-12 border-gray-200 focus:border-primary focus:ring focus:ring-primary/20 transition-all duration-200"
                                                                                value={poProd.qty}
                                                                                onChange={(e) => handleChangeQty(e, poProd.product_id)}
                                                                            />
                                                                            <button
                                                                                className="btn btn-icon btn-sm hover:bg-gray-200 rounded-full transition-colors duration-200"
                                                                                onClick={() => adjustProductQty(Number(poProd.product_id), Number(poPackage.package_id), 'increase')}
                                                                            >
                                                                                <i className="ki-solid ki-plus-squared text-gray-600"></i>
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-3 text-center">
                                                                        {poProd.supply ?
                                                                            <span className="text-green-600">RM {(poProd.supply_price * poProd.qty * (poPackage.quantity || 1)).toFixed(2)}</span>
                                                                            : <span className="text-gray-400">-</span>
                                                                        }
                                                                    </td>
                                                                    <td className="p-3 text-center">
                                                                        {poProd.install ?
                                                                            <span className="text-green-600">RM {(poProd.install_price * poProd.qty * (poPackage.quantity || 1)).toFixed(2)}</span>
                                                                            : <span className="text-gray-400">-</span>
                                                                        }
                                                                    </td>
                                                                    <td className="p-3 text-center font-semibold">
                                                                        RM {(((poProd.supply ? poProd.supply_price : 0) + (poProd.install ? poProd.install_price : 0)) * poProd.qty * (poPackage.quantity || 1)).toFixed(2)}
                                                                    </td>
                                                                    <td className="p-3 text-center">
                                                                        <input
                                                                            className="checkbox checkbox-sm rounded checked:bg-primary"
                                                                            type="checkbox"
                                                                            checked={!!poProd.supply}
                                                                            onChange={() => toggleProperty(Number(poProd.product_id), Number(poPackage.package_id), 'supply')}
                                                                        />
                                                                    </td>
                                                                    <td className="p-3 text-center">
                                                                        <input
                                                                            className="checkbox checkbox-sm rounded checked:bg-primary"
                                                                            type="checkbox"
                                                                            checked={!!poProd.install}
                                                                            onChange={() => toggleProperty(Number(poProd.product_id), Number(poPackage.package_id), 'install')}
                                                                        />
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4">
                        <button className="btn btn-lg btn-light">
                            Cancel
                        </button>
                        <button
                            className="btn btn-lg btn-primary"
                            onClick={handleSubmit}
                        >
                            Create
                        </button>
                    </div>
                </div>
            </div >

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