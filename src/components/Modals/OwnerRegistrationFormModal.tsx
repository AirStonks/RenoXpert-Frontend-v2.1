
import useFetchRegistrationForm from "../../hook/useFetchRegistrationForm";
import Loading from "../Loading";

// 
interface OwnerRegistrationFormModalProps {
    formId: number | null;
}

function OwnerRegistrationFormModal({ formId }: OwnerRegistrationFormModalProps) {
    const { formDetail, loading, error } = useFetchRegistrationForm(formId);

    // if (!formId) return null;

    let content;

    if (loading) {
        content = <Loading />;
    } else if (error) {
        content = <div className="text-red-600">Something went wrong: {error}</div>;
    } else if (!formDetail) {
        content = <div>Registration Form not found</div>;
    } else {
        console.log(formDetail);

        content = (
            <div className="flex flex-wrap gap-6">
                <div className="card flex-grow">
                    <div className="card-header">
                        <h3 className="card-title">Owner Information</h3>
                    </div>
                    <div className="card-body flex flex-col gap-6">
                        <div className="flex flex-col">
                            <span className="font-normal">Salutations:</span>
                            <span className="font-semibold">{formDetail.salutations}</span>
                        </div>

                        <div className="flex flex-col">
                            <span className="font-normal">Name:</span>
                            <span className="font-semibold">{formDetail.name_first} {formDetail.name_last}</span>
                        </div>

                        <div className="flex flex-col">
                            <span className="font-normal">Preferred Name:</span>
                            <span className="font-semibold">{formDetail.name_preferred}</span>
                        </div>

                        <div className="flex flex-col">
                            <span className="font-normal">Email:</span>
                            <span className="font-semibold">{formDetail.email}</span>
                        </div>

                        <div className="flex flex-col">
                            <span className="font-normal">Phone Number:</span>
                            <span className="font-semibold">{formDetail.phone_no}</span>
                        </div>

                        <div className="flex flex-col">
                            <span className="font-normal">Current residence address:</span>
                            <span className="font-semibold">{formDetail.address.address_1}, {formDetail.address.address_2}, {formDetail.address.postcode}, {formDetail.address.city}, {formDetail.address.state}</span>
                        </div>

                        <div className="flex flex-col">
                            <span className="font-normal">IC / ID number:</span>
                            <span className="font-semibold">{formDetail.ic}</span>
                        </div>
                    </div>
                </div>

                <div className="card flex-grow">
                    <div className="card-header">
                        <h3 className="card-title">Property Information</h3>
                    </div>
                    <div className="card-body flex flex-col gap-6">
                        <div className="flex flex-col">
                            <span className="font-normal">Property to be renovated:</span>
                            <span className="font-semibold">{formDetail.property.property_name}</span>
                        </div>

                        <div className="flex flex-col">
                            <span className="font-normal">Unit:</span>
                            <span className="font-semibold">{formDetail.property.block}-{formDetail.property.level}-{formDetail.property.unit}</span>
                        </div>

                        <div className="flex flex-col">
                            <span className="font-normal">Layout Type:</span>
                            <span className="font-semibold">{formDetail.property.layout_type}</span>
                        </div>

                        <div className="flex flex-col">
                            <span className="font-normal">Sqft:</span>
                            <span className="font-semibold">{formDetail.property.sqft}</span>
                        </div>
                    </div>
                </div>

                <div className="card flex-grow">
                    <div className="card-header">
                        <h3 className="card-title">Property Information (Detail)</h3>
                    </div>
                    <div className="card-body flex flex-col gap-6">
                        <div className="flex flex-col">
                            <span className="font-normal">What's your original number of rooms?</span>
                            <span className="font-semibold">{formDetail.questions.quest_1}</span>
                        </div>

                        <div className="flex flex-col">
                            <span className="font-normal">What's the number of bathroom?</span>
                            <span className="font-semibold">{formDetail.questions.quest_2}</span>
                        </div>

                        <div className="flex flex-col">
                            <span className="font-normal">Already Vacant Possessions (VP)?</span>
                            <span className="font-semibold">{formDetail.questions.quest_3}</span>
                        </div>

                        <div className="flex flex-col">
                            <span className="font-normal">Already collect key?</span>
                            <span className="font-semibold">{formDetail.questions.quest_4}</span>
                        </div>

                        <div className="flex flex-col">
                            <span className="font-normal">Already done defect inspection?</span>
                            <span className="font-semibold">{formDetail.questions.quest_5}</span>
                        </div>

                        <div className="flex flex-col">
                            <span className="font-normal">Already submit defect submission to MO?</span>
                            <span className="font-semibold">{formDetail.questions.quest_6}</span>
                        </div>

                        <div className="flex flex-col">
                            <span className="font-normal">MO has completed that defect rectification?</span>
                            <span className="font-semibold">{formDetail.questions.quest_7}</span>
                        </div>

                        <div className="flex flex-col">
                            <span className="font-normal">Do you want to add partition room to your unit?</span>
                            <span className="font-semibold">{formDetail.questions.quest_8}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal p-14" data-modal="true" id="view_owner_reg_form_modal">
            <div className="modal-content modal-center-y max-w-[1024px]">
                <div className="modal-header py-4 px-5">
                    <span className="text-lg text-gray-900 font-semibold">Registration Form Detail</span>
                    <button
                        className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
                        data-modal-dismiss="true"
                    >
                        <i className="ki-filled ki-cross"></i>
                    </button>
                </div>
                <div className="modal-body max-h-[600px] scrollable overflow-y-auto">
                    {content}
                </div>
            </div>
        </div>
    );
}

export default OwnerRegistrationFormModal;