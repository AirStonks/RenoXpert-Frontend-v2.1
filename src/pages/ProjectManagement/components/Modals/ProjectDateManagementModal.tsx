
import { useEffect, useState } from "react";
import { RenoProgress } from "../../../../types";
import { changeRenoProgressContractorDate, changeRenoProgressContractorHandoverDate, changeRenoProgressContractualDate, changeRenoProgressContractualHandoverDate } from "../../../../services/api";
import { Slide, toast } from "react-toastify";
import Loading from "../../../../components/Loading";
import ScheduleSection from "../ScheduleSection";


interface Props {
    renoProgress: RenoProgress
    setRenoProgress: React.Dispatch<React.SetStateAction<RenoProgress>>
}

function ProjectDateManagementModal({ renoProgress, setRenoProgress }: Props) {
    const [isLoading, setIsLoading] = useState<boolean>(false);

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

    const handleChangeDate = async (event: React.ChangeEvent<HTMLInputElement>, renoProgressId: number, userType: string, dateType: string = 'date', datePoint: string = 'start') => {
        const date = event.target.value;
        setIsLoading(true);
        try {
            let response;

            if (userType === 'contractual') {
                if (dateType === 'date') {
                    response = await changeRenoProgressContractualHandoverDate(renoProgressId, date);
                } else {
                    if (datePoint === 'start') {
                        response = await changeRenoProgressContractualDate(renoProgressId, dateType, date);
                    } else {
                        response = await changeRenoProgressContractualDate(renoProgressId, dateType, null, date);
                    }
                }
            } else if (userType === 'contractor') {
                if (dateType === 'date') {
                    response = await changeRenoProgressContractorHandoverDate(renoProgressId, date);
                } else {
                    if (datePoint === 'start') {
                        response = await changeRenoProgressContractorDate(renoProgressId, dateType, date);
                    } else {
                        response = await changeRenoProgressContractorDate(renoProgressId, dateType, null, date);
                    }
                }
            }

            if (response?.success) {
                notify('success', 'Date updated successfully');
                setRenoProgress(response.data);
            }

            setIsLoading(false);

        } catch (error) {

            if (error.status === 400) {
                notify('error', error.response.data.message);
            } else {
                notify('error', 'Something went wrong');
            }

            setIsLoading(false);
        }
    }

    return (
        <>
            {isLoading && <Loading />}

            <div className="modal p-14" data-modal="true" data-modal-backdrop-static="true" id="date_management_modal">
                <div className="modal-content h-full max-w-[900px]">
                    <div className="modal-header py-4 px-5">
                        <span className="text-lg text-gray-900 font-bold">Date Management</span>
                        <button
                            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
                            data-modal-dismiss="true"
                        >
                            <i className="ki-filled ki-cross"></i>
                        </button>
                    </div>
                    <div className="modal-body overflow-y-auto scrollable-y flex flex-col gap-4">
                        <ScheduleSection
                            title="Owner Schedule"
                            type="contractual"
                            renoProgress={renoProgress}
                            handleChangeDate={handleChangeDate}
                        />

                        <ScheduleSection
                            title="Sub Contractor Schedule"
                            type="contractor"
                            renoProgress={renoProgress}
                            handleChangeDate={handleChangeDate}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

export default ProjectDateManagementModal;