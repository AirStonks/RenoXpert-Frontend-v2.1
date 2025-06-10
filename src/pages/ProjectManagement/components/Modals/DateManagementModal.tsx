import { AlertTriangle, Calendar, Clock } from 'lucide-react'
import React, { useRef, useState } from 'react'
import { RenoProgress } from '../../../../types';
import { changeDateManagement } from '../../../../services/api';
import { Slide, toast } from 'react-toastify';
import Loading from '../../../../components/Loading';

type DateManagementKey = 'p1_date' | 'p2a_date' | 'p2b_date' | 'qc_date' | 'cleaning_date' | 'ch_date' | 'oh_date';

interface DateManagementModalProps {
    renoProgress: RenoProgress
    setRenoProgress: React.Dispatch<React.SetStateAction<RenoProgress | null>>;
}

const getDateKey: Record<DateManagementKey, string> = {
    p1_date: 'P1 Date',
    p2a_date: 'P2A Date',
    p2b_date: 'P2B Date',
    qc_date: 'QC Date',
    cleaning_date: 'Cleaning Date',
    ch_date: 'Contractor Handover Date',
    oh_date: 'Owner Handover Date'
};

const formatDateToDDMMYYYY = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const formatDateForInput = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

function DateManagementModal({ renoProgress, setRenoProgress }: DateManagementModalProps) {
    const readOnlyFields: DateManagementKey[] = [
        'p1_date',
        'p2a_date',
        'p2b_date',
        'qc_date',
        'cleaning_date',
        'ch_date',
        'oh_date'
    ];

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

    const salesDateInputRef = useRef<HTMLInputElement>(null);
    const defectPermitDateInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [salesDateTemp, setSalesDateTemp] = useState<string>(formatDateForInput(renoProgress.date_management.sales_date));
    const [defectPermitDateTemp, setDefectPermitDateTemp] = useState<string>(formatDateForInput(renoProgress.date_management.defect_permit_date));

    const handleDateChange = async (field: DateManagementKey | 'sales_date' | 'defect_permit_date', value: string) => {
        if (!value) return; // Ignore empty values

        setIsLoading(true);

        try {
            const response = await changeDateManagement(Number(renoProgress.id), field, value);
            const updatedRenoProgress: RenoProgress = response.data;

            if (response?.success) {
                notify('success', 'Date updated successfully');
                setRenoProgress(updatedRenoProgress);
                // Reset temp state to new value after successful update
                if (field === 'sales_date') setSalesDateTemp(formatDateForInput(updatedRenoProgress.date_management.sales_date));
                if (field === 'defect_permit_date') setDefectPermitDateTemp(formatDateForInput(updatedRenoProgress.date_management.defect_permit_date));
            }
        } catch (error) {
            notify('error', 'Failed to update date');
        } finally {
            setIsLoading(false);
        }
    };

    const triggerDatePicker = (field: 'sales_date' | 'defect_permit_date') => {
        if (field === 'sales_date' && salesDateInputRef.current) {
            salesDateInputRef.current.showPicker();
        } else if (field === 'defect_permit_date' && defectPermitDateInputRef.current) {
            defectPermitDateInputRef.current.showPicker();
        }
    };

    // Check if the temporary date differs from the original
    const isSalesDateChanged = salesDateTemp !== formatDateForInput(renoProgress.date_management.sales_date);
    const isDefectPermitDateChanged = defectPermitDateTemp !== formatDateForInput(renoProgress.date_management.defect_permit_date);

    return (
        <>
            {isLoading && <Loading />}

            <div className="modal p-14" data-modal="true" id="date-management-modal">
                <div className="modal-content modal-center-y max-w-[50%] max-h-[95%] bg-white rounded-lg shadow-xl">
                    <div className="modal-header py-4 px-5 border-b border-gray-200 flex justify-between items-center">
                        <span className="text-lg text-gray-900 font-bold">
                            Date Management
                        </span>
                        <button
                            className="btn btn-sm btn-icon btn-light btn-clear shrink-0 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700"
                            data-modal-dismiss="true"
                        >
                            <i className="ki-filled ki-cross text-xl"></i>
                        </button>
                    </div>
                    <div className="modal-body rounded-xl overflow-y-auto scrollable-y-auto">
                        <div className="space-y-4">
                            {/* Warning Message */}
                            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                <p className="text-xs text-amber-700">
                                    Changes to Defect & Permit Date will affect all subsequent dates.
                                </p>
                            </div>

                            {/* Editable Fields in Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label htmlFor="salesDate" className="text-xs font-medium text-gray-600 flex items-center gap-1">
                                        <Calendar className="w-3 h-3 text-blue-500" />
                                        Sales Date
                                    </label>
                                    <div className="relative flex items-center">
                                        <span className="text-xs text-gray-500 p-2 border border-gray-300 rounded-s-md w-full">
                                            {formatDateToDDMMYYYY(salesDateTemp)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => triggerDatePicker('sales_date')}
                                            className="p-2 bg-blue-100 rounded-e-md border border-gray-300 hover:bg-blue-200 transition-colors"
                                        >
                                            <Calendar className="w-4 h-4 text-blue-500" />
                                        </button>
                                        <input
                                            type="date"
                                            id="salesDate"
                                            ref={salesDateInputRef}
                                            value={salesDateTemp}
                                            onChange={(e) => setSalesDateTemp(e.target.value)}
                                            className="absolute left-0 top-full mt-1 w-0 h-0 opacity-0 pointer-events-none"
                                        />
                                    </div>
                                    {isSalesDateChanged && (
                                        <button
                                            type="button"
                                            onClick={() => handleDateChange('sales_date', salesDateTemp)}
                                            className="mt-2 px-3 py-1 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                        >
                                            Confirm
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label htmlFor="defectPermitDate" className="text-xs font-medium text-gray-600 flex items-center gap-1">
                                        <Calendar className="w-3 h-3 text-amber-500" />
                                        Defect & Permit
                                    </label>
                                    <div className="relative flex items-center">
                                        <span className="text-xs text-gray-500 p-2 border border-gray-300 rounded-s-md w-full">
                                            {formatDateToDDMMYYYY(defectPermitDateTemp)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => triggerDatePicker('defect_permit_date')}
                                            className="p-2 bg-amber-100 rounded-e-md border border-gray-300 hover:bg-amber-200 transition-colors"
                                        >
                                            <Calendar className="w-4 h-4 text-amber-500" />
                                        </button>
                                        <input
                                            type="date"
                                            id="defectPermitDate"
                                            ref={defectPermitDateInputRef}
                                            value={defectPermitDateTemp}
                                            onChange={(e) => setDefectPermitDateTemp(e.target.value)}
                                            className="absolute left-0 top-full mt-1 w-0 h-0 opacity-0 pointer-events-none"
                                        />
                                    </div>
                                    {isDefectPermitDateChanged && (
                                        <button
                                            type="button"
                                            onClick={() => handleDateChange('defect_permit_date', defectPermitDateTemp)}
                                            className="mt-2 px-3 py-1 text-xs bg-amber-500 text-white rounded-md hover:bg-amber-600"
                                        >
                                            Confirm
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Project Timeline - Compact Grid */}
                            <div className="space-y-2 pb-4">
                                <h3 className="text-xs font-medium text-gray-600 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-gray-500" />
                                    Project Timeline
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {readOnlyFields.map((key, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md border border-gray-100">
                                            <div className="flex items-center gap-2">
                                                <span className="text sn font-medium text-gray-700">
                                                    {getDateKey[key]}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-500">{renoProgress.date_management[key] || 'N/A'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default DateManagementModal