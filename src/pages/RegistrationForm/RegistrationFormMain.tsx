import RegistrationFormTable from "../../components/Tables/RegistrationFormTable";

function RegistrationFormMain() {
    return (
        <>
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center flex-wrap">
                    <span className="text-2xl font-bold text-gray-900">
                        Registration Form Requests
                    </span>
                    <div className="flex gap-3 flex-wrap">

                    </div>
                </div>

                <RegistrationFormTable />
            </div>
        </>
    );
}

export default RegistrationFormMain;