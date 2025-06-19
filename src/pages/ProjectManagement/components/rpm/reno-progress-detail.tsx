import { useCallback } from "react";
import { TaskStatusBadge } from "../../../../components/task-status-badge";
import { RenoProgress } from "../../../../types";
import { CheckCircle, Clock } from "lucide-react";
import { StatusBadge } from "../../../../components/status-badge";
import { sendRenoToLark } from "../../../../services/api";
import { Slide, toast } from "react-toastify";

const customStatusOptions: string[] = [
    'not-sent',
    'sent',
]

const customStatusConfig = {
    "not-sent": {
        label: "Not Sent",
        icon: Clock,
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-800",
        iconColor: "text-yellow-600",
        hoverColor: "hover:bg-yellow-200",
    },
    "sent": {
        label: "Completed",
        icon: CheckCircle,
        bgColor: "bg-green-100",
        textColor: "text-green-800",
        iconColor: "text-green-600",
        hoverColor: "hover:bg-green-200",
    },
}

interface Props {
    renoProgress: RenoProgress;
    setRenoProgress?: React.Dispatch<React.SetStateAction<RenoProgress>>
}

const formatDate = (date: string) => {
    if (date) {
        const [year, month, day] = date.split(/\/|-/).map(Number); // Split on '/' or '-'
        const parsedDate = new Date(year, month - 1, day); // Month is 0-based in JS
        if (isNaN(parsedDate.getTime())) {
            return 'Invalid Date';
        }
        const formattedDate = parsedDate.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        const [dayStr, monthStr, yearStr] = formattedDate.split(' ');
        return `${dayStr} ${monthStr.toUpperCase()} ${yearStr}`;
    } else {
        return '-';
    }
};

export const RenoPorgressDetailCard = ({ renoProgress, setRenoProgress }: Props) => {
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

    const handleInformRPM = async () => {
        try {
            const response = await sendRenoToLark(Number(renoProgress.id)!);

            if (response?.success) {

                setRenoProgress({
                    ...renoProgress,
                    sent_to_lark_date: response.data.sent_to_lark_date,
                    rpm_acknowledge_status: 'informed'
                });

                notify('success', 'Reno has been sent to Lark successfully.');
                return;
            }
        } catch (error) {
            notify('error', 'Failed to send Reno to Lark.');
        }
    }

    return (
        <div className="shadow-md rounded-xl overflow-hidden bg-white w-full">
            <div className="bg-gradient-to-r from-green-50 to-green-100 border-b border-gray-200 p-2 px-4">
                <span className="text-base font-semibold">
                    {renoProgress.property.name} ({renoProgress.sale.order.block}-{renoProgress.sale.order.floor}-{renoProgress.sale.order.unit_no})
                </span>
                <div className="w-full rounded-full h-1 mt-1">
                </div>
            </div>
            <div className="p-2">
                <ul className="space-y-1">
                    {/* <li className="p-2 rounded-lg bg-white shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">Sales Date</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">{formatDate(renoProgress.date_management.sales_date)}</p>
                    </li> */}
                    <li className="p-2 rounded-lg bg-white shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">Payment</span>
                        </div>
                        <div className="relative w-full bg-gray-200 rounded-full h-1.5 mt-0.5">
                            <div
                                className="absolute top-0 left-0 h-full bg-blue-300 rounded-full"
                                style={{ width: `${100 - renoProgress.remaining_percentage * 100}%` }}
                            ></div>
                            <div
                                className="absolute top-0 left-0 h-full bg-green-500 rounded-full"
                                style={{ width: `${renoProgress.paid_percentage * 100}%` }}
                            ></div>
                        </div>
                        <div className="flex gap-1 mt-0.5">
                            <span className="text-sm text-green-600">
                                {(renoProgress.paid_percentage * 100).toFixed(2)}% Paid
                            </span>
                        </div>
                    </li>
                    <li className="p-2 rounded-lg bg-white shadow-sm flex justify-between">
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">Send to RPM</span>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-0.5">Notify Date: {renoProgress.sent_to_lark_date ? renoProgress.sent_to_lark_date : '-'}</p>
                        </div>
                        {renoProgress.rpm_acknowledge_status === 'pending' && (
                            <button
                                className="btn btn-sm btn-info"
                                onClick={handleInformRPM}
                            >
                                Notify RPM
                            </button>
                        )}
                        {renoProgress.rpm_acknowledge_status === 'informed' && (
                            <span className="inline-flex px-2.5 py-1.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 items-center">Informed</span>
                        )}
                        {renoProgress.rpm_acknowledge_status === 'acknowledged' && (
                            <span className="inline-flex px-2.5 py-1.5 text-xs font-medium rounded-full bg-green-100 text-green-800 items-center">Acknowledged</span>
                        )}
                        {/* <StatusBadge
                            statusConfig={customStatusConfig}
                            statusOptions={customStatusOptions}
                            status={renoProgress.sent_to_lark_date ? 'sent' : 'not-sent'}
                            onStatusChange={() => handleChangeStatus()}
                        /> */}
                    </li>
                </ul>
            </div>
        </div>
    );
};