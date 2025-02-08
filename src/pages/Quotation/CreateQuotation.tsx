// src\pages\Quotation\CreateQuotation.tsx

import React, { useEffect, useRef, useState } from 'react';
import { toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import InputFieldGroup from '../../components/Forms/TextFields/InputFieldGroup';
import IncludePackageModal from '../../components/Modals/IncludePackageModal';
import { Package, Product, Property, Quotation } from '../../types';
import { createQuotation, fetchProperties } from '../../services/api';
import IncludeQuotationProductModal from '../../components/Modals/IncludeQuotationProductModal';
import { KTDropdown } from '../../metronic/core';
import Loading from '../../components/Loading';

const categoryOptions = [
    { value: "renovation", label: "Renovation" },
    { value: "partition", label: "Partition" },
    { value: "carpentry", label: "Carpentry" },
    { value: "furniture", label: "Furniture" },
    { value: "electrical_appliances", label: "Electrical Appliances" },
    { value: "air_conditioning", label: "Air Conditioning" },
    { value: "smart_iot", label: "Smart IoT" },
    { value: "project_management", label: "Project Management" },
    { value: "loose_items", label: "Loose Items" },
    { value: "others", label: "Others" },
];

function CreateQuotation() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        quotationName: '',
        quotationPrice: 0,
        is_ready: false,
        description: '',
    });

    const qtyBtnRef = useRef(null);
    const inputPropertyRef = useRef(null);

    const [searchPropertyTerm, setSearchPropertyTerm] = useState('');
    const [properties, setProperties] = useState<Property[]>([]);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [selectedPackages, setSelectedPackages] = useState<Package[]>([]);
    const [totalAmount, setTotalAmount] = useState<number>(0);

    const [isLoading, setIsLoading] = useState(false);

    const handleBackClick = () => {
        localStorage.removeItem('include_packages');
        localStorage.removeItem('packages_data');
        localStorage.removeItem('packages_table');
        localStorage.removeItem('products_data');
        localStorage.removeItem('products_table');
        navigate('/quotations');
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
        document.title = "Create Quotation | RenoXpert";

        const storedPackages = localStorage.getItem('include_packages');

        if (storedPackages) {
            const selectedPackages: Package[] = JSON.parse(storedPackages);
            setSelectedPackages(selectedPackages);

            const totalAmount = selectedPackages.reduce((sum, prodPackage) => {
                return sum + prodPackage.total_price;
            }, 0);

            setTotalAmount(totalAmount);
        }

        setFormData(prevData => ({
            ...prevData,
            quotationPrice: totalAmount, // Sync quotationPrice with totalAmount
        }));

        initDropdown();

    }, [totalAmount]);

    const initDropdown = async () => {
        const propertyEl = document.querySelector('#property_dropdown') as HTMLElement;
        const propertyDropdown = KTDropdown.getInstance(propertyEl);

        propertyDropdown.on('shown', async () => {
            inputPropertyRef.current.focus();
            try {
                const data = await fetchProperties('', 6);
                setProperties(data.data);

            } catch (error) {
                console.error('Failed to fetch quotations:', error);
            }
        });
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleVisibilityToggle = (id: number) => {
        setSelectedPackages((prevPackages) => {
            const updatedPackages = prevPackages.map((prodPackage) => {
                // Check if the package has the product to toggle
                const updatedProducts = prodPackage.products.map((product) => {
                    if (product.id === id) {
                        // Toggle the visibility of the product
                        return { ...product, pivot: { ...product.pivot, visibility: !product.pivot.visibility } };
                    }
                    return product; // Return the original product if not matched
                });

                // Calculate the new total price based on the updated products
                const newTotalPrice = updatedProducts.reduce((sum, product) => {
                    return sum + (product.provisioning.supply.retail_price * product.pivot.quantity) + (product.provisioning.install.retail_price * product.pivot.quantity);
                }, 0);

                return {
                    ...prodPackage,
                    products: updatedProducts,
                    total_price: newTotalPrice // Update total price for the package
                };
            });

            // Update localStorage with the new state
            updateLocalStorage(updatedPackages);

            return updatedPackages; // Return the updated packages
        });
    };

    // PENDING
    const handleSubmit = async () => {

        setIsLoading(true);

        if (selectedProperty === null) {
            notify('error', "Please select a property");
            setIsLoading(false);
            return;
        }

        if (formData.quotationName === '') {
            notify('error', "Please enter a quotation name");
            setIsLoading(false);
            return;
        }

        const storedPackages = localStorage.getItem('include_packages');
        const parsedPackages = JSON.parse(storedPackages);

        const packagesData = parsedPackages.map(pkg => ({
            package_id: pkg.id,
            quantity: pkg.quantity,
            products: pkg.products.map(product => ({
                product_id: product.id,
                quantity: product.pivot.quantity,
                visibility: product.pivot.visibility
            }))
        }));

        if (packagesData === null || packagesData.length === 0) {
            notify('error', "Please select at least one package");
            setIsLoading(false);
            return;
        }

        // const metadata;
        const newMetadata = parsedPackages.map((pkg: Package) => ({
            id: pkg.id,
            name: pkg.name,
            description: pkg.description,
            description_internal: pkg.description_internal,
            category: pkg.category,
            total_price: pkg.total_price,
            quantity: pkg.quantity,
            products: pkg.products.map((product: Product) => (product))
        }));

        setFormData(prevState => {
            const updatedState = {
                ...prevState,
                metadata: newMetadata
            };
            return updatedState;
        });

        const quotationData: Quotation = {
            name: formData.quotationName,
            property_id: selectedProperty.id,
            description: formData.description,
            is_ready: formData.is_ready,
            total_amount: formData.quotationPrice,
        }

        try {
            const response = await createQuotation(quotationData, packagesData);

            if (response?.success) {
                notify('success', "Quotation Created Successfully!");
                localStorage.removeItem('include_packages');
                setIsLoading(false);
                navigate('/quotations');
            } else {
                console.log(response);
            }
        } catch (error) {
            console.log(error);
        }

        setIsLoading(false);
    };

    const openAddPackageModal = () => {
        const datatableEl = document.querySelector('#packages_table') as HTMLElement;
        if (datatableEl) {
            const datatable = (datatableEl as any).instance;

            if (datatable) {
                datatable.reload();
            }
        }
    };

    const openAddProductModal = (event) => {

        // Get selected package id
        const id = event.currentTarget.getAttribute('data-id');

        const includePackages = localStorage.getItem('include_packages');
        const packages = JSON.parse(includePackages);

        const selectedPackage = packages.find(pkg => pkg.id === Number(id));

        if (selectedPackage) {

            const selectedProducts = selectedPackage.products.map(product => ({
                id: product.id,
                name: product.name,
                quantity: product.pivot.quantity,
                price: product.price,
                includeSupply: true,
                includeInstall: true,
                description: product.description || "N/A" // Using "N/A" for null descriptions
            }));

            localStorage.setItem('selected_quotation_packages', includePackages);
            localStorage.setItem('quotation:selected_package_id', JSON.stringify(selectedPackage.id))
            localStorage.setItem('include_quotation_pack_prods', JSON.stringify(selectedProducts))

            const datatableEl = document.querySelector('#products_table') as HTMLElement;
            if (datatableEl) {
                const datatable = (datatableEl as any).instance;

                if (datatable) {
                    datatable.reload();
                }
            }

        } else {
            console.log('Package not found');
        }
    };

    const handleSearchProperty = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const term = event.target.value;
        setSearchPropertyTerm(term);

        try {
            const data = await fetchProperties(term, 6); // Assuming you have a similar fetch function
            setProperties(data.data);
        } catch (error) {
            console.error('Error fetching properties:', error);
        }
    };

    const handleSelectProperty = async (property: Property) => {
        setFormData((prev) => ({
            ...prev,
            propertyId: property.id,
        }));
        setSelectedProperty(property);
        setSearchPropertyTerm('');
        setProperties([]);
        localStorage.setItem('create_order_data', JSON.stringify(formData));
    };

    const toggleIsReady = () => {
        setFormData((prevData) => ({
            ...prevData,
            is_ready: !prevData.is_ready
        }));
    };

    const updateSelectedPackages = (packages) => {
        const updatedPackages = packages.map((prodPackage: Package) => {
            const totalPrice = prodPackage.products.reduce((sum, product) => {

                return sum + (product.provisioning.supply.retail_price * product.pivot.quantity) + (product.provisioning.install.retail_price * product.pivot.quantity);
            }, 0);

            return {
                ...prodPackage,
                total_price: totalPrice // Calculate total price
            };
        });

        setSelectedPackages(updatedPackages);
        const newTotalAmount = calculateTotalAmount(updatedPackages);
        setTotalAmount(newTotalAmount); // Update totalAmount
        updateLocalStorage(updatedPackages);
    };

    const updateLocalStorage = (packages) => {
        localStorage.setItem('include_packages', JSON.stringify(packages));
    };

    const adjustPackageQuantity = (packId: number, action: 'increase' | 'decrease') => {
        setSelectedPackages((prevPackages: Package[]) => {
            const updatedPackages = prevPackages.map((prodPackage) => {
                if (prodPackage.id === packId) {
                    const newTotalPrice = prodPackage.products.reduce((sum, product) => {
                        return sum + (product.provisioning.supply.retail_price * product.pivot.quantity) + (product.provisioning.install.retail_price * product.pivot.quantity);
                    }, 0);

                    return {
                        ...prodPackage,
                        total_price: newTotalPrice * (action === 'increase' ? prodPackage.quantity + 1 : Math.max(1, prodPackage.quantity - 1)), // Update total price
                        quantity: action === 'increase' ? prodPackage.quantity + 1 : Math.max(1, prodPackage.quantity - 1)
                    };
                }
                return prodPackage; // Return the original package if not matched
            });

            const newTotalAmount = calculateTotalAmount(updatedPackages);
            setTotalAmount(newTotalAmount); // Update totalAmount
            updateLocalStorage(updatedPackages);
            return updatedPackages;
        });
    };

    const adjustQuantity = (prodId: number, packId: number, action: 'increase' | 'decrease') => {
        setSelectedPackages((prevPackages: Package[]) => {
            const updatedPackages = prevPackages.map((prodPackage) => {
                if (prodPackage.id === packId) {
                    const updatedProducts = prodPackage.products.map((product) => {
                        if (product.id === prodId) {
                            const newQty = action === 'increase'
                                ? product.pivot.quantity + 1
                                : Math.max(1, product.pivot.quantity - 1);

                            return {
                                ...product,
                                pivot: {
                                    ...product.pivot,
                                    quantity: newQty
                                }
                            };
                        }
                        return product; // Return the original product if not matched
                    });

                    const newTotalPrice = updatedProducts.reduce((sum, product) => {
                        return sum + (product.provisioning.supply.retail_price * product.pivot.quantity) + (product.provisioning.install.retail_price * product.pivot.quantity);
                    }, 0);

                    return {
                        ...prodPackage,
                        products: updatedProducts,
                        total_price: newTotalPrice * prodPackage.quantity // Update total price
                    };
                }
                return prodPackage; // Return the original package if not matched
            });

            const newTotalAmount = calculateTotalAmount(updatedPackages);
            setTotalAmount(newTotalAmount); // Update totalAmount
            updateLocalStorage(updatedPackages);
            return updatedPackages;
        });
    };

    const handleRemoveProduct = (prodId: number, packId: number) => {

        setSelectedPackages((prevPackages: Package[]) => {
            const updatedPackages = prevPackages.map((prodPackage: Package) => {
                if (Number(prodPackage.id) === packId) {
                    const updatedProducts = prodPackage.products.filter((product: Product) => product.id !== prodId);

                    const newTotalPrice = updatedProducts.reduce((sum, product) => {
                        return sum + (product.provisioning.supply.retail_price * product.pivot.quantity) + (product.provisioning.install.retail_price * product.pivot.quantity);
                    }, 0);

                    return {
                        ...prodPackage,
                        products: updatedProducts,
                        total_price: newTotalPrice // Update total price
                    };
                }
                return prodPackage; // Return the original package if not matched
            });

            const newTotalAmount = calculateTotalAmount(updatedPackages);
            setTotalAmount(newTotalAmount); // Update totalAmount
            updateLocalStorage(updatedPackages);
            return updatedPackages;
        });
    };

    const handleRemovePackage = (packId: number) => {
        setSelectedPackages((prevPackages: Package[]) => {
            // Filter out the package with the matching packId
            const updatedPackages = prevPackages.filter((prodPackage: Package) => prodPackage.id !== packId);

            // Calculate new total amount after removing the package
            const newTotalAmount = calculateTotalAmount(updatedPackages);
            setTotalAmount(newTotalAmount); // Update totalAmount

            updateLocalStorage(updatedPackages); // Update localStorage
            return updatedPackages;
        });
    };

    const calculateTotalAmount = (packages: Package[]) => {
        return packages.reduce((sum, pkg) => sum + pkg.total_price, 0);
    };


    return (
        <>
            {isLoading && <Loading />}

            <div className="flex justify-between items-center flex-wrap mb-6">
                <div className="flex gap-4 items-center">
                    <button className='text-gray-800 dark:text-gray-400' onClick={handleBackClick}>
                        <i className="ki-solid ki-arrow-left"></i>
                    </button>
                    <span className="text-2xl font-bold text-gray-900">
                        Create New Quotation Template
                    </span>
                </div>
            </div>

            <div className="flex flex-wrap gap-8 mb-8">
                <div className="flex flex-col flex-[3] gap-8">
                    <div className="card">
                        <div className="card-body">
                            <h2 className='text-xl mb-4 font-semibold text-gray-900'>General</h2>

                            {/* Package Name */}
                            <InputFieldGroup
                                fieldTitle="Quotation Name"
                                description="The name of the quotation, recommend to be unique."
                                placeholder="Quotation name"
                                name="quotationName"
                                value={formData.quotationName}
                                onChange={handleChange}
                                error={validationErrors.name}
                            />

                            {/* Description */}
                            <InputFieldGroup
                                fieldTitle="Description"
                                description="An extra description of the quotation."
                                placeholder="Description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                error={validationErrors.description}
                            />

                            {/* Property */}
                            <div className="flex flex-col mb-8">
                                <span className="mb-2 text-sm font-medium text-gray-900">
                                    Property
                                </span>
                                <span className="text-xs text-gray-600 tracking-wide mb-2">
                                    Select the property that associated with this quotation template.
                                </span>
                                <div className="dropdow mb-2" data-dropdown="true" data-dropdown-trigger="click" id='property_dropdown'>
                                    <button className="dropdown-toggle btn btn-light w-full flex justify-between items-center">
                                        <span>Property</span>
                                        <i className="ki-filled ki-down"></i>
                                    </button>
                                    <div className="dropdown-content w-full max-w-80">
                                        <div className="px-4 pt-4 text-sm text-gray-900 font-medium">
                                            <label className="input input-sm">
                                                <i className="ki-filled ki-magnifier"></i>
                                                <input
                                                    ref={inputPropertyRef}
                                                    placeholder="Search property"
                                                    type="text"
                                                    value={searchPropertyTerm}
                                                    onChange={handleSearchProperty}
                                                />
                                            </label>
                                        </div>
                                        <div className="menu menu-default flex flex-col w-full">
                                            {properties.map((property, index) => (
                                                <div className="menu-item" key={index} data-id={property.id}>
                                                    <button
                                                        className="menu-link"
                                                        onClick={() => handleSelectProperty(property)}
                                                    >
                                                        <span className="menu-title">{property.name}</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                {selectedProperty && (
                                    <>
                                        <div className="card">
                                            <div className="card-body">
                                                <div className="flex flex-col gap-1 text-gray-900">
                                                    <span className='text-sm font-semibold text-gray-900'>{selectedProperty.name}</span>
                                                    <span className='text-sm font-normal text-slate-400'>
                                                        {[
                                                            selectedProperty.address,
                                                            selectedProperty.street,
                                                            selectedProperty.postcode,
                                                            selectedProperty.city,
                                                            selectedProperty.state
                                                        ].filter(Boolean).join(', ')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>


                            {/* Quotation Status */}
                            <div className="flex flex-col mb-8">
                                <label className="mb-2 text-sm font-medium text-gray-900">
                                    Quotation Status
                                </label>

                                <span className="text-xs text-gray-600 tracking-wide mb-2">
                                    Set the status of the quotation. "On" indicates ready to use, "Off" indicates draft mode.
                                </span>

                                <label className="switch switch-lg">
                                    <input
                                        className="checkbox"
                                        name="is_ready"
                                        type="checkbox"
                                        checked={!!formData.is_ready}
                                        onChange={toggleIsReady}
                                    />
                                    <span className="switch-label">
                                        Current Mode: {formData.is_ready ? 'Ready to use' : 'Draft Mode'}
                                    </span>
                                </label>

                                {/* <input
                                    className={`input mb-2 ${error ? 'border-red-500' : ''}`}
                                    placeholder={placeholder}
                                    type={type}
                                    name={name}
                                    value={displayValue}  // Display value as a string, but handle 0 properly
                                    onChange={handleChange}
                                />

                                {error && <label className="text-red-500 text-xs">{error}</label>} */}
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-body">
                            <div className="flex flex-col">
                                <label className='mb-2 text-sm font-medium text-gray-900'>
                                    Quotation Total Amount
                                </label>

                                <span className="text-xs text-gray-600 tracking-wide mb-2">
                                    The total amount will be reflected based on selected products/packages and quantity.
                                </span>

                                <span className="text-lg font-medium text-gray-900">
                                    RM {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='flex flex-col right-column flex-[7] gap-8'>
                    <div className="card">
                        <div className="card-body">
                            <h2 className='text-xl mb-4 font-semibold text-gray-900'>Packages</h2>

                            <button
                                className='btn btn-outline btn-primary w-full flex justify-center items-center mb-4'
                                data-modal-toggle="#include_package_modal"
                                onClick={openAddPackageModal}
                            >
                                <i className="ki-outline ki-plus-squared"></i>
                                Add Packages
                            </button>

                            <div className="flex flex-col gap-5" data-accordion="true">
                                {selectedPackages.map((prodPackage: Package) => (
                                    <div className="package flex items-center" key={prodPackage.id} data-id={prodPackage.id}>
                                        <button
                                            className='mr-4'
                                            onClick={() => handleRemovePackage(prodPackage.id)}
                                        >
                                            <i className="ki-solid ki-cross-square text-danger text-2xl"></i>
                                        </button>
                                        <div className="accordion-item border rounded-xl w-full" data-accordion-item="true" id={"package_item_" + prodPackage.id.toString()}>
                                            <button className="accordion-toggle p-4" data-accordion-toggle={"#package_content_" + prodPackage.id.toString()}>
                                                <div className="flex flex-col items-start">
                                                    <span className="text-base text-gray-900 font-medium">
                                                        {prodPackage.name}
                                                    </span>
                                                    <span className='text-base text-gray-700'>
                                                        RM {prodPackage.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                    {prodPackage.category &&
                                                        <div className="badge text-sm">
                                                            {categoryOptions.find(option => option.value === prodPackage.category)?.label}
                                                        </div>
                                                    }
                                                    <span className='flex items-center gap-2 text-sm text-slate-400'>
                                                        {prodPackage.description_internal && <>
                                                            <i className="ki-filled ki-information-2 text-warning text-xl"></i>
                                                            {prodPackage.description_internal}
                                                        </>}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="badge text-sm">Quantity: {prodPackage.quantity}</div>
                                                    <i className="ki-outline ki-right text-gray-600 text-2sm accordion-active:hidden block"></i>
                                                    <i className="ki-outline ki-down text-gray-600 text-2sm accordion-active:block hidden"></i>
                                                </div>
                                            </button>
                                            <div className="accordion-content hidden border-t" id={"package_content_" + prodPackage.id.toString()}>
                                                <div className="flex justify-between my-2 mx-3">
                                                    <div className="flex items-center text-gray-700 gap-2 p-2 rounded-md bg-blue-50 dark:bg-sky-950">
                                                        <span>Package Quantity: </span>
                                                        <div className="flex text-center">
                                                            <button
                                                                data-action='decrease'
                                                                onClick={() => adjustPackageQuantity(prodPackage.id, 'decrease')}
                                                            >
                                                                <i className="ki-solid ki-minus-squared"></i>
                                                            </button>
                                                            <span className="mx-2 text-base">
                                                                {prodPackage.quantity}
                                                            </span>
                                                            <button
                                                                data-action='increase'
                                                                onClick={() => adjustPackageQuantity(prodPackage.id, 'increase')}
                                                            >
                                                                <i className="ki-solid ki-plus-squared"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <button
                                                        className="btn btn-primary"
                                                        data-id={prodPackage.id}
                                                        data-modal-toggle='#include_pack_prod_modal'
                                                        onClick={openAddProductModal}
                                                    >
                                                        Add Product
                                                    </button>
                                                </div>
                                                <div className="product-list flex flex-col">
                                                    <table className="table align-middle text-gray-700 font-medium text-sm">
                                                        <thead>
                                                            <tr>
                                                                <th className='w-[250px]'>Product</th>
                                                                <th className='w-[100px] text-center'>Quantity</th>
                                                                <th className='w-[120px] text-center'>Selling Price</th>
                                                                <th className='w-[120px] text-center'>Total Price</th>
                                                                <th className='w-[60px] text-center'>Visibility</th>
                                                                <th className='w-[60px] text-center'>Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {prodPackage.products.map((product) => (
                                                                <React.Fragment key={product.id}>
                                                                    <tr>
                                                                        <td>
                                                                            <div className="flex flex-col">
                                                                                <span>{product.name}</span>
                                                                                <span className="text-xs text-slate-400">{product.description}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td className='text-center text-lg'>
                                                                            <button
                                                                                data-action='decrease'
                                                                                onClick={() => adjustQuantity(product.id, prodPackage.id, 'decrease')}
                                                                            >
                                                                                <i className="ki-solid ki-minus-squared"></i>
                                                                            </button>
                                                                            <span className="mx-2 text-base">
                                                                                {product.pivot.quantity}
                                                                            </span>
                                                                            <button
                                                                                data-action='increase'
                                                                                onClick={() => adjustQuantity(product.id, prodPackage.id, 'increase')}
                                                                            >
                                                                                <i className="ki-solid ki-plus-squared"></i>
                                                                            </button>
                                                                        </td>
                                                                        <td className='text-center'>
                                                                            RM {(product.provisioning.supply.retail_price + product.provisioning.install.retail_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                        </td>
                                                                        <td className='text-center'>
                                                                            RM {((product.provisioning.supply.retail_price * product.pivot.quantity) + (product.provisioning.install.retail_price * product.pivot.quantity)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                        </td>
                                                                        <td className='text-center'>
                                                                            <label className="switch flex justify-center">
                                                                                <input
                                                                                    name="visibility"
                                                                                    type="checkbox"
                                                                                    checked={product.pivot.visibility}
                                                                                    // value={product.pivot.visibility}
                                                                                    onChange={() => handleVisibilityToggle(product.id)}
                                                                                />
                                                                            </label>
                                                                        </td>
                                                                        <td className='text-center'>
                                                                            <button
                                                                                className="btn btn-sm btn-danger"
                                                                                onClick={() => handleRemoveProduct(product.id, prodPackage.id)}
                                                                            >
                                                                                Remove
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                    {/* <tr>
                                                                        <td colSpan={8}>
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Add a internal reference note"
                                                                                className="input w-full border p-2"
                                                                            // onChange={(e) => handleNoteChange(product.id, e.target.value)}
                                                                            />
                                                                        </td>
                                                                    </tr> */}
                                                                </React.Fragment>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-6">
                <button
                    className="btn btn-lg btn-light"
                    onClick={handleBackClick}
                >
                    Cancel
                </button>
                <button
                    className="btn btn-lg btn-primary"
                    onClick={handleSubmit} // Trigger form submission
                >
                    Create
                </button>
            </div>

            <IncludePackageModal
                selectedPackages={selectedPackages}
                updateSelectedPackages={updateSelectedPackages}
            />


            <IncludeQuotationProductModal
                updateSelectedPackages={updateSelectedPackages}
                isFromOrderQuotation={false}
            />
        </>
    );
}

export default CreateQuotation;
