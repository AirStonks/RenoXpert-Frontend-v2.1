// src\pages\Product\CreateProduct.tsx

import { useState, useEffect } from 'react';
import Dropdown from '../../components/Forms/Dropdown/Dropdown';
import InputFieldGroup from '../../components/Forms/TextFields/InputFieldGroup';
import { createProduct } from '../../services/api';
import { toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { Product } from '../../types';
import useFetchProductCategory from '../../hook/useFetchPMCategory';
import Loading from '../../components/Loading';

interface FormErrors {
    [key: string]: string | undefined; // Use string or undefined for error messages
}

interface UploadedThumbnail {
    id: number;
    file: File;
    previewUrl: string;
}

const initProductData: Product = {
    name: '',
    SKU: '',
    type: 'renovation',
    description: '',
    pm_category: '1',
    uom: '',
    provisioning: {
        supply: {
            retail_price: 0,
            cogs: 0,
            excluded_price: 0,
        },
        install: {
            retail_price: 0,
            cogs: 0,
            excluded_price: 0,
        }
    },
    color: '',
    material: '',
    width: '',
    height: '',
    depth: '',
    task_weightage: null,
    status: 'available'
}

function CreateProduct() {
    const navigate = useNavigate();
    const { pmCategory, loading, error } = useFetchProductCategory();

    const [formData, setFormData] = useState<Product>(initProductData);
    const [thumbnail, setThumbnail] = useState(null);

    const [pendingUploadItems, setPendingUploadItems] = useState<File[]>([]);
    const [dragging, setDragging] = useState(false);
    const [documentItems, setDocumentItems] = useState<[]>([]);
    const [selectedDocumentTaskId, setSelectedDocumentTaskId] = useState<number>(null);

    const maxFiles = 10;

    const [errors, setErrors] = useState<FormErrors>({});

    const handleBackClick = () => {
        navigate('/products'); // Go back to the previous route
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
        document.title = "Create Product | RenoXpert";
    }, []);

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

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedThumbnail = event.target.files?.[0];
        if (selectedThumbnail) {
            const previewUrl = URL.createObjectURL(selectedThumbnail);  // Create a temporary URL for the image
            setThumbnail({
                id: Date.now(),  // You can generate a unique ID here if needed
                file: selectedThumbnail,
                previewUrl: previewUrl,
            });
            console.log('Selected file:', selectedThumbnail.name);
        }
    };

    const handleRemoveFile = () => {
        setThumbnail(null);  // Remove the file (or revert it to an initial state)
        console.log('File removed');
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(event.target.files ?? []);

        // Filter for image files based on MIME types
        const imageFiles = selectedFiles.filter(file =>
            ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'].includes(file.type)
        );

        const newPendingUploadItems = [...pendingUploadItems, ...imageFiles];

        if (newPendingUploadItems.length + documentItems.length > maxFiles) {
            notify('error', `You can only upload up to ${maxFiles} files.`);
            return;
        }

        if (imageFiles.length < selectedFiles.length) {
            notify('error', 'Only image files are allowed.');
        }

        setPendingUploadItems(newPendingUploadItems);
    };

    // Handle drag over event
    const handleDragOver = (event) => {
        event.preventDefault();
        setDragging(true); // Set dragging state to true when dragging over
    };

    // Handle drag leave event
    const handleDragLeave = () => {
        setDragging(false); // Set dragging state to false when dragging leaves
    };

    // Handle drop event
    const handleDrop = (event) => {
        event.preventDefault();
        const droppedFiles = event.dataTransfer.files;

        // Filter for image files based on MIME types
        const imageFiles = Array.from(droppedFiles).filter(file =>
            ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'].includes(file.type)
        );

        if (pendingUploadItems.length + imageFiles.length + documentItems.length <= maxFiles) {
            if (imageFiles.length > 0) {
                setPendingUploadItems((prevItems) => [
                    ...prevItems,
                    ...imageFiles,
                ]);
            } else {
                notify('error', 'Only image files are allowed.');
            }
        } else {
            notify('error', `You can only upload up to ${maxFiles} files.`);
        }
        setDragging(false); // Reset dragging state when drop occurs
    };

    const removeFile = (index) => {
        setPendingUploadItems((prevItems) => prevItems.filter((_, i) => i !== index));
    };

    const validate = (): FormErrors => {
        const newErrors: FormErrors = {};
        if (!formData.name) newErrors.name = "Name required";
        if (!formData.uom) newErrors.uom = "UOM required";
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

        const updatedFormData = {
            ...formData, // Spread the existing formData
            attachments: {
                ...formData.attachments, // Spread the existing attachments (if any)
                thumbnail: thumbnail?.file,
                photos: pendingUploadItems,
            }
        };

        try {
            const response = await createProduct(updatedFormData);

            if (response?.success) {
                notify('success', "Product Created Successfully!");
                navigate('/products'); // Navigate to /products on success
            }

        } catch (error) {
            console.error('Product creation failed:', error);
        }
    };

    const formatFileSize = (size: number) => {
        const KB = 1024;
        const MB = KB * 1024;
        if (size >= MB) {
            return `${(size / MB).toFixed(2)} MB`;
        }
        return `${(size / KB).toFixed(2)} KB`;
    };

    if (loading) return <Loading />;
    if (error) return <div>{error}</div>;
    if (!pmCategory) return <div>Product Category not found</div>;

    // Convert pmCategory to the format needed for Dropdown options
    const dropdownOptions = pmCategory.map((cat: ProductCategory) => ({
        value: cat.id.toString(), // Ensure value is a string
        label: cat.name // Assuming pmCategory has a 'name' property
    }));

    return (
        <>
            <div className="flex justify-between items-center flex-wrap mb-6">
                <div className="flex gap-4 items-center">
                    <button className='text-gray-800 dark:text-gray-400' onClick={handleBackClick}>
                        <i className="ki-solid ki-arrow-left"></i>
                    </button>
                    <span className="text-2xl font-bold text-gray-900">
                        Create Product
                    </span>
                </div>
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
                                    value={formData.name}
                                    onChange={handleChange}
                                    error={errors.name}
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
                                        onChange={(e) => handleChange(e)}
                                    >
                                        {formData.description}
                                    </textarea>
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
                                        onChange={(e) => handleChange(e)}
                                    >
                                        {formData.internal_desc}
                                    </textarea>
                                </div>

                                {/* UOM */}
                                <InputFieldGroup
                                    fieldTitle="UOM"
                                    description="Unit of Measurement of the product"
                                    placeholder="measurement"
                                    type="text"
                                    name="uom"
                                    value={formData.uom}
                                    onChange={handleChange}
                                    error={errors.uom}
                                />

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
                                        value={formData.type}
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
                            <div className="flex flex-col">
                                <h1 className='text-2xl mb-4 font-semibold text-gray-900'>Thumbnail</h1>

                                <div className="flex justify-center items-center mb-2">
                                    {!thumbnail && (
                                        <input
                                            className="file-input file-input-lg"
                                            type="file"
                                            name="attachments"
                                            accept="image/*"
                                            onChange={handleFileUpload} // React handles file input change
                                        />
                                    )}

                                    {thumbnail && (
                                        <div className="flex flex-col items-center">
                                            <div className="image-input-placeholder rounded-lg border-2 border-success image-input-empty:border-gray-300 relative mb-2">
                                                <div className="image-input-preview rounded-lg">
                                                    <img
                                                        src={thumbnail.previewUrl}
                                                        alt="Thumbnail preview"
                                                        className="rounded-lg w-32 h-32 object-cover"  // Adjust size and style as needed
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex">
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={handleRemoveFile}
                                                >
                                                    Remove
                                                </button>
                                            </div>

                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col justify-center items-center text-center">
                                    <span className="flex text-xs text-gray-600 tracking-wide mb-2">
                                        The product thumbnail will be displayed on the product page.
                                    </span>
                                </div>
                            </div>

                            <hr className='my-4' />

                            <div className="flex flex-col">
                                <h1 className='text-2xl mb-4 font-semibold text-gray-900'>Photos</h1>

                                <div
                                    className={`flex bg-center w-full p-1 lg:p-2 bg-no-repeat bg-[length:550px] border border-gray-300 rounded-xl border-dashed branding-bg mb-4 
                                    ${dragging ? 'border-primary border-1 bg-gray-100' : ''}`} // Add custom styles when dragging
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <div className="flex flex-col place-items-center place-content-center text-center rounded-xl w-full">
                                        <div className="flex items-center mb-2.5">
                                            <div className="relative size-11 shrink-0">
                                                <svg
                                                    className="w-full h-full stroke-brand-clarity fill-light"
                                                    fill="none"
                                                    height="48"
                                                    viewBox="0 0 44 48"
                                                    width="44"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path d="M16 2.4641C19.7128 0.320509 24.2872 0.320508 28 2.4641L37.6506 8.0359C41.3634 10.1795 43.6506 14.141 43.6506 18.4282V29.5718C43.6506 33.859 41.3634 37.8205 37.6506 39.9641L28 45.5359C24.2872 47.6795 19.7128 47.6795 16 45.5359L6.34937 39.9641C2.63655 37.8205 0.349365 33.859 0.349365 29.5718V18.4282C0.349365 14.141 2.63655 10.1795 6.34937 8.0359L16 2.4641Z" fill=""></path>
                                                    <path d="M16.25 2.89711C19.8081 0.842838 24.1919 0.842837 27.75 2.89711L37.4006 8.46891C40.9587 10.5232 43.1506 14.3196 43.1506 18.4282V29.5718C43.1506 33.6804 40.9587 37.4768 37.4006 39.5311L27.75 45.1029C24.1919 47.1572 19.8081 47.1572 16.25 45.1029L6.59937 39.5311C3.04125 37.4768 0.849365 33.6803 0.849365 29.5718V18.4282C0.849365 14.3196 3.04125 10.5232 6.59937 8.46891L16.25 2.89711Z" stroke="" strokeOpacity="0.2"></path>
                                                </svg>
                                                <div className="absolute leading-none left-2/4 top-2/4 -translate-y-2/4 -translate-x-2/4">
                                                    <i className="ki-filled ki-picture text-xl ps-px text-brand"></i>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Input for file selection */}
                                        <input
                                            type="file"
                                            id="file-upload"
                                            multiple
                                            accept='image/*'
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                        <label
                                            htmlFor="file-upload"
                                            className="text-gray-900 text-xs font-medium hover:text-primary-active mb-px cursor-pointer"
                                        >
                                            Click or Drag & Drop
                                        </label>

                                        <span className="text-2xs text-gray-700 text-nowrap">
                                            max size: 50MB | max files: {maxFiles}
                                        </span>
                                    </div>
                                </div>

                                {pendingUploadItems.length > 0 && (
                                    <div className="flex flex-col gap-4 mb-8">
                                        {pendingUploadItems.map((file, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between flex-wrap grow border border-gray-200 rounded-xl gap-2 px-3.5 py-2.5 relative" // Add 'relative' for positioning the button
                                            >
                                                <div className="flex items-center flex-wrap gap-3.5">
                                                    <div className="relative size-[50px] shrink-0">
                                                        <svg
                                                            className="w-full h-full stroke-gray-300 fill-gray-100"
                                                            fill="none"
                                                            height="48"
                                                            viewBox="0 0 44 48"
                                                            width="44"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                        >
                                                            <path d="M16 2.4641C19.7128 0.320509 24.2872 0.320508 28 2.4641L37.6506 8.0359C41.3634 10.1795 43.6506 14.141 43.6506 18.4282V29.5718C43.6506 33.859 41.3634 37.8205 37.6506 39.9641L28 45.5359C24.2872 47.6795 19.7128 47.6795 16 45.5359L6.34937 39.9641C2.63655 37.8205 0.349365 33.859 0.349365 29.5718V18.4282C0.349365 14.141 2.63655 10.1795 6.34937 8.0359L16 2.4641Z" fill=""></path>
                                                            <path d="M16.25 2.89711C19.8081 0.842838 24.1919 0.842837 27.75 2.89711L37.4006 8.46891C40.9587 10.5232 43.1506 14.3196 43.1506 18.4282V29.5718C43.1506 33.6804 40.9587 37.4768 37.4006 39.5311L27.75 45.1029C24.1919 47.1572 19.8081 47.1572 16.25 45.1029L6.59937 39.5311C3.04125 37.4768 0.849365 33.6803 0.849365 29.5718V18.4282C0.849365 14.3196 3.04125 10.5232 6.59937 8.46891L16.25 2.89711Z" stroke=""></path>
                                                        </svg>
                                                        <div className="absolute leading-none start-2/4 top-2/4 -translate-y-2/4 -translate-x-2/4 rtl:translate-x-2/4">
                                                            <i className="ki-filled ki-sms text-xl text-gray-500"></i>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <a
                                                            className="text-sm font-medium text-gray-900 hover:text-primary-active mb-px"
                                                            href={URL.createObjectURL(file)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            {file.name}
                                                        </a>
                                                        <span className="text-2sm text-gray-700">
                                                            {formatFileSize(file.size)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* 'X' Button */}
                                                <button
                                                    className="absolute top-2 right-2 text-md text-red-600 hover:text-red-800"
                                                    onClick={() => removeFile(index)}
                                                >
                                                    <i className="ki-filled ki-cross text-md text-red-600 hover:text-red-800"></i>
                                                </button>
                                            </div>
                                        ))}

                                    </div>
                                )}

                                <div className="flex flex-col justify-center items-center text-center">
                                    <span className="flex text-xs text-gray-600 tracking-wide mb-2">
                                        Attach photos to the product for reference.
                                    </span>
                                </div>
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
                                            value={formData.provisioning.supply.retail_price}
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
                                            value={formData.provisioning.supply.cogs}
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
                                            value={formData.provisioning.supply.excluded_price}
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
                                            value={formData.provisioning.install.retail_price}
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
                                            value={formData.provisioning.install.cogs}
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
                                            value={formData.provisioning.install.excluded_price}
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
                                value={formData.task_weightage}
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
                                    name="pm_category"
                                    value={formData.pm_category}
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
                                    value={formData.color}
                                    onChange={handleChange}
                                    error={errors.color}
                                />

                                <InputFieldGroup
                                    fieldTitle="Material"
                                    description="The product material"
                                    placeholder="material"
                                    name="material"
                                    type='text'
                                    value={formData.material}
                                    onChange={handleChange}
                                    error={errors.material}
                                />

                                <InputFieldGroup
                                    fieldTitle="Width"
                                    description="Product width"
                                    placeholder="width"
                                    name="width"
                                    type='text'
                                    value={formData.width}
                                    onChange={handleChange}
                                    error={errors.width}
                                />

                                <InputFieldGroup
                                    fieldTitle="Height"
                                    description="The product height"
                                    placeholder="height"
                                    name="height"
                                    type='text'
                                    value={formData.height}
                                    onChange={handleChange}
                                    error={errors.height}
                                />

                                <InputFieldGroup
                                    fieldTitle="Depth"
                                    description="The product depth"
                                    placeholder="depth"
                                    name="depth"
                                    type='text'
                                    value={formData.depth}
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
                    Create
                </button>
            </div>
        </>
    );
}

export default CreateProduct;
