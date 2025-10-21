import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Calendar, TrendingUp, BarChart3, Filter, GripVertical, Eye, X } from 'lucide-react';
import { ProjectStatusHistory, RenoProgress } from '../../types';
import { fetchProjectStatusHistoryByType } from '../../services/projectStatusHistoryApi';
import { renoProgressIndex, updateRenoProgressStatus } from '../../services/api';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

interface Project {
    reno_progress_id: string;
    unit: string;
    property: string;
    paymentPercentage: number;
    stage?: string;
    property_id?: string;
    status?: string;
    snapshot_date?: string;
    snapshot_type?: 'weekly' | 'monthly' | 'yearly';
}

interface Week {
    snapshot_year: number;
    snapshot_week: number;
    label: string;
    date: string;
    data: Project[][];
    snapshot_type?: 'weekly' | 'monthly' | 'yearly';
}

interface DraggedItem {
    project: Project;
    fromColumn: number;
}

interface HistoricalData {
    weekly: ProjectStatusHistory[];
}

const PMKanban = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
    const [filterType, setFilterType] = useState('month');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [showDetailView, setShowDetailView] = useState(false);
    const [selectedWeekForDetail, setSelectedWeekForDetail] = useState<Week | null>(null);
    const [historicalData, setHistoricalData] = useState<HistoricalData>({
        weekly: []
    });
    const [isLoadingHistorical, setIsLoadingHistorical] = useState(false);
    const [isLoadingCurrentWeek, setIsLoadingCurrentWeek] = useState(false);
    const isDragOperationRef = useRef(false);
    const [currentWeekData, setCurrentWeekData] = useState<Project[][]>([]);

    const stages = useMemo(() => [
        { label: 'Pre-purchase', value: 'pre-purchase', color: 'bg-amber-50 border-amber-200', textColor: 'text-amber-900' },
        { label: 'Pending-VP', value: 'pending-vp', color: 'bg-orange-50 border-orange-200', textColor: 'text-orange-900' },
        { label: 'Under Defect', value: 'under-defect', color: 'bg-red-50 border-red-200', textColor: 'text-red-900' },
        { label: 'P1', value: 'p1', color: 'bg-blue-50 border-blue-200', textColor: 'text-blue-900' },
        { label: 'P2a', value: 'p2a', color: 'bg-indigo-50 border-indigo-200', textColor: 'text-indigo-900' },
        { label: 'P2b', value: 'p2b', color: 'bg-purple-50 border-purple-200', textColor: 'text-purple-900' },
        { label: 'Scheduled Handover', value: 'scheduled-handover', color: 'bg-yellow-50 border-yellow-200', textColor: 'text-pink-900' },
        { label: 'Successful Handover', value: 'successful-handover', color: 'bg-emerald-50 border-emerald-200', textColor: 'text-emerald-900' },
        { label: 'Onboarding', value: 'onboarding', color: 'bg-teal-50 border-teal-200', textColor: 'text-teal-900' },
        { label: 'Onboarded', value: 'onboarded', color: 'bg-cyan-50 border-cyan-200', textColor: 'text-cyan-900' }
    ], []);


    const [weeks, setWeeks] = useState<Week[]>([]);

    // Property name to short code mapping
    const getPropertyShortCode = (propertyName: string): string => {
        const propertyMap: { [key: string]: string } = {
            '121 Residence': '121R',
            '7 Tree Seven Residence': '737',
            'Acacia Residences': 'ACA',
            'AraTre Residence': 'ARA',
            'Armani Soho USJ': 'ARM',
            'Arte Cheras': 'Art',
            'Astoria Ampang': 'AA',
            'Austin Regency': 'AUS',
            'Bayu Angkasa': 'BAY',
            'Bora Residence': 'BOR',
            'Duta Park Residences': 'DP',
            'Emporis Kota Damansara': 'EMP',
            'Epic Residences JB': 'EPIC',
            'Fairview Residence': 'FV',
            'HighPark Suites': 'HPS',
            'Icon City': 'ICON',
            'Inwood Residence': 'INW',
            'M Adora Residence': 'MA',
            'Majestic Maxim': 'MXM',
            'Marina Residence': 'MAR',
            'Medini Signature': 'MED',
            'Meta City': 'MC',
            'MH Platinum 2': 'MH2',
            'M Vertica': 'MV',
            'Neu Suites': 'NEU',
            'One Cochrane': '1C',
            'Perla @ Ara Sentral': 'PER',
            'Pinnacle': 'PIN',
            'Pixel City Sentral': 'PIX',
            'Platinum Splendor': 'SPL',
            'Razak City Residence': 'RC',
            'RICA Residence': 'RICA',
            'Sapphire Paradigm': 'SAP',
            'Secoya Residence': 'SEC',
            'Sfera Residency': 'SFR',
            'Sinaran Residence': 'SNR',
            'Sunway Avila Residence': 'SAV',
            'Sunway Serene': 'SER',
            'The Andes': 'AND',
            'The Azure Residence': 'AZR',
            'The Birch': 'TBR',
            'The Netizen': 'NET',
            'The Ooak': 'OOAK',
            'The Parc 3': 'PC3',
            'The Riv @ Riveria City': 'RIV',
            'Trion @ KL': 'Trion',
            'Unio Residence': 'UNIO',
            'Utropolis Utama Batu Kawan': 'UU',
            'Vertu Resort Condominium': 'VRC',
            'Vivo Executive Apartment': 'VIVO',
            'Youth City Nilai': 'YC',

            // Not caterogized in Spacify system
            'Rubica Harbour Place': 'RBC',
            'The Harmony @ Old Klang Road': 'HAR',
        };
        
        return propertyMap[propertyName] || propertyName;
    };

    const getPaymentBadge = (percentage: number) => {
        if (percentage === 100) {
            return 'bg-emerald-100 text-emerald-800 border-emerald-300';
        } else if (percentage > 0) {
            return 'bg-amber-100 text-amber-800 border-amber-300';
        } else {
            return 'bg-red-100 text-red-800 border-red-300';
        }
    };

    // Helper function to get week number from date
    const getWeekNumber = (date: Date): number => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    };

    // Convert RenoProgress data to kanban format
    const convertRenoProgressToKanban = useCallback((renoProgressData: RenoProgress[]): Project[][] => {
        const kanbanData: Project[][] = Array(stages.length).fill(null).map((): Project[] => []);

        renoProgressData.forEach(progress => {
            // Determine the stage based on the progress status
            const stageIndex = getStageIndexFromStatus(progress.status || '');

            if (stageIndex !== -1) {
                const project: Project = {
                    reno_progress_id: progress.id || '',
                    unit: progress.property ?
                        `${progress.property.block || ''}-${progress.property.floor || ''}-${progress.property.unit_no || ''}` :
                        '',
                    property: progress.property?.name,
                    paymentPercentage: (progress.paid_percentage * 100) || 0,
                    stage: progress.status,
                    property_id: progress.property?.id,
                    status: progress.status,
                    snapshot_date: new Date().toISOString().split('T')[0],
                    snapshot_type: 'weekly'
                };

                kanbanData[stageIndex].push(project);
            }
        });

        return kanbanData;
    }, [stages.length]);

    // Get stage index based on status
    const getStageIndexFromStatus = (status: string): number => {
        const statusMap: { [key: string]: number } = {
            'pre-purchase': 0,
            'pending-vp': 1,
            'under-defect': 2,
            'p1': 3,
            'p2a': 4,
            'p2b': 5,
            'scheduled-handover': 6,
            'successful-handover': 7,
            'onboarding': 8,
            'onboarded': 9
        };

        return statusMap[status] ?? -1;
    };

    // Fetch current week data from RenoProgress
    const fetchCurrentWeekData = useCallback(async () => {
        setIsLoadingCurrentWeek(true);
        try {
            const response = await renoProgressIndex(100, 1, '', 'asc', 'id');
            const renoProgressData = response?.data || [];

            // Convert to kanban format
            const kanbanData = convertRenoProgressToKanban(renoProgressData);
            setCurrentWeekData(kanbanData);
        } catch (error) {
            console.error('Error fetching current week data:', error);
            // Fallback to empty data
            setCurrentWeekData(Array(stages.length).fill(null).map((): Project[] => []));
        } finally {
            setIsLoadingCurrentWeek(false);
        }
    }, [convertRenoProgressToKanban, stages.length]);

    // Handle URL parameters for detail view
    useEffect(() => {
        // Don't trigger detail view if we're in the middle of a drag operation
        if (isDragOperationRef.current) {
            return;
        }

        const weekId = searchParams.get('weekId');
        const label = searchParams.get('label');
        const date = searchParams.get('date');
        const isCurrentWeek = searchParams.get('isCurrentWeek');

        if (weekId && label && date) {
            if (isCurrentWeek === 'true') {
                // Show current week detail
                const currentDate = new Date();
                const currentWeek: Week = {
                    snapshot_year: currentDate.getFullYear(),
                    snapshot_week: getWeekNumber(currentDate),
                    label: decodeURIComponent(label),
                    date: decodeURIComponent(date),
                    data: currentWeekData
                };
                setSelectedWeekForDetail(currentWeek);
                setShowDetailView(true);
            } else {
                // Show historical week detail - parse weekId as year-week format
                const [year, week] = weekId.split('-').map(Number);
                const weekData = weeks.find(w => w.snapshot_year === year && w.snapshot_week === week);
                if (weekData) {
                    setSelectedWeekForDetail(weekData);
                    setShowDetailView(true);
                }
            }
        } else {
            // Clear detail view when no URL parameters
            setShowDetailView(false);
            setSelectedWeekForDetail(null);
        }
    }, [searchParams, weeks, currentWeekData]);

    const handleDragStart = (e: React.DragEvent, project: Project, columnIndex: number) => {
        isDragOperationRef.current = true;
        setDraggedItem({ project, fromColumn: columnIndex });
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, toColumnIndex: number) => {
        e.preventDefault();
        if (!draggedItem) return;

        const { project, fromColumn } = draggedItem;

        if (fromColumn === toColumnIndex) {
            setDraggedItem(null);
            isDragOperationRef.current = false;
            return;
        }

        // Get the new status from the target stage
        const newStatus = stages[toColumnIndex].value;
        
        // Update the local state immediately
        const newData = currentWeekData.map(col => [...col]);

        // Remove from original column
        newData[fromColumn] = newData[fromColumn].filter(p => p.reno_progress_id !== project.reno_progress_id);

        // Add to new column with updated status
        const updatedProject = {
            ...project,
            stage: newStatus,
            status: newStatus
        };
        newData[toColumnIndex] = [...newData[toColumnIndex], updatedProject];

        setCurrentWeekData(newData);

        // Update selected week detail data if we're in detail view and it's the current week
        const currentDate = new Date();
        const currentWeekNumber = getWeekNumber(currentDate);
        if (showDetailView && selectedWeekForDetail && selectedWeekForDetail.snapshot_week === currentWeekNumber) {
            setSelectedWeekForDetail({
                ...selectedWeekForDetail,
                data: newData
            });
        }

        // Update the status in the backend (fire and forget)
        updateRenoProgressStatus(parseInt(project.reno_progress_id), newStatus)
            .then(() => {
                console.log(`Successfully updated project ${project.reno_progress_id} status to ${newStatus}`);
            })
            .catch((error) => {
                console.error('Error updating project status:', error);
                // Optionally show a toast notification or error message to the user
                alert('Failed to update project status. Please try again.');
            });

        setDraggedItem(null);

        // Reset the drag operation flag after a short delay to allow useEffect to run normally
        setTimeout(() => {
            isDragOperationRef.current = false;
        }, 100);
    };

    const getTotalCount = (columnIndex: number) => {
        return currentWeekData[columnIndex].length;
    };

    // Helper function to get week start and end dates
    const getWeekDateRange = (date: string): string => {
        if (!date) return '';
        
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        const monday = new Date(d.setDate(diff));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        
        const formatDate = (date: Date) => {
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });
        };
        
        return `${formatDate(monday)} - ${formatDate(sunday)}`;
    };

    // Convert historical data to kanban format
    const convertHistoricalDataToKanban = useCallback((historicalData: ProjectStatusHistory[]): Week[] => {
        const weekMap = new Map<string, Week>();

        historicalData.forEach(record => {
            const weekKey = `${record.snapshot_year}-${record.snapshot_week}`;
            const weekLabel = `Week ${record.snapshot_week}`;
            const weekDateRange = record.snapshot_date ? getWeekDateRange(record.snapshot_date) : '';

            if (!weekMap.has(weekKey)) {
                weekMap.set(weekKey, {
                    snapshot_year: record.snapshot_year || 0,
                    snapshot_week: record.snapshot_week || 0,
                    label: weekLabel,
                    date: weekDateRange,
                    data: Array(stages.length).fill(null).map((): Project[] => []),
                    snapshot_type: record.snapshot_type
                });
            }

            const week = weekMap.get(weekKey)!;
            const stageIndex = stages.findIndex(stage => stage.value === record.status);

            if (stageIndex !== -1) {
                const project: Project = {
                    reno_progress_id: record.reno_progress_id || '',
                    unit: record.unit || record.reno_progress_id || '',
                    property: record.property?.name || '',
                    paymentPercentage: (record.payment_percentage * 100) || 0,
                    stage: record.status,
                    property_id: record.property_id,
                    status: record.status,
                    snapshot_date: record.snapshot_date,
                    snapshot_type: record.snapshot_type
                };

                week.data[stageIndex].push(project);
            }
        });

        return Array.from(weekMap.values()).sort((a, b) => {
            if (a.snapshot_year !== b.snapshot_year) {
                return a.snapshot_year - b.snapshot_year;
            }
            return a.snapshot_week - b.snapshot_week;
        });
    }, [stages]);

    const getFilteredWeeks = () => {
        // Use historical data if available
        let dataToUse = weeks;

        if (historicalData.weekly.length > 0) {
            dataToUse = convertHistoricalDataToKanban(historicalData.weekly);
        }

        switch (filterType) {
            case 'current-week':
                // Show only the current week - this will be handled by showing the currentWeekData
                return [];
            case '2-weeks':
                // Show last 2 weeks
                return dataToUse.slice(-2);
            case '3-weeks':
                // Show last 3 weeks
                return dataToUse.slice(-3);
            case 'month': {
                // Show current month's weeks
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();
                console.log('Month filter - Current month:', currentMonth, 'Current year:', currentYear);
                console.log('Month filter - Available weeks:', dataToUse.map(w => ({ 
                    label: w.label, 
                    date: w.date, 
                    year: w.snapshot_year 
                })));
                
                const filteredWeeks = dataToUse.filter(week => {
                    if (week.date) {
                        // Parse the date from the week.date string format (e.g., "Oct 14 - Oct 20")
                        const dateMatch = week.date.match(/(\w+)\s+\d+/);
                        if (dateMatch) {
                            const monthName = dateMatch[1];
                            const monthMap: { [key: string]: number } = {
                                'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                                'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
                            };
                            const weekMonth = monthMap[monthName];
                            const matches = weekMonth === currentMonth && week.snapshot_year === currentYear;
                            console.log(`Week ${week.label}: month=${monthName}(${weekMonth}), year=${week.snapshot_year}, matches=${matches}`);
                            return matches;
                        }
                    }
                    return false;
                });
                
                console.log('Month filter - Filtered weeks:', filteredWeeks.length);
                return filteredWeeks;
            }
            case 'yearly': {
                // Show all weeks for the current year
                const currentYearForFilter = new Date().getFullYear();
                return dataToUse.filter(week => week.snapshot_year === currentYearForFilter);
            }
            default:
                return dataToUse;
        }
    };


    const handleViewDetail = (week: Week) => {
        // Navigate to property detail page using same route
        const weekId = `${week.snapshot_year}-${week.snapshot_week}`;
        const url = `${LOCAL_PATH_PREFIX}reno-progress/kanban?weekId=${weekId}&label=${encodeURIComponent(week.label)}&date=${encodeURIComponent(week.date)}`;
        navigate(url);
    };

    const handleViewCurrentWeekDetail = () => {
        // Navigate to current week property detail page using same route
        const currentDate = new Date();
        const currentWeekNumber = getWeekNumber(currentDate);
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Monday
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // Sunday
        
        const formatDate = (date: Date) => {
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });
        };
        
        const dateRange = `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
        const url = `${LOCAL_PATH_PREFIX}reno-progress/kanban?weekId=current&label=${encodeURIComponent(`Week ${currentWeekNumber}`)}&date=${encodeURIComponent(dateRange)}&isCurrentWeek=true`;
        navigate(url);
    };

    // Fetch historical data (weekly only)
    const fetchHistoricalData = async () => {
        setIsLoadingHistorical(true);
        try {
            const data = await fetchProjectStatusHistoryByType('weekly');
            return data;
        } catch (error) {
            console.error('Error fetching historical data:', error);
            return [];
        } finally {
            setIsLoadingHistorical(false);
        }
    };

    // Load current week data when component mounts
    useEffect(() => {
        fetchCurrentWeekData();
    }, [fetchCurrentWeekData]);

    // Load historical data when component mounts or filter changes
    useEffect(() => {
        const loadHistoricalData = async () => {
            const weeklyData = await fetchHistoricalData();

            setHistoricalData({
                weekly: weeklyData
            });

            // Convert and set the weeks data
            if (weeklyData.length > 0) {
                const convertedWeeks = convertHistoricalDataToKanban(weeklyData);
                setWeeks(convertedWeeks);
            }
        };

        loadHistoricalData();
    }, [filterType, convertHistoricalDataToKanban]);


    const filteredWeeks = getFilteredWeeks();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Live Badge Animation Styles */}
            <style>
                {`
                    @keyframes live-pulse {
                        0%, 100% {
                            opacity: 1;
                            transform: scale(1);
                        }
                        50% {
                            opacity: 0.7;
                            transform: scale(1.1);
                        }
                    }
                    @keyframes live-dot {
                        0%, 100% {
                            opacity: 1;
                        }
                        50% {
                            opacity: 0.3;
                        }
                    }
                `}
            </style>
            {/* Property-Stage Detail View */}
            {showDetailView && selectedWeekForDetail && (
                <>
                    {/* Header */}
                    <div className="bg-white border-b border-slate-200 shadow-sm">
                        <div className="px-8 py-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-xl shadow-lg">
                                        <BarChart3 className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-slate-900">Project Management</h1>
                                        <p className="text-slate-600 mt-1 flex items-center gap-2">
                                            Property View - {selectedWeekForDetail.label}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => {
                                            setShowDetailView(false);
                                            setSelectedWeekForDetail(null);
                                            // Clear URL parameters using navigate
                                            navigate(`${LOCAL_PATH_PREFIX}reno-progress/kanban`);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                        Close Detail View
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mx-8 mt-8 mb-8">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center gap-2">
                                        Property View - {selectedWeekForDetail.label}
                                        {(() => {
                                            const currentDate = new Date();
                                            const currentWeekNumber = getWeekNumber(currentDate);
                                            return selectedWeekForDetail.snapshot_week === currentWeekNumber && selectedWeekForDetail.snapshot_year === currentDate.getFullYear();
                                        })() && (
                                            <span
                                                className="bg-red-500 opacity-90 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1 font-bold"
                                                style={{
                                                    animation: 'live-pulse 1.5s ease-in-out infinite'
                                                }}
                                            >
                                                <div
                                                    className="w-1.5 h-1.5 bg-white rounded-full"
                                                    style={{
                                                        animation: 'live-dot 1s ease-in-out infinite'
                                                    }}
                                                ></div>
                                                LIVE
                                            </span>
                                        )}
                                    </h2>
                                    <p className="text-blue-200 mt-1">{selectedWeekForDetail.date}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            {/* Property-Stage Grid */}
                            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                                {/* Table Header */}
                                <div className="grid gap-px bg-slate-200" style={{ gridTemplateColumns: `200px repeat(${stages.length}, 1fr)` }}>
                                    <div className="bg-slate-700 p-4 flex items-center sticky left-0 z-10">
                                        <h3 className="text-sm font-bold text-white">Property</h3>
                                    </div>
                                    {stages.map((stage, idx) => (
                                        <div key={idx} className={`${stage.color} border-b ${stage.color.replace('bg-', 'border-').replace('-50', '-300')} p-3 min-w-[120px]`}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${stage.color.replace('bg-', 'bg-').replace('-50', '-500')}`}></div>
                                                <h3 className={`text-xs font-bold ${stage.textColor}`}>{stage.label}</h3>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Property Rows */}
                                {(() => {
                                    // Get all unique properties from the week data
                                    const allProperties = Array.from(new Set(selectedWeekForDetail.data.flat().map(project => getPropertyShortCode(project.property || ''))));

                                    return allProperties.map((property) => (
                                        <div key={property} className="border-b border-slate-200">
                                            <div className="grid gap-px bg-slate-200" style={{ gridTemplateColumns: `200px repeat(${stages.length}, 1fr)` }}>
                                                {/* Property Header */}
                                                <div className="bg-slate-100 p-3 flex items-center sticky left-0 z-10 border-r border-slate-300">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                                        <span className="font-semibold text-slate-900 text-sm">{property}</span>
                                                    </div>
                                                </div>

                                                {/* Stage Columns for this property */}
                                                {selectedWeekForDetail.data.map((column, colIdx) => {
                                                    // Filter projects for this property in this stage
                                                    const propertyProjects = column.filter(project => getPropertyShortCode(project.property || '') === property);

                                                    return (
                                                        <div key={colIdx} className="bg-white p-2 min-w-[120px] min-h-[100px]">
                                                            <div className="space-y-2">
                                                                {propertyProjects.length === 0 ? (
                                                                    <div className="text-center py-4">
                                                                        <div className="text-slate-300 text-xs">No projects</div>
                                                                    </div>
                                                                ) : propertyProjects.map((project, projIdx) => (
                                                                    <div
                                                                        key={projIdx}
                                                                        className="bg-white border border-slate-200 rounded-lg p-2 hover:shadow-sm transition-shadow"
                                                                    >
                                                                        <div className="flex flex-col">
                                                                            <div className="font-bold text-xs text-slate-700 mb-1">
                                                                                {project.unit}
                                                                            </div>
                                                                            <span className={`inline-block text-xs px-2 py-0.5 rounded-full border font-medium ${getPaymentBadge(project.paymentPercentage)}`}>
                                                                                {project.paymentPercentage.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}%
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>

                            {/* Stats for Selected Week */}
                            <div className="mt-6">
                                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl">
                                    <div className="grid grid-cols-4 gap-6">
                                        <div>
                                            <div className="text-blue-200 text-sm mb-1">Total Projects</div>
                                            <div className="text-3xl font-bold">{selectedWeekForDetail.data.flat().length}</div>
                                        </div>
                                        <div>
                                            <div className="text-blue-200 text-sm mb-1">Fully Paid</div>
                                            <div className="text-3xl font-bold">{selectedWeekForDetail.data.flat().filter(p => p.paymentPercentage === 100).length}</div>
                                        </div>
                                        <div>
                                            <div className="text-blue-200 text-sm mb-1">Partially Paid</div>
                                            <div className="text-3xl font-bold">{selectedWeekForDetail.data.flat().filter(p => p.paymentPercentage > 0 && p.paymentPercentage < 100).length}</div>
                                        </div>
                                        <div>
                                            <div className="text-blue-200 text-sm mb-1">Unpaid</div>
                                            <div className="text-3xl font-bold">{selectedWeekForDetail.data.flat().filter(p => p.paymentPercentage === 0).length}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Regular Kanban Board */}
            {!showDetailView && (
                <>
                    {/* Header */}
                    <div className="bg-white border-b border-slate-200 shadow-sm">
                        <div className="px-8 py-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-xl shadow-lg">
                                        <BarChart3 className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-slate-900">Project Tracker Kanban</h1>
                                        <p className="text-sm text-slate-600 mt-0.5">Real-time project progress visualization</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                                        >
                                            <Filter className="w-4 h-4" />
                                            <span className="text-sm font-medium">Filters</span>
                                        </button>

                                        {showFilterDropdown && (
                                            <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                                                <div className="p-2">
                                                    <div className="text-xs font-semibold text-slate-600 mb-2 px-2">Filter by Time Period</div>
                                                    {[
                                                        { value: 'current-week', label: 'Current Week' },
                                                        { value: '2-weeks', label: '2 Weeks' },
                                                        { value: '3-weeks', label: '3 Weeks' },
                                                        { value: 'month', label: 'This Month' },
                                                        { value: 'yearly', label: 'This Year' }
                                                    ].map((option) => (
                                                        <button
                                                            key={option.value}
                                                            onClick={() => {
                                                                setFilterType(option.value);
                                                                setShowFilterDropdown(false);
                                                            }}
                                                            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${filterType === option.value
                                                                ? 'bg-blue-100 text-blue-900'
                                                                : 'hover:bg-slate-100 text-slate-700'
                                                                }`}
                                                        >
                                                            {option.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 bg-slate-100 rounded-lg px-4 py-2">
                                        <Calendar className="w-4 h-4 text-slate-600" />
                                        <div className="text-right">
                                            <div className="text-xs text-slate-600 font-medium">Filtered Results</div>
                                            <div className="text-sm font-semibold text-slate-900">
                                                {filterType === 'current-week' ? 'Current Week' :
                                                    filterType === '2-weeks' ? 'Last 2 Weeks' :
                                                        filterType === '3-weeks' ? 'Last 3 Weeks' :
                                                            filterType === 'month' ? 'This Month' :
                                                                filterType === 'yearly' ? 'This Year' : 'This Month'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Kanban Board */}
                    <div className="p-8 overflow-x-auto">
                        {isLoadingHistorical && (
                            <div className="flex items-center justify-center py-8">
                                <div className="text-slate-600">Loading historical data...</div>
                            </div>
                        )}
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden min-w-max">
                            {/* Stage Headers */}
                            <div className="grid gap-px bg-slate-200" style={{ gridTemplateColumns: `160px repeat(${stages.length}, 1fr)` }}>
                                <div className="bg-slate-700 p-4 flex items-center sticky left-0 z-10">
                                    <h3 className="text-sm font-bold text-white">Week</h3>
                                </div>
                                {stages.map((stage, idx) => (
                                    <div key={idx} className={`${stage.color} border-b ${stage.color.replace('bg-', 'border-').replace('-50', '-300')} p-3 min-w-[120px]`}>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${stage.color.replace('bg-', 'bg-').replace('-50', '-500')}`}></div>
                                            <h3 className={`text-xs font-bold ${stage.textColor}`}>{stage.label}</h3>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Historical Week Rows */}
                            {filteredWeeks.map((week) => (
                                <div key={`${week.snapshot_year}-${week.snapshot_week}`} className="border-b-4 border-slate-300">
                                    <div className="grid gap-px bg-slate-200" style={{ gridTemplateColumns: `160px repeat(${stages.length}, 1fr)` }}>
                                        <div className="bg-slate-700 p-3 flex flex-col justify-center sticky left-0 z-10">
                                            <div className="font-bold text-white text-sm">{week.label}</div>
                                            <div className="text-xs text-slate-300 mt-0.5">{week.date}</div>
                                            <button
                                                onClick={() => handleViewDetail(week)}
                                                className="mt-2 flex items-center gap-1 px-2 py-1 bg-slate-600 hover:bg-slate-500 text-white text-xs rounded-md transition-colors"
                                            >
                                                <Eye className="w-3 h-3" />
                                                View Detail
                                            </button>
                                        </div>

                                        {week.data.map((column, colIdx) => (
                                            <div key={colIdx} className="bg-white p-2 min-w-[120px] min-h-[140px]">
                                                <div className="space-y-2">
                                                    {column.length === 0 ? (
                                                        <div className="text-center py-6">
                                                            <div className="text-slate-300 text-xs">No data</div>
                                                        </div>
                                                    ) : column.map((project, projIdx) => (
                                                        <div
                                                            key={projIdx}
                                                            className="flex justify-between bg-white border border-slate-200 rounded-lg p-2 opacity-70"
                                                        >
                                                            <div className="flex flex-col">
                                                                <div className="font-bold text-xs text-slate-700 mb-1">
                                                                    {project.unit}
                                                                </div>
                                                                <div className="text-xs text-slate-500 mb-1.5">{getPropertyShortCode(project.property || '')}</div>

                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className={`inline-block text-xs px-2 py-0.5 rounded-full border font-medium ${getPaymentBadge(project.paymentPercentage)}`}>
                                                                    {project.paymentPercentage.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}%
                                                                </span>

                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {/* Current Week Row - Interactive */}
                            <div className="border-b-4 border-blue-400">
                                <div className="grid gap-px bg-slate-200" style={{ gridTemplateColumns: `160px repeat(${stages.length}, 1fr)` }}>
                                    <div className="bg-blue-700 p-3 flex flex-col justify-center sticky left-0 z-10">
                                        <div className="font-bold text-white text-sm flex items-center gap-2">
                                            Current Week
                                            <span
                                                className="bg-red-500 opacity-90 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1 font-bold"
                                            >
                                                <div
                                                    className="w-1.5 h-1.5 bg-white rounded-full"
                                                    style={{
                                                        animation: 'live-dot 1s ease-in-out infinite'
                                                    }}
                                                ></div>
                                                LIVE
                                            </span>
                                        </div>
                                        <div className="text-xs text-blue-200 mt-0.5">
                                            {(() => {
                                                const currentDate = new Date();
                                                const weekStart = new Date(currentDate);
                                                weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Monday
                                                const weekEnd = new Date(weekStart);
                                                weekEnd.setDate(weekStart.getDate() + 6); // Sunday
                                                
                                                const formatDate = (date: Date) => {
                                                    return date.toLocaleDateString('en-US', { 
                                                        month: 'short', 
                                                        day: 'numeric' 
                                                    });
                                                };
                                                
                                                return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
                                            })()}
                                        </div>
                                        <div className="flex flex-col gap-1 mt-2">
                                            <button
                                                onClick={handleViewCurrentWeekDetail}
                                                className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-md transition-colors"
                                            >
                                                <Eye className="w-3 h-3" />
                                                View Detail
                                            </button>
                                            <button
                                                onClick={fetchCurrentWeekData}
                                                disabled={isLoadingCurrentWeek}
                                                className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-400 text-white text-xs rounded-md transition-colors"
                                            >
                                                <Calendar className="w-3 h-3" />
                                                Refresh
                                            </button>
                                        </div>
                                    </div>

                                    {isLoadingCurrentWeek ? (
                                        // Loading state for current week
                                        Array(stages.length).fill(null).map((_, colIdx) => (
                                            <div key={colIdx} className="bg-white p-2 min-w-[120px] min-h-[140px]">
                                                <div className="flex items-center justify-center h-full">
                                                    <div className="text-slate-500 text-sm">Loading...</div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        currentWeekData.map((column, colIdx) => (
                                            <div
                                                key={colIdx}
                                                className="bg-white p-2 min-w-[120px] min-h-[140px]"
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => handleDrop(e, colIdx)}
                                            >
                                                <div className="flex flex-col h-full space-y-2">
                                                    <div className="flex-1 space-y-2">
                                                        {column.map((project, projIdx) => (
                                                            <div
                                                                key={projIdx}
                                                                draggable
                                                                onDragStart={(e) => handleDragStart(e, project, colIdx)}
                                                                className="flex justify-between bg-white border-2 border-slate-300 rounded-lg p-2 hover:shadow-lg hover:border-blue-400 transition-all cursor-move group"
                                                            >
                                                                <div className="flex flex-col">
                                                                    <div className="flex items-start gap-1 mb-1">
                                                                        <GripVertical className="w-3 h-3 text-slate-400 group-hover:text-blue-600 flex-shrink-0 mt-0.5" />
                                                                        <div className="font-bold text-xs text-slate-900 group-hover:text-blue-600">
                                                                            {project.unit}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-xs text-slate-600 mb-1.5">{getPropertyShortCode(project.property || '')}</div>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full border font-medium ${getPaymentBadge(project.paymentPercentage)}`}>
                                                                        {project.paymentPercentage.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}%
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {getTotalCount(colIdx) > 0 && (
                                                        <div className="mt-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-2">
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                <TrendingUp className="w-3 h-3 text-blue-600" />
                                                                <span className="text-xs font-bold text-blue-900">
                                                                    Total: {getTotalCount(colIdx)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Stats */}
                    <div className="px-8 pb-8">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl">
                            <div className="grid grid-cols-4 gap-6">
                                <div>
                                    <div className="text-blue-200 text-sm mb-1">Total Projects</div>
                                    <div className="text-3xl font-bold">{currentWeekData.flat().length}</div>
                                </div>
                                <div>
                                    <div className="text-blue-200 text-sm mb-1">Fully Paid</div>
                                    <div className="text-3xl font-bold">{currentWeekData.flat().filter(p => p.paymentPercentage === 100).length}</div>
                                </div>
                                <div>
                                    <div className="text-blue-200 text-sm mb-1">Partially Paid</div>
                                    <div className="text-3xl font-bold">{currentWeekData.flat().filter(p => p.paymentPercentage > 0 && p.paymentPercentage < 100).length}</div>
                                </div>
                                <div>
                                    <div className="text-blue-200 text-sm mb-1">Unpaid</div>
                                    <div className="text-3xl font-bold">{currentWeekData.flat().filter(p => p.paymentPercentage === 0).length}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default PMKanban;
