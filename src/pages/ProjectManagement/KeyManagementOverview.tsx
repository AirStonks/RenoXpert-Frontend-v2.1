import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Slide, toast } from "react-toastify";
import Loading from "../../components/Loading";
import { KTAccordion } from "../../metronic/core";
import { Link } from "react-router-dom";
import useFetchRenoProgress from "../../hook/useFetchRenoProgress";
import { Attachment } from "../../types"; // Assuming types are exported from index.ts

const AWS_S3_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_AWS_S3_URL
        : import.meta.env.VITE_APP_ENV === "staging" || import.meta.env.VITE_APP_ENV === "local"
            ? import.meta.env.VITE_STAGING_AWS_S3_URL
            : null;

// Define the type for metadata value items
interface MetadataValue {
    name?: string;
    remark?: string;
    attachment?: Attachment;
}

// Define keys for labelMap
type LabelKey =
    | "ori_acc_card"
    | "dup_acc_card"
    | "car_acc_card"
    | "guest_acc_card"
    | "main_door_key"
    | "room_door_key"
    | "yard_door_key"
    | "grill_door_key"
    | "mailbox_key"
    | "ac_ledge_key"
    | "ac_remote"
    | "others";

const getLabelForName = (name: LabelKey): string => {
    const labelMap: Record<LabelKey, string> = {
        ori_acc_card: "Original Access Card",
        dup_acc_card: "Duplicate Access Card",
        car_acc_card: "Car Park Access Card",
        guest_acc_card: "Guest Access Card",
        main_door_key: "Main Door Key",
        room_door_key: "Room Door Key",
        yard_door_key: "Yard Key",
        grill_door_key: "Grill Door key",
        mailbox_key: "Mailbox Key",
        ac_ledge_key: "AC Ledge Key",
        ac_remote: "AC Remote",
        others: "Others",
    };

    return labelMap[name] || name;
};

// Props interface for AccordionItem
interface AccordionItemProps {
    title: string;
    id: string;
    items: MetadataValue[];
    itemQty: number;
}

const AccordionItem = ({ title, id, items, itemQty }: AccordionItemProps) => {
    return (
        <div className="accordion-item border rounded-xl w-full" data-accordion-item="true" id={id}>
            <button className="accordion-toggle p-4" data-accordion-toggle={`#${id}_content`}>
                <div className="flex flex-col items-start">
                    <h3 className="text-md text-gray-900 font-bold">{title}</h3>
                </div>
                <div className="flex items-center gap-4">
                    {itemQty > 0 ? (
                        <div className="badge text-sm">Quantity: {itemQty}</div>
                    ) : (
                        <div className="badge badge-danger badge-outline">Empty</div>
                    )}
                    <i className="ki-outline ki-right text-gray-600 text-2sm accordion-active:hidden block"></i>
                    <i className="ki-outline ki-down text-gray-600 text-2sm accordion-active:block hidden"></i>
                </div>
            </button>
            <div className="accordion-content hidden border-t" id={`${id}_content`}>
                <div className="grid p-4 gap-4 sm:grid-cols-1 lg:grid-cols-2">
                    {items.length === 0 ? (
                        <div className="col-span-full text-center text-gray-500">No items available</div>
                    ) : (
                        items.map((item, index: number) => {
                            console.log(item);

                            return (
                                <div className="card rounded-lg overflow-hidden" key={index}>
                                    <div className="card-body p-0">
                                        <div className="flex flex-col sm:flex-row">
                                            <div className="w-24 h-24 mr-1">
                                                {item.attachment && item.attachment?.file_url ? (
                                                    <a
                                                        href={AWS_S3_URL + item.attachment.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <img
                                                            src={AWS_S3_URL + item.attachment.file_url}
                                                            alt={item.name || "Item"}
                                                            className="w-24 h-24 object-cover"
                                                        />
                                                    </a>
                                                ) : (
                                                    <div className="w-24 h-24 bg-gray-200 flex items-center justify-center">
                                                        No Image
                                                    </div>
                                                )}
                                            </div>
                                            <div className="w-full sm:w-3/4 p-2">
                                                <h3 className="font-semibold mb-2 text-gray-900">
                                                    {item.name || "N/A"}
                                                </h3>
                                                <p className="text-xs text-gray-600">
                                                    Remark: {item.remark || "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

function KeyManagementOverview() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { id } = useParams<{ id: string }>();
    const renoProgressId = id ? parseInt(id, 10) : null;
    const { renoProgressDetail, loading, error } = useFetchRenoProgress(renoProgressId);

    const [isLoading, setIsLoading] = useState(false);

    const notify = (type: "success" | "error", message: string) => {
        toast[type](message, {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: localStorage.getItem("theme") as "light" | "dark",
            transition: Slide,
        });
    };

    const handleBackClick = () => {
        if (state) {
            navigate(state.fromUrl);
        } else {
            navigate("/reno-progress/" + renoProgressId);
        }
    };

    useEffect(() => {
        document.title = "Key Management | RenoXpert";

        if (renoProgressDetail) {
            KTAccordion.init();
        }
    }, [renoProgressDetail]);

    if (loading) {
        return <Loading />;
    } else if (error) {
        return <div className="text-red-600">Something went wrong: {error}</div>;
    } else if (!renoProgressDetail) {
        return <div>Reno progress not found</div>;
    }

    return (
        <>
            {(isLoading || loading) && <Loading />}

            <div className="flex justify-between items-center flex-wrap mb-6">
                <div className="flex gap-4 items-center">
                    <button className="text-gray-800 dark:text-gray-400" onClick={handleBackClick}>
                        <i className="ki-solid ki-arrow-left"></i>
                    </button>
                    <span className="text-2xl font-bold text-gray-900">Key Management</span>
                </div>

                <Link
                    to={`/reno-progress/${renoProgressId}/key-management/update`}
                    className="btn btn-info btn-sm"
                >
                    Update Key & Access Card
                </Link>
            </div>

            <div className="flex gap-4 mb-4">
                <div className="flex flex-col flex-[3] gap-4">
                    <div className="card sm:mb-0 mb-2 mr-2">
                        <div className="card-header">
                            <h2 className="card-title">Property</h2>
                        </div>
                        <div className="card-body">
                            <div className="flex justify-between flex-wrap">
                                <div className="flex flex-col mb-4 mr-8">
                                    <span className="text-sm text-gray-600">Name:</span>
                                    <span className="text-sm text-gray-900 font-semibold">
                                        {renoProgressDetail.property?.name}
                                    </span>
                                </div>
                                <div className="flex flex-col mb-4">
                                    <span className="text-sm text-gray-600">Unit:</span>
                                    <span className="text-sm text-gray-900 font-semibold">
                                        {renoProgressDetail.property?.block}-
                                        {renoProgressDetail.property?.floor}-
                                        {renoProgressDetail.property?.unit_no}
                                    </span>
                                </div>
                                <div></div>
                            </div>
                        </div>
                    </div>
                    <div className="card sm:mb-0 mb-2 mr-2">
                        <div className="card-header">
                            <h2 className="card-title">Info</h2>
                        </div>
                        <div className="card-body">
                            <table className="table-auto">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Status:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {renoProgressDetail.key_management.status}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Date received key:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {renoProgressDetail.key_management.date_received_key}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Date posted:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {renoProgressDetail.key_management.date_posted}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            PIC Name:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {renoProgressDetail.key_management.pic_name}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="card sm:mb-0 mb-2 mr-2">
                        <div className="card-header">
                            <h2 className="card-title">Activity</h2>
                        </div>
                        <div className="card-body">
                            <table className="table-auto">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Last Updated By:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {renoProgressDetail.key_management.updated_by?.name || "N/A"}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Last Updated At:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {renoProgressDetail.key_management.updated_at}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col flex-[7] gap-4">
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">Key & access card detail</h2>
                        </div>
                        <div className="card-body">
                            <div className="flex flex-col mb-4 gap-2" data-accordion="true">
                                {renoProgressDetail.key_management.metadata &&
                                    renoProgressDetail.key_management.metadata.length > 0 &&
                                    renoProgressDetail.key_management.metadata.map((item, index: number) => (
                                        <AccordionItem
                                            key={index}
                                            title={getLabelForName(item.name as LabelKey)}
                                            id={item.name}
                                            items={item.value}
                                            itemQty={item.quantity || 0}
                                        />
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default KeyManagementOverview;