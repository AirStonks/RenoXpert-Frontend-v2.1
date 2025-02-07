// src\pages\Order\EditOrderQuotation.tsx

import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useFetchQuotation from "../../hook/useFetchQuotation";
import Loading from "../../components/Loading";
import { OwnerRegistrationForm, Package, Product, Quotation } from "../../types";
import { Slide, toast } from "react-toastify";
import IncludeOrderQuotationPackageModal from "../../components/Modals/IncludeOrderQuotationPackageModal";
import IncludeQuotationProductModal from "../../components/Modals/IncludeQuotationProductModal";
import { fetchOrder, fetchQuotation, fetchRegistrationForm } from "../../services/api";

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

function EditOrderQuotation() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { quoteId } = useParams<{ quoteId: string }>();
    const orderId = id ? parseInt(id, 10) : null;
    const quotationId = quoteId ? parseInt(quoteId, 10) : null;

    const qtyBtnRef = useRef(null);

    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [selectedPackages, setSelectedPackages] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [selectedPackageId, setSelectedPackageId] = useState<number>();
    const [selectedProduct, setSelectedProduct] = useState([]);
    const [selectedQuotation, setSelectedQuotation] = useState<Quotation>(null);
    const [formDetail, setFormDetail] = useState<OwnerRegistrationForm | null>(null);

    const [totalAmount, setTotalAmount] = useState<number>(0);

    const handleBackClick = () => {
        localStorage.removeItem('selected_quotation_packages');
        navigate('/orders/edit/' + orderId);
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
            const orderData = localStorage.getItem('edit_order_data');

            if (orderData) {
                // Parse the JSON string into an object
                const orderObject = JSON.parse(orderData);

                // Update the totalAmount value
                orderObject.totalAmount = totalAmount;

                // Convert the object back to a JSON string
                const updatedOrderData = JSON.stringify(orderObject);

                // Save the updated data back to localStorage
                localStorage.setItem('e:edit_order_data', updatedOrderData);
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
            navigate('/orders/edit/' + orderId);
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
        document.title = "Edit Quotation Order | RenoXpert";

        const includePackages = localStorage.getItem('include_packages');
        const orderData = localStorage.getItem('edit_order_data');

        handleSearchForm();
        handleSelectedQuotation();

        if (includePackages) {
            setSelectedPackages(JSON.parse(includePackages));
            localStorage.setItem('selected_quotation_packages', includePackages);
            setTotalAmount(JSON.parse(orderData).totalAmount);
        } else if (selectedQuotation) {
            const packages = JSON.stringify(selectedQuotation.metadata);
            localStorage.setItem('include_packages', packages);
            setSelectedPackages(JSON.parse(packages));
            localStorage.setItem('selected_quotation_packages', packages);
            setTotalAmount(selectedQuotation.total_amount);
        }

    }, []);

    const handleSearchForm = async () => {

        try {
            const orderRes = await fetchOrder(Number(orderId));

            if (orderRes?.data?.form_id) {
                const response = await fetchRegistrationForm(orderRes?.data?.form_id); // This returns AxiosResponse
                const registrationForm: OwnerRegistrationForm = response.data.data; // Extract the data

                if (registrationForm) {
                    setFormDetail(registrationForm);
                } else {
                    toast.error("Registration form not found");
                }
            }

        } catch (error) {
            console.error("Error fetching registration form:", error);
            toast.error("Failed to fetch registration form");
        }
    };

    const handleSelectedQuotation = async () => {
        try {
            const response = await fetchOrder(Number(orderId));

            if (response?.success) {
                const orderDetail = response.data

                if (orderDetail.latest_quotation.quotation) {
                    setSelectedQuotation(orderDetail.latest_quotation.quotation);
                } else {
                    const pastQuotation: Quotation = {
                        id: orderDetail.latest_quotation.id,
                        name: orderDetail.latest_quotation.quotation_name,
                        description: orderDetail.latest_quotation.description,
                        total_amount: orderDetail.latest_quotation.total_amount,
                        valid_from: orderDetail.latest_quotation.from,
                        valid_until: orderDetail.latest_quotation.valid_until,
                        metadata: orderDetail.latest_quotation.metadata
                    }

                    setSelectedQuotation(pastQuotation);
                }
            }

        } catch (error) {
            console.log(error);

        }
    }

    const updateSelectedPackages = (packages) => {
        const updatedPackages = packages.map((prodPackage: Package) => {
            const packageTotalPrice = prodPackage.products.reduce((sum, product) => {
                return sum + (product.provisioning.supply.retail_price * product.pivot.quantity) + (product.provisioning.install.retail_price * product.pivot.quantity);
            }, 0);

            let newTotalPrice = packageTotalPrice

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

                // console.log('prodSum Instalkl: ', prodSum);


                return prodSum;
            }, 0)

            return sum;
        }, 0);
    };

    if (!selectedQuotation) return <Loading />;

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
                            Quotation: {selectedQuotation.name}
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
                            {selectedPackages.map((prodPackage: Package) => (
                                <div className="package flex items-center" key={prodPackage.id} data-id={prodPackage.id}>
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
                                                <span className='text-sm text-slate-400'>
                                                    {prodPackage.description}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-8">
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
                                            <div className="flex justify-end my-2 mr-3">
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
                                                                    {product.pivot.isOriginal ?
                                                                        !product.pivot.visibility && <i className="ki-solid ki-eye-slash text-2xl"></i>
                                                                        :
                                                                        <button
                                                                            className="btn-revoke btn btn-sm btn-danger"
                                                                            data-tooltip="#remove_tooltip"
                                                                            data-action="remove"
                                                                            data-id={product.id}
                                                                            onClick={() => handleRemoveProduct(prodPackage.id, product.id)}
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    }
                                                                </td>
                                                            </tr>
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

            <div
                className="w-[400px] drawer drawer-start grow fixed z-1 top-20 lg:top-20 bottom-12 lg:bottom-12 lg:right-8 lg:left-auto lg:translate-x-0 lg:flex flex-col items-stretch shrink-0 bg-[#fefefe] dark:bg-coal-500"
                data-overlay="true"
                data-overlay-enable="true|lg:false"
                id="aside"
            >
                <div
                    className="card flex flex-col shrink-0 px-3 scrollable-y-hover max-h-dvh"
                    data-scrollable="true"
                    data-scrollable-dependencies="#header"
                    data-scrollable-height="auto"
                    data-scrollable-offset="15px"
                    data-scrollable-wrappers="#page"
                    id="aside_content"
                    style={{ height: 'calc(100vh - 11em)', maxHeight: 'calc(100vh - 11em)' }}
                >
                    {formDetail ?
                        <>
                            <div className="card-header px-2">
                                <h2 className='text-base font-semibold'>Form Detail</h2>
                            </div>
                            <div className="card-body flex flex-col text-gray-900 px-2 py-4">
                                <div className="flex flex-col mb-8">
                                    <span className="font-medium">Status</span>
                                    <span className={`badge badge-outline gap-1 items-center ${formDetail.status ===
                                        'approved' ? 'badge-success' : ''}`}>
                                        {formDetail.status.charAt(0).toUpperCase() + formDetail.status.slice(1)}
                                    </span>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">Salutations</span>
                                    <span className="font-semibold">{formDetail.user.salutations}</span>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <label className="text-slate-900 mb-2 font-medium" htmlFor="name_f">Name</label>
                                    <div className="flex gap-2">
                                        <div className="flex flex-col w-full">
                                            <span className="text-slate-400 font-medium">First Name</span>
                                            <span className="font-semibold">{formDetail.user.name_first}</span>
                                        </div>
                                        <div className="flex flex-col w-full">
                                            <span className="text-slate-400 font-medium">Last Name</span>
                                            <span className="font-semibold">{formDetail.user.name_last}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">Preferred Name</span>
                                    <span className="font-semibold">{formDetail.user.name_preferred}</span>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <div className="flex gap-2 flex-wrap">
                                        <div className="flex flex-col flex-auto mb-6 md:mb-0">
                                            <span className="text-slate-400 font-medium">Email</span>
                                            <span className="font-semibold">{formDetail.user.email}</span>
                                        </div>
                                        <div className="flex flex-col flex-auto">
                                            <span className="text-slate-400 font-medium">Phone Number</span>
                                            <span className="font-semibold">+60 {formDetail.user.phone_no}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <label className="text-slate-900 mb-2 font-medium" htmlFor="address_1">Current residence address (information needed for renovation agreement purpose)</label>

                                    <div className="flex flex-col mb-8">
                                        <span className="text-slate-400 font-medium">Address Line 1</span>
                                        <span className="font-semibold">{formDetail.address.address_1}</span>
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <span className="text-slate-400 font-medium">Address Line 2</span>
                                        <span className="font-semibold">{formDetail.address.address_2}</span>
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <div className="flex gap-2 ">
                                            <div className="flex flex-col w-full">
                                                <span className="text-slate-400 font-medium">City</span>
                                                <span className="font-semibold">{formDetail.address.city}</span>
                                            </div>
                                            <div className="flex flex-col w-full">
                                                <span className="text-slate-400 font-medium">State</span>
                                                <span className="font-semibold">{formDetail.address.state}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="text-slate-400 font-medium">Postal / Zip Code</span>
                                        <span className="font-semibold">{formDetail.address.postcode}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">IC / ID number</span>
                                    <span className="font-semibold">{formDetail.user.ic}</span>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">Property to be renovated</span>
                                    <span className="font-semibold">
                                        {formDetail.property ? formDetail.property.property_name : "(Other) " + formDetail.other_property.property_name}
                                    </span>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <div className="flex flex-col w-full">
                                        <span className="text-slate-400 font-medium">Unit</span>
                                        <span className="font-semibold">{formDetail.property ?
                                            `${formDetail.property.block}-${formDetail.property.level}-${formDetail.property.unit}` :
                                            `${formDetail.other_property.block}-${formDetail.other_property.level}-${formDetail.other_property.unit}`
                                        }</span>
                                    </div>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">Layout Type</span>
                                    <span className="font-semibold">
                                        {formDetail.property ?
                                            `${formDetail.property.layout_type}` :
                                            `${formDetail.other_property.layout_type}`
                                        }
                                    </span>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">Sqft</span>
                                    <span className="font-semibold">
                                        {formDetail.property ?
                                            `${formDetail.property.sqft}` :
                                            `${formDetail.other_property.sqft}`
                                        }
                                    </span>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">What's your original number of rooms?</span>
                                    <span className="font-semibold">{formDetail.questions.quest_1}</span>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">What's the number of bathroom?</span>
                                    <span className="font-semibold">{formDetail.questions.quest_2}</span>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">Already Vacant Possessions (VP)?</span>
                                    <span className="font-semibold">{formDetail.questions.quest_3}</span>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">Already collect key?</span>
                                    <span className="font-semibold">{formDetail.questions.quest_4}</span>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">Already done defect inspection?</span>
                                    <span className="font-semibold">{formDetail.questions.quest_5}</span>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">Already submit defect submission to MO?</span>
                                    <span className="font-semibold">{formDetail.questions.quest_6}</span>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">MO has completed that defect rectification?</span>
                                    <span className="font-semibold">{formDetail.questions.quest_7}</span>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">Do you want to add partition room to your unit?</span>
                                    <span className="font-semibold">{formDetail.questions.quest_8}</span>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <span className="text-sm text-gray-900 font-bold text-justify">
                                        Please help us understand the furnishing condition of your unit for the following areas:
                                    </span>
                                </div>

                                <div className="flex flex-col flex-wrap mb-8">
                                    <div className="card rounded-md mb-8">
                                        <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
                                            <h2 className="">Foyer & entrance</h2>
                                        </div>
                                        <div className="card-body text-sm px-4">
                                            <div className="w-full">
                                                <div className="grid grid-cols-3 gap-4">
                                                    {/* Header Row */}
                                                    <div className="col-start-2 text-xs text-center text-gray-900 font-semibold">Furnished</div>
                                                    <div className="col-start-3 text-xs text-center text-gray-900 font-semibold">Not Furnished</div>

                                                    {/* Grille Door */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Grille door</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.foyer_entrance.grille_door === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.foyer_entrance.grille_door === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* Digital Lock */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Digital lock</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.foyer_entrance.digital_lock === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.foyer_entrance.digital_lock === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* Shoe Cabinet */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Shoe cabinet</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.foyer_entrance.shoe_cabinet === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.foyer_entrance.shoe_cabinet === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* Lights */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.foyer_entrance.lights === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.foyer_entrance.lights === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="furnishing.foyer_entrance.other">Remarks</label>
                                        <span className="textarea">
                                            {formDetail.furnishing.foyer_entrance.other ? formDetail.furnishing.foyer_entrance.other : '-'}
                                        </span>
                                    </div>

                                    <hr className="mb-8" />

                                    <div className="card rounded-md mb-8">
                                        <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
                                            <h2 className="">Kitchen</h2>
                                        </div>
                                        <div className="card-body text-sm px-4">
                                            <div className="w-full">
                                                <div className="grid grid-cols-3 gap-4">
                                                    {/* Header Row */}
                                                    <div className="col-start-2 text-xs text-center text-gray-900 font-semibold">Furnished</div>
                                                    <div className="col-start-3 text-xs text-center text-gray-900 font-semibold">Not Furnished</div>

                                                    {/* Kitchen Cabinet */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Kitchen cabinet</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.kitchen_cabinet === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.kitchen_cabinet === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* Kitchen Island */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Kitchen island</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.kitchen_island === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.kitchen_island === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* Sink & Tap */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Sink & tap</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.sink_tap === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.sink_tap === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* Hood and Hob */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Hood and hob</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.hood_hob === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.hood_hob === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* Microwave */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Microwave</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.microwave === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.microwave === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* Oven */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Oven</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.oven === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.oven === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* Water Dispenser / Water Purifier */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Water dispenser / water purifier</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.water_dispenser === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.water_dispenser === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* Fridge */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Fridge</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.fridge === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.fridge === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* Lights */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.lights === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.kitchen.lights === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="kitchen.other">Remarks</label>
                                        <span className="textarea">
                                            {formDetail.furnishing.kitchen.other ? formDetail.furnishing.kitchen.other : '-'}
                                        </span>
                                    </div>

                                    <hr className="mb-8" />

                                    <div className="card rounded-md mb-8">
                                        <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
                                            <h2 className="">Yard</h2>
                                        </div>
                                        <div className="card-body text-sm px-4">
                                            <div className="w-full">
                                                <div className="grid grid-cols-3 gap-4">
                                                    {/* Header Row */}
                                                    <div className="col-start-2 text-xs text-center text-gray-900 font-semibold">Furnished</div>
                                                    <div className="col-start-3 text-xs text-center text-gray-900 font-semibold">Not Furnished</div>

                                                    {/* Washer */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Washer</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.yard.washer === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.yard.washer === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* Dryer */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Dryer</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.yard.dryer === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.yard.dryer === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* Lights */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.yard.lights === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.yard.lights === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="yard.other">Remarks</label>
                                        <span className="textarea">
                                            {formDetail.furnishing.yard.other ? formDetail.furnishing.yard.other : '-'}
                                        </span>
                                    </div>

                                    <hr className="mb-8" />

                                    <div className="card rounded-md mb-8">
                                        <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
                                            <h2 className="">Dining</h2>
                                        </div>
                                        <div className="card-body text-sm px-4">
                                            <div className="w-full">
                                                <div className="grid grid-cols-3 gap-4">
                                                    {/* Header Row */}
                                                    <div className="col-start-2 text-xs text-center text-gray-900 font-semibold">Furnished</div>
                                                    <div className="col-start-3 text-xs text-center text-gray-900 font-semibold">Not Furnished</div>

                                                    {/* Dining Table & Chairs */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Dining table & chairs</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.dining.dining_table_chairs === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.dining.dining_table_chairs === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* Lights */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.dining.lights === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.dining.lights === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* Fan */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Fan</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.dining.fan === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.dining.fan === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="dining.other">Remarks</label>
                                        <span className="textarea">
                                            {formDetail.furnishing.dining.other ? formDetail.furnishing.dining.other : '-'}
                                        </span>
                                    </div>

                                    <hr className="mb-8" />

                                    <div className="card rounded-md mb-8">
                                        <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
                                            <h2 className="">Living</h2>
                                        </div>
                                        <div className="card-body text-sm px-4">
                                            <div className="w-full">
                                                <div className="grid grid-cols-3 gap-4">
                                                    {/* Header Row */}
                                                    <div className="col-start-2 text-xs text-center text-gray-900 font-semibold">Furnished</div>
                                                    <div className="col-start-3 text-xs text-center text-gray-900 font-semibold">Not Furnished</div>

                                                    {/* Sofa */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Sofa</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.sofa === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.sofa === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* Coffee Table */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Coffee table</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.coffee_table === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.coffee_table === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* TV */}
                                                    <div className="flex items-center text-gray-900 font-semibold">TV</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.tv === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.tv === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* TV Cabinet */}
                                                    <div className="flex items-center text-gray-900 font-semibold">TV cabinet</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.tv_cabinet === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.tv_cabinet === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* Fan */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Fan</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.fan === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.fan === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* Lights */}
                                                    <div className="flex items-center text-gray-900 font-semibold">Lights</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.lights === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.lights === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>

                                                    {/* AC */}
                                                    <div className="flex items-center text-gray-900 font-semibold">AC</div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.ac === 'furnished' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                        }
                                                    </div>
                                                    <div className="flex justify-center items-center">
                                                        {formDetail.furnishing.living.ac === 'not-furnish' &&
                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col mb-8">
                                        <label className="text-slate-900 mb-2 font-medium" htmlFor="living.other">Remarks</label>
                                        <span className="textarea">
                                            {formDetail.furnishing.living.other ? formDetail.furnishing.living.other : '-'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <span className="text-slate-400 font-medium">Attachments</span>

                                    {formDetail.attachments && Object.keys(formDetail.attachments).length > 0 ? (
                                        <ul>
                                            {Object.keys(formDetail.attachments).map((key) => {
                                                const attachment = formDetail.attachments[key];
                                                return (
                                                    <li key={key}>
                                                        {attachment.file_url ? (
                                                            <a href={AWS_S3_URL + (attachment.file_url)} target="_blank" rel="noopener noreferrer" className="badge badge-lg mb-2">
                                                                {attachment.original_name}
                                                            </a>
                                                        ) : (
                                                            'No file available'
                                                        )}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <p>No attachments found.</p>
                                    )}
                                </div>
                            </div>
                        </>
                        :
                        <div className="card-body flex flex-col items-center justify-center">
                            <img alt="image" className="dark:hidden max-h-[160px] mb-12" src="/public/media/illustrations/3.svg" />
                            <img alt="image" className="light:hidden max-h-[160px] mb-12" src="/public/media/illustrations/3-dark.svg" />
                            <span className="text-gray-800 text-lg font-semibold text-center">No Registration Form selected</span>
                        </div>
                    }
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

export default EditOrderQuotation;