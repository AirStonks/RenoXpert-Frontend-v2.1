// src\pages\Quotation\EditQuotation.tsx

import { useEffect, useRef, useState } from 'react';
import { toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate, useParams } from 'react-router-dom';
import InputFieldGroup from '../../components/Forms/TextFields/InputFieldGroup';
import IncludePackageModal from '../../components/Modals/IncludePackageModal';
import { Package, Product, Quotation } from '../../types';
import { updateQuotation } from '../../services/api';
import useFetchQuotation from '../../hook/useFetchQuotation';
import Loading from '../../components/Loading';

function EditQuotation() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const quotationId = id ? parseInt(id, 10) : null;

    const { quotationDetail, loading, error } = useFetchQuotation(quotationId);

    const [formData, setFormData] = useState({
        quotationName: '',
        quotationPrice: 0,
        description: '',
    });

    const qtyBtnRef = useRef(null);

    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [selectedPackages, setSelectedPackages] = useState([]);

    const handleBackClick = () => {
        localStorage.removeItem('include_packages');
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

    // PENDING
    const handleSubmit = async () => {
        try {
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
                id: quotationDetail.id,
                name: formData.quotationName,
                description: formData.description,
                total_amount: formData.quotationPrice,
                metadata: newMetadata,
            }

            const response = await updateQuotation(quotationData);

            if (response?.success) {
                notify('success', "Quotation Updated Successfully!");
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
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

    useEffect(() => {
        if (quotationDetail) {

            localStorage.setItem('include_packages', JSON.stringify(quotationDetail.metadata));
            const storedPackages = localStorage.getItem('include_packages');

            if (storedPackages) {
                setSelectedPackages(JSON.parse(storedPackages));
            }

            setFormData({
                quotationName: quotationDetail.name || '',
                quotationPrice: quotationDetail.total_amount || 0,
                description: quotationDetail.description || ''
            });
        }

    }, [quotationDetail]);

    const updateSelectedPackages = (packages) => {
        setSelectedPackages(packages);
        localStorage.setItem('include_packages', JSON.stringify(packages));
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

                            // Return the updated product with new quantity
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

                    // Return the updated package with modified products
                    return {
                        ...prodPackage,
                        products: updatedProducts
                    };
                }
                return prodPackage; // Return the original package if not matched
            });

            updateLocalStorage(updatedPackages); // Update localStorage
            return updatedPackages; // Return the updated packages
        });
    };

    const handleRemoveProduct = (packId: number, prodId: number) => {
        setSelectedPackages((prevPackages: Package[]) => {

            const updatedPackages = prevPackages.map((prodPackage: Package) => {
                if (prodPackage.id === packId) {
                    // Filter out the product with the matching prodId
                    const updatedProducts = prodPackage.products.filter((product: Product) => product.id !== prodId);

                    // Return a new package object with the updated products
                    return {
                        ...prodPackage,
                        products: updatedProducts
                    };
                }
                return prodPackage; // Return the original package if not matched
            });

            updateLocalStorage(updatedPackages); // Update localStorage
            return updatedPackages;
        });
    };

    const handleRemovePackage = (packId: number) => {
        setSelectedPackages((prevPackages: Package[]) => {
            // Filter out the package with the matching packId
            const updatedPackages = prevPackages.filter((prodPackage: Package) => prodPackage.id !== packId);

            updateLocalStorage(updatedPackages); // Update localStorage
            return updatedPackages;
        });
    };

    if (loading) return <Loading />;
    if (error) return <div>{error}</div>;
    if (!quotationDetail) return <div>Quotation not found</div>;

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

                            {/* Price */}
                            <InputFieldGroup
                                fieldTitle="Quotation Price"
                                description="A prodPackage name is required and recommended to be unique."
                                placeholder="Total Price"
                                name="quotationPrice"
                                value={formData.quotationPrice}
                                onChange={handleChange}
                                error={validationErrors.price}
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
                                                                <th className='w-[150px]'>Product</th>
                                                                <th className='w-[100px] text-center'>Quantity</th>
                                                                <th className='w-[100px]'>Unit Price</th>
                                                                <th className='w-[100px]'>Total Price</th>
                                                                <th className='w-[80px] text-center'>Action</th>
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
                                                                        RM {product.price.toFixed(2)}
                                                                    </td>
                                                                    <td>
                                                                        RM {(product.price * product.pivot.quantity).toFixed(2)}
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
                    Edit
                </button>
            </div>

            <IncludePackageModal
                selectedPackages={selectedPackages}
                updateSelectedPackages={updateSelectedPackages}
            />
        </>
    );
}

export default EditQuotation;