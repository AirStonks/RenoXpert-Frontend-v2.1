import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { RenoAccetanceForm } from "../../types";
import useFetchRenoProgress from '../../hook/useFetchRenoProgress';
import Loading from "../../components/Loading";
import SignatureCanvas from 'react-signature-canvas';

const initialFormData: RenoAccetanceForm = {
    is_accepted: false,
    date: '',
    property: {
        property_name: '',
        block: '',
        level: '',
        unit: '',
    },
    user: {
        id: '',
        name: '',
        email: '',
        phone_no: '',
    }
};

const token = localStorage.getItem('o_token');

function RenoAcceptanceForm() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const renoProgressId = id ? parseInt(id, 10) : null;
    const { renoProgressDetail, loading, error } = useFetchRenoProgress(renoProgressId);
    const [formData, setFormData] = useState(initialFormData);
    const [signature, setSignature] = useState();

    // $renovatedProperty = Get renoProgress.sale.order.property
    // Block
    // Level
    // Unit
    // $completionDate = [Date input]
    // $agreement = false
    // $signature = [Signature Input]
    // $ownerName = renoProgress.sale.order.user.name
    // $phoneNo = renoProgress.sale.order.user.phone_no
    // $email = renoProgress.sale.order.user.email

    useEffect(() => {
        if (renoProgressDetail) {
            setFormData({
                property: {
                    property_name: renoProgressDetail.sale.order.property.name,
                    block: renoProgressDetail.sale.order.block,
                    level: renoProgressDetail.sale.order.floor,
                    unit: renoProgressDetail.sale.order.unit_no,
                },
                user: {
                    id: renoProgressDetail.sale.order.user.id,
                    name: renoProgressDetail.sale.order.user.name,
                    email: renoProgressDetail.sale.order.user.email,
                    phone_no: renoProgressDetail.sale.order.user.phone_no,
                }
            });
        }
    }, [renoProgressDetail])

    const handleClearSignature = (ref) => {
        signature.clear();
    }

    return (
        <>
            {loading && <Loading />}
            <div className="card w-full">
                <div className="card-header py-2">
                    <div className="flex gap-4 justify-center">
                        <h2 className="text-slate-900 text-lg font-semibold">Reno Acceptance Form</h2>
                    </div>
                </div>
                <div className="card-body">
                    {loading ?
                        <Loading />
                        :
                        !renoProgressDetail ?
                            <div className="flex">
                                Invalid form
                            </div>
                            :
                            <>
                                <div className="flex flex-col mb-8">
                                    <div className="flex gap-6">
                                        <div className="flex flex-col flex-1">
                                            <label className="text-slate-900 mb-2 font-medium" htmlFor="property">Renovated Property</label>
                                            <div className="flex gap-6">
                                                <div className="card w-full">
                                                    <div className="card-group">
                                                        <div className="flex flex-col">
                                                            <span className="text-lg font-semibold">
                                                                {formData.property.property_name}
                                                            </span>
                                                            <span className="text-md">
                                                                {formData.property.block} - {formData.property.level} - {formData.property.unit}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col flex-1">
                                            <label className="text-slate-900 mb-2 font-medium" htmlFor="date">Date</label>
                                            <div className="flex gap-6">
                                                <input
                                                    type="date"
                                                    className="input input-sm"
                                                    value={formData.date || ''}
                                                // onChange={(e) => handleChangeEndDate(e, Number(progress.id))}
                                                // onClick={(e) => e.stopPropagation()} // Prevent tr onClick
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <div className="flex gap-6">
                                        <span>
                                            I, the undersigned property owner of above unit, hereby confirm that all renovation work carried out on the property has been completed to my satisfaction in accordance with the agreed-upon specifications, plans, and standards.
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <div className="flex gap-6">
                                        <span>
                                            I have thoroughly inspected the work and found it to be in compliance with the terms of our contract. Any concerns or issues that I may have had during the course of the renovation have been addressed and resolved to my satisfaction.
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <div className="flex gap-6">
                                        <span>
                                            Furthermore, I confirm that all payments and financial obligations related to the renovation project will be fulfilled in accordance with our agreement within 3 working days.
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <div className="flex gap-6 mb-2">
                                        <span>
                                            I understand that, upon my signature below, I am acknowledging the completion of the renovation project and that no further work is expected.
                                        </span>
                                    </div>
                                    <label className="form-label flex items-center gap-2.5">
                                        <input
                                            className="radio radio-lg h-4 w-4 text-blue-600"
                                            name="radio1"
                                            type="radio"
                                            value="2"
                                        />
                                        Yes
                                    </label>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <div className="flex gap-6 mb-2">
                                        <span>
                                            Signature:
                                        </span>
                                    </div>
                                    <div className="flex gap-4 mb-2">
                                        <SignatureCanvas
                                            ref={(ref) => setSignature(ref)}
                                            penColor='black'
                                            canvasProps={{ width: 250, height: 120, className: 'sigCanvas border-slate-300 border-2' }}
                                        />
                                    </div>
                                    <div className="flex">
                                        <button
                                            className="btn btn-sm btn-secondary"
                                            onClick={handleClearSignature}
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <div className="flex gap-6 mb-2">
                                        <span>
                                            Owner Name:
                                        </span>
                                    </div>
                                    <div className="flex gap-6 mb-2">
                                        <span>
                                            {formData.user.name}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <div className="flex gap-6 mb-2">
                                        <span>
                                            Phone No:
                                        </span>
                                    </div>
                                    <div className="flex gap-6 mb-2">
                                        <span>
                                           +60 {formData.user.phone_no}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <div className="flex gap-6 mb-2">
                                        <span>
                                            Email:
                                        </span>
                                    </div>
                                    <div className="flex gap-6 mb-2">
                                        <span>
                                            {formData.user.email}
                                        </span>
                                    </div>
                                </div>
                            </>


                    }
                </div>
            </div>
            <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2">
            </div>
        </>
    )
}

export default RenoAcceptanceForm;