import { useCallback } from "react";
import { TaskStatusBadge } from "../../../../components/task-status-badge";
import { RenoProgress } from "../../../../types";

interface Props {
    renoProgress: RenoProgress;
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

export const RenoPorgressDetailCard = ({ renoProgress }: Props) => {

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
                    <li className="p-2 rounded-lg bg-white shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">Sales Date</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">{formatDate(renoProgress.date_management.sales_date)}</p>
                    </li>
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
                            <span className="text-[10px] text-blue-600">
                                {(100 - renoProgress.remaining_percentage * 100).toFixed(2)}%
                            </span>
                            <span className="text-[10px] text-green-600">
                                {(renoProgress.paid_percentage * 100).toFixed(2)}%
                            </span>
                        </div>
                    </li>
                    <li className="p-2 rounded-lg bg-white shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">Delivery Date</span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5">{formatDate(renoProgress.date_management.oh_date)}</p>
                    </li>
                </ul>
            </div>
        </div>
    );
};