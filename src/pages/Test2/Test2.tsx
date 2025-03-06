
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import React, { useState } from 'react';
import { DraggablePackage } from './components/DraggablePackage';
import { Package } from '../../types';

function Test2() {
    const [packages, setPackages] = useState<Package[]>([
        {
            id: 'pkg-1',
            name: 'Basic Package',
            products: [{ id: 'prod-1', name: 'Product A', description: 'Basic item' }]
        },
        {
            id: 'pkg-2',
            name: 'Premium Package',
            products: [{ id: 'prod-2', name: 'Product B', description: 'Premium item' }]
        },
        {
            id: 'pkg-3',
            name: 'Unassigned Products',
            products: [
                { id: 'prod-3', name: 'Product C', description: 'Extra item' },
                { id: 'prod-4', name: 'Product D', description: 'Additional item' }
            ]
        }
    ]);

    const [activeId, setActiveId] = useState<string | null>(null);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over?.id) {
            setActiveId(null);
            return;
        }

        if (active.id.toString().startsWith('pkg-') && over.id.toString().startsWith('pkg-')) {
            const oldIndex = packages.findIndex(pkg => pkg.id === active.id);
            const newIndex = packages.findIndex(pkg => pkg.id === over.id);
            setPackages(arrayMove(packages, oldIndex, newIndex));
        }
        else if (active.id.toString().startsWith('prod-') && over.id.toString().startsWith('pkg-')) {
            const sourcePackageId = active.data.current?.packageId as string;
            const targetPackageId = over.id as string;
            const draggedProductId = active.id as string;

            if (sourcePackageId === targetPackageId) {
                setActiveId(null);
                return;
            }

            setPackages(prevPackages => {
                const sourcePackage = prevPackages.find(pkg => pkg.id === sourcePackageId);
                const targetPackage = prevPackages.find(pkg => pkg.id === targetPackageId);
                const product = sourcePackage?.products.find(p => p.id === draggedProductId);

                if (!sourcePackage || !targetPackage || !product) return prevPackages;

                return prevPackages.map(pkg => {
                    if (pkg.id === sourcePackageId) {
                        return { ...pkg, products: pkg.products.filter(p => p.id !== draggedProductId) };
                    }
                    if (pkg.id === targetPackageId) {
                        return { ...pkg, products: [...pkg.products, product] };
                    }
                    return pkg;
                });
            });
        }

        setActiveId(null);
    };

    const handleSubmit = () => {
        console.log('Current Packages:', packages);
    };

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <h1 className="text-2xl font-bold mb-6">Package Manager</h1>
            <DndContext
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex flex-col gap-6">
                    {packages.map((pkg) => (
                        <DraggablePackage
                            key={pkg.id}
                            pkg={pkg}
                            isDragging={activeId === pkg.id}
                        />
                    ))}
                </div>
            </DndContext>
            <div className="mt-6">
                <button
                    onClick={handleSubmit}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                    Submit
                </button>
            </div>
        </div>
    );
}



// interface TableColumn {
//     field: keyof RenoProgress;
//     header: string;
//     sortable?: boolean;
//     groupable?: boolean;
// }

// type GroupBy = string | null;

// function Test2() {
//     const [renoProgress, setRenoProgress] = useState<RenoProgress[]>([]);
//     const [isLoading, setIsLoading] = useState<boolean>(true);
//     const [error, setError] = useState<string | null>(null);
//     const [page, setPage] = useState<number>(1);
//     const [size, setSize] = useState<number>(10);
//     const [totalItems, setTotalItems] = useState<number>(0);
//     const [searchTerm, setSearchTerm] = useState<string>('');
//     const [sortField, setSortField] = useState<string>('');
//     const [groupBy, setGroupBy] = useState<GroupBy>('property.id');
//     const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
//     // const [groupBy, setGroupBy] = useState<GroupBy>('property.id');
//     const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

//     const columns: TableColumn[] = [
//         { field: 'property.unit_no', header: 'Unit', sortable: true },
//         { field: 'progress.pre_reno_1', header: 'VP', sortable: true },
//         { field: 'progress.pre_reno_2', header: 'Defect', sortable: true },
//         { field: 'progress.pre_reno_3', header: 'Reno Permit', sortable: true },
//         { field: 'progress.p1_1', header: 'Electric Wiring', sortable: true },
//         { field: 'progress.p1_2', header: 'Painting', sortable: true },
//         { field: 'progress.p1_3', header: 'Partition', sortable: true },
//     ];

//     const groupableColumns = columns.filter(col => col.groupable);

//     useEffect(() => {
//         document.title = "TEST";
//         initRenoProgressTable(1, 10, '', null, '');
//     }, []);

//     const initRenoProgressTable = async (
//         page: number,
//         size: number,
//         searchTerm?: string,
//         order?: string,
//         field?: string
//     ) => {
//         setIsLoading(true);
//         try {
//             const response = await renoProgressAdvanceTable('property');
//             const data = response?.data || [];
//             setRenoProgress(data);
//             setTotalItems(response?.totalCount || 0);
//         } catch (error) {
//             console.error('Error fetching renoProgress:', error);
//             setError('Failed to load renoProgress');
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const handleSort = (field: string) => {
//         if (sortField === field) {
//             setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
//         } else {
//             setSortField(field);
//             setSortDirection('asc');
//         }
//     };

//     const renderSortIcon = (field: string) => {
//         if (sortField !== field) return null;
//         return sortDirection === 'asc' ? '<ChevronUp size={16} />' : '<ChevronDown size={16} />';
//     };

//     const toggleGroup = (groupValue: string) => {
//         setExpandedGroups(prev => {
//             const next = new Set(prev);
//             if (next.has(groupValue)) {
//                 next.delete(groupValue);
//             } else {
//                 next.add(groupValue);
//             }
//             return next;
//         });
//     };

//     const groupedData = useMemo(() => {
//         if (!groupBy) return null;

//         const groups = new Map<string, RenoProgress[]>();
//         renoProgress.forEach(item => {
//             const groupValue = item.property?.id || 'Unassigned';
//             const propertyName = item.property?.name || 'Unassigned Property';
//             if (!groups.has(groupValue)) {
//                 groups.set(groupValue, []);
//             }
//             groups.get(groupValue)!.push(item);
//         });

//         return Array.from(groups.entries()).map(([key, items]) => ({
//             key,
//             name: items[0].property?.name || 'Unassigned Property',
//             items,
//             count: items.length
//         }));
//     }, [renoProgress, groupBy]);

//     if (isLoading) {
//         return (
//             <div className="min-h-screen bg-gray-50 flex items-center justify-center w-full">
//                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
//             </div>
//         );
//     }

//     if (error) {
//         return (
//             <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//                 <div className="text-red-600">{error}</div>
//             </div>
//         );
//     }

//     // Add this header row right after opening the group content div
//     const renderGroupContent = (group) => (
//         <div className="p-4 space-y-2">
//             {/* Column Headers */}
//             <div className="grid grid-cols-6 gap-4 px-4 py-2 bg-gray-50 rounded-lg mb-2">
//                 {columns.map((column, index) => (
//                     <div key={index} className="text-xs font-medium text-gray-200 uppercase tracking-wider">
//                         {column.header}
//                     </div>
//                 ))}
//             </div>

//             {/* Group Items */}
//             {group.items.map(renderTableRow)}
//         </div>
//     );

//     const getBadgeColorClass = (status: string) => {
//         switch (status?.toLowerCase()) {
//             case 'not_started':
//                 return 'bg-gray-200 text-gray-700';
//             case 'started':
//                 return 'bg-blue-100 text-blue-700';
//             case 'in_progress':
//                 return 'bg-yellow-100 text-yellow-700';
//             case 'completed':
//                 return 'bg-green-100 text-green-700';
//             case 'not available':
//             case 'not_available':
//                 return 'bg-red-100 text-red-700';
//             default:
//                 return 'bg-gray-100 text-gray-500';
//         }
//     };

//     const renderTableRow = (item: RenoProgress) => (
//         <div key={item.id} className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200 mb-4">
//             <div className="grid grid-cols-7 gap-4">
//                 <div>
//                     <div className="text-sm font-medium text-gray-900">
//                         {item.property?.block}-{item.property?.unit_no}
//                     </div>
//                 </div>
//                 {/* VP Progress */}
//                 <div>
//                     <div className="space-y-1">
//                         <ProgressBar progress={+(item.progress?.pre_reno_1 || 0) * 100} />
//                         <div className="text-xs text-gray-500 text-right">
//                             {((item.progress?.pre_reno_1 || 0) * 100).toFixed(2)}%
//                         </div>
//                     </div>
//                 </div>
//                 {/* Defect Progress */}
//                 <div>
//                     <div className="space-y-1">
//                         <ProgressBar progress={+(item.progress?.pre_reno_2 || 0) * 100} />
//                         <div className="text-xs text-gray-500 text-right">
//                             {((item.progress?.pre_reno_2 || 0) * 100).toFixed(2)}%
//                         </div>
//                     </div>
//                 </div>
//                 {/* Reno Permit Progress */}
//                 <div>
//                     <div className="space-y-1">
//                         <ProgressBar progress={+(item.progress?.pre_reno_3 || 0) * 100} />
//                         <div className="text-xs text-gray-500 text-right">
//                             {((item.progress?.pre_reno_3 || 0) * 100).toFixed(2)}%
//                         </div>
//                     </div>
//                 </div>
//                 {/* Electric Wiring Progress */}
//                 <div>
//                     <div className="space-y-1">
//                         <ProgressBar progress={+(item.progress?.p1_1 || 0) * 100} />
//                         <div className="text-xs text-gray-500 text-right">
//                             {((item.progress?.p1_1 || 0) * 100).toFixed(2)}%
//                         </div>
//                     </div>
//                 </div>
//                 {/* Painting Progress */}
//                 <div>
//                     <div className="space-y-1">
//                         <ProgressBar progress={+(item.progress?.p1_2 || 0) * 100} />
//                         <div className="text-xs text-gray-500 text-right">
//                             {((item.progress?.p1_2 || 0) * 100).toFixed(2)}%
//                         </div>
//                     </div>
//                 </div>
//                 {/* Partition Progress */}
//                 <div>
//                     <div className="space-y-1">
//                         <ProgressBar progress={+(item.progress?.p1_3 || 0) * 100} />
//                         <div className="text-xs text-gray-500 text-right">
//                             {((item.progress?.p1_3 || 0) * 100).toFixed(2)}%
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );

//     return (
//         <div className="min-h-screen bg-gray-100 p-6 w-full">
//             <div className="max-w-7xl mx-auto">
//                 {/* Header */}
//                 <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
//                     <div className="flex items-center justify-between">
//                         <div className="flex items-center space-x-4">
//                             <h2 className="text-2xl font-bold text-gray-800">Renovation Projects</h2>
//                             <div className="relative">
//                                 <select
//                                     value={groupBy || ''}
//                                     onChange={(e) => setGroupBy(e.target.value as GroupBy)}
//                                     className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-gray-700 shadow-sm"
//                                 >
//                                     <option value="">No Grouping</option>
//                                     {groupableColumns.map(col => (
//                                         <option key={col.field} value={col.field}>{col.header}</option>
//                                     ))}
//                                 </select>
//                                 {/* <Group className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} /> */}
//                             </div>
//                         </div>
//                         <div className="relative">
//                             {/* <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} /> */}
//                             <input
//                                 type="text"
//                                 placeholder="Search projects..."
//                                 className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
//                                 value={searchTerm}
//                                 onChange={(e) => setSearchTerm(e.target.value)}
//                             />
//                         </div>
//                     </div>
//                     {/* Column Headers */}
//                     <div className="grid grid-cols-7 gap-4 mt-6 px-6">
//                         {columns.map(column => (
//                             <div key={column.field} className="text-sm font-medium text-gray-700">
//                                 {column.header}
//                             </div>
//                         ))}
//                     </div>
//                 </div>

//                 {/* Content */}
//                 <div className="space-y-4">
//                     {groupedData ? (
//                         groupedData.map(group => (
//                             <div key={group.key} className="bg-white rounded-xl shadow-sm overflow-hidden">
//                                 <button
//                                     className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
//                                     onClick={() => toggleGroup(group.key)}
//                                 >
//                                     <div className="flex items-center space-x-3">
//                                         <i className={`ki-filled ki-right transform transition-transform duration-200 ${expandedGroups.has(group.key) ? 'rotate-90' : ''}`}></i>
//                                         <span className="font-semibold text-gray-700">{group.name}</span>
//                                         <span className="bg-gray-200 text-gray-600 px-2.5 py-1 rounded-full text-sm">
//                                             {group.count} units
//                                         </span>
//                                     </div>
//                                 </button>
//                                 <div className={`transition-all duration-200 ease-in-out
//                       ${expandedGroups.has(group.key) ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
//                                     <div className="p-4 space-y-2">
//                                         {group.items.map(renderTableRow)}
//                                     </div>
//                                 </div>
//                             </div>
//                         ))
//                     ) : (
//                         <div className="space-y-2">
//                             {renoProgress.map(renderTableRow)}
//                         </div>
//                     )}
//                 </div>

//                 {/* Pagination */}
//                 <div className="mt-4 bg-white rounded-xl shadow-sm p-4">
//                     <div className="flex items-center justify-between">
//                         <div className="text-sm text-gray-500">
//                             {/* Showing {((page - 1) * size) + 1} to {Math.min(page * size, totalItems)} of {totalItems} results */}
//                             Showing {totalItems} results
//                         </div>
//                         {/* <div className="flex space-x-2">
//                             <button
//                                 onClick={() => setPage(page - 1)}
//                                 disabled={page === 1}
//                                 className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors duration-200"
//                             >
//                                 Previous
//                             </button>
//                             <button
//                                 onClick={() => setPage(page + 1)}
//                                 disabled={page * size >= totalItems}
//                                 className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors duration-200"
//                             >
//                                 Next
//                             </button>
//                         </div> */}
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }

export default Test2;
