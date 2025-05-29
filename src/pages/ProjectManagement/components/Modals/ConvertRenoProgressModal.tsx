import { useState } from "react"
import { Slide, toast } from "react-toastify"
import { constconvertRenoProgressToV3 } from "../../../../services/api"
import { useNavigate } from "react-router-dom"
import type { RenoProgress } from "../../../../types"
import { ArrowPathIcon } from "@heroicons/react/24/solid"
import { KTModal } from "../../../../metronic/core"

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

function ConvertRenoProgressModal({ renoProgressId }: { renoProgressId: number }) {
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(false)

    const notify = (type: "success" | "error", message: string) => {
        (toast[type] as (message: string, options?: object) => void)(message, {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: localStorage.getItem("theme"),
            transition: Slide,
        })
    }

    const handleSubmit = async () => {
        try {
            setIsLoading(true)
            const response = await constconvertRenoProgressToV3(renoProgressId)
            const newRenoProgress: RenoProgress = response?.data

            if (response?.success) {
                const modalEl = document.querySelector("#reno-progress-convert-modal") as HTMLElement
                const modal = KTModal.getInstance(modalEl)
                modal.hide()

                navigate(LOCAL_PATH_PREFIX + `reno-progress/${newRenoProgress.id}`)
                notify("success", "Reno Progress converted to V3 successfully.")
            }
        } catch (error) {
            notify("error", "Error occurred during conversion.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="modal p-14" data-modal="true" id="reno-progress-convert-modal">
            <div className="modal-content modal-center-y max-w-[45%] max-h-[95%] bg-white rounded-lg shadow-xl">
                <div className="modal-header py-4 px-5 border-b border-gray-200 flex justify-between items-center">
                    <span className="text-lg text-gray-900 font-bold">Convert Reno Progress to V3</span>
                    <button
                        className="btn btn-sm btn-icon btn-light btn-clear shrink-0 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700"
                        data-modal-dismiss="true"
                        disabled={isLoading}
                    >
                        <i className="ki-filled ki-cross text-xl"></i>
                    </button>
                </div>
                <div className="modal-body p-8 rounded-xl overflow-y-auto scrollable-y-auto bg-gray-50">
                    <div className="flex flex-col gap-6">
                        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-md">
                            <p className="text-gray-800 font-semibold">
                                Warning: Converting to Reno Progress V3 is a{" "}
                                <span className="text-red-600 font-bold">permanent action</span>.
                            </p>
                            <p className="text-gray-700 mt-1">Please review the impacts of this conversion carefully:</p>
                        </div>
                        <ul className="list-disc pl-6 text-gray-700 space-y-2">
                            <li>
                                The <span className="font-semibold">existing version</span> will be preserved for reference.
                            </li>
                            <li>
                                <span className="font-semibold">Key Management</span>, <span className="font-semibold">DI Form</span>,
                                and <span className="font-semibold">QC Form</span> will remain unchanged.
                            </li>
                            <li>
                                All <span className="font-semibold text-red-600">comments</span>,{" "}
                                <span className="font-semibold text-red-600">attachments</span>, and{" "}
                                <span className="font-semibold text-red-600">status</span> will be{" "}
                                <span className="font-bold text-red-600">permanently reset and removed</span>.
                            </li>
                        </ul>
                        <div className="flex justify-end gap-4 mt-6">
                            <button
                                className="btn btn-sm btn-light border border-gray-300 text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-md"
                                data-modal-dismiss="true"
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className={`btn btn-sm btn-primary bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md flex items-center justify-center min-w-[100px] transition-all ${isLoading ? "opacity-90" : ""}`}
                            >
                                {isLoading ? (
                                    <>
                                        <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                                        Converting...
                                    </>
                                ) : (
                                    "Convert to V3"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ConvertRenoProgressModal
