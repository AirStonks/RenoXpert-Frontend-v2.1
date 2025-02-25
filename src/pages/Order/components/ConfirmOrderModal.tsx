import { useState } from "react";
import { confirmOrder } from "../../../services/api";
import { Slide, toast } from "react-toastify";
import Loading from "../../../components/Loading";
import { KTModal } from "../../../metronic/core";

interface ConfirmOrderModalProps {
    order: { id: number | string, name: string } | null;
    onSubmit: () => void;
}

function ConfirmOrderModal({ order, onSubmit }: ConfirmOrderModalProps) {
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

    const handleConfirmOrder = async () => {
        setIsLoading(true);
        try {
            const response = await confirmOrder(Number(order.id));

            if (response?.success) {

                const confirmOrderModalEl = document.querySelector('#confirm_order_modal') as HTMLElement;
                const confirmOrderModal = KTModal.getInstance(confirmOrderModalEl);

                confirmOrderModal?.hide();

                notify('success', 'Order confirmed successfully!');
                onSubmit();
            }

        } catch (error) {
            console.error(error);
            notify('error', 'Failed to confirm order.');
        }
        setIsLoading(false);
    }

    return (
        <>
            {isLoading && <Loading />}

            <div className="modal p-14" data-modal="true" data-modal-backdrop-static="true" id="confirm_order_modal">
                <div className="modal-content modal-center-y max-w-[500px]">
                    <div className="modal-body overflow-y-auto scrollable-y flex flex-col gap-6 justify-center items-center my-4">
                        <div className="modal-title text-lg">
                            Confirm Order
                        </div>

                        <div className="text-gray-800">
                            Are you sure you want to confirm this order?
                        </div>

                        <div className="font-semibold text-orange-500">
                            {order?.name}
                        </div>

                        {/* <blockquote className="p-4 border-s-4 border-warning bg-warning-clarity rounded-md">
                    <div className="flex gap-4">
                        <div className="flex">
                            <i className="ki-filled ki-information-4 text-xl text-warning"></i>
                        </div>
                        <div className="flex flex-col gap-2">
                            <span className="text-warning-active font-semibold">
                                Information
                            </span>
                            <span className="text-sm text-gray-800">
                                You can retrieve this product from the product archive zone and unarchive it.
                            </span>
                        </div>
                    </div>
                </blockquote> */}

                        <div className="flex gap-4">
                            <button
                                className="btn btn-secondary btn-sm"
                                data-modal-dismiss="true"
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-success btn-sm"
                                onClick={handleConfirmOrder}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ConfirmOrderModal;