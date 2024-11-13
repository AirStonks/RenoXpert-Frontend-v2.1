import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchQCForms } from "../../services/operationApi";
import { QCForm } from "../../types";
import Loading from "../../components/Loading";

function OperationHome() {

    const [qcForms, setQCForms] = useState<QCForm[] | null>(null);

    useEffect(() => {
        getQCForms();
    }, []);

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
                <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-lg font-bold text-slate-900">QC Forms</span>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        {!qcForms ? <Loading /> :
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
        </>
    )
}

export default OperationHome;