// src\pages\Order\EditNewOrderQuotation.tsx

import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useFetchQuotation from "../../hook/useFetchQuotation";
import Loading from "../../components/Loading";
import { OwnerRegistrationForm, Package, Product } from "../../types";
import { Slide, toast } from "react-toastify";
import IncludeOrderQuotationPackageModal from "../../components/Modals/IncludeOrderQuotationPackageModal";
import IncludeQuotationProductModal from "../../components/Modals/IncludeQuotationProductModal";
import { fetchRegistrationForm } from "../../services/api";
import { KTAccordion } from "../../metronic/core";

const AWS_S3_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_AWS_S3_URL
        : import.meta.env.VITE_APP_ENV === "staging" || import.meta.env.VITE_APP_ENV === "local"
            ? import.meta.env.VITE_STAGING_AWS_S3_URL
            : null

const categoryOptions = [
    { value: "renovation", label: "Renovation" },
    { value: "partition", label: "Partition" },
    { value: "smart_iot", label: "Smart IoT" },
    { value: "project_management", label: "Project Management" },
    { value: "electrical_appliances", label: "Electrical Appliances" },
    { value: "air_conditioning", label: "Air Conditioning" },
    { value: "others", label: "Others" },
];

function EditNewOrderQuotation() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const quotationId = id ? parseInt(id, 10) : null;

    const queryParams = new URLSearchParams(location.search);
    const formId = queryParams.get('formId');

    const { quotationDetail, loading, error } = quotationId !== 0 ? useFetchQuotation(quotationId) : { quotationDetail: null, loading: false, error: null };

    const qtyBtnRef = useRef(null);

    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [selectedPackages, setSelectedPackages] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [selectedPackageId, setSelectedPackageId] = useState<number>();
    const [formDetail, setFormDetail] = useState<OwnerRegistrationForm | null>(null);
    const [totalAmount, setTotalAmount] = useState<number>(0);

    const handleBackClick = () => {
        localStorage.removeItem('selected_quotation_packages');
        navigate(-1);
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

    // PENDING
    const handleSubmit = async () => {
        try {
            const storedPackages = localStorage.getItem('selected_quotation_packages');
            const orderData = localStorage.getItem('create_order_data');

            if (orderData) {
                // Parse the JSON string into an object
                const orderObject = JSON.parse(orderData);

                // Update the totalAmount value
                orderObject.totalAmount = totalAmount;

                // Convert the object back to a JSON string
                const updatedOrderData = JSON.stringify(orderObject);

                // Save the updated data back to localStorage
                localStorage.setItem('create_order_data', updatedOrderData);
            }

            localStorage.setItem('include_packages', storedPackages);

            // // const metadata;
            // const newMetadata = parsedPackages.map((pkg: Package) => ({
            //     id: pkg.id,
            //     name: pkg.name,
            //     description: pkg.description,
            //     total_price: pkg.total_price,
            //     products: pkg.products.map((product: Product) => (product))
            // }));

            // TODO: DO NOT UPDATE THE DATA BECAUSE IT IS NOT IN THE DATABASE YET

            // TODO: FROM 'selected_quotation_packages' TO 'included_package'

            // localStorage.setItem('include_packages', storedPackages);

            // const quotationData: Quotation = {
            //     id: quotationDetail.id,
            //     name: formData.quotationName,
            //     description: formData.description,
            //     total_amount: formData.quotationPrice,
            //     metadata: newMetadata,
            // }

            // const response = await updateQuotation(quotationData);

            // if (response?.success) {
            notify('success', "Quotation Updated Successfully!");
            navigate('/orders/create');
            // }
        } catch (error) {
            if (error.response?.status === 422) {
                // Extract validation errors from the response
                const errors = error.response.data.data || {};
                // Convert array of errors to a single error message for each field
                const formattedErrors = Object.keys(errors).reduce((acc, key) => {
                    acc[key] = errors[key].join(' '); // Join array of errors into a single string
                    return acc;
                }, {} as Record<string, string>);

                setValidationErrors(formattedErrors);
                notify('error', "Quotation edit unsuccessful. Check the errors below.");
            } else {
                console.error('Quotation edit failed:', error);
            }
        }
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

        const includePackages = localStorage.getItem('selected_quotation_packages');
        const packages = JSON.parse(includePackages);

        const selectedPackage = packages.find(pkg => pkg.id === Number(id));

        if (selectedPackage) {

            const selectedProducts = selectedPackage.products.map(product => ({
                id: product.id,
                name: product.name,
                quantity: product.pivot.quantity,
                price: product.price,
                description: product.description || "N/A" // Using "N/A" for null descriptions
            }));

            setSelectedProducts(selectedProducts);
            setSelectedPackageId(selectedPackage.id);

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

    useEffect(() => {
        document.title = "Create Quotation Order | RenoXpert";

        const includePackages = localStorage.getItem('include_packages');
        const orderData = localStorage.getItem('create_order_data');

        if (formId) {
            handleSearchForm(formId);
        }

        if (includePackages) {
            setSelectedPackages(JSON.parse(includePackages));
            localStorage.setItem('selected_quotation_packages', includePackages);
        } else if (quotationDetail) {
            const packages = JSON.stringify(quotationDetail.packages);
            localStorage.setItem('include_packages', packages);
            setSelectedPackages(JSON.parse(packages));
            localStorage.setItem('selected_quotation_packages', packages);
        }

        if (orderData) {
            // Parse the JSON string into an object
            const orderObject = JSON.parse(orderData);

            setTotalAmount(orderObject.totalAmount);
        }

        // if (quotationDetail) {  // Check if quotationDetail is not null
        //     setTotalAmount(quotationDetail.total_amount);
        // }
        KTAccordion.init();
    }, [quotationDetail, formId]);

    const handleSearchForm = async (formId: string) => {

        try {
            const response = await fetchRegistrationForm(Number(formId)); // This returns AxiosResponse
            const registrationForm: OwnerRegistrationForm = response.data.data; // Extract the data

            if (registrationForm) {
                setFormDetail(registrationForm);
            } else {
                toast.error("Registration form not found");
            }

        } catch (error) {
            console.error("Error fetching registration form:", error);
            toast.error("Failed to fetch registration form");
        }
    };

    const updateSelectedPackages = (packages) => {
        const updatedPackages = packages.map((prodPackage: Package) => {
            const packageTotalPrice = prodPackage.products.reduce((sum, product) => {
                return sum + (product.provisioning.supply.retail_price * product.pivot.quantity) + (product.provisioning.install.retail_price * product.pivot.quantity);
            }, 0);

            let newTotalPrice = packageTotalPrice;

            prodPackage.products.map((product) => {
                if (!product.pivot.includeSupply) {
                    newTotalPrice -= (product.provisioning.supply.excluded_price * product.pivot.quantity);
                }

                if (!product.pivot.includeInstall) {
                    newTotalPrice -= (product.provisioning.install.excluded_price * product.pivot.quantity);
                }
            });

            return {
                ...prodPackage,
                total_price: newTotalPrice // Calculate total price
            };
        });

        setSelectedPackages(updatedPackages);
        const newTotalAmount = calculateTotalAmount(updatedPackages);
        setTotalAmount(newTotalAmount); // Update totalAmount
        updateLocalStorage(updatedPackages);
    };

    // const updateSelectedProducts = (products) => {
    //     setSelectedProducts(products);
    //     localStorage.setItem('include_prod_selected_products', JSON.stringify(products));
    // };

    const updateLocalStorage = (packages) => {
        localStorage.setItem('selected_quotation_packages', JSON.stringify(packages));
    };

    const toggleProperty = (id: number, packId: number, property: 'supply' | 'install') => {
        setSelectedPackages((prevPackages: Package[]) => {
            const updatedPackages = prevPackages.map((prodPackage) => {
                if (prodPackage.id === packId) {
                    const updatedProducts = prodPackage.products.map((product) => {
                        if (product.id === id) {
                            const key = property === 'install' ? 'includeInstall' : 'includeSupply';

                            const updatedPivot = {
                                ...product.pivot,
                                [key]: product.pivot ? !product.pivot[key] : true, // Toggle the specified property
                            };

                            // Check if both includeSupply and includeInstall are false, and set quantity to 1
                            if (!updatedPivot.includeSupply && !updatedPivot.includeInstall) {
                                updatedPivot.quantity = 1; // Reset quantity to 1
                            }

                            return {
                                ...product,
                                pivot: updatedPivot,
                            };
                        }
                        return product; // Return the original product if not matched
                    });

                    const packageTotalPrice = updatedProducts.reduce((sum, product) => {
                        return sum + (product.provisioning.supply.retail_price * product.pivot.quantity) +
                            (product.provisioning.install.retail_price * product.pivot.quantity);
                    }, 0);

                    let newTotalPrice = packageTotalPrice;

                    updatedProducts.forEach((product) => {
                        if (!product.pivot.includeSupply) {
                            newTotalPrice -= (product.provisioning.supply.excluded_price * product.pivot.quantity);
                        }

                        if (!product.pivot.includeInstall) {
                            newTotalPrice -= (product.provisioning.install.excluded_price * product.pivot.quantity);
                        }
                    });

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

    const adjustQuantity = (prodId: number, packId: number, action: 'increase' | 'decrease') => {
        setSelectedPackages((prevPackages: Package[]) => {
            const updatedPackages = prevPackages.map((prodPackage) => {
                if (prodPackage.id === packId) {
                    const updatedProducts = prodPackage.products.map((product) => {
                        if (product.id === prodId) {
                            // New condition: When quantity is 1, action is increase, and both includes are false
                            if (product.pivot.quantity === 1 &&
                                action === 'increase' &&
                                !product.pivot.includeSupply &&
                                !product.pivot.includeInstall) {
                                return {
                                    ...product,
                                    pivot: {
                                        ...product.pivot,
                                        includeSupply: true,
                                        includeInstall: true
                                    }
                                };
                            }

                            // Block increase/decrease if either includeSupply or includeInstall is false
                            if (!product.pivot.includeSupply && !product.pivot.includeInstall) {
                                return product; // Return the product unchanged if both are false
                            }

                            // Handle decrease action with quantity of 1
                            if (action === 'decrease' && product.pivot.quantity === 1) {
                                return {
                                    ...product,
                                    pivot: {
                                        ...product.pivot,
                                        includeSupply: false,
                                        includeInstall: false
                                    }
                                };
                            }

                            // Calculate new quantity based on action
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
                        return product;
                    });

                    const packageTotalPrice = updatedProducts.reduce((sum, product) => {
                        return sum + (product.provisioning.supply.retail_price * product.pivot.quantity) +
                            (product.provisioning.install.retail_price * product.pivot.quantity);
                    }, 0);

                    let newTotalPrice = packageTotalPrice;

                    updatedProducts.forEach((product) => {
                        if (!product.pivot.includeSupply) {
                            newTotalPrice -= (product.provisioning.supply.excluded_price * product.pivot.quantity);
                        }
                        if (!product.pivot.includeInstall) {
                            newTotalPrice -= (product.provisioning.install.excluded_price * product.pivot.quantity);
                        }
                    });

                    return {
                        ...prodPackage,
                        products: updatedProducts,
                        total_price: newTotalPrice
                    };
                }
                return prodPackage;
            });

            const newTotalAmount = calculateTotalAmount(updatedPackages);
            setTotalAmount(newTotalAmount);
            updateLocalStorage(updatedPackages);
            return updatedPackages;
        });
    };

    const adjustPackageQuantity = (packId: number, action: 'increase' | 'decrease') => {
        setSelectedPackages((prevPackages: Package[]) => {
            const updatedPackages = prevPackages.map((prodPackage) => {
                if (prodPackage.id === packId) {
                    const newQuantity = action === 'increase' ? prodPackage.quantity + 1 : Math.max(1, prodPackage.quantity - 1);

                    let packageTotalPrice = prodPackage.products.reduce((sum, product) => {
                        return sum + (product.provisioning.supply.retail_price * product.pivot.quantity) +
                            (product.provisioning.install.retail_price * product.pivot.quantity);
                    }, 0);

                    prodPackage.products.forEach((product) => {
                        if (!product.pivot.includeSupply) {
                            packageTotalPrice -= (product.provisioning.supply.excluded_price * product.pivot.quantity);
                        }
                        if (!product.pivot.includeInstall) {
                            packageTotalPrice -= (product.provisioning.install.excluded_price * product.pivot.quantity);
                        }
                    });

                    return {
                        ...prodPackage,
                        total_price: packageTotalPrice, // Adjust total price considering exclusions
                        quantity: newQuantity
                    };
                }
                return prodPackage;
            });

            const newTotalAmount = calculateTotalAmount(updatedPackages);
            setTotalAmount(newTotalAmount); // Update totalAmount
            updateLocalStorage(updatedPackages);
            return updatedPackages;
        });
    };

    const handleRemoveProduct = (packId: number, prodId: number) => {
        setSelectedPackages((prevPackages: Package[]) => {
            const updatedPackages = prevPackages.map((prodPackage: Package) => {
                if (prodPackage.id === packId) {
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
        return packages.reduce((sum, pkg) => {
            sum += pkg.products.reduce((prodSum, product) => {
                if (!product.pivot.includeSupply) {
                    prodSum += (product.provisioning.supply.retail_price * product.pivot.quantity) - (product.provisioning.supply.excluded_price * product.pivot.quantity);
                } else {
                    prodSum += (product.provisioning.supply.retail_price * product.pivot.quantity);
                }

                if (!product.pivot.includeInstall) {
                    prodSum += (product.provisioning.install.retail_price * product.pivot.quantity) - (product.provisioning.install.excluded_price * product.pivot.quantity);
                } else {
                    prodSum += (product.provisioning.install.retail_price * product.pivot.quantity);
                }

                return prodSum;
            }, 0) * pkg.quantity;


            return sum;
        }, 0);
    };

    if (quotationId !== 0) {
        if (loading) return <Loading />;
        if (error) return <div>{error}</div>;
        if (!quotationDetail) return <div>Quotation not found</div>;
    }

    return (
        <>
            <div className="flex justify-between items-center flex-wrap mb-6">
                <div className="flex gap-4 items-center">
                    <button className='text-gray-800 dark:text-gray-400' onClick={handleBackClick}>
                        <i className="ki-solid ki-arrow-left"></i>
                    </button>
                    <span className="text-2xl font-bold text-gray-900">
                        Update Quotation
                    </span>
                </div>
            </div>

            <div className="flex flex-col flex-wrap lg:mr-[400px] lg:px-6 mb-6">
                <div className="card mb-6">
                    <div className="card-body flex flex-col gap-4">
                        <span className="text-xl text-gray-900 font-semibold">
                            Quotation: {quotationDetail ? quotationDetail.name : 'Custom Quotation'}
                        </span>
                        <span className="text-xl text-gray-900 font-semibold">
                            Total Amount: RM {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>

                <div className="card mb-6">
                    <div className="card-body">
                        <div className="flex justify-between items-center flex-wrap mb-2">
                            <h2 className='text-xl mb-4 font-semibold text-gray-900'>Packages</h2>
                            <button
                                className='btn btn-outline btn-primary flex justify-center items-center mb-4'
                                data-modal-toggle="#include_package_modal"
                                onClick={openAddPackageModal}
                            >
                                <i className="ki-outline ki-plus-squared"></i>
                                Add Packages
                            </button>
                        </div>

                        <div className="flex flex-col gap-5 mb-4" data-accordion="true">
                            {selectedPackages &&
                                selectedPackages.map((prodPackage: Package) => (
                                    <div className="package flex items-center" key={prodPackage.id} data-id={prodPackage.id}>
                                        <div className="accordion-item border rounded-xl w-full" data-accordion-item="true" id={"package_item_" + prodPackage.id.toString()}>
                                            <button className="accordion-toggle p-4" data-accordion-toggle={"#package_content_" + prodPackage.id.toString()}>
                                                <div className="flex flex-col items-start">
                                                    <span className="text-base text-gray-900 font-medium">
                                                        {prodPackage.name}
                                                    </span>
                                                    <span className="text-sm text-gray-700 font-medium">
                                                        {prodPackage.description_internal}
                                                    </span>
                                                    <span className='text-base text-gray-700'>
                                                        RM {(prodPackage.total_price * (prodPackage.quantity ? prodPackage.quantity : 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                    {prodPackage.category &&
                                                        <div className="badge text-sm">
                                                            {categoryOptions.find(option => option.value === prodPackage.category)?.label}
                                                        </div>
                                                    }
                                                    <span className='text-sm text-slate-400'>
                                                        {prodPackage.description}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-8">
                                                    <span className="text-gray-600 font-semibold py-2 px-4 bg-gray-200 rounded-md">Quantity: {prodPackage.quantity}</span>
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => handleRemovePackage(prodPackage.id)}
                                                    >
                                                        Remove
                                                        {/* <i className="ki-solid ki-cross-square text-danger text-2xl"></i> */}
                                                    </button>
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
                                                                {prodPackage.quantity ? prodPackage.quantity : 1}
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
                                                                <th className='w-[10px] text-center'>Supply</th>
                                                                <th className='w-[10px] text-center'>Install</th>
                                                                <th className='w-[250px]'>Product</th>
                                                                <th className='w-[100px] text-center'>Quantity</th>
                                                                <th className='w-[100px] text-center'>Unit Price</th>
                                                                <th className='w-[100px] text-center'>Discount</th>
                                                                <th className='w-[100px] text-center'>Total Price</th>
                                                                <th className='w-[100px] text-center'>Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {prodPackage.products.map((product) => (
                                                                <tr
                                                                    key={product.id}
                                                                    className={`${!product.pivot.includeSupply && !product.pivot.includeInstall ? 'light:bg-orange-50 dark:bg-orange-950' : ''}`}
                                                                >
                                                                    <td>
                                                                        <span></span>
                                                                        <div className="flex flex-col items-center">
                                                                            <input
                                                                                className="checkbox"
                                                                                name="supply"
                                                                                type="checkbox"
                                                                                checked={!!product.pivot.includeSupply}
                                                                                onChange={() => toggleProperty(product.id, prodPackage.id, 'supply')}
                                                                            />
                                                                        </div>
                                                                    </td>
                                                                    <td>
                                                                        <div className="flex flex-col items-center">
                                                                            <input
                                                                                className="checkbox"
                                                                                name="install"
                                                                                type="checkbox"
                                                                                checked={!!product.pivot.includeInstall}
                                                                                onChange={() => toggleProperty(product.id, prodPackage.id, 'install')}
                                                                            />
                                                                        </div>
                                                                    </td>
                                                                    <td>
                                                                        <div className="flex flex-col">
                                                                            <span>{product.name}</span>
                                                                            <span className="text-xs text-slate-400">{product.description}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className='text-center text-lg'>
                                                                        <button
                                                                            ref={qtyBtnRef}
                                                                            data-action='decrease'
                                                                            onClick={product.pivot.included ? () => adjustQuantity(product.id, prodPackage.id, 'decrease') : null}
                                                                            disabled={!product.pivot.included}
                                                                        >
                                                                            <i className="ki-solid ki-minus-squared"></i>
                                                                        </button>
                                                                        <span className="mx-2 text-base">
                                                                            {product.pivot.included ? ((!product.pivot.includeSupply && !product.pivot.includeInstall ? 0 : product.pivot.quantity)) : '0'}
                                                                        </span>
                                                                        <button
                                                                            data-action='increase'
                                                                            onClick={product.pivot.included ? () => adjustQuantity(product.id, prodPackage.id, 'increase') : null}
                                                                            disabled={!product.pivot.included}
                                                                        >
                                                                            <i className="ki-solid ki-plus-squared"></i>
                                                                        </button>

                                                                    </td>
                                                                    <td className="text-center">
                                                                        RM {(product.provisioning.supply.retail_price + product.provisioning.install.retail_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </td>
                                                                    <td className='text-center'>
                                                                        {!product.pivot.includeSupply || !product.pivot.includeInstall
                                                                            ? `- RM ${(
                                                                                (!product.pivot.includeSupply ? product.provisioning.supply.excluded_price * product.pivot.quantity : 0) +
                                                                                (!product.pivot.includeInstall ? product.provisioning.install.excluded_price * product.pivot.quantity : 0)
                                                                            )
                                                                                .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                                            : null}
                                                                    </td>
                                                                    <td className="text-center">
                                                                        {!product.pivot.included
                                                                            ? null
                                                                            : `RM ${(
                                                                                (product.provisioning.supply.retail_price * product.pivot.quantity -
                                                                                    (!product.pivot.includeSupply ? product.provisioning.supply.excluded_price * product.pivot.quantity : 0)
                                                                                ) +
                                                                                (product.provisioning.install.retail_price * product.pivot.quantity -
                                                                                    (!product.pivot.includeInstall ? product.provisioning.install.excluded_price * product.pivot.quantity : 0)
                                                                                )
                                                                            )
                                                                                .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                                    </td>
                                                                    <td className='text-center'>
                                                                        {!product.pivot.visibility &&
                                                                            <i className="ki-solid ki-eye-slash text-2xl"></i>
                                                                        }
                                                                        <button
                                                                            className="btn-revoke btn btn-sm btn-danger"
                                                                            data-tooltip="#remove_tooltip"
                                                                            data-action="remove"
                                                                            data-id={product.id}
                                                                            onClick={() => handleRemoveProduct(prodPackage.id, product.id)}
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-6">
                    <button className="btn btn-lg btn-light">
                        Cancel
                    </button>
                    <button
                        className="btn btn-lg btn-primary"
                        onClick={handleSubmit} // Trigger form submission
                    >
                        Update
                    </button>
                </div>
            </div>

            <IncludeOrderQuotationPackageModal
                selectedPackages={selectedPackages}
                updateSelectedPackages={updateSelectedPackages}
            />

            <IncludeQuotationProductModal
                updateSelectedPackages={updateSelectedPackages}
                isFromOrderQuotation={true}
            />
        </>
    );
}

export default EditNewOrderQuotation;