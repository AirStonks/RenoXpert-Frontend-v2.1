import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";
import useFetchKeyManagement from "../../hook/useFetchKeyManagement";
import Loading from "../../components/Loading";
import { addKeyManagementItem, updateKeyManagementInfo } from "../../services/api";
import KeyManagementCategoryItem from "./components/KeyManagementCategoryItem";
import { Slide, toast } from "react-toastify";

function UpdateKeyManagement() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { id } = useParams<{ id: string }>();
    const renoProgressId = id ? parseInt(id, 10) : null;
    const { keyManagementDetail, loading, error, refetch } = useFetchKeyManagement(renoProgressId);

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

    const [formData, setFormData] = useState({
        id: '',
        reno_progress_id: '',
        date_received_key: '',
        date_posted: '',
        pic_name: '',
        no_main_door: 0,
        no_room: 0,
        status: '',
    })

    const [metadataItems, setMetadataItems] = useState({
        metadata: []
    });

    const [isFormAmened, setIsFormAmend] = useState(false);

    const handleBackClick = () => {
        if (state) {
            navigate(state.fromUrl);
        } else {
            navigate(`/reno-progress/${renoProgressId}/key-management`);
        }
    };

    useEffect(() => {
        document.title = "Update Key Management | RenoXpert";

        if (keyManagementDetail) {
            setFormData({
                id: keyManagementDetail.id,
                reno_progress_id: keyManagementDetail.reno_progress_id,
                date_received_key: keyManagementDetail.date_received_key,
                date_posted: keyManagementDetail.date_posted,
                pic_name: keyManagementDetail.pic_name,
                no_main_door: keyManagementDetail.no_main_door,
                no_room: keyManagementDetail.no_room,
                status: keyManagementDetail.status,
            });

            setMetadataItems({
                metadata: keyManagementDetail.metadata
            });
        }

    }, [keyManagementDetail]);

    const hasFormChanged = (currentData, originalData) => {
        if (!originalData) return false;

        return (
            currentData.date_received_key !== originalData.date_received_key ||
            currentData.date_posted !== originalData.date_posted ||
            currentData.pic_name !== originalData.pic_name ||
            currentData.no_main_door !== originalData.no_main_door ||
            currentData.no_room !== originalData.no_room ||
            currentData.status !== originalData.status
        );
    };


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        setFormData(prevData => {
            const newData = {
                ...prevData,
                [name]: value
            };

            // Check if form has changed and update isFormAmended
            setIsFormAmend(hasFormChanged(newData, keyManagementDetail));

            return newData;
        });
    };

    // Add handlers for number inputs
    const handleNumberChange = (field: 'no_main_door' | 'no_room', action: 'increase' | 'decrease') => {
        setFormData(prevData => {
            const newData = {
                ...prevData,
                [field]: action === 'increase' ? prevData[field] + 1 : Math.max(0, prevData[field] - 1)
            };

            // Check if form has changed and update isFormAmended
            setIsFormAmend(hasFormChanged(newData, keyManagementDetail));

            return newData;
        });
    };

    // Add handler for date changes
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const { value } = e.target;

        setFormData(prevData => {
            const newData = {
                ...prevData,
                [field]: value
            };

            // Check if form has changed and update isFormAmended
            setIsFormAmend(hasFormChanged(newData, keyManagementDetail));

            return newData;
        });
    };

    const submitSaveInfo = async () => {
        try {
            const response = await updateKeyManagementInfo(Number(keyManagementDetail.id), formData);

            if (response?.success) {
                notify('success', 'Info Updated!');
            }

        } catch (error) {
            notify('error', 'Failed to update info');
        }
    }

    const handleAddItem = async (category: string) => {
        try {
            const response = await addKeyManagementItem(renoProgressId, category);

            if (response?.success) {
                // Find category in metadata
                setFormData((prevFormData) => {
                    const updatedMetadata = prevFormData.metadata.map((item) => {
                        if (item.name === category) {
                            return { ...item, metadata: response.data.metadata };
                        }
                        return item;
                    });

                    return {
                        ...prevFormData,
                        metadata: updatedMetadata,
                    };
                });
            }
        } catch (error) {
            console.error('Error adding item:', error);
        }
    };

    const getLabelForName = (name) => {
        const labelMap = {
            'ori_acc_card': 'Original Access Card',
            'dup_acc_card': 'Duplicate Access Card',
            'car_acc_card': 'Car Park Access Card',
            'main_door_key': 'Main Door Key',
            'room_door_key': 'Guest Access Card',
            'yard_door_key': 'Yard Key',
            'mailbox_key': 'Mailbox Key',
            'ac_ledge_key': 'AC Ledge Key',
            'ac_remote': 'AC Remote',
            'others': 'Others',
        };

        return labelMap[name] || name; // Return original name if no mapping found
    };

    const AccordionItem = ({ title, id, items }) => {
        return (
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
                                {items.map((card, index) => (
                                    <div className="card rounded-lg overflow-hidden" key={index}>
                                        <div className="card-body p-0">
                                            <div className="flex flex-col sm:flex-row">
                                                <div className="w-24 h-24 mr-1">
                                                    <a
                                                        className=""
                                                        href={card.image}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <img
                                                            src={card.image}
                                                            alt={card.title}
                                                            className="w-24 h-24 object-cover"
                                                        />
                                                    </a>
                                                </div>
                                                <div className="w-full sm:w-3/4 p-2">
                                                    <h3 className="font-semibold mb-2 text-gray-900">{card.title}</h3>
                                                    <p className="text-xs text-gray-600">Remark: {card.description ? card.description : 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <div className="card rounded-lg overflow-hidden">
                                    <div className="card-body h-24 flex justify-center items-center text-center p-0">
                                        <button
                                            className="btn btn-sm btn-primary"
                                            onClick={() => handleAddItem(id)}
                                        >
                                            Add Item
                                        </button>
                                    </div>
                                </div>
                            </>

                        )}
                    </div>

                </div>
            </div>
        );
    };

    if (loading) {
        return <Loading />;
    } else if (error) {
        return <div className="text-red-600">Something went wrong: {error}</div>;
    } else if (!keyManagementDetail) {
        return <div>Key Management not found</div>;
    }

    return (
        <>
            <div className="flex justify-between items-center flex-wrap mb-6">
                <div className="flex gap-4 items-center">
                    <button className='text-gray-800 dark:text-gray-400' onClick={handleBackClick}>
                        <i className="ki-solid ki-arrow-left"></i>
                    </button>
                    <span className="text-2xl font-bold text-gray-900">
                        Update Key Management
                    </span>
                </div>
            </div>

            <div className="flex gap-4 mb-4">
                <div className="flex flex-col flex-[3] gap-4">
                    <div className="card sm:mb-0 mb-2 mr-2">
                        <div className="card-header">
                            <h2 className="card-title">
                                Info
                            </h2>
                        </div>
                        <div className="card-body">
                            <table className="table-auto">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Status:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <select
                                                className="select select-bordered w-full max-w-xs"
                                                name="status"
                                                value={formData.status}
                                                onChange={handleChange}
                                            >
                                                <option value="not_started">Not Started</option>
                                                <option value="started">Started</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="completed">Completed</option>
                                                <option value="not_available">Not Available</option>
                                            </select>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Date received key:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <input
                                                type="date"
                                                className="input input-sm"
                                                value={formData.date_received_key || ''}
                                                onChange={(e) => handleDateChange(e, 'date_received_key')}
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Date posted:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <input
                                                type="date"
                                                className="input input-sm"
                                                value={formData.date_posted || ''}
                                                onChange={(e) => handleDateChange(e, 'date_posted')}
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            PIC Name:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <input
                                                type="text"
                                                className="input"
                                                name='pic_name'
                                                value={formData.pic_name || ''}
                                                onChange={handleChange}
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            No. of main door:
                                        </td>
                                        <td className="text-lg text-gray-900 pb-3">
                                            <button
                                                className="text-gray-600"
                                                onClick={() => handleNumberChange('no_main_door', 'decrease')}
                                            >
                                                <i className="ki-solid ki-minus-squared"></i>
                                            </button>
                                            <span className="mx-2 text-base">
                                                {formData.no_main_door}
                                            </span>
                                            <button
                                                className="text-gray-600"
                                                onClick={() => handleNumberChange('no_main_door', 'increase')}
                                            >
                                                <i className="ki-solid ki-plus-squared"></i>
                                            </button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            No. of room:
                                        </td>
                                        <td className="text-lg text-gray-900 pb-3">
                                            <button
                                                className="text-gray-600"
                                                onClick={() => handleNumberChange('no_room', 'decrease')}
                                            >
                                                <i className="ki-solid ki-minus-squared"></i>
                                            </button>
                                            <span className="mx-2 text-base">
                                                {formData.no_room}
                                            </span>
                                            <button
                                                className="text-gray-600"
                                                onClick={() => handleNumberChange('no_room', 'increase')}
                                            >
                                                <i className="ki-solid ki-plus-squared"></i>
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {isFormAmened &&
                                <div className="flex justify-end gap-4">
                                    <button
                                        className="btn btn-sm btn-secondary btn-outline"
                                    >
                                        Reset
                                    </button>

                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={submitSaveInfo}
                                    >
                                        Save
                                    </button>
                                </div>
                            }

                        </div>
                    </div>
                </div>
                <div className='flex flex-col flex-[7] gap-4'>
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">
                                Key & access card detail
                            </h2>
                        </div>
                        <div className="card-body">
                            <div className="flex flex-col mb-4 gap-2" data-accordion="true">
                                {metadataItems.metadata.map((item: any, index: number) => (
                                    <KeyManagementCategoryItem
                                        key={index}
                                        renoProgressId={renoProgressId}
                                        title={getLabelForName(item.name)}
                                        id={item.name}
                                        items={item.value}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default UpdateKeyManagement;