// src\pages\Product\EditProduct.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useFetchProduct from '../../hook/useFetchProduct';
import Loading from '../../components/Loading';
import InputFieldGroup from '../../components/Forms/TextFields/InputFieldGroup';
import Dropdown from '../../components/Forms/Dropdown/Dropdown';
import { Product, PMCategory } from '../../types';
import { removeProduct, updateProduct } from '../../services/api';
import { Slide, toast } from 'react-toastify';
import DeleteModal from '../../components/Modals/DeleteModal';
import useFetchPMCategory from '../../hook/useFetchPMCategory';

const AWS_S3_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_AWS_S3_URL
        : import.meta.env.VITE_APP_ENV === "staging" || import.meta.env.VITE_APP_ENV === "local"
            ? import.meta.env.VITE_STAGING_AWS_S3_URL
            : null

interface FormErrors {
    [key: string]: string | undefined; // Use string or undefined for error messages
}

const EditProduct: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const productId = id ? parseInt(id, 10) : null;

    const { product, loading: productLoading, error: productError } = useFetchProduct(productId);
    const { pmCategory, loading: categoryLoading, error: categoryError } = useFetchPMCategory();

    const [formData, setFormData] = useState<Product | null>(null);

    const [selectedProduct, setSelectedProduct] = useState<{ id: number, name: string } | null>(null);
    const [errors, setErrors] = useState<FormErrors>({});

    const handleBackClick = () => {
        navigate('/products/' + productId); // Go back to the previous route
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
        document.title = "Edit Product | RenoXpert";
        if (product) {
            setFormData(product);
        }
    }, [product]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name.startsWith('provisioning.supply')) {
            const property = name.split('.')[2];

            setFormData((prevData) => ({
                ...prevData,
                provisioning: {
                    ...prevData.provisioning,
                    supply: {
                        ...prevData.provisioning.supply,
                        [property]: value,
                    },
                },

            }));

        } else if (name.startsWith('provisioning.install')) {
            const property = name.split('.')[2];

            setFormData((prevData) => ({
                ...prevData,
                provisioning: {
                    ...prevData.provisioning,
                    install: {
                        ...prevData.provisioning.install,
                        [property]: value,
                    },
                },

            }));
        } else {
            setFormData((prevData) => ({
                ...prevData,
                [name]: value
            }));
        }
    };

    const validate = (): FormErrors => {
        const newErrors: FormErrors = {};

        if (!formData?.name) newErrors.name = "Name required";
        if (!formData?.uom) newErrors.uom = "UOM required";
        if ((formData?.provisioning.supply.retail_price < 0 || formData?.provisioning.supply.retail_price === '') && (formData?.type !== 'roundup')) newErrors.supply_retail_price = "Retail Price required";
        if ((formData?.provisioning.supply.cogs < 0 || formData?.provisioning.supply.cogs === '') && (formData?.type !== 'roundup')) newErrors.supply_cogs = "Cost of Good Sold required";
        if ((formData?.provisioning.supply.excluded_price < 0 || formData?.provisioning.supply.excluded_price === '') && (formData?.type !== 'roundup')) newErrors.supply_excluded_price = "Excluded Price required";
        if ((formData?.provisioning.install.retail_price < 0 || formData?.provisioning.install.retail_price === '') && (formData?.type !== 'roundup')) newErrors.install_retail_price = "Retail Price required";
        if ((formData?.provisioning.install.cogs < 0 || formData?.provisioning.install.cogs === '') && (formData?.type !== 'roundup')) newErrors.install_cogs = "Cost of Good Sold required";
        if ((formData?.provisioning.install.excluded_price < 0 || formData?.provisioning.install.excluded_price === '') && (formData?.type !== 'roundup')) newErrors.install_excluded_price = "Excluded Price required";

        return newErrors;
    };

    const handleSubmit = async () => {
        setErrors({});
        const validationErrors = validate();

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            const response = await updateProduct(formData);

            if (response?.success) {
                notify('success', "Product Edited Successfully!");
                navigate('/products/' + productId);
            }

        } catch (error) {
            notify('error', error.response.data.message);
        }
    };

    const handleRemoveProduct = () => {
        setSelectedProduct({ id: productId, name: formData?.name });

        const modal = document.querySelector('#delete_product_modal') as HTMLElement;

        if (modal) {
            modal.classList.add('open'); // Assuming you have some CSS to show the modal
        }
    };

    if (productLoading) return <Loading />;
    if (productError) return <div>{productError}</div>;

    if (categoryLoading) return <Loading />;
    if (categoryError) return <div>{categoryError}</div>;
    if (!product) return <div>Product not found</div>;

    // Convert productCategory to the format needed for Dropdown options
    const dropdownOptions = pmCategory.map((cat: PMCategory) => ({
        value: cat.id.toString(), // Ensure value is a string
        label: cat.name // Assuming productCategory has a 'name' property
    }));

    return (
        <>
            {productLoading || categoryLoading && <Loading />}

            {(formData || product) &&
                <>
                    <div className="flex justify-between items-center flex-wrap mb-6">
                        <div className="flex gap-4 items-center">
                            <button className='text-gray-800 dark:text-gray-400' onClick={handleBackClick}>
                                <i className="ki-solid ki-arrow-left"></i>
                            </button>
                            <span className="text-2xl font-bold text-gray-900">
                                Edit Product
                            </span>
                        </div>
                        {/* <div className="flex gap-3 flex-wrap">
                            <button className="btn btn-sm btn-danger" data-action="delete" data-id={productId} data-name={formData?.name} data-modal-toggle="#delete_item_modal" onClick={handleRemoveProduct}>
                                <i className="ki-outline ki-trash"></i>
                                Remove Product
                            </button>
                        </div> */}
                    </div>

                    <div className="flex flex-wrap gap-8 mb-8">
                        <div className="flex flex-col flex-[1] gap-8">
                            <div className="card">
                                <div className="card-body">
                                    {/* Header */}
                                    <h1 className='text-xl mb-4 font-semibold text-gray-900'>General</h1>

                                    <div className="flex flex-col">
                                        {/* Product Name */}
                                        <InputFieldGroup
                                            fieldTitle="Product Name"
                                            description="A product name is required and recommended to be unique."
                                            placeholder="Product name"
                                            name="name"
                                            value={formData?.name}
                                            onChange={handleChange}
                                            error={errors.name}
                                        />


                                        {/* Supplier Name */}
                                        <InputFieldGroup
                                            fieldTitle="Supplier Name"
                                            description="The supplier name who supplies the product."
                                            placeholder="Supplier name"
                                            name="supplier_name"
                                            value={formData?.supplier_name}
                                            onChange={handleChange}
                                            error={errors.supplier_name}
                                        />

                                        {/* Description */}
                                        <div className="flex flex-col items-baseline flex-wrap lg:flex-nowrap mb-8">
                                            <label className="mb-2 text-sm font-medium text-gray-900">
                                                Description
                                            </label>
                                            <span className='text-xs text-gray-600 tracking-wide mb-2'>
                                                Add any additional comments or notes about the product here
                                            </span>
                                            <textarea
                                                className="textarea"
                                                name="description"
                                                placeholder="Text"
                                                rows={6}
                                                value={formData?.description || ''} // Use value instead of children
                                                onChange={(e) => handleChange(e)} // Handle change for updating formData
                                            />
                                        </div>

                                        {/* Internal Description */}
                                        <div className="flex flex-col items-baseline flex-wrap lg:flex-nowrap mb-8">
                                            <label className="mb-2 text-sm font-medium text-gray-900">
                                                Internal Description
                                            </label>
                                            <span className='text-xs text-gray-600 tracking-wide mb-2'>
                                                Add comment for internal reference. (Not visible to public)
                                            </span>
                                            <textarea
                                                className="textarea"
                                                name="internal_desc"
                                                placeholder="Text"
                                                rows={6}
                                                value={formData?.internal_desc || ''} // Use value instead of children
                                                onChange={(e) => handleChange(e)} // Handle change for updating formData
                                            />
                                        </div>


                                        {/* UOM */}
                                        {/* <InputFieldGroup
                                            fieldTitle="UOM"
                                            description="Unit of Measurement of the product"
                                            placeholder="measurement"
                                            type="text"
                                            name="uom"
                                            value={formData?.uom}
                                            onChange={handleChange}
                                            error={errors.uom}
                                        /> */}
                                        <div className="flex flex-col mb-8">
                                            <label className='mb-2 text-sm font-medium text-gray-900'>
                                                UOM
                                            </label>

                                            <span className="text-xs text-gray-600 tracking-wide mb-2">
                                                Unit of Measurement of the product.
                                            </span>

                                            <Dropdown
                                                options={[
                                                    { value: "set", label: "Set" },
                                                    { value: "lumpsum", label: "Lumpsum" },
                                                    { value: "unit", label: "Unit" },
                                                    { value: "pc", label: "Pc" },
                                                    { value: "ft", label: "Ft" },
                                                ]}
                                                name="uom"
                                                value={formData?.uom}
                                                onChange={handleChange}
                                                error={errors.uom}
                                            />
                                        </div>

                                        {/* Product Type */}
                                        <div className="flex flex-col mb-8">
                                            <label className='mb-2 text-sm font-medium text-gray-900'>
                                                Product Type
                                            </label>

                                            <span className="text-xs text-gray-600 tracking-wide mb-2">
                                                Select a product type to differentiate the product.
                                            </span>

                                            <Dropdown
                                                options={[
                                                    { value: "renovation", label: "Renovation" },
                                                    { value: "carpentry", label: "Carpentry" },
                                                    { value: "furniture", label: "Furniture" },
                                                    { value: "electrical_appliances", label: "Electrical Appliances" },
                                                    { value: "iot", label: "IOT" },
                                                    { value: "project_management", label: "Project Management" },
                                                    { value: "loose_items", label: "Loose Items" },
                                                    { value: "roundup", label: "Roundup" },
                                                ]}
                                                name="type"
                                                value={formData?.type}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        {/* SKU */}
                                        <InputFieldGroup
                                            fieldTitle="SKU"
                                            description="Unique code for tracking this product in inventory"
                                            placeholder="SKU"
                                            name="SKU"
                                            value={formData?.SKU}
                                            onChange={handleChange}
                                            error={errors.SKU}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col flex-[2] gap-8">
                            {/* Thumbnail */}
                            <div className="card relative">
                                <div className="card-body">
                                    {/* Header */}
                                    <h1 className='text-xl mb-4 font-semibold text-gray-900'>Photo</h1>

                                    <div className="flex flex-col justify-center items-center text-center">
                                        <span className="flex text-xs text-gray-600 tracking-wide mb-2">
                                            To manage product photos, head back to the previous or product detail page and click on "View" to manage photos.
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-body">
                                    {/* Header */}
                                    <h1 className='text-xl mb-4 font-semibold text-gray-900'>Pricing</h1>

                                    <div className="flex flex-wrap gap-4">
                                        <div className="card flex lg:flex-1 md:flex-auto">
                                            <div className="card-body">
                                                <div className="flex flex-col mb-4">
                                                    <h1 className='text-2xl font-semibold text-gray-900 mb-2'>Supply</h1>
                                                    <span className='text-xs text-gray-600 tracking-wide'>The costs for the product supply</span>
                                                </div>

                                                {/* Retail Price */}
                                                <InputFieldGroup
                                                    fieldTitle="Retail Price"
                                                    description="This is the price at which the product will be sold to customers"
                                                    placeholder="Retail Price"
                                                    type="number"
                                                    name="provisioning.supply.retail_price"
                                                    value={formData?.provisioning.supply.retail_price}
                                                    onChange={handleChange}
                                                    error={errors.supply_retail_price}
                                                />

                                                {/* Cost of Good */}
                                                <InputFieldGroup
                                                    fieldTitle="Cost of Good Sold"
                                                    description="This includes all costs directly tied to the production of the product"
                                                    placeholder="Cost of Good Sold"
                                                    type="number"
                                                    name="provisioning.supply.cogs"
                                                    value={formData?.provisioning.supply.cogs}
                                                    onChange={handleChange}
                                                    error={errors.supply_cogs}
                                                />

                                                {/* Excluded Price */}
                                                <InputFieldGroup
                                                    fieldTitle="Excluded Price"
                                                    description="Enter the price that will be deducted when the selected product is excluded from a package in quotation"
                                                    placeholder="Excluded Price"
                                                    type="number"
                                                    name="provisioning.supply.excluded_price"
                                                    value={formData?.provisioning.supply.excluded_price}
                                                    onChange={handleChange}
                                                    error={errors.supply_excluded_price}
                                                />
                                            </div>
                                        </div>
                                        <div className="card flex lg:flex-1 md:flex-auto">
                                            <div className="card-body">
                                                <div className="flex flex-col mb-4">
                                                    <h1 className='text-2xl font-semibold text-gray-900 mb-2'>Install</h1>
                                                    <span className='text-xs text-gray-600 tracking-wide'>The installation cost for the product</span>
                                                </div>

                                                {/* Retail Price */}
                                                <InputFieldGroup
                                                    fieldTitle="Retail Price"
                                                    description="This is the price at which the product will be sold to customers"
                                                    placeholder="Retail Price"
                                                    type="number"
                                                    name="provisioning.install.retail_price"
                                                    value={formData?.provisioning.install.retail_price}
                                                    onChange={handleChange}
                                                    error={errors.install_retail_price}
                                                />

                                                {/* Cost of Good */}
                                                <InputFieldGroup
                                                    fieldTitle="Cost of Good Sold"
                                                    description="This includes all costs directly tied to the production of the product"
                                                    placeholder="Cost of Good Sold"
                                                    type="number"
                                                    name="provisioning.install.cogs"
                                                    value={formData?.provisioning.install.cogs}
                                                    onChange={handleChange}
                                                    error={errors.install_cogs}
                                                />

                                                {/* Excluded Price */}
                                                <InputFieldGroup
                                                    fieldTitle="Excluded Price"
                                                    description="Enter the price that will be deducted when the selected product is excluded from a package in quotation"
                                                    placeholder="Excluded Price"
                                                    type="number"
                                                    name="provisioning.install.excluded_price"
                                                    value={formData?.provisioning.install.excluded_price}
                                                    onChange={handleChange}
                                                    error={errors.install_excluded_price}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='flex flex-col flex-[1] gap-8'>
                            <div className="card">
                                <div className="card-body">
                                    {/* Header */}
                                    <h1 className='text-xl mb-4 font-semibold text-gray-900'>Project Management</h1>

                                    {/* Task Weightage */}
                                    <InputFieldGroup
                                        fieldTitle="Task Weightage"
                                        description="Define the weightage of this task."
                                        placeholder="0 - 10"
                                        name="task_weightage"
                                        type='number'
                                        value={formData?.task_weightage}
                                        onChange={handleChange}
                                        error={errors.task_weightage}
                                    />

                                    {/* PM Category */}
                                    <div className="flex flex-col mb-8">
                                        <label className='mb-2 text-sm font-medium text-gray-900'>
                                            PM Category
                                        </label>

                                        <span className="text-xs text-gray-600 tracking-wide mb-2">
                                            Define the category of the product. (for PM Management purpose)
                                        </span>

                                        <Dropdown
                                            options={dropdownOptions}
                                            name="pm_category_id"
                                            value={formData?.pm_category_id}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Properties */}
                            <div className="card">
                                <div className="card-body">
                                    {/* Header */}
                                    <h1 className='text-xl mb-4 font-semibold text-gray-900'>Properties</h1>

                                    <div className="flex flex-col">
                                        <InputFieldGroup
                                            fieldTitle="Color"
                                            description="Color of the product"
                                            placeholder="color"
                                            name="color"
                                            type='text'
                                            value={formData?.color}
                                            onChange={handleChange}
                                            error={errors.color}
                                        />

                                        <InputFieldGroup
                                            fieldTitle="Material"
                                            description="The product material"
                                            placeholder="material"
                                            name="material"
                                            type='text'
                                            value={formData?.material}
                                            onChange={handleChange}
                                            error={errors.material}
                                        />

                                        <InputFieldGroup
                                            fieldTitle="Width"
                                            description="Product width"
                                            placeholder="width"
                                            name="width"
                                            type='text'
                                            value={formData?.width}
                                            onChange={handleChange}
                                            error={errors.width}
                                        />

                                        <InputFieldGroup
                                            fieldTitle="Height"
                                            description="The product height"
                                            placeholder="height"
                                            name="height"
                                            type='text'
                                            value={formData?.height}
                                            onChange={handleChange}
                                            error={errors.height}
                                        />

                                        <InputFieldGroup
                                            fieldTitle="Depth"
                                            description="The product depth"
                                            placeholder="depth"
                                            name="depth"
                                            type='text'
                                            value={formData?.depth}
                                            onChange={handleChange}
                                            error={errors.depth}
                                        />
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
                            Update
                        </button>
                    </div>
                </>
            }
            {/* <DeleteModal
                item={selectedProduct}
                modalTitle='Remove Product'
                modalPrompt='Are you sure to permanently remove this product:'
                notifySuccess='Product Removed Successfully!'
                notifyError='Product remove failed'
                navigateUrl='/products'
                deleteFunction={removeProduct}
            /> */}
        </>
    );
};

export default EditProduct;
