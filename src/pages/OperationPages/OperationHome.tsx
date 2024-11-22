import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDIForms, fetchQCForms } from "../../services/operationApi";
import { DefectInspectionForm, QCForm } from "../../types";
import Loading from "../../components/Loading";
import KTComponents from "../../metronic/core";

function OperationHome() {

    const [qcForms, setQCForms] = useState<QCForm[] | null>(null);
    const [diForms, setDIForms] = useState<DefectInspectionForm[] | null>(null);

    useEffect(() => {
        document.title = "Operation Home | RenoXpert";
        KTComponents.init();

        const initFunction = async () => {
            await getDIForms();
            await getQCForms();
        }

        initFunction();
    }, []);

    const getDIForms = async () => {
        try {
            const response = await fetchDIForms();

            if (response.success) {
                setDIForms(response.data);
            }

        } catch (error) {
            console.log(error);
        }
    }

    const getQCForms = async () => {
        try {
            const response = await fetchQCForms();

            if (response.success) {
                setQCForms(response.data);
            }

        } catch (error) {
            console.log(error);
        }
    }

    return (
        <>
            <div className="flex flex-col w-full px-4">
                <div className="flex flex-col" data-tabs="true">
                    <div className="btn-tabs mb-4">
                        <button className="btn active" data-tab-toggle="#tab_1">DI Form</button>
                        <button className="btn" data-tab-toggle="#tab_2">QC Form</button>
                    </div>


                    <div className="" id="tab_1">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-lg font-bold text-slate-900">DI Forms</span>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            {!diForms ? <Loading /> :
                                diForms.length === 0 ? <div className="text-center w-full">No Defect Inspection Forms available</div> :
                                    diForms.map((diForm, index) => (
                                        <Link
                                            to={diForm.status === 'saved' ? `/reno/defect-inspection-form?diFormId=${diForm.id}` : `/reno/defect-inspection-forms/${diForm.id}/detail`}
                                            key={index}
                                            className="card w-full sm:w-[calc(50%-0.5rem)] cursor-pointer"
                                        >
                                            <div className="card-body flex justify-between items-center">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex flex-col gap-3">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs text-gray-600">
                                                                Property Under Defect Inspection:
                                                            </span>
                                                            <span className="text-sm text-gray-900 font-medium">
                                                                {diForm.property.block}-{diForm.property.level}-{diForm.property.unit} ({diForm.property.property_name})
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs text-gray-600">
                                                                Last Update:
                                                            </span>
                                                            <span className="text-sm text-gray-900 font-medium">
                                                                {diForm.updated_at
                                                                    ? new Intl.DateTimeFormat('en-GB', {
                                                                        day: 'numeric',
                                                                        month: 'short',
                                                                        year: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                        hour12: true
                                                                    }).format(new Date(diForm.updated_at))
                                                                    : 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="status">
                                                    <span className={`badge badge-pill badge-outline gap-1 items-center`}>
                                                        {diForm.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                            }
                        </div>
                    </div>

                    <div className="hidden" id="tab_2">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-lg font-bold text-slate-900">QC Forms</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-4">
                            {!qcForms ? <Loading /> :
                                qcForms.length === 0 ? <div className="text-center w-full">No QC Forms available</div> :
                                    qcForms.map((qcForm, index) => (
                                        <Link
                                            to={qcForm.status === 'saved' ? `/reno/qc-form?qcFormId=${qcForm.id}` : `/reno/qc-forms/${qcForm.id}/detail`}
                                            key={index}
                                            className="card w-full sm:w-[calc(50%-0.5rem)] cursor-pointer"
                                        >
                                            <div className="card-body flex justify-between items-center">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex flex-col gap-3">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs text-gray-600">
                                                                Property Under QC:
                                                            </span>
                                                            <span className="text-sm text-gray-900 font-medium">
                                                                {qcForm.property.block}-{qcForm.property.level}-{qcForm.property.unit} ({qcForm.property.property_name})
                                                            </span>
                                                        </div>

                                                        <div className="flex flex-col">
                                                            <span className="text-xs text-gray-600">
                                                                Last Update:
                                                            </span>
                                                            <span className="text-sm text-gray-900 font-medium">
                                                                {qcForm.updated_at
                                                                    ? new Intl.DateTimeFormat('en-GB', {
                                                                        day: 'numeric',
                                                                        month: 'short',
                                                                        year: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                        hour12: true
                                                                    }).format(new Date(qcForm.updated_at))
                                                                    : 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="status">
                                                    <span className={`badge badge-pill badge-outline gap-1 items-center`}>
                                                        {qcForm.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                            }
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default OperationHome;