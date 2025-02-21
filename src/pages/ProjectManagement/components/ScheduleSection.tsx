import React from 'react';
import { RenoProgress } from '../../../types';

interface DateField {
    title: string;
    color: string;
    label: string;
    field: string;
    phase: string | null;
    isEnd?: boolean;
}

interface ScheduleSectionProps {
    title: string;
    type: string;
    renoProgress: RenoProgress;
    handleChangeDate: (
        e: React.ChangeEvent<HTMLInputElement>,
        id: number,
        type: string,
        phase?: string,
        dateType?: string
    ) => void;
}

const ScheduleSection: React.FC<ScheduleSectionProps> = ({
    title,
    type,
    renoProgress,
    handleChangeDate
}) => {
    // Define all date fields with their labels
    const dateFields: DateField[] = [
        { title: "Project", color: "bg-purple-300", label: "Start Date", field: `${type}_start_date`, phase: "overall" },
        { title: "Project", color: "bg-purple-300", label: "Permit Approved Date", field: `${type}_end_date`, phase: "overall", isEnd: true },
        { title: "P1", color: "bg-green-300", label: "P1 Start Date", field: `${type}_p1_start_date`, phase: "p1" },
        { title: "P1", color: "bg-green-300", label: "P1 End Date", field: `${type}_p1_end_date`, phase: "p1", isEnd: true },
        { title: "P2", color: "bg-orange-300", label: "P2 Start Date", field: `${type}_p2_start_date`, phase: "p2" },
        { title: "P2", color: "bg-orange-300", label: "P2 End Date", field: `${type}_p2_end_date`, phase: "p2", isEnd: true },
        { title: "QC", color: "bg-red-300", label: "QC Start Date", field: `${type}_qc_start_date`, phase: "qc" },
        { title: "QC", color: "bg-red-300", label: "QC End Date", field: `${type}_qc_end_date`, phase: "qc", isEnd: true },
        { title: "Cleaning", color: "bg-gray-300", label: "Cleaning Start Date", field: `${type}_pc_start_date`, phase: "pc" },
        { title: "Cleaning", color: "bg-gray-300", label: "Cleaning End Date", field: `${type}_pc_end_date`, phase: "pc", isEnd: true },
        { title: "Handover", color: "bg-teal-300", label: "Handover Date", field: `${type}_handover_date`, phase: null },
    ];

    // Group date fields by phase for better organization
    const groupedFields: Record<string, DateField[]> = {};
    dateFields.forEach(field => {
        const phaseKey = field.phase || 'handover';
        if (!groupedFields[phaseKey]) {
            groupedFields[phaseKey] = [];
        }
        groupedFields[phaseKey].push(field);
    });

    const convertDateFormat = (dateString: string) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');

        // Array of month names
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();

        return `${day} ${month} ${year}`;
    };

    return (
        <div className="card h-full overflow-y-auto scrollable-y">
            <div className="card-header">
                <div className="card-title">
                    {title}
                </div>
            </div>

            <div className="card-body px-4 pt-2">
                <div className="mb-4">
                    <span className='text-success text-sm font-semibold'>Click on "Project" Start Date to choose a date</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(groupedFields).map(([phase, fields]) => (
                        <div className="card" key={phase}>
                            <div className="card-body py-2 px-4">
                                {/* Use the title from the first field in the group as the section header */}
                                <div className="flex gap-2 mb-2">
                                    <div className={`w-3 h-auto ${fields[0].color} rounded my-1`}></div>
                                    <h3 className="text-lg font-semibold">{fields[0].title}</h3>
                                </div>
                                <hr className='mb-2' />
                                {/* Render each field in this phase */}
                                <div className="space-y-2">
                                    {fields.map((field, index) => (
                                        <div key={field.field} className="flex flex-col">
                                            <label
                                                className={`card w-full ${phase === 'overall' && index === 0 && 'cursor-pointer'} shadow-none`}
                                                htmlFor={`date-${field.field}`}
                                                onClick={() => {
                                                    const input = document.getElementById(`date-${field.field}`);
                                                    if (input) input.showPicker(); // Opens the date picker
                                                }}
                                            >
                                                <div className="card-body px-4">
                                                    <div className="flex gap-2">
                                                        <i className="ki-outline ki-calendar-2 mt-2 font-bold"></i>
                                                        <div className="flex flex-col">
                                                            <span className="text-gray-800 text-xs">{field.label}</span>
                                                            <span className="text-gray-900 font-bold">{renoProgress[field.field] ? convertDateFormat(renoProgress[field.field]) : '-'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </label>
                                            {phase === 'overall' && index === 0 &&
                                                <input
                                                    type="date"
                                                    id={`date-${field.field}`}
                                                    value={renoProgress[field.field] || ''}
                                                    onChange={(e) => handleChangeDate(
                                                        e,
                                                        Number(renoProgress.id),
                                                        type.split('_')[0],
                                                        field.phase || undefined,
                                                        field.isEnd ? 'end' : undefined
                                                    )}
                                                    className="absolute opacity-0 w-0 h-16"
                                                />
                                            }

                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ScheduleSection;


// {fields.map((field) => (
//     <tr key={field.field}>
//         <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
//             {field.label}:
//         </td>
//         <td className="text-sm text-gray-900 pb-3">
//             <input
//                 type="date"
//                 className="input input-sm"
//                 value={renoProgress[field.field] || ''}
//                 onChange={(e) => handleChangeDate(
//                     e,
//                     Number(renoProgress.id),
//                     type.split('_')[0],
//                     field.phase || undefined,
//                     field.isEnd ? 'end' : undefined
//                 )}
//             // onClick={(e) => e.stopPropagation()} // Prevent tr onClick if needed
//             />
//         </td>
//     </tr>
// ))}