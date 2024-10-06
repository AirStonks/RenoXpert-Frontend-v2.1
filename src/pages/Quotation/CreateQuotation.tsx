// src\pages\Quotation\CreateQuotation.tsx

import { useEffect, useRef, useState } from 'react';
import { toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import InputFieldGroup from '../../components/Forms/TextFields/InputFieldGroup';
import IncludePackageModal from '../../components/Modals/IncludePackageModal';
import { Package, Product, Quotation } from '../../types';
import { createQuotation } from '../../services/api';

function CreateQuotation() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        quotationName: '',
        quotationPrice: 0,
        description: '',
    });

    const qtyBtnRef = useRef(null);

    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [selectedPackages, setSelectedPackages] = useState([]);
    const [totalAmount, setTotalAmount] = useState<number>(0);

    const handleBackClick = () => {
        localStorage.removeItem('include_packages');
        localStorage.removeItem('packages_data');
        localStorage.removeItem('packages_table');
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
                    return sum + (product.product_retail_price * product.pivot.quantity);
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
        const storedPackages = localStorage.getItem('include_packages');
        const parsedPackages = JSON.parse(storedPackages);
        console.log(storedPackages);

        // const metadata;
        const newMetadata = parsedPackages.map((pkg: Package) => ({
            id: pkg.id,
            name: pkg.name,
            description: pkg.description,
            total_price: pkg.total_price,
            products: pkg.products.map((product: Product) => (product))
        }));

        setFormData(prevState => {
            const updatedState = {
                ...prevState,
                metadata: newMetadata
            };
            console.log('Updated FormData:', updatedState);
            return updatedState;
        });

        const quotationData: Quotation = {
            name: formData.quotationName,
            description: formData.description,
            total_amount: formData.quotationPrice,
            metadata: newMetadata,
        }

        const response = await createQuotation(quotationData);

        if (response?.success) {
            notify('success', "Quotation Created Successfully!");
            localStorage.removeItem('include_packages');
            navigate('/quotations');
            console.log(response);
        } else {
            console.log(response);

        }

        try {
            console.log('FormData:', formData);



        } catch (error) {
            console.error("Error submitting form data:", error);
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

    useEffect(() => {
        const storedPackages = localStorage.getItem('include_packages');

        if (storedPackages) {
            setSelectedPackages(JSON.parse(storedPackages));
        }

        setFormData(prevData => ({
            ...prevData,
            quotationPrice: totalAmount, // Sync quotationPrice with totalAmount
        }));

    }, [totalAmount]);

    const updateSelectedPackages = (packages) => {
        const updatedPackages = packages.map((prodPackage: Package) => {
            const totalPrice = prodPackage.products.reduce((sum, product) => {
                return sum + product.product_retail_price * product.pivot.quantity;
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
                        return sum + product.product_retail_price * product.pivot.quantity;
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

    const handleRemoveProduct = (packId: number, prodId: number) => {
        setSelectedPackages((prevPackages: Package[]) => {
            const updatedPackages = prevPackages.map((prodPackage: Package) => {
                if (prodPackage.id === packId) {
                    const updatedProducts = prodPackage.products.filter((product: Product) => product.id !== prodId);

                    const newTotalPrice = updatedProducts.reduce((sum, product) => {
                        return sum + product.product_retail_price * product.pivot.quantity;
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
            <div className="flex justify-between items-center flex-wrap mb-6">
                <div className="flex gap-4 items-center">
                    <button className='text-gray-800 dark:text-gray-400' onClick={handleBackClick}>
                        <i className="ki-solid ki-arrow-left"></i>
                    </button>
                    <span className="text-2xl font-bold text-gray-900">
                        Create New Quotation
                    </span>
                </div>
            </div>

            <div className="flex flex-wrap gap-8 mb-8">
                <div className="left-column flex flex-col flex-[3] gap-8">
                    <div className="card">
                        <div className="card-body">
                            <h2 className='text-xl mb-4 font-semibold text-gray-900'>Package Detail</h2>

                            {/* Package Name */}
                            <InputFieldGroup
                                fieldTitle="Quotation Name"
                                description="A prodPackage name is required and recommended to be unique."
                                placeholder="Quotation name"
                                name="quotationName"
                                value={formData.quotationName}
                                onChange={handleChange}
                                error={validationErrors.name}
                            />

                            {/* Description */}
                            <InputFieldGroup
                                fieldTitle="Description"
                                description="A prodPackage name is required and recommended to be unique."
                                placeholder="Description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                error={validationErrors.description}
                            />
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
                                    RM {totalAmount.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='flex flex-col right-column flex-[6] gap-8'>
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
                                                    <span className='text-base text-slate-700'>
                                                        RM {prodPackage.total_price.toFixed(2)}
                                                    </span>
                                                    <span className='text-sm text-slate-400'>
                                                        {prodPackage.description}
                                                    </span>
                                                </div>
                                                <i className="ki-outline ki-plus text-gray-600 text-2sm accordion-active:hidden block">
                                                </i>
                                                <i className="ki-outline ki-minus text-gray-600 text-2sm accordion-active:block hidden">
                                                </i>
                                            </button>
                                            <div className="accordion-content hidden border-t" id={"package_content_" + prodPackage.id.toString()}>
                                                <div className="product-list flex flex-col">
                                                    <table className="table align-middle text-gray-700 font-medium text-sm">
                                                        <thead>
                                                            <tr>
                                                                <th className='w-[250px]'>Product</th>
                                                                <th className='w-[100px] text-center'>Quantity</th>
                                                                <th className='w-[120px] text-center'>Retail Price</th>
                                                                <th className='w-[120px] text-center'>Total Price</th>
                                                                <th className='w-[60px] text-center'>Visibility</th>
                                                                <th className='w-[60px] text-center'>Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {prodPackage.products.map((product) => (
                                                                <tr
                                                                    key={product.id}
                                                                >
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
                                                                    <td>
                                                                        RM {product.product_retail_price.toFixed(2)}
                                                                    </td>
                                                                    <td>
                                                                        RM {(product.product_retail_price * product.pivot.quantity).toFixed(2)}
                                                                    </td>
                                                                    <td className='text-center'>
                                                                        <label className="switch flex justify-center">
                                                                            <input
                                                                                name="visibility"
                                                                                type="checkbox"
                                                                                checked={product.pivot.visibility}
                                                                                onChange={() => handleVisibilityToggle(product.id)}
                                                                            />
                                                                        </label>
                                                                    </td>
                                                                    <td className='text-center'>
                                                                        <button
                                                                            className="btn btn-sm btn-danger"
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
                                ))}
                            </div>
                        </div>
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
                    Create
                </button>
            </div>

            <IncludePackageModal
                selectedPackages={selectedPackages}
                updateSelectedPackages={updateSelectedPackages}
            />
        </>
    );
}

export default CreateQuotation;
