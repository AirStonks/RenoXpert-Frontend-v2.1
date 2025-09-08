import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Package, POItem, POPackage, Product, PurchaseOrder, RenoXSale, Sale, User } from "../../types";

import { fetchPo, fetchRenoSale, fetchSale, fetchSales, fetchUsers, updatePurchaseOrder, fetchPurchaseOrdersBySaleId } from "../../services/api";
import { Slide, toast } from "react-toastify";

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
    Layers,
    AlertCircle
} from "lucide-react";
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

    const [renoSale, setRenoSale] = useState<RenoXSale | null>(null);
    const [sales, setSales] = useState<Sale[]>([]);
    const [vendors, setVendors] = useState<User[]>([]);
    const [poDetail, setPoDetail] = useState<PurchaseOrder | null>(null);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [selectedVendor, setSelectedVendor] = useState<User | null>(null);
    const [totalAmount, setTotalAmount] = useState<number>(0);

    const [selectedPOPackages, setSelectedPOPackages] = useState<POPackage[]>([]);

    const [openAccordions, setOpenAccordions] = useState<{ [key: number]: boolean }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isRenoSaleLoading, setIsRenoSaleLoading] = useState(false);
    const [existingPurchaseOrders, setExistingPurchaseOrders] = useState<PurchaseOrder[]>([]);

    // Dropdown states
    const [isSalesDropdownOpen, setIsSalesDropdownOpen] = useState(false);
    const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);

    // New state variables for POProductModal
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
        fetchPurchaseOrderData();

        if (saleId) {
            console.log(saleId);

            handleSelectSale(null, saleId);
        }

        // Add click outside handler for dropdowns
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('[data-dropdown-container]')) {
                setIsVendorDropdownOpen(false);
                setIsSalesDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };

    }, [saleId]);

    // Recalculate whenever selectedPOPackages changes
    useEffect(() => {
        if (selectedPOPackages.length > 0) {
            recalculateTotalAmount();
        } else {
            setTotalAmount(0);
        }
    }, [selectedPOPackages]);

    useEffect(() => {
        if (poDetail && poDetail.reno_sale_id) {
            const fetchRenoSaleData = async () => {
                setIsRenoSaleLoading(true);
                try {
                    const response = await fetchRenoSale(Number(poDetail.reno_sale_id));
                    setRenoSale(response.data);
                    const filteredPurchaseOrders = response.data.purchase_orders.filter((po: PurchaseOrder) => Number(po.id) !== Number(poId));
                    setExistingPurchaseOrders(filteredPurchaseOrders);


                } catch (error) {
                    console.error('Failed to fetch reno sale:', error);
                    notify('error', 'Failed to fetch renovation sale data.');
                } finally {
                    setIsRenoSaleLoading(false);
                }
            }
            fetchRenoSaleData();
        }
    }, [poDetail])

    const handleOpenProductModal = (packageId: string) => {
        setActivePackageId(Number(packageId));
        setIsProductSelectorOpen(true);
    };

    const fetchPurchaseOrderData = async () => {
        setIsLoading(true);
        try {
            const response = await fetchPo(poId);
            const po = response.data;
            setPoDetail(po);
            setSelectedVendor(po.vendor);
            setSelectedPOPackages(po.po_packages || []);
            setTotalAmount(po.total_amount || 0);
            
            // Fetch the sale order using sale_id
            if (po.sale_id) {
                try {
                    const saleResponse = await fetchSale(Number(po.sale_id));
                    setSelectedSale(saleResponse.data);
                    console.log('Sale order loaded from sale_id:', saleResponse.data);
                } catch (saleError) {
                    console.error('Failed to fetch sale order:', saleError);
                    notify('error', 'Failed to fetch sale order data.');
                }
            }
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

        setSearchVendorTerm(term);

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

            try {
                // Fetch existing purchase orders for this sale (excluding current PO if editing)
                const existingPOsResponse = await fetchPurchaseOrdersBySaleId(updatedSale.id!);
                const allExistingPOs = existingPOsResponse.data || [];

                // Filter out the current PO being edited
                const filteredExistingPOs = poId ? allExistingPOs.filter((po: PurchaseOrder) => String(po.id) !== String(poId)) : allExistingPOs;
                setExistingPurchaseOrders(filteredExistingPOs);

                // Set POPackages with deduction logic
                const poPackages: POPackage[] = updatedSale.order.latest_quotation.packages.map((prodPackage: Package) => {
                    const poItems = prodPackage.products.map((product: Product) => {
                        // Calculate base quantities
                        const baseQuantity = product.pivot.quantity;
                        const baseSupplyQty = product.pivot.includeSupply ? baseQuantity : 0;
                        const baseInstallQty = product.pivot.includeInstall ? baseQuantity : 0;

                        // Calculate quantities already ordered in existing POs
                        let existingSupplyQty = 0;
                        let existingInstallQty = 0;

                        filteredExistingPOs.forEach((po: PurchaseOrder) => {
                            po.po_packages?.forEach((poPackage: POPackage) => {
                                if (String(poPackage.package_id) === String(prodPackage.id)) {
                                    poPackage.po_items?.forEach((poItem) => {
                                        if (String(poItem.product_id) === String(product.id)) {
                                            existingSupplyQty += poItem.supply_qty || 0;
                                            existingInstallQty += poItem.install_qty || 0;
                                        }
                                    });
                                }
                            });
                        });

                        // Deduct existing quantities from base quantities
                        const remainingSupplyQty = Math.max(0, baseSupplyQty - existingSupplyQty);
                        const remainingInstallQty = Math.max(0, baseInstallQty - existingInstallQty);

                        return {
                            product_id: String(product.id),
                            product_name: product.name,
                            product_desc: product.description,
                            qty: baseQuantity,
                            uom: product.uom,
                            supply_qty: remainingSupplyQty,
                            install_qty: remainingInstallQty,
                            supply: product.pivot.includeSupply,
                            install: product.pivot.includeInstall,
                            unit_price: product.provisioning.supply.cogs + product.provisioning.install.cogs,
                            supply_price: product.provisioning.supply.cogs,
                            install_price: product.provisioning.install.cogs,
                            total_price: (product.provisioning.supply.cogs + product.provisioning.install.cogs) * baseQuantity,
                        };
                    });

                    // Filter out items that are fully issued (0 remaining quantities for both supply and install)
                    const filteredPoItems = poItems.filter((item) => {
                        const supplyQty = item.supply_qty || 0;
                        const installQty = item.install_qty || 0;
                        return supplyQty > 0 || installQty > 0;
                    });

                    const newPOPackage: POPackage = {
                        package_id: String(prodPackage.id),
                        name: prodPackage.name,
                        description: prodPackage.description,
                        description_internal: prodPackage.description_internal || null,
                        category: prodPackage.category || null,
                        quantity: prodPackage.quantity || 1,
                        status: 'pending',
                        po_items: filteredPoItems
                    };

                    return {
                        ...newPOPackage,
                        total_price: calculatePackageTotal({ ...newPOPackage, po_items: filteredPoItems }),
                    }
                });

                // Filter out packages where all items are fully issued (0 remaining quantities)
                const filteredPoPackages = poPackages.filter((poPackage) => {
                    // Check if any item in the package has remaining quantities
                    return poPackage.po_items?.some((item) => {
                        const supplyQty = item.supply_qty || 0;
                        const installQty = item.install_qty || 0;
                        return supplyQty > 0 || installQty > 0;
                    });
                });

                setSelectedPOPackages(filteredPoPackages);
                setSelectedSale(updatedSale);
                setSearchSaleTerm('');
                setSales([]);
                recalculateTotalAmount();
            } catch (error) {
                console.error('Error fetching existing purchase orders:', error);
                notify('error', 'Failed to fetch existing purchase orders');

                // Fallback to original logic if API call fails
                const poPackages: POPackage[] = updatedSale.order.latest_quotation.packages.map((prodPackage: Package) => {
                    const poItems = prodPackage.products.map((product: Product) => ({
                        product_id: String(product.id),
                        product_name: product.name,
                        product_desc: product.description,
                        qty: product.pivot.quantity,
                        uom: product.uom,
                        supply_qty: product.pivot.includeSupply ? product.pivot.quantity : 0,
                        install_qty: product.pivot.includeInstall ? product.pivot.quantity : 0,
                        supply: product.pivot.includeSupply,
                        install: product.pivot.includeInstall,
                        unit_price: product.provisioning.supply.cogs + product.provisioning.install.cogs,
                        supply_price: product.provisioning.supply.cogs,
                        install_price: product.provisioning.install.cogs,
                        total_price: (product.provisioning.supply.cogs + product.provisioning.install.cogs) * product.pivot.quantity,
                    }));

                    // Filter out items that are fully issued (0 remaining quantities for both supply and install)
                    const filteredPoItems = poItems.filter((item) => {
                        const supplyQty = item.supply_qty || 0;
                        const installQty = item.install_qty || 0;
                        return supplyQty > 0 || installQty > 0;
                    });

                    const newPOPackage: POPackage = {
                        package_id: String(prodPackage.id),
                        name: prodPackage.name,
                        description: prodPackage.description,
                        description_internal: prodPackage.description_internal || null,
                        category: prodPackage.category || null,
                        quantity: prodPackage.quantity || 1,
                        status: 'pending',
                        po_items: filteredPoItems
                    };

                    return {
                        ...newPOPackage,
                        total_price: calculatePackageTotal({ ...newPOPackage, po_items: filteredPoItems }),
                    }
                });

                // Filter out packages where all items are fully issued (0 remaining quantities)
                const filteredPoPackages = poPackages.filter((poPackage) => {
                    // Check if any item in the package has remaining quantities
                    return poPackage.po_items?.some((item) => {
                        const supplyQty = item.supply_qty || 0;
                        const installQty = item.install_qty || 0;
                        return supplyQty > 0 || installQty > 0;
                    });
                });

                setSelectedPOPackages(filteredPoPackages);
                setSelectedSale(updatedSale);
                setSearchSaleTerm('');
                setSales([]);
                recalculateTotalAmount();
            }
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

    const updateProductSupplyQuantity = (productId: number, packageId: number, newSupplyQuantity: number) => {
        const maxAllowed = getMaxSupplyQuantity(productId, packageId);
        const clampedQuantity = Math.max(0, Math.min(newSupplyQuantity, maxAllowed));

        const newSelectedPackages = selectedPOPackages.map((item) =>
            Number(item.package_id) === packageId
                ? {
                    ...item,
                    po_items: item.po_items.map((product) =>
                        Number(product.product_id) === productId
                            ? {
                                ...product,
                                supply_qty: clampedQuantity,
                                total_price: (
                                    clampedQuantity * (product.supply_price || 0) +
                                    (product.install_qty || 0) * (product.install_price || 0)
                                ),
                            }
                            : product,
                    ),
                }
                : item,
        );

        // Filter out items with 0 supply_qty and install_qty from each package
        const packagesWithFilteredItems = newSelectedPackages.map(pkg => ({
            ...pkg,
            po_items: pkg.po_items.filter(item => {
                const supplyQty = item.supply_qty || 0
                const installQty = item.install_qty || 0
                return supplyQty > 0 || installQty > 0
            })
        }))

        // Filter out packages where all items have 0 quantity for both supply_qty and install_qty
        const packagesWithNonZeroQuantities = packagesWithFilteredItems.filter(pkg => {
            return pkg.po_items.some(item => {
                const supplyQty = item.supply_qty || 0
                const installQty = item.install_qty || 0
                return supplyQty > 0 || installQty > 0
            })
        })

        setSelectedPOPackages(packagesWithNonZeroQuantities);
    };

    const updateProductInstallQuantity = (productId: number, packageId: number, newInstallQuantity: number) => {
        const maxAllowed = getMaxInstallQuantity(productId, packageId);
        const clampedQuantity = Math.max(0, Math.min(newInstallQuantity, maxAllowed));

        const newSelectedPackages = selectedPOPackages.map((item) =>
            Number(item.package_id) === packageId
                ? {
                    ...item,
                    po_items: item.po_items.map((product) =>
                        Number(product.product_id) === productId
                            ? {
                                ...product,
                                install_qty: clampedQuantity,
                                total_price: (
                                    (product.supply_qty || 0) * (product.supply_price || 0) +
                                    clampedQuantity * (product.install_price || 0)
                                ),
                            }
                            : product,
                    ),
                }
                : item,
        );

        // Filter out items with 0 supply_qty and install_qty from each package
        const packagesWithFilteredItems = newSelectedPackages.map(pkg => ({
            ...pkg,
            po_items: pkg.po_items.filter(item => {
                const supplyQty = item.supply_qty || 0
                const installQty = item.install_qty || 0
                return supplyQty > 0 || installQty > 0
            })
        }))

        // Filter out packages where all items have 0 quantity for both supply_qty and install_qty
        const packagesWithNonZeroQuantities = packagesWithFilteredItems.filter(pkg => {
            return pkg.po_items.some(item => {
                const supplyQty = item.supply_qty || 0
                const installQty = item.install_qty || 0
                return supplyQty > 0 || installQty > 0
            })
        })

        setSelectedPOPackages(packagesWithNonZeroQuantities);
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

    // Helper function to get existing PO information for display
    const getExistingPOInfo = () => {
        if (existingPurchaseOrders.length === 0) return null;

        return {
            count: existingPurchaseOrders.length,
            totalAmount: existingPurchaseOrders.reduce((sum, po) => sum + (po.total_amount || 0), 0),
            poNumbers: existingPurchaseOrders.map(po => po.po_no).filter(Boolean)
        };
    };

    // Helper function to get PO numbers and quantities that contributed to deduction for a specific product
    const getDeductionPONumbers = (packageId: number, productId: number, deductionType: 'supply' | 'install') => {
        const poDeductions: { po_no: string; qty: number }[] = [];

        existingPurchaseOrders.forEach((po: PurchaseOrder) => {
            po.po_packages?.forEach((poPackage: POPackage) => {
                if (String(poPackage.package_id) === String(packageId)) {
                    poPackage.po_items?.forEach((poItem) => {
                        if (String(poItem.product_id) === String(productId)) {
                            const qty = deductionType === 'supply' ? (poItem.supply_qty || 0) : (poItem.install_qty || 0);
                            if (qty > 0 && po.po_no) {
                                poDeductions.push({ po_no: po.po_no, qty });
                            }
                        }
                    });
                }
            });
        });

        return poDeductions;
    };

    // Helper function to get maximum allowed quantity for supply_qty
    const getMaxSupplyQuantity = (productId: number, packageId: number) => {
        const product = selectedPOPackages
            .find(pkg => Number(pkg.package_id) === packageId)
            ?.po_items?.find(item => Number(item.product_id) === productId);

        if (!product) return 0;

        // Get existing PO deductions for this product
        const deductions = getDeductionPONumbers(packageId, productId, 'supply');
        const totalDeducted = deductions.reduce((sum, d) => sum + d.qty, 0);

        // Maximum allowed is base quantity minus existing PO quantities
        // The base quantity is the original quantity from the sale order (product.qty)
        const baseQuantity = product.qty || 0;
        return Math.max(0, baseQuantity - totalDeducted);
    };

    // Helper function to get maximum allowed quantity for install_qty
    const getMaxInstallQuantity = (productId: number, packageId: number) => {
        const product = selectedPOPackages
            .find(pkg => Number(pkg.package_id) === packageId)
            ?.po_items?.find(item => Number(item.product_id) === productId);

        if (!product) return 0;

        // Get existing PO deductions for this product
        const deductions = getDeductionPONumbers(packageId, productId, 'install');
        const totalDeducted = deductions.reduce((sum, d) => sum + d.qty, 0);

        // Maximum allowed is base quantity minus existing PO quantities
        // The base quantity is the original quantity from the sale order (product.qty)
        const baseQuantity = product.qty || 0;
        return Math.max(0, baseQuantity - totalDeducted);
    };

    const toggleAccordion = (packageId: number) => {
        setOpenAccordions(prev => ({
            ...prev,
            [packageId]: !prev[packageId]
        }));
    };



    // Helper functions for POProductModal

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

    const removeProductFromPackage = (productId: number, packageId: number) => {
        const newSelectedPackages = selectedPOPackages.map((item) =>
            Number(item.package_id) === packageId
                ? {
                    ...item,
                    po_items: item.po_items.filter((product) => Number(product.product_id) !== productId),
                }
                : item,
        );

        // Filter out packages where all items have 0 quantity for both supply_qty and install_qty
        const packagesWithNonZeroQuantities = newSelectedPackages.filter(pkg => {
            return pkg.po_items.some(item => {
                const supplyQty = item.supply_qty || 0
                const installQty = item.install_qty || 0
                return supplyQty > 0 || installQty > 0
            })
        })

        setSelectedPOPackages(packagesWithNonZeroQuantities);
        recalculateTotalAmount();
    };

    const removePackage = (packageId: number) => {
        setSelectedPOPackages(prev => prev.filter(pkg => Number(pkg.package_id) !== packageId));
        recalculateTotalAmount();
    };

    const getRemainingPackages = () => {
        if (!selectedSale) return [];

        const currentPackageIds = selectedPOPackages.map(pkg => Number(pkg.package_id));

        const allPackages = selectedSale.order.latest_quotation.packages;

        // Filter out packages that are already in the current PO
        const packagesNotInCurrentPO = allPackages.filter(pkg => !currentPackageIds.includes(pkg.id));

        // Further filter out packages that are fully issued by other POs
        return packagesNotInCurrentPO.filter((prodPackage: Package) => {
            // Check if any product in this package has remaining quantities
            return prodPackage.products.some((product: Product) => {
                // Calculate base quantities
                const baseQuantity = product.pivot.quantity;
                const baseSupplyQty = product.pivot.includeSupply ? baseQuantity : 0;
                const baseInstallQty = product.pivot.includeInstall ? baseQuantity : 0;

                // Calculate quantities already ordered in existing POs
                let existingSupplyQty = 0;
                let existingInstallQty = 0;

                existingPurchaseOrders.forEach((po: PurchaseOrder) => {
                    po.po_packages?.forEach((poPackage: POPackage) => {
                        if (String(poPackage.package_id) === String(prodPackage.id)) {
                            poPackage.po_items?.forEach((poItem) => {
                                if (String(poItem.product_id) === String(product.id)) {
                                    existingSupplyQty += poItem.supply_qty || 0;
                                    existingInstallQty += poItem.install_qty || 0;
                                }
                            });
                        }
                    });
                });

                // Check if there are remaining quantities
                const remainingSupplyQty = Math.max(0, baseSupplyQty - existingSupplyQty);
                const remainingInstallQty = Math.max(0, baseInstallQty - existingInstallQty);

                return remainingSupplyQty > 0 || remainingInstallQty > 0;
            });
        });
    };

    const addRemainingPackages = () => {
        const remainingPackages = getRemainingPackages();
        if (remainingPackages.length === 0) return;

        // Convert remaining packages to PO packages format with deduction logic
        const newPOPackages = remainingPackages.map((prodPackage: Package) => {
            const poItems = prodPackage.products.map((product: Product) => {
                // Calculate base quantities
                const baseQuantity = product.pivot.quantity;
                const baseSupplyQty = product.pivot.includeSupply ? baseQuantity : 0;
                const baseInstallQty = product.pivot.includeInstall ? baseQuantity : 0;

                // Calculate quantities already ordered in existing POs
                let existingSupplyQty = 0;
                let existingInstallQty = 0;

                existingPurchaseOrders.forEach((po: PurchaseOrder) => {
                    po.po_packages?.forEach((poPackage: POPackage) => {
                        if (String(poPackage.package_id) === String(prodPackage.id)) {
                            poPackage.po_items?.forEach((poItem) => {
                                if (String(poItem.product_id) === String(product.id)) {
                                    existingSupplyQty += poItem.supply_qty || 0;
                                    existingInstallQty += poItem.install_qty || 0;
                                }
                            });
                        }
                    });
                });

                // Deduct existing quantities from base quantities
                const remainingSupplyQty = Math.max(0, baseSupplyQty - existingSupplyQty);
                const remainingInstallQty = Math.max(0, baseInstallQty - existingInstallQty);

                return {
                    product_id: String(product.id),
                    product_name: product.name,
                    product_desc: product.description,
                    qty: baseQuantity,
                    uom: product.uom,
                    supply_qty: remainingSupplyQty,
                    install_qty: remainingInstallQty,
                    supply: product.pivot.includeSupply,
                    install: product.pivot.includeInstall,
                    unit_price: product.provisioning.supply.cogs + product.provisioning.install.cogs,
                    supply_price: product.provisioning.supply.cogs,
                    install_price: product.provisioning.install.cogs,
                    total_price: (product.provisioning.supply.cogs + product.provisioning.install.cogs) * baseQuantity,
                };
            });

            // Filter out items that are fully issued (0 remaining quantities for both supply and install)
            const filteredPoItems = poItems.filter((item) => {
                const supplyQty = item.supply_qty || 0;
                const installQty = item.install_qty || 0;
                return supplyQty > 0 || installQty > 0;
            });

            const newPOPackage: POPackage = {
                package_id: String(prodPackage.id),
                name: prodPackage.name,
                description: prodPackage.description,
                description_internal: prodPackage.description_internal || null,
                category: prodPackage.category || null,
                quantity: prodPackage.quantity || 1,
                status: 'pending',
                po_items: filteredPoItems
            };

            return {
                ...newPOPackage,
                total_price: calculatePackageTotal({ ...newPOPackage, po_items: filteredPoItems }),
            };
        });

        // Filter out packages where all items are fully issued (0 remaining quantities)
        const filteredNewPackages = newPOPackages.filter((poPackage) => {
            // Check if any item in the package has remaining quantities
            return poPackage.po_items?.some((item) => {
                const supplyQty = item.supply_qty || 0;
                const installQty = item.install_qty || 0;
                return supplyQty > 0 || installQty > 0;
            });
        });

        setSelectedPOPackages(prev => [...prev, ...filteredNewPackages]);
        recalculateTotalAmount();
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
                                            <div className="relative w-full" data-dropdown-container>
                                                <button
                                                    onClick={() => {
                                                        setIsSalesDropdownOpen(!isSalesDropdownOpen);
                                                        if (!isSalesDropdownOpen) {
                                                            // Load sales when opening dropdown
                                                            fetchSales('', 15).then(data => {
                                                                setSales(data.data);
                                                            }).catch(error => {
                                                                console.error('Failed to fetch sales:', error);
                                                            });
                                                        }
                                                    }}
                                                    className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                                >
                                                    <span>{selectedSale ? selectedSale.sales_no : 'Select a Sales Order'}</span>
                                                    <Search className="w-4 h-4 text-gray-500" />
                                                </button>

                                                {isSalesDropdownOpen && (
                                                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
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
                                                        <div className="flex flex-col max-h-48 overflow-y-auto">
                                                            {sales.length > 0 ? (
                                                                sales.map((sale, key) => (
                                                                    <button
                                                                        key={key}
                                                                        className="px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                                                        onClick={() => {
                                                                            handleSelectSale(sale);
                                                                            setIsSalesDropdownOpen(false);
                                                                        }}
                                                                    >
                                                                        {sale.sales_no} ({sale.order.property.name} {sale.order.block}-{sale.order.floor}-{sale.order.unit_no})
                                                                    </button>
                                                                ))
                                                            ) : (
                                                                <div className="px-3 py-2 text-sm text-gray-500">
                                                                    No sale orders found
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
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

                                        <div className="relative w-full">
                                            <button
                                                onClick={() => {
                                                    setIsVendorDropdownOpen(!isVendorDropdownOpen);
                                                    if (!isVendorDropdownOpen) {
                                                        // Load vendors when opening dropdown
                                                        fetchUsers('', 'backend-vendor').then(data => {
                                                            setVendors(data.data);
                                                        }).catch(error => {
                                                            console.error('Failed to fetch vendors:', error);
                                                        });
                                                    }
                                                }}
                                                className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                            >
                                                <span>{selectedVendor ? selectedVendor.name : 'Select a Vendor'}</span>
                                                <Search className="w-4 h-4 text-gray-500" />
                                            </button>

                                            {isVendorDropdownOpen && (
                                                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
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
                                                    <div className="flex flex-col max-h-48 overflow-y-auto">
                                                        {vendors.length > 0 ? (
                                                            vendors.map((vendor, key) => (
                                                                <button
                                                                    key={key}
                                                                    className="px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                                                    onClick={() => {
                                                                        handleSelectVendor(vendor);
                                                                        setIsVendorDropdownOpen(false);
                                                                    }}
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
                                            )}
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

                                        {/* Existing PO Information */}
                                        {getExistingPOInfo() && (
                                            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <AlertCircle className="h-5 w-5 text-blue-600" />
                                                    <span className="text-sm font-semibold text-blue-800">
                                                        Existing Purchase Orders
                                                    </span>
                                                </div>
                                                <div className="text-sm text-blue-700 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">Count:</span>
                                                        <span>{getExistingPOInfo()?.count} PO(s) already created</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">Total Amount:</span>
                                                        <span>RM {getExistingPOInfo()?.totalAmount.toLocaleString()}</span>
                                                    </div>
                                                    {getExistingPOInfo()?.poNumbers.length > 0 && (
                                                        <div className="flex items-start gap-2">
                                                            <span className="font-medium mt-0.5">PO Numbers:</span>
                                                            <span className="break-all">{getExistingPOInfo()?.poNumbers.join(", ")}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Add Remaining Packages Button */}
                                        {getRemainingPackages().length > 0 && (
                                            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <PackageIcon className="h-5 w-5 text-green-600" />
                                                        <span className="text-sm font-semibold text-green-800">
                                                            Remaining Packages Available
                                                        </span>
                                                    </div>
                                                    <span className="text-sm text-green-700 font-medium">
                                                        {getRemainingPackages().length} package(s)
                                                    </span>
                                                </div>
                                                <div className="text-sm text-green-700 mb-3">
                                                    There are {getRemainingPackages().length} package(s) from this sale that haven't been added to this PO yet.
                                                </div>
                                                <button
                                                    onClick={addRemainingPackages}
                                                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                    Add All Remaining Packages
                                                </button>
                                            </div>
                                        )}
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

                        {/* Renovation Sale Card */}
                        {poDetail?.reno_sale_id && (
                            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200/50 bg-gradient-to-r from-cyan-50/50 to-blue-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-cyan-100 rounded-lg">
                                            <FileText className="h-5 w-5 text-cyan-600" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">Renovation Sale</h3>
                                    </div>
                                </div>
                                <div className="p-6">
                                    {isRenoSaleLoading ? (
                                        <div className="flex items-center justify-center py-4">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-600"></div>
                                            <span className="ml-2 text-sm text-gray-600">Loading renovation sale data...</span>
                                        </div>
                                    ) : renoSale ? (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Reno Sale No:</span>
                                                <span className="text-sm font-medium text-gray-900">{renoSale.reno_sale_no}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Status:</span>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium
                                                    ${renoSale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''} 
                                                    ${renoSale.status === 'approved' ? 'bg-green-100 text-green-800' : ''} 
                                                    ${renoSale.status === 'active' ? 'bg-blue-100 text-blue-800' : ''}
                                                    ${renoSale.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}`}
                                                >
                                                    {renoSale.status}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Sale Amount:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    RM {renoSale.sale_total_amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Sale Paid:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    RM {renoSale.sale_paid_amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Sale Progress:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {(renoSale.sale_paid_percentage * 100)?.toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">PO Amount:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    RM {renoSale.po_total_amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">PO Paid:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    RM {renoSale.po_paid_amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">PO Progress:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {(renoSale.po_paid_percentage * 100)?.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-gray-600">No renovation sale data available</div>
                                    )}
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

                                </div>
                            </div>
                            <div className="p-6">
                                <div className="flex flex-col gap-4">

                                    {selectedPOPackages.map((poPackage: POPackage) => (
                                        <SortablePOPackage
                                            key={poPackage.package_id}
                                            poPackage={poPackage}
                                            existingPoPackages={selectedPOPackages}
                                            handleOpenProductModal={handleOpenProductModal}
                                            updateProductSupplyQuantity={updateProductSupplyQuantity}
                                            updateProductInstallQuantity={updateProductInstallQuantity}
                                            removeProduct={removeProductFromPackage}
                                            removePackage={removePackage}
                                            handleChangeQty={handleChangeQty}
                                            openAccordions={openAccordions}
                                            toggleAccordion={(packageId: string) => toggleAccordion(Number(packageId))}
                                            getDeductionPONumbers={getDeductionPONumbers}
                                            getMaxSupplyQuantity={getMaxSupplyQuantity}
                                            getMaxInstallQuantity={getMaxInstallQuantity}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>




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