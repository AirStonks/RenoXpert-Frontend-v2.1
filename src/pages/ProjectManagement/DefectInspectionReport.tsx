import { useLocation, useNavigate, useParams } from "react-router-dom";
import KTComponents from "../../metronic/core";
import ClipboardJS from "clipboard";
import { Slide, toast } from "react-toastify";
import { useEffect } from "react";

function DefectInspectionReport() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { id } = useParams<{ id: string }>();
    const renoProgressId = id ? parseInt(id, 10) : null;

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
        document.title = "DIR | RenoXpert";

        KTComponents.init();

        const clipboard = new ClipboardJS('.copy-link');

        clipboard.on('success', function (e) {
            notify('success', 'Copied to clipboard!');
            e.clearSelection();
        });

        return () => {
            clipboard.destroy();
        };

    }, []); // This effect runs when renoProgressDetail changes

    const handleBackClick = () => {
        if (state) {
            navigate(state.fromUrl);
        } else {
            navigate('/reno-progress/' + renoProgressId);
        }
    };

    return (
        <>
            <div className="flex justify-between items-center flex-wrap mb-6">
                <div className="flex gap-4 items-center">
                    <button className='text-gray-800 dark:text-gray-400' onClick={handleBackClick}>
                        <i className="ki-solid ki-arrow-left"></i>
                    </button>
                    <span className="text-2xl font-bold text-gray-900">
                        DIR Overview
                    </span>
                </div>

                <button className="btn btn-success btn-sm">
                    Mark as Complete
                </button>
            </div>

            <div className="flex flex-wrap gap-8 mb-8">
                <div className="flex flex-col flex-[3] gap-8">
                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                Defect Inspection Status
                            </h3>
                        </div>
                        <div className="card-body pt-3.5 pb-3.5">
                            <table className="table-auto">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Progress ID:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {renoProgressId}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Status:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {/* <span className={`badge badge-sm p-2 cursor-default
                                                ${orderDetail.status === 'confirmed' ? 'badge-success' : ''} 
                                                ${orderDetail.status === 'revoked' ? 'badge-danger' : ''} 
                                                badge-outline`}
                                            >
                                                {orderDetail.status}
                                            </span> */}
                                            <span className="badge badge-sm p-2 cursor-default">
                                                Not Submitted
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Submit Date:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            11 November 2024
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Time:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            3:20 pm
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Submitter:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            Test Technician
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Form Link:</td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <button
                                                className="btn btn-info btn-sm btn-outline copy-link"
                                                data-clipboard-text={`${location.protocol}/${window.location.host}/reno/defect-inspection-form?progressId=${renoProgressId}`}
                                            >
                                                Defect Inspection Form
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">
                                General Info
                            </div>
                        </div>
                        <div className="card-body">
                            <table className="table-auto">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Owner Email:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">

                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Property Name:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">

                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Unit:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">

                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Address:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">

                                        </td>

                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Contractor:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">

                                        </td>

                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Contractor Email:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">

                                        </td>

                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Bedroom Number:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">

                                        </td>

                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Bathroom Number:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">

                                        </td>

                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className='flex flex-col right-column flex-[7] gap-4'>
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">
                                Form Detail
                            </div>
                        </div>
                        <div className="card-body">
                            {renoProgressId ?
                                <div>
                                    <div className="tabs mb-5" data-tabs="true">
                                        <button className="tab active" data-tab-toggle="#tab_1">
                                            Foyer & Entrance
                                        </button>
                                        <button className="tab" data-tab-toggle="#tab_2">
                                            Kitchen
                                        </button>
                                        <button className="tab" data-tab-toggle="#tab_3">
                                            Yard
                                        </button>
                                        <button className="tab" data-tab-toggle="#tab_4">
                                            Living & Dining
                                        </button>
                                        <button className="tab" data-tab-toggle="#tab_5">
                                            Balcony
                                        </button>
                                        <button className="tab" data-tab-toggle="#tab_6">
                                            Hallway
                                        </button>
                                        <button className="tab" data-tab-toggle="#tab_7">
                                            Bedrooms
                                        </button>
                                        <button className="tab" data-tab-toggle="#tab_8">
                                            Bathrooms
                                        </button>
                                    </div>
                                    <div className="transition-opacity duration-700" id="tab_1">
                                        Tab 1 content.
                                    </div>
                                    <div className="hidden transition-opacity duration-700" id="tab_2">
                                        Tab 2 content.
                                    </div>
                                    <div className="hidden transition-opacity duration-700" id="tab_3">
                                        Tab 3 content.
                                    </div>
                                    <div className="hidden transition-opacity duration-700" id="tab_4">
                                        Tab 4 content.
                                    </div>
                                    <div className="hidden transition-opacity duration-700" id="tab_5">
                                        Tab 5 content.
                                    </div>
                                    <div className="hidden transition-opacity duration-700" id="tab_6">
                                        Tab 6 content.
                                    </div>
                                    <div className="hidden transition-opacity duration-700" id="tab_7">
                                        Tab 7 content.
                                    </div>
                                    <div className="hidden transition-opacity duration-700" id="tab_8">
                                        Tab 8 content.
                                    </div>
                                </div>
                                :
                                ''
                            }
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default DefectInspectionReport;