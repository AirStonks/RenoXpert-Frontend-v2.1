import { useEffect, useRef, useState } from "react";
import { addKeyManagementItem, changeKeyManagementItemName, changeKeyManagementItemPhoto, changeKeyManagementItemRemark, removeKeyManagementItem, uploadKeyManagementItemPhoto } from "../../../services/api";
import { KTAccordion } from "../../../metronic/core";

const AWS_S3_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_AWS_S3_URL
        : import.meta.env.VITE_APP_ENV === "staging" || import.meta.env.VITE_APP_ENV === "local"
            ? import.meta.env.VITE_STAGING_AWS_S3_URL
            : null

interface Props {
    renoProgressId: number;
    title: string;
    id: string;
    items: [];
}

function KeyManagementCategoryItem({ renoProgressId, title, id, items: initialItems }: Props) {
    const [items, setItems] = useState(initialItems);
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        KTAccordion.init();
    });

    const handleChangeCategoryItem = async (index: number, field: 'name' | 'remark', category: string, value: string) => {

        setItems(currentItems =>
            currentItems.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        );

        // Debounce logic remains the same
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(async () => {
            try {
                if (field === 'name') {
                    const response = await changeKeyManagementItemName(renoProgressId, category, index, value);

                    if (response?.success) {
                        console.log('yes');
                    }


                } else if (field === 'remark') {
                    const response = await changeKeyManagementItemRemark(renoProgressId, category, index, value);

                    if (response?.success) {
                        console.log('yes');
                    }
                }

            } catch (error) {
                console.error('Error updating item:', error);
            }
        }, 1000);
    };

    const handleAddItem = async (category: string) => {
        try {
            const response = await addKeyManagementItem(renoProgressId, category);

            if (response?.success) {
                setItems(currentItems => [...currentItems, response.data]);
            }
        } catch (error) {
            console.error('Error adding item:', error);
        }
    };

    const handlePhotoSelect = async (index: number, category: string, file: File) => {
        try {
            const response = await uploadKeyManagementItemPhoto(renoProgressId, category, index, file);

            if (response?.success) {
                const selectedCat = response.data.metadata.find(item =>
                    item.name === category
                );

                setItems(currentItems =>
                    currentItems.map((item, i) =>
                        i === index ? { ...item, attachment: selectedCat.value[index].attachment } : item
                    )
                );
            }

        } catch (error) {
            console.error('Error uploading photo:', error);
        }
    }

    const handleChangePhotoSelect = async (index: number, category: string, file: File) => {
        try {
            const response = await changeKeyManagementItemPhoto(renoProgressId, category, index, file);

            if (response?.success) {

                const selectedCat = response.data.metadata.find(item =>
                    item.name === category
                );

                setItems(currentItems =>
                    currentItems.map((item, i) =>
                        i === index ? { ...item, attachment: selectedCat.value[index].attachment } : item
                    )
                );

            }

        } catch (error) {
            console.error('Error uploading photo:', error);
        }
    }

    const handleRemoveCategoryItem = async (index: number, category: string) => {
        try {
            const response = await removeKeyManagementItem(renoProgressId, category, index);

            if (response?.success) {

                const selectedCat = response.data.metadata.find(item =>
                    item.name === category
                );

                setItems(selectedCat.value);

            }

        } catch (error) {
            console.error('Error uploading photo:', error);
        }
    }

    return (
        <>
            <div className="accordion-item border rounded-xl w-full" data-accordion-item="true" id={id}>
                <button className="accordion-toggle p-4" data-accordion-toggle={`#${id}_content`}>
                    <div className="flex flex-col items-start">
                        <h3 className="text-md text-gray-900 font-bold">{title}</h3>
                    </div>
                    <div className="flex items-center gap-4">
                        {items.length > 0 ?
                            <div className="badge text-sm">Quantity: {items.length}</div>
                            :
                            <div className="badge badge-danger badge-outline">Empty</div>
                        }
                        <i className="ki-outline ki-right text-gray-600 text-2sm accordion-active:hidden block"></i>
                        <i className="ki-outline ki-down text-gray-600 text-2sm accordion-active:block hidden"></i>
                    </div>
                </button>
                <div className="accordion-content hidden border-t" id={`${id}_content`}>
                    <div className="flex flex-col gap-2 p-4">
                        {items.length === 0 ? (
                            <>
                                <div className="col-span-full text-center text-gray-500">No items available</div>
                                <div className="col-span-full text-center">
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={() => handleAddItem(id)}
                                    >
                                        Add Item
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                {items.map((item, index) => (
                                    <div key={index} className="flex gap-3 items-center">
                                        <button
                                            className="btn btn-icon btn-danger"
                                            onClick={() => handleRemoveCategoryItem(index, id)}
                                        >
                                            <i className="ki-outline ki-cross"></i>
                                        </button>
                                        <div className="card w-full rounded-lg overflow-hidden">
                                            <div className="card-body p-0">
                                                <div className="flex flex-col sm:flex-row">
                                                    <div className="w-36 h-36 mr-1">
                                                        {item.attachment ? (
                                                            <div className="relative inline-block">
                                                                <a
                                                                    className=""
                                                                    href={AWS_S3_URL + (item.attachment?.file_url)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    <img
                                                                        src={AWS_S3_URL + (item.attachment?.file_url)}
                                                                        alt={item.name}
                                                                        className="w-36 h-36 object-cover"
                                                                    />
                                                                </a>

                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    id="file-change-upload"
                                                                    onChange={(e) => handleChangePhotoSelect(index, id, e.target.files[0])}
                                                                    className="hidden"
                                                                />
                                                                <label
                                                                    htmlFor="file-change-upload"
                                                                    className="btn btn-icon btn-secondary btn-xs opacity-85 absolute top-0 right-0 m-2"
                                                                >
                                                                    <i className="ki-filled ki-pencil"></i>
                                                                </label>
                                                            </div>
                                                        )
                                                            :
                                                            <div className="flex justify-center items-center w-36 h-36">
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    id="file-upload"
                                                                    onChange={(e) => handlePhotoSelect(index, id, e.target.files[0])}
                                                                    className="hidden"
                                                                />
                                                                <label
                                                                    htmlFor="file-upload"
                                                                    className="btn btn-sm btn-secondary btn-outline"
                                                                >
                                                                    Add Photo
                                                                </label>
                                                            </div>
                                                        }

                                                    </div>
                                                    <div className="w-full sm:w-3/4 p-2">
                                                        <span className="text-xs text-gray-600">Name/Serial Number</span>
                                                        <input
                                                            className="input input-sm mb-2"
                                                            type="text"
                                                            name="name"
                                                            value={item.name || ''}
                                                            onChange={(e) => handleChangeCategoryItem(index, 'name', id, e.target.value)}
                                                        />
                                                        <span className="text-xs text-gray-600">Remark:</span>
                                                        <input
                                                            className="input input-sm mb-2"
                                                            type="text"
                                                            name="remark"
                                                            value={item.remark || ''}
                                                            onChange={(e) => handleChangeCategoryItem(index, 'remark', id, e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <div className="flex gap-3 items-center">
                                    <div className="btn btn-icon btn-clear pointer-events-none">
                                    </div>
                                    <div className="card w-full rounded-lg overflow-hidden">
                                        <div className="card-body h-24 flex justify-center items-center text-center p-0">
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={() => handleAddItem(id)}
                                            >
                                                Add Item
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

export default KeyManagementCategoryItem;