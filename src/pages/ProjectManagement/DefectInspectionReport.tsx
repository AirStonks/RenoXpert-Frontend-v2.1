import { useLocation, useNavigate, useParams } from "react-router-dom";
import KTComponents, { KTTabs } from "../../metronic/core";
import ClipboardJS from "clipboard";
import { Slide, toast } from "react-toastify";
import { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import { DefectInspectionForm } from "../../types";
import { fetchRenoProgress } from "../../services/api";
import React from 'react';

const APP_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_APP_URL
        : import.meta.env.VITE_APP_ENV === "staging"
            ? import.meta.env.VITE_STAGING_APP_URL
            : import.meta.env.VITE_APP_ENV === "local"
                ? import.meta.env.VITE_LOCAL_APP_URL
                : null;

const AWS_S3_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_AWS_S3_URL
        : import.meta.env.VITE_APP_ENV === "staging" || import.meta.env.VITE_APP_ENV === "local"
            ? import.meta.env.VITE_STAGING_AWS_S3_URL
            : null

function DefectInspectionReport() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { id } = useParams<{ id: string }>();
    const renoProgressId = id ? parseInt(id, 10) : null;

    const [diForm, setDiForm] = useState<DefectInspectionForm | null>(null);
    const [isLoading, setIsLoading] = useState(false);

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

    const handleBackClick = () => {
        if (state) {
            navigate(state.fromUrl);
        } else {
            navigate('/reno-progress/' + renoProgressId);
        }
    };

    useEffect(() => {
        document.title = "DIR | RenoXpert";

        const getRenoProgress = async () => {
            setIsLoading(true);

            try {
                const response = await fetchRenoProgress(renoProgressId);

                if (response?.success) {
                    setDiForm(response.data.defect_inspection_form);
                }

            } catch (error) {
                console.log(error);
            }

            setIsLoading(false);

            await new Promise(resolve => setTimeout(resolve, 1));
            KTTabs.init();
        }

        // Get RenoProgress
        // Get DIForm from RenoProgress
        // setDiForm
        // if diForm is null, display not submitted
        getRenoProgress();

        const clipboard = new ClipboardJS('.copy-link');

        clipboard.on('success', function (e) {
            notify('success', 'Copied to clipboard!');
            e.clearSelection();
        });

        return () => {
            clipboard.destroy();
        };

    }, [renoProgressId]);

    return (
        <>
            {isLoading && <Loading />}

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

            <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex flex-col flex-[3] gap-4">
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
                                            <span className={`badge badge-sm badge-pill p-2 cursor-default
                                                ${diForm?.status === 'submitted' ? 'badge-info' : ''} 
                                                badge-outline`}
                                            >
                                                {diForm?.status ? diForm?.status : 'Not Submitted'}
                                            </span>
                                            {/* <span className="badge badge-sm p-2 cursor-default">
                                                Not Submitted
                                            </span> */}
                                        </td>
                                    </tr>
                                    {/* <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Submit Date:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {diForm?.created_at
                                                ? new Date(diForm?.created_at).toLocaleDateString('en-GB', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })
                                                : 'N/A'}
                                        </td>
                                    </tr> */}
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">Form Link:</td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <button
                                                className="btn btn-info btn-sm btn-outline copy-link"
                                                data-clipboard-text={`${APP_URL}reno/defect-inspection-form?progressId=${renoProgressId}`}
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
                                            {diForm?.owner_email || 'N/A'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Property Name:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {diForm?.property?.property_name || 'N/A'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Unit:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {diForm?.property ? (diForm?.property?.block + '-' + diForm?.property?.level + '-' + diForm?.property?.unit) : 'N/A'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Contractor:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {diForm?.contractor_name}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Contractor Email:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {diForm?.contractor_email}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className='flex flex-col flex-[7] gap-4'>
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">
                                Form Detail
                            </div>
                        </div>
                        <div className="card-body">
                            {
                                !isLoading ?
                                    diForm ?
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
                                                <div className="flex gap-4">
                                                    <div className="flex-[2]">
                                                        <div className="card rounded-md mb-8">
                                                            <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
                                                                <h2 className="">Foyer & Entrance</h2>
                                                            </div>
                                                            <div className="card-body text-sm px-4">
                                                                <div className="w-full">
                                                                    <div className="grid grid-cols-12 gap-4">
                                                                        {/* Header Row */}
                                                                        <div className="col-start-6 col-span-1 text-xs text-center text-gray-900 font-semibold">Has Defect</div>
                                                                        <div className="col-start-7 col-span-1 text-xs text-center text-gray-900 font-semibold">No Defect / YES</div>
                                                                        <div className="col-start-8 col-span-1 text-xs text-center text-gray-900 font-semibold">No Available</div>
                                                                        <div className="col-start-9 col-span-4 text-xs text-center text-gray-900 font-semibold">Attachments</div>

                                                                        {/* Inspection Item Component */}
                                                                        {[
                                                                            { label: "1.1 Entrance door (Frame, leaf, handle, lock, accessories)", path: 'q1' },
                                                                            { label: "1.2 Floor & skirting", path: 'q2' },
                                                                            { label: "1.3 Wall & ceiling", path: 'q3' },
                                                                            { label: "1.4 DB box", path: 'q4' }
                                                                        ].map(({ label, path }) => (
                                                                            <React.Fragment key={path}>
                                                                                {/* Label */}
                                                                                <div className="col-span-5 flex items-center text-gray-900 font-semibold">
                                                                                    {label}
                                                                                </div>

                                                                                {/* Has Defect */}
                                                                                <div className="col-start-6 col-span-1 flex justify-center items-center">
                                                                                    {diForm?.area?.foyer?.[path]?.value === 'has-defect' &&
                                                                                        <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                                    }
                                                                                </div>

                                                                                {/* No Defect */}
                                                                                <div className="col-start-7 col-span-1 flex justify-center items-center">
                                                                                    {diForm?.area?.foyer?.[path]?.value === 'no-defect' &&
                                                                                        <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                                    }
                                                                                </div>

                                                                                {/* N/A */}
                                                                                <div className="col-start-8 col-span-1 flex justify-center items-center">
                                                                                    {diForm?.area?.foyer?.[path]?.value === 'not-available' &&
                                                                                        <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                                    }
                                                                                </div>

                                                                                <div className="col-start-9 col-span-4 ">
                                                                                    {
                                                                                        diForm?.area?.foyer ? (
                                                                                            (() => {
                                                                                                // You can use 'attachments' here as needed, for example:
                                                                                                return (
                                                                                                    <div className="flex flex-wrap gap-4 border-gray-200">
                                                                                                        {diForm?.area?.foyer?.[path]?.attachments?.map((attachment, index) => (
                                                                                                            <div className="flex gap-4 relative" key={index}>
                                                                                                                <a
                                                                                                                    className="text-sm font-medium text-gray-900 hover:text-primary-active mb-px relative"
                                                                                                                    href={AWS_S3_URL + (attachment.file_url)}
                                                                                                                    target="_blank"
                                                                                                                    rel="noopener noreferrer"
                                                                                                                >
                                                                                                                    <img
                                                                                                                        src={AWS_S3_URL + (attachment.file_url)}
                                                                                                                        alt={attachment.original_name}
                                                                                                                        className="w-16 h-16 object-cover border border-gray-300 rounded"
                                                                                                                    />
                                                                                                                </a>
                                                                                                            </div>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                );
                                                                                            })()
                                                                                        ) : null
                                                                                    }
                                                                                </div>

                                                                                <div className="col-span-8">
                                                                                    <div className="flex flex-col w-full">
                                                                                        <span className="text-slate-900 mb-2 font-medium">Remark</span>
                                                                                        <span className="textarea text-slate-900 mb-2 font-medium">{diForm?.area?.foyer?.[path]?.remark}</span>
                                                                                    </div>
                                                                                </div>

                                                                                <div className="col-span-12">
                                                                                    <hr />
                                                                                </div>
                                                                            </React.Fragment>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="hidden transition-opacity duration-700" id="tab_2">
                                                <div className="flex gap-4">
                                                    <div className="flex-[2]">
                                                        <div className="card rounded-md mb-8">
                                                            <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
                                                                <h2 className="">Kitchen</h2>
                                                            </div>
                                                            <div className="card-body text-sm px-4">
                                                                <div className="w-full">
                                                                    <div className="flex">
                                                                        <div className="grid grid-cols-12 gap-4">
                                                                            {/* Header Row */}
                                                                            <div className="col-start-6 col-span-1 text-xs text-center text-gray-900 font-semibold">Has Defect</div>
                                                                            <div className="col-start-7 col-span-1 text-xs text-center text-gray-900 font-semibold">No Defect / YES</div>
                                                                            <div className="col-start-8 col-span-1 text-xs text-center text-gray-900 font-semibold">No Available</div>
                                                                            <div className="col-start-9 col-span-4 text-xs text-center text-gray-900 font-semibold">Attachments</div>

                                                                            {/* Inspection Item Component */}
                                                                            {[
                                                                                { label: "2.1 Floor & skirting", path: 'q1' },
                                                                                { label: "2.2 Wall & ceiling", path: 'q2' },
                                                                                { label: "2.3 Electrical & wiring (plug point, switches, etc)", path: 'q3' },
                                                                                { label: "2.4 Piping & water flow (Kitchen sink, etc)", path: 'q4' },
                                                                                { label: "2.5 Kitchen cabinet (Kitchen top, drawer, cabinet door, accessories, etc)", path: 'q5' },
                                                                                { label: "2.6 Electrical appliances (Fridge, microwave, oven, hood & hob, etc)", path: 'q6' },
                                                                                { label: "2.7 Door (Frame, leaf, handle, accessories, etc)", path: 'q7' },
                                                                                { label: "2.8 Window (Frame, panel, handle, accessories, etc)", path: 'q8' },
                                                                            ].map(({ label, path }) => (
                                                                                <React.Fragment key={path}>
                                                                                    {/* Label */}
                                                                                    <div className="col-span-5 flex items-center text-gray-900 font-semibold">
                                                                                        {label}
                                                                                    </div>

                                                                                    {/* Has Defect */}
                                                                                    <div className="col-start-6 col-span-1 flex justify-center items-center">
                                                                                        {diForm?.area?.kitchen?.[path]?.value === 'has-defect' &&
                                                                                            <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                                        }
                                                                                    </div>

                                                                                    {/* No Defect */}
                                                                                    <div className="col-start-7 col-span-1 flex justify-center items-center">
                                                                                        {diForm?.area?.kitchen?.[path]?.value === 'no-defect' &&
                                                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                                        }
                                                                                    </div>

                                                                                    {/* N/A */}
                                                                                    <div className="col-start-8 col-span-1 flex justify-center items-center">
                                                                                        {diForm?.area?.kitchen?.[path]?.value === 'not-available' &&
                                                                                            <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                                        }
                                                                                    </div>

                                                                                    <div className="col-start-9 col-span-4 ">
                                                                                        {

                                                                                            diForm?.area?.kitchen ? (
                                                                                                (() => {
                                                                                                    // You can use 'attachments' here as needed, for example:
                                                                                                    return (
                                                                                                        <div className="flex flex-wrap gap-4 border-gray-200">
                                                                                                            {diForm?.area?.kitchen?.[path]?.attachments?.map((attachment, index) => (
                                                                                                                <div className="flex gap-4 relative" key={index}>
                                                                                                                    <a
                                                                                                                        className="text-sm font-medium text-gray-900 hover:text-primary-active mb-px relative"
                                                                                                                        href={AWS_S3_URL + (attachment.file_url)}
                                                                                                                        target="_blank"
                                                                                                                        rel="noopener noreferrer"
                                                                                                                    >
                                                                                                                        <img
                                                                                                                            src={AWS_S3_URL + (attachment.file_url)}
                                                                                                                            alt={attachment.original_name}
                                                                                                                            className="w-16 h-16 object-cover border border-gray-300 rounded"
                                                                                                                        />
                                                                                                                    </a>
                                                                                                                </div>
                                                                                                            ))}
                                                                                                        </div>
                                                                                                    );
                                                                                                })()
                                                                                            ) : null
                                                                                        }
                                                                                    </div>

                                                                                    <div className="col-span-8">
                                                                                        <div className="flex flex-col w-full">
                                                                                            <span className="text-slate-900 mb-2 font-medium">Remark</span>
                                                                                            <span className="textarea text-slate-900 mb-2 font-medium">{diForm?.area?.kitchen?.[path]?.remark}</span>
                                                                                        </div>
                                                                                    </div>

                                                                                    <div className="col-span-12">
                                                                                        <hr />
                                                                                    </div>
                                                                                </React.Fragment>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* <div className="flex-[1]">
                                                        <div className="card rounded-md">
                                                            <div className="card-header">
                                                                <div className="card-title">
                                                                    Attachments
                                                                </div>
                                                            </div>
                                                            <div className="card-body">
                                                                {
                                                                    diForm?.area?.kitchen ? (
                                                                        (() => {
                                                                            // Extract attachments
                                                                            const onlyAttachments = Object.values(diForm?.area?.kitchen)
                                                                                .filter(question => question.attachments)
                                                                                .map(question => question.attachments)
                                                                                .flat();

                                                                            // You can use 'attachments' here as needed, for example:
                                                                            return (
                                                                                <div className="flex flex-wrap justify-center gap-4">
                                                                                    {Object.values(onlyAttachments).map((attachment, index) => (
                                                                                        <div className="flex gap-4 relative" key={index}>
                                                                                            <a
                                                                                                className="text-sm font-medium text-gray-900 hover:text-primary-active mb-px relative"
                                                                                                href={AWS_S3_URL + (attachment.file_url)}
                                                                                                target="_blank"
                                                                                                rel="noopener noreferrer"
                                                                                            >
                                                                                                <img
                                                                                                    src={AWS_S3_URL + (attachment.file_url)}
                                                                                                    alt={attachment.original_name}
                                                                                                    className="w-32 h-32 object-cover border border-gray-300 rounded"
                                                                                                />
                                                                                            </a>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            );
                                                                        })()
                                                                    ) : null
                                                                }
                                                            </div>
                                                        </div>
                                                    </div> */}
                                                </div>
                                            </div>
                                            <div className="hidden transition-opacity duration-700" id="tab_3">
                                                <div className="flex gap-4">
                                                    <div className="flex-[2]">
                                                        <div className="card rounded-md mb-8">
                                                            <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
                                                                <h2 className="">Yard</h2>
                                                            </div>
                                                            <div className="card-body text-sm px-4">
                                                                <div className="w-full">
                                                                    <div className="grid grid-cols-12 gap-4">
                                                                        {/* Header Row */}
                                                                        <div className="col-start-6 col-span-1 text-xs text-center text-gray-900 font-semibold">Has Defect</div>
                                                                        <div className="col-start-7 col-span-1 text-xs text-center text-gray-900 font-semibold">No Defect / YES</div>
                                                                        <div className="col-start-8 col-span-1 text-xs text-center text-gray-900 font-semibold">No Available</div>
                                                                        <div className="col-start-9 col-span-4 text-xs text-center text-gray-900 font-semibold">Attachments</div>

                                                                        {/* Inspection Item Component */}
                                                                        {[
                                                                            { label: "3.1 Floor & skirting (Floor trap)", path: 'q1' },
                                                                            { label: "3.2 Wall & ceiling", path: 'q2' },
                                                                            { label: "3.3 Electrical & wiring (plug point, switches, etc)", path: 'q3' },
                                                                            { label: "3.4 Piping & water flow (Kitchen sink, etc)", path: 'q4' },
                                                                            { label: "3.5 Electrical appliances (Washing machine, dryer, etc)", path: 'q5' },
                                                                            { label: "3.6 AC ledge (Railing, compressor, etc)", path: 'q6' },
                                                                        ].map(({ label, path }) => (
                                                                            <React.Fragment key={path}>
                                                                                {/* Label */}
                                                                                <div className="col-span-5 flex items-center text-gray-900 font-semibold">
                                                                                    {label}
                                                                                </div>

                                                                                {/* Has Defect */}
                                                                                <div className="col-start-6 col-span-1 flex justify-center items-center">
                                                                                    {diForm?.area?.yard?.[path]?.value === 'has-defect' &&
                                                                                        <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                                    }
                                                                                </div>

                                                                                {/* No Defect */}
                                                                                <div className="col-start-7 col-span-1 flex justify-center items-center">
                                                                                    {diForm?.area?.yard?.[path]?.value === 'no-defect' &&
                                                                                        <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                                    }
                                                                                </div>

                                                                                {/* N/A */}
                                                                                <div className="col-start-8 col-span-1 flex justify-center items-center">
                                                                                    {diForm?.area?.yard?.[path]?.value === 'not-available' &&
                                                                                        <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                                    }
                                                                                </div>

                                                                                <div className="col-start-9 col-span-4 ">
                                                                                    {

                                                                                        diForm?.area?.yard ? (
                                                                                            (() => {
                                                                                                // You can use 'attachments' here as needed, for example:
                                                                                                return (
                                                                                                    <div className="flex flex-wrap gap-4 border-gray-200">
                                                                                                        {diForm?.area?.yard?.[path]?.attachments?.map((attachment, index) => (
                                                                                                            <div className="flex gap-4 relative" key={index}>
                                                                                                                <a
                                                                                                                    className="text-sm font-medium text-gray-900 hover:text-primary-active mb-px relative"
                                                                                                                    href={AWS_S3_URL + (attachment.file_url)}
                                                                                                                    target="_blank"
                                                                                                                    rel="noopener noreferrer"
                                                                                                                >
                                                                                                                    <img
                                                                                                                        src={AWS_S3_URL + (attachment.file_url)}
                                                                                                                        alt={attachment.original_name}
                                                                                                                        className="w-16 h-16 object-cover border border-gray-300 rounded"
                                                                                                                    />
                                                                                                                </a>
                                                                                                            </div>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                );
                                                                                            })()
                                                                                        ) : null
                                                                                    }
                                                                                </div>

                                                                                <div className="col-span-8">
                                                                                    <div className="flex flex-col w-full">
                                                                                        <span className="text-slate-900 mb-2 font-medium">Remark</span>
                                                                                        <span className="textarea text-slate-900 mb-2 font-medium">{diForm?.area?.yard?.[path]?.remark}</span>
                                                                                    </div>
                                                                                </div>

                                                                                <div className="col-span-12">
                                                                                    <hr />
                                                                                </div>
                                                                            </React.Fragment>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="hidden transition-opacity duration-700" id="tab_4">
                                                <div className="flex gap-4">
                                                    <div className="flex-[2]">
                                                        <div className="card rounded-md mb-8">
                                                            <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
                                                                <h2 className="">Living & Dining</h2>
                                                            </div>
                                                            <div className="card-body text-sm px-4">
                                                                <div className="w-full">
                                                                    <div className="grid grid-cols-12 gap-4">
                                                                        {/* Header Row */}
                                                                        <div className="col-start-6 col-span-1 text-xs text-center text-gray-900 font-semibold">Has Defect</div>
                                                                        <div className="col-start-7 col-span-1 text-xs text-center text-gray-900 font-semibold">No Defect / YES</div>
                                                                        <div className="col-start-8 col-span-1 text-xs text-center text-gray-900 font-semibold">No Available</div>
                                                                        <div className="col-start-9 col-span-4 text-xs text-center text-gray-900 font-semibold">Attachments</div>

                                                                        {/* Inspection Item Component */}
                                                                        {[
                                                                            { label: "4.1 Floor & skirting", path: 'q1' },
                                                                            { label: "4.2 Wall", path: 'q2' },
                                                                            { label: "4.3 Ceiling", path: 'q3' },
                                                                            { label: "4.4 Electrical & wiring (plug point, switches, etc)", path: 'q4' },
                                                                            { label: "4.5 Window (Frame, panel, handle, accessories, etc)", path: 'q5' },
                                                                            { label: "4.6 Sliding door (Frame, panel, handle, accessories, etc)", path: 'q6' },
                                                                            { label: "4.7 Air conditioner", path: 'q7' },
                                                                            { label: "4.8 Air conditioner turned on for 2 hours or more", path: 'q8' },
                                                                            { label: "4.9 Other", path: 'q9' },
                                                                        ].map(({ label, path }) => (
                                                                            <React.Fragment key={path}>
                                                                                {/* Label */}
                                                                                <div className="col-span-5 flex items-center text-gray-900 font-semibold">
                                                                                    {label}
                                                                                </div>

                                                                                {/* Has Defect */}
                                                                                <div className="col-start-6 col-span-1 flex justify-center items-center">
                                                                                    {diForm?.area?.living?.[path]?.value === 'has-defect' &&
                                                                                        <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                                    }
                                                                                </div>

                                                                                {/* No Defect */}
                                                                                <div className="col-start-7 col-span-1 flex justify-center items-center">
                                                                                    {
                                                                                        (diForm?.area?.living?.[path]?.value === 'no-defect' || diForm?.area?.living?.[path]?.value === 'yes') &&
                                                                                        <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                                    }
                                                                                </div>

                                                                                {/* N/A */}
                                                                                <div className="col-start-8 col-span-1 flex justify-center items-center">
                                                                                    {diForm?.area?.living?.[path]?.value === 'not-available' &&
                                                                                        <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                                    }
                                                                                </div>

                                                                                <div className="col-start-9 col-span-4 ">
                                                                                    {

                                                                                        diForm?.area?.living ? (
                                                                                            (() => {
                                                                                                // You can use 'attachments' here as needed, for example:
                                                                                                return (
                                                                                                    <div className="flex flex-wrap gap-4 border-gray-200">
                                                                                                        {diForm?.area?.living?.[path]?.attachments?.map((attachment, index) => (
                                                                                                            <div className="flex gap-4 relative" key={index}>
                                                                                                                <a
                                                                                                                    className="text-sm font-medium text-gray-900 hover:text-primary-active mb-px relative"
                                                                                                                    href={AWS_S3_URL + (attachment.file_url)}
                                                                                                                    target="_blank"
                                                                                                                    rel="noopener noreferrer"
                                                                                                                >
                                                                                                                    <img
                                                                                                                        src={AWS_S3_URL + (attachment.file_url)}
                                                                                                                        alt={attachment.original_name}
                                                                                                                        className="w-16 h-16 object-cover border border-gray-300 rounded"
                                                                                                                    />
                                                                                                                </a>
                                                                                                            </div>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                );
                                                                                            })()
                                                                                        ) : null
                                                                                    }
                                                                                </div>

                                                                                <div className="col-span-8">
                                                                                    <div className="flex flex-col w-full">
                                                                                        <span className="text-slate-900 mb-2 font-medium">Remark</span>
                                                                                        <span className="textarea text-slate-900 mb-2 font-medium">{diForm?.area?.living?.[path]?.remark}</span>
                                                                                    </div>
                                                                                </div>

                                                                                <div className="col-span-12">
                                                                                    <hr />
                                                                                </div>
                                                                            </React.Fragment>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="hidden transition-opacity duration-700" id="tab_5">
                                                <div className="flex gap-4">
                                                    <div className="flex-[2]">
                                                        <div className="card rounded-md mb-8">
                                                            <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
                                                                <h2 className="">Balcony</h2>
                                                            </div>
                                                            <div className="card-body text-sm px-4">
                                                                <div className="w-full">
                                                                    <div className="grid grid-cols-12 gap-4">
                                                                        {/* Header Row */}
                                                                        <div className="col-start-6 col-span-1 text-xs text-center text-gray-900 font-semibold">Has Defect</div>
                                                                        <div className="col-start-7 col-span-1 text-xs text-center text-gray-900 font-semibold">No Defect / YES</div>
                                                                        <div className="col-start-8 col-span-1 text-xs text-center text-gray-900 font-semibold">No Available</div>
                                                                        <div className="col-start-9 col-span-4 text-xs text-center text-gray-900 font-semibold">Attachments</div>

                                                                        {/* Inspection Item Component */}
                                                                        {[
                                                                            { label: "5.1 Floor & skirting (Floor trap, evenness, etc)", path: 'q1' },
                                                                            { label: "5.2 Wall & ceiling", path: 'q2' },
                                                                            { label: "5.3 Railing", path: 'q3' },
                                                                            { label: "5.4 AC ledge", path: 'q4' },
                                                                        ].map(({ label, path }) => (
                                                                            <React.Fragment key={path}>
                                                                                {/* Label */}
                                                                                <div className="col-span-5 flex items-center text-gray-900 font-semibold">
                                                                                    {label}
                                                                                </div>

                                                                                {/* Has Defect */}
                                                                                <div className="col-start-6 col-span-1 flex justify-center items-center">
                                                                                    {diForm?.area?.balcony?.[path]?.value === 'has-defect' &&
                                                                                        <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                                    }
                                                                                </div>

                                                                                {/* No Defect */}
                                                                                <div className="col-start-7 col-span-1 flex justify-center items-center">
                                                                                    {diForm?.area?.balcony?.[path]?.value === 'no-defect' &&
                                                                                        <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                                    }
                                                                                </div>

                                                                                {/* N/A */}
                                                                                <div className="col-start-8 col-span-1 flex justify-center items-center">
                                                                                    {diForm?.area?.balcony?.[path]?.value === 'not-available' &&
                                                                                        <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                                    }
                                                                                </div>

                                                                                <div className="col-start-9 col-span-4 ">
                                                                                    {

                                                                                        diForm?.area?.balcony ? (
                                                                                            (() => {
                                                                                                // You can use 'attachments' here as needed, for example:
                                                                                                return (
                                                                                                    <div className="flex flex-wrap gap-4 border-gray-200">
                                                                                                        {diForm?.area?.balcony?.[path]?.attachments?.map((attachment, index) => (
                                                                                                            <div className="flex gap-4 relative" key={index}>
                                                                                                                <a
                                                                                                                    className="text-sm font-medium text-gray-900 hover:text-primary-active mb-px relative"
                                                                                                                    href={AWS_S3_URL + (attachment.file_url)}
                                                                                                                    target="_blank"
                                                                                                                    rel="noopener noreferrer"
                                                                                                                >
                                                                                                                    <img
                                                                                                                        src={AWS_S3_URL + (attachment.file_url)}
                                                                                                                        alt={attachment.original_name}
                                                                                                                        className="w-16 h-16 object-cover border border-gray-300 rounded"
                                                                                                                    />
                                                                                                                </a>
                                                                                                            </div>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                );
                                                                                            })()
                                                                                        ) : null
                                                                                    }
                                                                                </div>

                                                                                <div className="col-span-8">
                                                                                    <div className="flex flex-col w-full">
                                                                                        <span className="text-slate-900 mb-2 font-medium">Remark</span>
                                                                                        <span className="textarea text-slate-900 mb-2 font-medium">{diForm?.area?.balcony?.[path]?.remark}</span>
                                                                                    </div>
                                                                                </div>

                                                                                <div className="col-span-12">
                                                                                    <hr />
                                                                                </div>
                                                                            </React.Fragment>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="hidden transition-opacity duration-700" id="tab_6">
                                                <div className="flex gap-4">
                                                    <div className="flex-[2]">
                                                        <div className="card rounded-md mb-8">
                                                            <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
                                                                <h2 className="">Hallway</h2>
                                                            </div>
                                                            <div className="card-body text-sm px-4">
                                                                <div className="w-full">
                                                                    <div className="grid grid-cols-12 gap-4">
                                                                        {/* Header Row */}
                                                                        <div className="col-start-6 col-span-1 text-xs text-center text-gray-900 font-semibold">Has Defect</div>
                                                                        <div className="col-start-7 col-span-1 text-xs text-center text-gray-900 font-semibold">No Defect / YES</div>
                                                                        <div className="col-start-8 col-span-1 text-xs text-center text-gray-900 font-semibold">No Available</div>
                                                                        <div className="col-start-9 col-span-4 text-xs text-center text-gray-900 font-semibold">Attachments</div>

                                                                        {/* Inspection Item Component */}
                                                                        {[
                                                                            { label: "6.1 Floor & skirting", path: 'q1' },
                                                                            { label: "6.2 Wall", path: 'q2' },
                                                                            { label: "6.3 Ceiling", path: 'q3' },
                                                                            { label: "6.4 Electrical & wiring (plug point, switches, etc)", path: 'q4' },
                                                                        ].map(({ label, path }) => (
                                                                            <React.Fragment key={path}>
                                                                                {/* Label */}
                                                                                <div className="col-span-5 flex items-center text-gray-900 font-semibold">
                                                                                    {label}
                                                                                </div>

                                                                                {/* Has Defect */}
                                                                                <div className="col-start-6 col-span-1 flex justify-center items-center">
                                                                                    {diForm?.area?.hallway?.[path]?.value === 'has-defect' &&
                                                                                        <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                                    }
                                                                                </div>

                                                                                {/* No Defect */}
                                                                                <div className="col-start-7 col-span-1 flex justify-center items-center">
                                                                                    {diForm?.area?.hallway?.[path]?.value === 'no-defect' &&
                                                                                        <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                                    }
                                                                                </div>

                                                                                {/* N/A */}
                                                                                <div className="col-start-8 col-span-1 flex justify-center items-center">
                                                                                    {diForm?.area?.hallway?.[path]?.value === 'not-available' &&
                                                                                        <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                                    }
                                                                                </div>

                                                                                <div className="col-start-9 col-span-4 ">
                                                                                    {

                                                                                        diForm?.area?.hallway ? (
                                                                                            (() => {
                                                                                                // You can use 'attachments' here as needed, for example:
                                                                                                return (
                                                                                                    <div className="flex flex-wrap gap-4 border-gray-200">
                                                                                                        {diForm?.area?.hallway?.[path]?.attachments?.map((attachment, index) => (
                                                                                                            <div className="flex gap-4 relative" key={index}>
                                                                                                                <a
                                                                                                                    className="text-sm font-medium text-gray-900 hover:text-primary-active mb-px relative"
                                                                                                                    href={AWS_S3_URL + (attachment.file_url)}
                                                                                                                    target="_blank"
                                                                                                                    rel="noopener noreferrer"
                                                                                                                >
                                                                                                                    <img
                                                                                                                        src={AWS_S3_URL + (attachment.file_url)}
                                                                                                                        alt={attachment.original_name}
                                                                                                                        className="w-16 h-16 object-cover border border-gray-300 rounded"
                                                                                                                    />
                                                                                                                </a>
                                                                                                            </div>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                );
                                                                                            })()
                                                                                        ) : null
                                                                                    }
                                                                                </div>

                                                                                <div className="col-span-8">
                                                                                    <div className="flex flex-col w-full">
                                                                                        <span className="text-slate-900 mb-2 font-medium">Remark</span>
                                                                                        <span className="textarea text-slate-900 mb-2 font-medium">{diForm?.area?.hallway?.[path]?.remark}</span>
                                                                                    </div>
                                                                                </div>

                                                                                <div className="col-span-12">
                                                                                    <hr />
                                                                                </div>
                                                                            </React.Fragment>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="hidden transition-opacity duration-700" id="tab_7">
                                                <div className="flex gap-4">
                                                    <div className="flex-[2] flex-col">
                                                        {Object.keys(diForm?.area?.bedrooms || {}).map((bedroomKey) => {
                                                            const bedroom = diForm?.area?.bedrooms[bedroomKey];

                                                            return (
                                                                <div className="card rounded-md mb-8" key={bedroomKey}>
                                                                    <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
                                                                        <h2 className="">{bedroomKey}</h2>
                                                                    </div>
                                                                    <div className="card-body text-sm px-4">
                                                                        <div className="w-full">
                                                                            <div className="grid grid-cols-12 gap-4">
                                                                                {/* Header Row */}
                                                                                <div className="col-start-6 col-span-1 text-xs text-center text-gray-900 font-semibold">Has Defect</div>
                                                                                <div className="col-start-7 col-span-1 text-xs text-center text-gray-900 font-semibold">No Defect / YES</div>
                                                                                <div className="col-start-8 col-span-1 text-xs text-center text-gray-900 font-semibold">No Available</div>
                                                                                <div className="col-start-9 col-span-4 text-xs text-center text-gray-900 font-semibold">Attachments</div>

                                                                                {/* Inspection Item Component */}
                                                                                {[
                                                                                    { label: "1. Floor & skirting", path: 'q1' },
                                                                                    { label: "2. Wall", path: 'q2' },
                                                                                    { label: "3. Ceiling", path: 'q3' },
                                                                                    { label: "4. Electrical & wiring (plug point, switches, etc)", path: 'q4' },
                                                                                    { label: "5. Door (Frame, panel, handle, accessories, etc)", path: 'q5' },
                                                                                    { label: "6. Window (Frame, panel, handle, accessories, etc)", path: 'q6' },
                                                                                    { label: "7. Air conditioner", path: 'q7' },
                                                                                    { label: "8. Air conditioner turned on for 2 hours or more", path: 'q8' },
                                                                                    { label: "9. Other", path: 'q9' },
                                                                                ].map(({ label, path }) => (
                                                                                    <React.Fragment key={path}>
                                                                                        {/* Label */}
                                                                                        <div className="col-span-5 flex items-center text-gray-900 font-semibold">
                                                                                            {label}
                                                                                        </div>

                                                                                        {/* Has Defect */}
                                                                                        <div className="col-start-6 col-span-1 flex justify-center items-center">
                                                                                            {bedroom?.[path]?.value === 'has-defect' &&
                                                                                                <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                                            }
                                                                                        </div>

                                                                                        {/* No Defect */}
                                                                                        <div className="col-start-7 col-span-1 flex justify-center items-center">
                                                                                            {(bedroom?.[path]?.value === 'no-defect' || bedroom?.[path]?.value === 'yes') &&
                                                                                                <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                                            }
                                                                                        </div>

                                                                                        {/* N/A */}
                                                                                        <div className="col-start-8 col-span-1 flex justify-center items-center">
                                                                                            {bedroom?.[path]?.value === 'not-available' &&
                                                                                                <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                                            }
                                                                                        </div>

                                                                                        <div className="col-start-9 col-span-4 ">
                                                                                            {
                                                                                                Array.isArray(bedroom?.[path]?.attachments) && bedroom?.[path]?.attachments.length > 0 ? (
                                                                                                    <div className="flex flex-wrap gap-4 border-gray-200">
                                                                                                        {console.log(bedroomKey, ':', bedroom)} {/* Logs the attachments array */}
                                                                                                        {bedroom?.[path]?.attachments.map((attachment, index) => (
                                                                                                            <div className="flex gap-4 relative" key={index}>
                                                                                                                <a
                                                                                                                    className="text-sm font-medium text-gray-900 hover:text-primary-active mb-px relative"
                                                                                                                    href={AWS_S3_URL + (attachment.file_url)}
                                                                                                                    target="_blank"
                                                                                                                    rel="noopener noreferrer"
                                                                                                                >
                                                                                                                    <img
                                                                                                                        src={AWS_S3_URL + (attachment.file_url)}
                                                                                                                        alt={attachment.original_name}
                                                                                                                        className="w-16 h-16 object-cover border border-gray-300 rounded"
                                                                                                                    />
                                                                                                                </a>
                                                                                                            </div>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                ) : null
                                                                                            }
                                                                                        </div>

                                                                                        <div className="col-span-8">
                                                                                            <div className="flex flex-col w-full">
                                                                                                <span className="text-slate-900 mb-2 font-medium">Remark</span>
                                                                                                <span className="textarea text-slate-900 mb-2 font-medium">{bedroom?.[path]?.remark}</span>
                                                                                            </div>
                                                                                        </div>

                                                                                        <div className="col-span-12">
                                                                                            <hr />
                                                                                        </div>
                                                                                    </React.Fragment>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="hidden transition-opacity duration-700" id="tab_8">
                                                <div className="flex gap-4">
                                                    <div className="flex-[2] flex-col">
                                                        {Object.keys(diForm?.area?.bathrooms || {}).map((bathroomKey) => {
                                                            const bathroom = diForm?.area?.bathrooms[bathroomKey];

                                                            return (
                                                                <div className="card rounded-md mb-8" key={bathroomKey}>
                                                                    <div className="card-header px-4 rounded-t-md bg-gray-300 text-gray-900 font-bold">
                                                                        <h2 className="">{bathroomKey}</h2>
                                                                    </div>
                                                                    <div className="card-body text-sm px-4">
                                                                        <div className="w-full">
                                                                            <div className="grid grid-cols-12 gap-4">
                                                                                {/* Header Row */}
                                                                                <div className="col-start-6 col-span-1 text-xs text-center text-gray-900 font-semibold">Has Defect</div>
                                                                                <div className="col-start-7 col-span-1 text-xs text-center text-gray-900 font-semibold">No Defect / YES</div>
                                                                                <div className="col-start-8 col-span-1 text-xs text-center text-gray-900 font-semibold">No Available</div>
                                                                                <div className="col-start-9 col-span-4 text-xs text-center text-gray-900 font-semibold">Attachments</div>

                                                                                {/* Inspection Item Component */}
                                                                                {[
                                                                                    { label: "1. Floor (Floor trap, etc)", path: 'q1' },
                                                                                    { label: "2. Wall & ceiling", path: 'q2' },
                                                                                    { label: "3. Door (Frame, panel, handle, accessories, etc)", path: 'q3' },
                                                                                    { label: "4. Window (Frame, panel, handle, accessories, etc)", path: 'q4' },
                                                                                    { label: "5. Electrical & wiring (plug point, switches, etc)", path: 'q5' },
                                                                                    { label: "6. Sanitary ware (Basin, bidet, tap, WC, shower, etc)", path: 'q6' },
                                                                                    { label: "7. Piping & water flow (Basin, bidet, tap, WC, shower, etc)", path: 'q7' },
                                                                                    { label: "8. Shower screen (Panel, frame, accessories, etc)", path: 'q8' },
                                                                                    { label: "9. Other", path: 'q9' },
                                                                                ].map(({ label, path }) => (
                                                                                    <React.Fragment key={path}>
                                                                                        {/* Label */}
                                                                                        <div className="col-span-5 flex items-center text-gray-900 font-semibold">
                                                                                            {label}
                                                                                        </div>

                                                                                        {/* Has Defect */}
                                                                                        <div className="col-start-6 col-span-1 flex justify-center items-center">
                                                                                            {bathroom?.[path]?.value === 'has-defect' &&
                                                                                                <i className="ki-solid ki-check-circle text-2xl text-danger"></i>
                                                                                            }
                                                                                        </div>

                                                                                        {/* No Defect */}
                                                                                        <div className="col-start-7 col-span-1 flex justify-center items-center">
                                                                                            {bathroom?.[path]?.value === 'no-defect' &&
                                                                                                <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                                            }
                                                                                        </div>

                                                                                        {/* N/A */}
                                                                                        <div className="col-start-8 col-span-1 flex justify-center items-center">
                                                                                            {bathroom?.[path]?.value === 'not-available' &&
                                                                                                <i className="ki-solid ki-check-circle text-2xl text-success"></i>
                                                                                            }
                                                                                        </div>

                                                                                        <div className="col-start-9 col-span-4 ">
                                                                                            {
                                                                                                Array.isArray(bathroom?.[path]?.attachments) && bathroom?.[path]?.attachments.length > 0 ? (
                                                                                                    <div className="flex flex-wrap gap-4 border-gray-200">
                                                                                                        {bathroom?.[path]?.attachments.map((attachment, index) => (
                                                                                                            <div className="flex gap-4 relative" key={index}>
                                                                                                                <a
                                                                                                                    className="text-sm font-medium text-gray-900 hover:text-primary-active mb-px relative"
                                                                                                                    href={AWS_S3_URL + (attachment.file_url)}
                                                                                                                    target="_blank"
                                                                                                                    rel="noopener noreferrer"
                                                                                                                >
                                                                                                                    <img
                                                                                                                        src={AWS_S3_URL + (attachment.file_url)}
                                                                                                                        alt={attachment.original_name}
                                                                                                                        className="w-16 h-16 object-cover border border-gray-300 rounded"
                                                                                                                    />
                                                                                                                </a>
                                                                                                            </div>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                ) : null
                                                                                            }
                                                                                        </div>

                                                                                        <div className="col-span-8">
                                                                                            <div className="flex flex-col w-full">
                                                                                                <span className="text-slate-900 mb-2 font-medium">Remark</span>
                                                                                                <span className="textarea text-slate-900 mb-2 font-medium">{bathroom?.[path]?.remark}</span>
                                                                                            </div>
                                                                                        </div>

                                                                                        <div className="col-span-12">
                                                                                            <hr />
                                                                                        </div>
                                                                                    </React.Fragment>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        :
                                        <div className=" flex justify-center items-center">
                                            <span>Nothing</span>
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