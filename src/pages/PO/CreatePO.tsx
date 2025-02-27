import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Package, POItem, Product, PurchaseOrder, Sale, User } from "../../types";
import { KTDropdown } from '../../metronic/core/components/dropdown/dropdown';
import { createPurchaseOrder, fetchSale, fetchSales, fetchUser, fetchUsers } from "../../services/api";
import IncludePOItemsModal from "./Components/IncludePOItemsModal";
import { Slide, toast } from "react-toastify";

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

    const [selectedPOProducts, setSelectedPOProducts] = useState<POItem[]>([]);

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

    const initDropdown = async () => {
        const orderEl = document.querySelector('#sales_dropdown') as HTMLElement;
        const orderDropdown = KTDropdown.getInstance(orderEl);


        const vendorEl = document.querySelector('#vendors_dropdown') as HTMLElement;
        const vendorDropdown = KTDropdown.getInstance(vendorEl);

        orderDropdown.on('show', async () => {
            inputOrderRef.current.focus();

            try {
                const data = await fetchSales('', 15);
                setSales(data.data);

            } catch (error) {
                console.error('Failed to fetch sale orders: ', error);
            }
        });

        vendorDropdown.on('show', async () => {
            inputVendorRef.current.focus();

            try {
                const data = await fetchUsers('', 'vendor');
                setVendors(data.data);
            } catch (error) {
                console.error('Failed to fetch sale vendors: ', error);
            }
        });
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

    const handleSelectSale = async (sale?: Sale, saleId?: string) => {
        if (saleId) {
            try {
                const response = await fetchSale(Number(saleId));
                const sale: Sale = response.data;

                if (response?.success) {
                    const updatedSale: Sale = {
                        ...sale, // Spread the existing sale object to preserve other properties
                        order: {
                            ...sale.order,
                            latest_quotation: {
                                ...sale.order.latest_quotation,
                                packages: sale.order.latest_quotation.packages.map((prodPackage: Package) => {
                                    console.log(prodPackage);
                                    return {
                                        ...prodPackage,
                                        products: prodPackage.products.filter((product: Product) => product.pm_category_id !== 1)
                                    };
                                })
                            }
                        }
                    };

                    // Now process the filtered products
                    const items = updatedSale.order.latest_quotation.packages.flatMap((prodPackage: Package) =>
                        prodPackage.products.map((product: Product) => ({
                            product_id: String(product.id),
                            product_name: product.name,
                            qty: product.pivot.quantity,
                            supply: false,
                            install: false,
                            unit_price: product.provisioning.supply.cogs + product.provisioning.install.cogs,
                            total_price: (product.provisioning.supply.cogs + product.provisioning.install.cogs) * product.pivot.quantity,
                        }))
                    );

                    const totalAmount = items.reduce((prev, curr) => prev + curr.total_price, 0);

                    setTotalAmount(totalAmount);
                    setSelectedSale(updatedSale);
                    setSearchSaleTerm('');
                    setSales([]);
                }
            } catch (error) {
                console.error('Error fetching sale:', error);
            }
        } else {

            const updatedSale: Sale = {
                ...sale, // Spread the existing sale object to preserve other properties
                order: {
                    ...sale.order,
                    latest_quotation: {
                        ...sale.order.latest_quotation,
                        packages: sale.order.latest_quotation.packages.map((prodPackage: Package) => {
                            
                            return {
                                ...prodPackage,
                                products: prodPackage.products.filter((product: Product) => product.pm_category_id !== 1)
                            };
                        })
                    }
                }
            };

            const items = updatedSale.order.latest_quotation.packages.flatMap((prodPackage: Package) =>
                prodPackage.products.map((product: Product) => ({
                    product_id: String(product.id),
                    product_name: product.name,
                    qty: product.pivot.quantity,
                    supply: false,
                    install: false,
                    unit_price: product.provisioning.supply.cogs + product.provisioning.install.cogs,
                    total_price: (product.provisioning.supply.cogs + product.provisioning.install.cogs) * product.pivot.quantity,
                }))
            );

            const totalAmount = items.reduce((prev, curr) => prev + curr.total_price, 0);

            setTotalAmount(totalAmount);
            setSelectedSale(updatedSale);
            setSearchSaleTerm('');
            setSales([]);
        }

        setSelectedPOProducts([]);
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
        setTotalAmount(0);
        setSelectedPOProducts([]);
    }

    const handleRemovePOProduct = (prodId: string) => {
        const productIndex = selectedPOProducts.findIndex(product => Number(product.product_id) === Number(prodId));

        if (productIndex > -1) {
            const updatedProducts = selectedPOProducts.filter((product, index) => index !== productIndex);

            setSelectedPOProducts(updatedProducts);
            setTotalAmount(recalculateTotalAmount(updatedProducts)); // Update total amount
        }
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
            setSelectedPOProducts(updatedProducts);
            setTotalAmount(recalculateTotalAmount(updatedProducts)); // Update total amount
        }
    };

    const toggleProperty = (id: number, packId: number, property: 'supply' | 'install') => {
        setSelectedSale((prevSale: Sale) => {
            const updatedSale = { ...prevSale };
            const packageIndex = updatedSale.order.latest_quotation.packages.findIndex((packageItem: Package) => packageItem.id === packId);
            const packageItem = updatedSale.order.latest_quotation.packages[packageIndex];
            const productIndex = packageItem.products.findIndex((product: Product) => product.id === id);
            const product = packageItem.products[productIndex];

            if (property === 'supply') {
                product.pivot.includeSupply = !product.pivot.includeSupply;
            } else if (property === 'install') {
                product.pivot.includeInstall = !product.pivot.includeInstall;
            }

            const updatedProducts = updatedSale.order.latest_quotation.packages.flatMap(pkg => pkg.products.map(product => ({
                qty: product.pivot.quantity,
                supply: product.pivot.includeSupply,
                install: product.pivot.includeInstall,
                supply_price: product.provisioning.supply?.cogs || 0,
                install_price: product.provisioning.install?.cogs || 0,
            })));

            setTotalAmount(recalculateTotalAmount(updatedProducts)); // Update total amount
            return updatedSale;
        });
    };

    const togglePOItemProperty = (id: number, property: 'supply' | 'install') => {
        setSelectedPOProducts((prevSelectedPOProducts) => {
            const updatedProducts = prevSelectedPOProducts.map((product) => {
                if (product.product_id === String(id)) {
                    if (property === 'supply') {
                        product.supply = !product.supply;
                    } else if (property === 'install') {
                        product.install = !product.install;
                    }
                }
                return product;
            });

            setTotalAmount(recalculateTotalAmount(updatedProducts)); // Update total amount
            return updatedProducts;
        });
    };

    const handleSubmit = async () => {
        let updatedPO: PurchaseOrder;

        if (selectedSale) {
            updatedPO = {
                sale_id: selectedSale.id,
                vendor_id: selectedVendor.id,
                items: selectedSale.order.latest_quotation.packages.flatMap((prodPackage: Package) =>
                    prodPackage.products.map((product: Product) => {
                        return ({
                            product_id: String(product.id),
                            product_name: product.name,
                            qty: product.pivot.quantity,
                            supply: product.pivot.includeSupply == 1 ? true : false,
                            install: product.pivot.includeInstall == 1 ? true : false,
                            unit_price: product.provisioning.supply.cogs + product.provisioning.install.cogs,
                            supply_price: product.provisioning.supply.cogs,
                            install_price: product.provisioning.install.cogs,
                            total_price: (product.provisioning.supply.cogs + product.provisioning.install.cogs) * product.pivot.quantity,
                        })
                    })
                ),
                total_amount: totalAmount
            };
        } else {
            console.log(selectedPOProducts);

            updatedPO = {
                vendor_id: selectedVendor.id,
                items: selectedPOProducts.map((product: POItem) => {
                    return ({
                        product_id: Number(product.product_id),
                        product_name: product.product_name,
                        description: product.product_desc,
                        qty: product.qty,
                        supply: product.supply,
                        install: product.install,
                        unit_price: product.supply_price + product.install_price,
                        supply_price: product.supply_price,
                        install_price: product.install_price,
                        total_price: (product.supply_price + product.install_price) * product.qty,
                    })
                }
                ),
                total_amount: totalAmount
            };
        }

        try {
            const response = await createPurchaseOrder(updatedPO);

            if (response?.success) {
                notify('success', "PO Created Successfully!");
                navigate('/purchase-orders');
            }

        } catch (error) {
            console.log(error);

        }

    };

    const recalculateTotalAmount = (products: POItem[]) => {
        return products.reduce((total, product) => {
            const productTotal = product.qty * (
                (product.supply ? product.supply_price : 0) +
                (product.install ? product.install_price : 0)
            );
            return total + productTotal;
        }, 0);
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

                        <div className="card-group py-4 flex items-center">
                            <span className="text-xs text-gray-600 pe-4 lg:pe-8 font-semibold">
                                Sales Order:
                            </span>
                            <div className="dropdow pe-2" data-dropdown="true" data-dropdown-trigger="click" id='sales_dropdown'>
                                <button className="dropdown-toggle btn btn-xs btn-light w-full flex">
                                    <span>{selectedSale ? selectedSale.sales_no : 'Select an Sales Order'}</span>
                                    <i className="ki-filled ki-down"></i>
                                </button>

                                <div className="dropdown-content w-full max-w-80">
                                    <div className="px-4 pt-4 text-sm text-gray-900 font-medium">
                                        <label className="input input-sm">
                                            <input
                                                ref={inputOrderRef}
                                                placeholder="Select an Order"
                                                type="text"
                                                value={searchSaleTerm}
                                                onChange={handleSearchSale}
                                            />
                                        </label>
                                    </div>
                                    <div className="menu menu-default flex flex-col">
                                        {sales.length > 0 ? (
                                            sales.map((sale, key) => (
                                                <div className="menu-item" key={key} data-id={sale.id}>
                                                    <button
                                                        className="menu-link"
                                                        onClick={() => handleSelectSale(sale)}
                                                    >
                                                        <span className="menu-title">{sale.sales_no}</span>
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="menu-item">
                                                <button
                                                    className="menu-link"
                                                >
                                                    <span className="menu-title">No sale orders found</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {selectedSale && (
                                <div className="flex">
                                    <button
                                        className="btn btn-icon btn-sm text-danger"
                                        onClick={handleRemoveSalesOrder}
                                    >
                                        <i className="ki-filled ki-cross"></i>
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="card-group py-4 flex items-center">
                            <span className="text-xs text-gray-600 pe-4 lg:pe-8 font-semibold">
                                Vendor:
                            </span>
                            <div className="dropdow" data-dropdown="true" data-dropdown-trigger="click" id='vendors_dropdown'>
                                <button className="dropdown-toggle btn btn-xs btn-light w-full flex justify-between items-center">
                                    <span></span>
                                    <span>{selectedVendor ? selectedVendor.name : 'Select a Vendor'}</span>
                                    <i className="ki-filled ki-down"></i>
                                </button>

                                <div className="dropdown-content w-full max-w-80">
                                    <div className="px-4 pt-4 text-sm text-gray-900 font-medium">
                                        <label className="input input-sm">
                                            <input
                                                ref={inputVendorRef}
                                                placeholder="Select a vendor"
                                                type="text"
                                                value={searchVendorTerm}
                                                readOnly
                                                onChange={handleSearchVendor}
                                            />
                                        </label>
                                    </div>
                                    <div className="menu menu-default flex flex-col">
                                        {vendors.length > 0 ? (
                                            vendors.map((vendor, key) => (
                                                <div className="menu-item" key={key} data-id={vendor.id}>
                                                    <button
                                                        className="menu-link"
                                                        onClick={() => handleSelectVendor(vendor)}
                                                    >
                                                        <span className="menu-title">{vendor.name}</span>
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="menu-item">
                                                <button
                                                    className="menu-link"
                                                >
                                                    <span className="menu-title">No vendors found</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
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
                            <span>RM {totalAmount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4 max-h-[600px]">
                    {selectedSale ?
                        <div className="card w-full">
                            <div className="card-body flex flex-col">
                                <div className="flex flex-col">
                                    <div className="flex">
                                        <h2 className="text-lg font-semibold mb-4">Add Items</h2>
                                    </div>
                                    {/* <div className="text-sm text-gray-900 font-medium w-1/2 mb-4">
                                        <label className="input">
                                            <input
                                                ref={inputVendorRef}
                                                placeholder="Select product"
                                                type="text"
                                                value={searchVendorTerm}
                                                onChange={handleSearchSale}
                                            />
                                        </label>
                                    </div> */}
                                    <div className="overflow-y-auto max-h-[500px] scrollable-y">
                                        <table className="table align-middle text-gray-700 font-medium text-2xs">
                                            <thead className="sticky top-0 bg-white z-5 rounded">
                                                <tr>
                                                    <th className='w-[250px]'>Item</th>
                                                    <th className='w-[250px]'>Description</th>
                                                    <th className='w-[70px] text-center'>Supply Price/Qty</th>
                                                    <th className='w-[70px] text-center'>Install Price/Qty</th>
                                                    <th className='w-[70px] text-center'>Qty</th>
                                                    <th className='w-[70px] text-center'>Total Supply Price</th>
                                                    <th className='w-[70px] text-center'>Total Install Price</th>
                                                    <th className='w-[100px] text-center'>Total Price</th>
                                                    <th className='w-[10px] text-center'>Supply</th>
                                                    <th className='w-[10px] text-center'>Install</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedSale.order.latest_quotation.packages.map((prodPackage: Package) => (
                                                    <React.Fragment key={prodPackage.id}>
                                                        <tr>
                                                            <td colSpan={10} className="bg-gray-200">{prodPackage.name}</td>
                                                        </tr>
                                                        {prodPackage.products.map((product) => {
                                                            const unitPrice = product.provisioning.supply.cogs + product.provisioning.install.cogs

                                                            return (
                                                                <tr key={product.id}>
                                                                    <td>{product.name}</td>
                                                                    <td>{product.description}</td>
                                                                    <td className="text-center">RM {product.provisioning.supply.cogs}</td>
                                                                    <td className="text-center">RM {product.provisioning.install.cogs}</td>
                                                                    <td className="text-center">{product.pivot.quantity}</td>
                                                                    <td className="text-center">
                                                                        {product.pivot.includeSupply ?
                                                                            <span>RM {product.provisioning.supply.cogs * product.pivot.quantity}</span>
                                                                            :
                                                                            '-'
                                                                        }
                                                                    </td>
                                                                    <td className="text-center">
                                                                        {product.pivot.includeInstall ?
                                                                            <span>RM {product.provisioning.install.cogs * product.pivot.quantity}</span>
                                                                            :
                                                                            '-'
                                                                        }
                                                                    </td>
                                                                    <td className="text-center">RM {
                                                                        ((product.pivot.includeSupply ? product.provisioning.supply.cogs : 0) + (product.pivot.includeInstall ? product.provisioning.install.cogs : 0)) * product.pivot.quantity
                                                                    }</td>
                                                                    <td className="text-center">
                                                                        <input
                                                                            className="checkbox"
                                                                            name="sel_prod"
                                                                            type="checkbox"
                                                                            checked={!!product.pivot.includeSupply}
                                                                            onChange={() => toggleProperty(product.id, prodPackage.id, 'supply')}
                                                                        />
                                                                    </td>
                                                                    <td className="text-center">
                                                                        <input
                                                                            className="checkbox"
                                                                            name="sel_prod"
                                                                            type="checkbox"
                                                                            checked={!!product.pivot.includeInstall}
                                                                            onChange={() => toggleProperty(product.id, prodPackage.id, 'install')}
                                                                        />
                                                                    </td>
                                                                </tr>
                                                            )
                                                        })}
                                                    </React.Fragment>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                        :
                        <div className="card w-full">
                            <div className="card-body flex flex-col">
                                <div className="flex flex-col">
                                    <div className="flex">
                                        <h2 className="text-lg font-semibold mb-4">Add Items</h2>
                                    </div>
                                    <div className="overflow-y-auto max-h-[500px] scrollable-y">
                                        <table className="table align-middle text-gray-700 font-medium text-2xs">
                                            <thead className="sticky top-0 bg-white z-5 rounded">
                                                <tr>
                                                    <th className='w-[10px]'></th>
                                                    <th className='w-[180px]'>Item</th>
                                                    <th className='w-[180px]'>Description</th>
                                                    <th className='w-[100px] text-center'>Supply Price/Qty</th>
                                                    <th className='w-[100px] text-center'>Install Price/Qty</th>
                                                    <th className='w-[70px] text-center'>Qty</th>
                                                    <th className='w-[100px] text-center'>Total Supply Price</th>
                                                    <th className='w-[100px] text-center'>Total Install Price</th>
                                                    <th className='w-[100px] text-center'>Total Price</th>
                                                    <th className='w-[10px] text-center'>Supply</th>
                                                    <th className='w-[10px] text-center'>Install</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedPOProducts.map((poProd: POItem, index) => (
                                                    <tr key={index}>
                                                        <td>
                                                            <button
                                                                className="btn btn-icon btn-sm"
                                                                onClick={() => handleRemovePOProduct(poProd.product_id)}
                                                            >
                                                                <i className="ki-filled ki-cross text-danger"></i>
                                                            </button>
                                                        </td>
                                                        <td>{poProd.product_name}</td>
                                                        <td>{poProd.product_desc}</td>
                                                        <td className="text-center">
                                                            RM {poProd.supply_price.toFixed(2)}
                                                        </td>
                                                        <td className="text-center">
                                                            RM {poProd.install_price.toFixed(2)}
                                                        </td>
                                                        <td className="text-center">
                                                            <input
                                                                type="text"
                                                                className="input input-sm text-center"
                                                                value={poProd.qty}
                                                                onChange={(e) => handleChangeQty(e, poProd.product_id)}
                                                                onInput={(e) => {
                                                                    // Only allow numbers in the input field
                                                                    e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
                                                                }}
                                                                onWheel={(e) => {
                                                                    // Prevent the default scroll behavior
                                                                    e.preventDefault();

                                                                    // Get the current quantity from the input
                                                                    const currentQty = Number(e.currentTarget.value);
                                                                    if (isNaN(currentQty)) return;

                                                                    // Adjust the quantity based on scroll direction
                                                                    if (e.deltaY < 0) {
                                                                        // Scroll up (increase quantity)
                                                                        handleChangeQty({ target: { value: String(currentQty + 1) } } as React.ChangeEvent<HTMLInputElement>, poProd.product_id);
                                                                    } else if (e.deltaY > 0) {
                                                                        // Scroll down (decrease quantity)
                                                                        if (currentQty > 1) {
                                                                            handleChangeQty({ target: { value: String(currentQty - 1) } } as React.ChangeEvent<HTMLInputElement>, poProd.product_id);
                                                                        }
                                                                    }
                                                                }}
                                                            />
                                                        </td>
                                                        <td className="text-center">
                                                            {poProd.supply ?
                                                                <span>RM {(poProd.supply_price * poProd.qty).toFixed(2)}</span>
                                                                :
                                                                '-'
                                                            }
                                                        </td>
                                                        <td className="text-center">
                                                            {poProd.install ?
                                                                <span>RM {(poProd.install_price * poProd.qty).toFixed(2)}</span>
                                                                :
                                                                '-'
                                                            }
                                                        </td>
                                                        <td className="text-center">
                                                            RM {
                                                                (((poProd.supply ? poProd.supply_price : 0) + (poProd.install ? poProd.install_price : 0)) * poProd.qty).toFixed(2)
                                                            }
                                                        </td>
                                                        <td className="text-center">
                                                            <input
                                                                className="checkbox"
                                                                name="sel_prod"
                                                                type="checkbox"
                                                                checked={!!poProd.supply}
                                                                onChange={() => togglePOItemProperty(Number(poProd.product_id), 'supply')}
                                                            />
                                                        </td>
                                                        <td className="text-center">
                                                            <input
                                                                className="checkbox"
                                                                name="sel_prod"
                                                                type="checkbox"
                                                                checked={!!poProd.install}
                                                                onChange={() => togglePOItemProperty(Number(poProd.product_id), 'install')}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                                <tr>
                                                    <td colSpan={11} className="bg-gray-200">
                                                        <button
                                                            className="btn btn-primary btn-sm"
                                                            data-modal-toggle="#add_item_modal"
                                                        >
                                                            Add Items
                                                        </button>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    }

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
            </div>

            <IncludePOItemsModal
                selectedPOProducts={selectedPOProducts}
                setSelectedPOProducts={setSelectedPOProducts}
                totalAmount={totalAmount}
                setTotalAmount={setTotalAmount}
            />
        </>
    );
}

export default CreatePO;