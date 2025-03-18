import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";
import useFetchKeyManagement from "../../hook/useFetchKeyManagement";
import Loading from "../../components/Loading";
import { addKeyManagementItem, updateKeyCategoryQuantity, updateKeyManagementInfo } from "../../services/api";
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
            'guest_acc_card': 'Guest Access Card',
            'main_door_key': 'Main Door Key',
            'room_door_key': 'Room Door Key',
            'yard_door_key': 'Yard Key',
            'grill_door_key': 'Grill Door key',
            'mailbox_key': 'Mailbox Key',
            'ac_ledge_key': 'AC Ledge Key',
            'ac_remote': 'AC Remote',
            'others': 'Others',
        };

        return labelMap[name] || name; // Return original name if no mapping found
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
                                        keyManagementId={Number(keyManagementDetail.id)}
                                        categoryQty={item.quantity}
                                        title={getLabelForName(item.name)}
                                        id={item.name}
                                        items={item.value}
                                        handleUpdateMetadata={setMetadataItems}
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