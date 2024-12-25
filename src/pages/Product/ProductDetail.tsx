import { useNavigate, useParams } from "react-router-dom";
import useFetchProduct from "../../hook/useFetchProduct";
import Loading from "../../components/Loading";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { changeProductThumbnail, removeProductPhoto, uploadProductPhotos } from "../../services/api";
import { Slide, toast } from "react-toastify";

const AWS_S3_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_AWS_S3_URL
        : import.meta.env.VITE_APP_ENV === "staging" || import.meta.env.VITE_APP_ENV === "local"
            ? import.meta.env.VITE_STAGING_AWS_S3_URL
            : null

function ProductDetail() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const productId = id ? parseInt(id, 10) : null;
    const { product, loading, error } = useFetchProduct(productId);

    const [isLoading, setIsLoading] = useState(false);

    const [selectedThumbnail, setselectedThumbnail] = useState(null);
    const [pendingUploadItems, setPendingUploadItems] = useState<File[]>([]);
    const [documentItems, setDocumentItems] = useState<[]>(null);
    const [documentManageMode, setDocumentManageMode] = useState(false);

    const maxFiles = 10; // Maximum number of files allowed

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
        document.title = 'Product Detail | RenoXpert';

        if (product?.attachments?.photos?.length > 0) {
            setDocumentItems(product?.attachments?.photos);
        } else {
            setDocumentItems([]);
        }

        if (product?.attachments?.thumbnail) {
            setselectedThumbnail(product?.attachments?.thumbnail);
        }

    }, [product?.attachments?.photos, product?.attachments?.thumbnail]);

    const handleBackClick = () => {
        navigate('/products');
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(event.target.files ?? []);

        // Filter for image files based on MIME types
        const imageFiles = selectedFiles.filter(file =>
            ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'].includes(file.type)
        );

        // Spread the existing pendingUploadItems with a fallback to an empty array
        const newPendingUploadItems = [...(pendingUploadItems || []), ...imageFiles];

        if (newPendingUploadItems.length + documentItems.length > maxFiles) {
            notify('error', `You can only upload up to ${maxFiles} files.`);
            return;
        }

        // Notify if some files were filtered out
        if (imageFiles.length < selectedFiles.length) {
            notify('error', 'Only image files are allowed.');
        }

        setPendingUploadItems(newPendingUploadItems);
    };

    const handleThumbnailChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        setIsLoading(true);

        const selectedThumbnail = event.target.files?.[0];

        // Validate file type
        const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

        if (selectedThumbnail) {
            // Check if the selected file is an image
            if (!allowedImageTypes.includes(selectedThumbnail.type)) {
                notify('error', 'Please select a valid image file (JPEG, PNG, GIF, WebP, SVG).');
                setIsLoading(false);
                return;
            }

            try {
                const response = await changeProductThumbnail(productId, selectedThumbnail);

                if (response?.success) {
                    setselectedThumbnail(response.data);
                    notify('success', 'Thumbnail changed successfully.');
                }

            } catch (error) {
                notify('error', 'Error occurred during file upload.');
            }
        }

        setIsLoading(false);
    };

    const removeFile = (index) => {
        setPendingUploadItems((prevItems) => prevItems.filter((_, i) => i !== index));
    };

    const removeServerFile = async (photoIndex: number) => {
        setIsLoading(true);

        try {
            const response = await removeProductPhoto(productId, photoIndex);

            if (response?.success) {
                setDocumentItems(response.data);

                if (response.data === null) {
                    setDocumentItems([]);
                }

                notify('success', 'File removed successfully.');
            }

        } catch (error) {
            console.log(error);
        }

        setIsLoading(false);
    }

    const uploadFiles = async () => {
        setIsLoading(true);
        try {
            const response = await uploadProductPhotos(productId, pendingUploadItems);

            if (response?.success) {
                setDocumentItems(response.data);
                setPendingUploadItems([]);
                setDocumentManageMode(false);

                notify('success', 'Files uploaded successfully.');
            }

        } catch (error) {
            console.log(error);
            notify('error', 'Error occurred during file upload.');
        }

        setIsLoading(false);
    };

    const formatFileSize = (size: number) => {
        const KB = 1024;
        const MB = KB * 1024;
        if (size >= MB) {
            return `${(size / MB).toFixed(2)} MB`;
        }
        return `${(size / KB).toFixed(2)} KB`;
    };


    if (!productId) return null;

    if (loading) {
        return <Loading />;
    } else if (error) {
        return <div className="text-red-600">Something went wrong: {error}</div>;
    } else if (!product) {
        return <div>Product not found</div>;
    }

    return (
        <>
            {isLoading && <Loading />}

            <div className="flex justify-between items-center flex-wrap mb-4">
                <div className="flex gap-4 items-center">
                    <button className='text-gray-800 dark:text-gray-400' onClick={handleBackClick}>
                        <i className="ki-solid ki-arrow-left"></i>
                    </button>
                    <span className="text-2xl font-bold text-gray-900">
                        Product Detail
                    </span>
                </div>
                <div className="flex">
                    <Link
                        to={'/products/edit/' + productId}
                        className="btn btn-info btn-sm"
                    >
                        Edit Product
                    </Link>
                </div>
            </div>

            <div className="flex mb-4 gap-2 items-center text-center badge badge-lg badge-pill">
                <i className="ki-filled ki-information-2 text-success"></i>
                <span className="font-semibold">Owner can only see this information</span>
            </div>

            <div className="flex flex-wrap gap-8 mb-8">
                <div className="flex flex-col flex-[1] gap-8">
                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                General Info
                            </h3>
                        </div>
                        <div className="card-body pt-3.5 pb-3.5">
                            <table className="table-auto">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Product Name:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3 flex gap-2 items-center">
                                            <span>{product.name}</span>
                                            <i className="ki-filled ki-information-2 text-success"></i>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Description:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3 flex gap-2 items-center">
                                            <span>{product.description ? product.description : '-'}</span>
                                            <i className="ki-filled ki-information-2 text-success"></i>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Internal Description:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3 flex gap-2 items-center">
                                            <span>{product.internal_desc ? product.internal_desc : '-'}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            UOM:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3 flex gap-2 items-center">
                                            <span>{product.uom}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Status:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Product Type:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {product.type.charAt(0).toUpperCase() + product.type.slice(1)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            SKU:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {product.SKU ? product.SKU : 'N/A'}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                Product History
                            </h3>
                        </div>
                        <div className="card-group pt-3.5 pb-3.5">
                            <table className="table-auto">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Created By:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {product.created_by ? product.created_by.name : 'N/A'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Date Created:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {product.created_at}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="card-group pt-3.5 pb-3.5">
                            <table className="table-auto">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Last Updated By:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {product.updated_by ? product.updated_by.name : 'N/A'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Last Updated At:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {product.updated_at}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col flex-[2] gap-8">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">
                                Photo
                            </h3>
                        </div>
                        <div className="card-body">
                            <table className="table-auto">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Thumbnail:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3 flex gap-2 items-center">
                                            <div className="flex gap-4 items-center">
                                                {selectedThumbnail ? (
                                                    <div className="flex gap-4 items-center">
                                                        <a
                                                            className="text-sm font-medium text-gray-900 hover:text-primary-active mb-px"
                                                            href={AWS_S3_URL + (selectedThumbnail.file_url)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <img
                                                                src={AWS_S3_URL + (selectedThumbnail.file_url)}
                                                                alt={product.name}
                                                                className="w-24 h-24 object-cover border border-gray-300 rounded"
                                                            />
                                                        </a>
                                                    </div>
                                                )
                                                    :
                                                    <span className="text-gray-600">N/A</span>
                                                }


                                                <button
                                                    className="btn btn-sm btn-info btn-outline"
                                                    data-modal-toggle="#photos_modal"
                                                >
                                                    View More
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">
                                Pricing
                            </div>
                        </div>
                        <div className="card-body">
                            <table className="table-auto mb-4">
                                <tbody>
                                    {/* <tr className="flex items-center">
                                        <td className="pb-3">
                                            <div className="flex flex-col pe-1">
                                                <span className="text-gray-900">UOM</span>
                                                <span className="text-xs text-gray-500">Unit of Measurement</span>
                                            </div>
                                        </td>
                                        <td className="pb-3">
                                            <span className="text-gray-900">:</span>
                                        </td>
                                        <td className="pb-3 ps-2 lg:ps-4 flex gap-2 items-center text-center">
                                            <span className="text-gray-900">{product.uom}</span>
                                            <i className="ki-filled ki-information-2 text-success"></i>
                                        </td>
                                    </tr> */}
                                    <tr className="flex items-center">
                                        <td>
                                            <div className="flex flex-col pe-1">
                                                <span className="text-gray-900">Total Retail Price</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="text-gray-900">:</span>
                                        </td>
                                        <td className="ps-2 lg:ps-4 flex gap-2 items-center text-center">
                                            <span className="text-gray-900">RM {product.provisioning.supply.retail_price + product.provisioning.install.retail_price}</span>
                                            <i className="ki-filled ki-information-2 text-success"></i>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="flex gap-2">
                                <div className="card flex-1">
                                    <div className="card-header">
                                        <div className="card-title">
                                            Supply
                                        </div>
                                    </div>
                                    <div className="card-body">
                                        <table className="table-auto">
                                            <tbody>
                                                <tr>
                                                    <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                        Retail Price:
                                                    </td>
                                                    <td className="text-sm text-gray-900 pb-3">
                                                        RM {product.provisioning.supply.retail_price}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                        COGS:
                                                    </td>
                                                    <td className="text-sm text-gray-900 pb-3">
                                                        RM {product.provisioning.supply.cogs}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="text-sm text-gray-600 pe-4 lg:pe-8">
                                                        Excluded Price:
                                                    </td>
                                                    <td className="text-sm text-gray-900">
                                                        RM {product.provisioning.supply.excluded_price}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="card flex-1">
                                    <div className="card-header">
                                        <div className="card-title">
                                            Install
                                        </div>
                                    </div>
                                    <div className="card-body">
                                        <table className="table-auto">
                                            <tbody>
                                                <tr>
                                                    <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                        Retail Price:
                                                    </td>
                                                    <td className="text-sm text-gray-900 pb-3">
                                                        RM {product.provisioning.install.retail_price}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                        COGS:
                                                    </td>
                                                    <td className="text-sm text-gray-900 pb-3">
                                                        RM {product.provisioning.install.cogs}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="text-sm text-gray-600 pe-4 lg:pe-8">
                                                        Excluded Price:
                                                    </td>
                                                    <td className="text-sm text-gray-900">
                                                        RM {product.provisioning.install.excluded_price}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='flex flex-col flex-[1] gap-8'>
                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                Project Management
                            </h3>
                        </div>
                        <div className="card-body pt-3.5 pb-3.5">
                            <table className="table-auto">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Task Weightage:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {product.task_weightage}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            PM Category:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {product.pm_category}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">
                                Properties
                            </div>
                        </div>
                        <div className="card-body">
                            <table className="table-auto">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Color:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3 flex gap-2 items-center">
                                            <span>{product.color || 'N/A'}</span>
                                            <i className="ki-filled ki-information-2 text-success"></i>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Material:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3 flex gap-2 items-center">
                                            <span>{product.material || 'N/A'}</span>
                                            <i className="ki-filled ki-information-2 text-success"></i>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Width:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3 flex gap-2 items-center ">
                                            <span>{product.width || 'N/A'}</span>
                                            <i className="ki-filled ki-information-2 text-success"></i>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Height:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3 flex gap-2 items-center">
                                            <span>{product.height || 'N/A'}</span>
                                            <i className="ki-filled ki-information-2 text-success"></i>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Depth:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3 flex gap-2 items-center">
                                            <span>{product.depth || 'N/A'}</span>
                                            <i className="ki-filled ki-information-2 text-success"></i>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <div className="modal p-14" data-modal="true" data-modal-backdrop-static="true" id="photos_modal">
                <div className="modal-content h-full max-w-[900px]">
                    <div className="modal-header py-4 px-5">
                        <span className="text-lg text-gray-900 font-bold">Product Photos</span>
                        <button
                            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
                            data-modal-dismiss="true"
                        >
                            <i className="ki-filled ki-cross"></i>
                        </button>
                    </div>
                    <div className="modal-body overflow-y-auto scrollable-y flex flex-col gap-4">
                        <div className="card w-full">
                            <div className="card-header flex justify-between items-center">
                                <div className="card-title">
                                    Thumbnail
                                </div>
                                <div className="flex">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        id="thumbnail"
                                        onChange={(e) => handleThumbnailChange(e)}
                                    />

                                    <label
                                        htmlFor="thumbnail"
                                        className="btn btn-sm btn-info btn-outline"
                                    >
                                        Change Thumbnail
                                    </label>
                                </div>
                            </div>
                            <div className="card-body">
                                {selectedThumbnail ?
                                    <div className="flex gap-4 items-center justify-center">
                                        <a
                                            className="text-sm font-medium text-gray-900 hover:text-primary-active mb-px"
                                            href={AWS_S3_URL + (selectedThumbnail.file_url)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <img
                                                src={AWS_S3_URL + (selectedThumbnail.file_url)}
                                                alt={product.name}
                                                className="w-48 h-248 object-cover border border-gray-300 rounded"
                                            />
                                        </a>
                                    </div>
                                    :
                                    <span className="text-gray-600">N/A</span>
                                }
                            </div>
                        </div>

                        <div className="card w-full">
                            <div className="card-header flex justify-between items-center">
                                <div className="card-title">
                                    Photos
                                </div>
                                <div className="flex gap-4">
                                    {documentManageMode === false ?
                                        <button
                                            className="btn btn-xs btn-primary btn-outline"
                                            onClick={() => setDocumentManageMode(true)}
                                        >
                                            Manage
                                        </button>
                                        :
                                        <button
                                            className="btn btn-xs btn-secondary btn-outline"
                                            onClick={() => setDocumentManageMode(false)}
                                        >
                                            Cancel
                                        </button>
                                    }
                                </div>
                            </div>
                            <div className="card-body flex flex-col gap-4">
                                {documentManageMode === true &&
                                    <div className="card">
                                        <div className="card-header flex justify-between items-center">
                                            <div className="card-title">
                                                Pending Upload
                                            </div>
                                            <div className="flex">
                                                <button
                                                    className="btn btn-sm btn-success btn-outline"
                                                    onClick={uploadFiles}
                                                >
                                                    Upload
                                                </button>
                                            </div>
                                        </div>
                                        <div className="card-body">
                                            <input
                                                type="file"
                                                name="hidden"
                                                id="file-upload"
                                                multiple
                                                accept="image/*"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                            />

                                            <label
                                                htmlFor="file-upload"
                                                className="btn btn-sm btn-primary mb-2"
                                            >
                                                Add Files
                                            </label>

                                            {pendingUploadItems !== null ?
                                                pendingUploadItems.length > 0 && pendingUploadItems.map((file, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center justify-between flex-wrap grow border border-gray-200 rounded-xl gap-2 px-3.5 py-2.5 mb-2"
                                                    >
                                                        <div className="flex items-center flex-wrap gap-3.5">
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
                                                        <button
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() => removeFile(index)}
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                ))
                                                :
                                                ''
                                            }
                                        </div>
                                    </div>
                                }

                                <div className="card">
                                    <div className="card-body flex flex-wrap gap-4">
                                        {
                                            documentItems !== null ? (Array.isArray(documentItems) && documentItems.length > 0 ?
                                                documentItems.map((photo: any, index: number) => (
                                                    <div className="flex gap-4 items-center relative" key={index}>
                                                        <a
                                                            className="text-sm font-medium text-gray-900 hover:text-primary-active mb-px relative"
                                                            href={AWS_S3_URL + (photo.file_url)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <img
                                                                src={AWS_S3_URL + (photo.file_url)}
                                                                alt={photo.original_name}
                                                                className="w-32 h-32 object-cover border border-gray-300 rounded"
                                                            />
                                                            {documentManageMode === true && (
                                                                <button
                                                                    className="absolute top-0 right-0 -mt-2 -mr-2 badge badge-dot badge-outline badge-danger p-1"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        e.preventDefault();
                                                                        removeServerFile(index);
                                                                    }}
                                                                >
                                                                    <i className="ki-filled ki-cross"></i>
                                                                </button>
                                                            )}
                                                        </a>
                                                    </div>
                                                ))
                                                : <span className="text-gray-600">N/A</span>)
                                                : <span className="text-gray-600">N/A</span>
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ProductDetail;