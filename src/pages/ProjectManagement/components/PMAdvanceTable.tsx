import React, { useEffect, useMemo, useState } from 'react'
import { RenoProgress } from '../../../types';
import ProgressBar from './ProgressBar';
import { renoProgressAdvanceTable } from '../../../services/api';
import { useNavigate } from 'react-router-dom';
import { KTSticky } from '../../../metronic/core';

interface TableColumn {
    field: keyof RenoProgress;
    header: string;
    sortable?: boolean;
    groupable?: boolean;
}

type GroupBy = string | null;

const PMAdvanceTable = () => {
    const navigate = useNavigate();
    const [renoProgress, setRenoProgress] = useState<RenoProgress[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(1);
    const [size, setSize] = useState<number>(10);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortField, setSortField] = useState<string>('');
    const [groupBy, setGroupBy] = useState<GroupBy>('property.id');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    // const [groupBy, setGroupBy] = useState<GroupBy>('property.id');
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    const columns: TableColumn[] = [
        { field: 'property.unit_no', header: 'Unit', sortable: true },
        { field: 'progress.pre_reno_1', header: 'VP', sortable: true },
        { field: 'progress.pre_reno_2', header: 'Defect', sortable: true },
        { field: 'progress.pre_reno_3', header: 'Reno Permit', sortable: true },
        { field: 'progress.p1_1', header: 'Electric Wiring', sortable: true },
        { field: 'progress.p1_2', header: 'Painting', sortable: true },
        { field: 'progress.p1_3', header: 'Partition', sortable: true },
    ];

    const groupableColumns = columns.filter(col => col.groupable);

    useEffect(() => {
        initRenoProgressTable(1, 10, '', null, '');
    }, []);

    useEffect(() => {
        if (renoProgress.length > 0) {
            KTSticky.init();
        }
    }, [renoProgress]);

    const initRenoProgressTable = async (
        page: number,
        size: number,
        searchTerm?: string,
        order?: string,
        field?: string
    ) => {
        setIsLoading(true);
        try {
            const response = await renoProgressAdvanceTable('property');
            const data = response?.data || [];
            setRenoProgress(data);
            setTotalItems(response?.totalCount || 0);
        } catch (error) {
            console.error('Error fetching renoProgress:', error);
            setError('Failed to load renoProgress');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const renderSortIcon = (field: string) => {
        if (sortField !== field) return null;
        return sortDirection === 'asc' ? '<ChevronUp size={16} />' : '<ChevronDown size={16} />';
    };

    const toggleGroup = (groupValue: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(groupValue)) {
                next.delete(groupValue);
            } else {
                next.add(groupValue);
            }
            return next;
        });
    };

    const toProgressDetail = (id: number) => {
        navigate(`/reno-progress/${id}`);
    }

    const groupedData = useMemo(() => {
        if (!groupBy) return null;

        const groups = new Map<string, RenoProgress[]>();
        renoProgress.forEach(item => {
            const groupValue = item.property?.id || 'Unassigned';
            const propertyName = item.property?.name || 'Unassigned Property';
            if (!groups.has(groupValue)) {
                groups.set(groupValue, []);
            }
            groups.get(groupValue)!.push(item);
        });

        return Array.from(groups.entries()).map(([key, items]) => ({
            key,
            name: items[0].property?.name || 'Unassigned Property',
            items,
            count: items.length
        }));
    }, [renoProgress, groupBy]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center w-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-red-600">{error}</div>
            </div>
        );
    }

    // Add this header row right after opening the group content div
    const renderGroupContent = (group) => (
        <div className="p-4 space-y-2">
            {/* Column Headers */}
            <div className="grid grid-cols-6 gap-4 px-4 py-2 bg-gray-50 rounded-lg mb-2">
                {columns.map((column, index) => (
                    <div key={index} className="text-xs font-medium text-gray-200 uppercase tracking-wider">
                        {column.header}
                    </div>
                ))}
            </div>

            {/* Group Items */}
            {group.items.map(renderTableRow)}
        </div>
    );

    const getBadgeColorClass = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'not_started':
                return 'bg-gray-200 text-gray-700';
            case 'started':
                return 'bg-blue-100 text-blue-700';
            case 'in_progress':
                return 'bg-yellow-100 text-yellow-700';
            case 'completed':
                return 'bg-green-100 text-green-700';
            case 'not available':
            case 'not_available':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-500';
        }
    };

    const renderTableRow = (item: RenoProgress) => (
        <div
            key={item.id}
            className="bg-white dark:bg-coal-100 rounded-lg p-4 shadow-sm hover:shadow-md dark:hover:bg-slate-900 transition-shadow duration-200 mb-4 cursor-pointer"
            onClick={() => toProgressDetail(Number(item.id))}
        >
            <div className="grid grid-cols-7 gap-4">
                <div>
                    <div className="text-sm font-medium text-gray-900">
                        {item.property?.block}-{item.property?.floor}-{item.property?.unit_no}
                    </div>
                </div>
                {/* VP Progress */}
                <div>
                    <div className="space-y-1">
                        <ProgressBar progress={+(item.progress?.pre_reno_1 || 0) * 100} />
                        <div className="text-xs text-gray-500 text-right">
                            {((item.progress?.pre_reno_1 || 0) * 100).toFixed(2)}%
                        </div>
                    </div>
                </div>
                {/* Defect Progress */}
                <div>
                    <div className="space-y-1">
                        <ProgressBar progress={+(item.progress?.pre_reno_2 || 0) * 100} />
                        <div className="text-xs text-gray-500 text-right">
                            {((item.progress?.pre_reno_2 || 0) * 100).toFixed(2)}%
                        </div>
                    </div>
                </div>
                {/* Reno Permit Progress */}
                <div>
                    <div className="space-y-1">
                        <ProgressBar progress={+(item.progress?.pre_reno_3 || 0) * 100} />
                        <div className="text-xs text-gray-500 text-right">
                            {((item.progress?.pre_reno_3 || 0) * 100).toFixed(2)}%
                        </div>
                    </div>
                </div>
                {/* Electric Wiring Progress */}
                <div>
                    <div className="space-y-1">
                        <ProgressBar progress={+(item.progress?.p1_1 || 0) * 100} />
                        <div className="text-xs text-gray-500 text-right">
                            {((item.progress?.p1_1 || 0) * 100).toFixed(2)}%
                        </div>
                    </div>
                </div>
                {/* Painting Progress */}
                <div>
                    <div className="space-y-1">
                        <ProgressBar progress={+(item.progress?.p1_2 || 0) * 100} />
                        <div className="text-xs text-gray-500 text-right">
                            {((item.progress?.p1_2 || 0) * 100).toFixed(2)}%
                        </div>
                    </div>
                </div>
                {/* Partition Progress */}
                <div>
                    <div className="space-y-1">
                        <ProgressBar progress={+(item.progress?.p1_3 || 0) * 100} />
                        <div className="text-xs text-gray-500 text-right">
                            {((item.progress?.p1_3 || 0) * 100).toFixed(2)}%
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-coal-500 p-6 w-full rounded-md">
            <div className="relative">
                {/* Header */}
                <div className="bg-white dark:bg-coal-100 rounded-xl shadow-sm p-6 mb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <select
                                    value={groupBy || ''}
                                    onChange={(e) => setGroupBy(e.target.value)}
                                    className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 
                                    focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-gray-700 shadow-sm"
                                >
                                    <option value="">No Grouping</option>
                                    {groupableColumns.map(col => (
                                        <option key={col.field} value={col.field}>{col.header}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search projects..."
                                className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 
                                focus:ring-blue-500 focus:border-transparent shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Main content container with relative positioning */}
                <div className="relative">
                    {/* Sticky Header */}
                    <div className="sticky top-0 z-5 mb-4 bg-white dark:bg-coal-100 rounded-xl shadow-sm">
                        <div className="grid grid-cols-7 gap-4 px-6 py-4">
                            {columns.map(column => (
                                <div
                                    key={column.field}
                                    className="text-sm font-medium text-gray-700"
                                >
                                    {column.header}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                        {groupedData ? (
                            groupedData.map((group, index) => (
                                <div key={group.key} className="relative mb-4">
                                    {/* Sticky group header */}
                                    <div className="sticky top-16 z-6">
                                        <button
                                            className="w-full px-6 py-4 flex items-center justify-between bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900 dark:hover:bg-indigo-700 transition-colors duration-200 rounded-xl shadow-sm"
                                            onClick={() => toggleGroup(group.key)}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <i className={`ki-filled ki-right transform transition-transform duration-200 ${expandedGroups.has(group.key) ? 'rotate-90' : ''}`}></i>
                                                <span className="font-semibold text-gray-700 dark:text-gray-50">{group.name}</span>
                                                <span className="bg-white dark:bg-gray-200 text-gray-600 px-2.5 py-1 rounded-full text-sm">
                                                    {group.count} units
                                                </span>
                                            </div>
                                        </button>
                                    </div>

                                    {/* Group content */}
                                    <div className={`transition-all duration-200 ease-in-out bg-white dark:bg-coal-100 rounded-xl shadow-sm mt-1
                                        ${expandedGroups.has(group.key) ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className="p-4 space-y-2">
                                            {group.items.map(renderTableRow)}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="space-y-2">
                                {renoProgress.map(renderTableRow)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Pagination */}
                <div className="mt-4 bg-white dark:bg-coal-100 rounded-xl shadow-sm p-4">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Showing {totalItems} results
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

}

export default PMAdvanceTable