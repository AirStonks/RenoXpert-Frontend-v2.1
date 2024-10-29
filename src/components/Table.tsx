// import React, { useEffect, useState } from 'react';
// import { fetchData } from '../services/api'; // Adjust the path as necessary

// function Table() {
//     const [data, setData] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [pageSize, setPageSize] = useState(5); // Default page size
//     const [currentPage, setCurrentPage] = useState(1);

//     useEffect(() => {
//         const loadData = async () => {
//             try {
//                 const result = await fetchData();
//                 setData(result);
//             } catch (error) {
//                 setError(error.message);
//             } finally {
//                 setLoading(false);
//             }
//         };

//         loadData();
//     }, []);

//     if (loading) return <div>Loading...</div>;
//     if (error) return <div>Error: {error}</div>;

//     // Pagination calculations
//     const startIndex = (currentPage - 1) * pageSize;
//     const endIndex = startIndex + pageSize;
//     const paginatedData = data.slice(startIndex, endIndex);
//     const totalPages = Math.ceil(data.length / pageSize);

//     return (
//         <div className="card min-w-full">
//             <div className="card-header">
//                 <h3 className="card-title">Latest Orders</h3>
//             </div>
//             <div className="card-table">
//                 <div data-datatable="true" data-datatable-page-size={pageSize}>
//                     <div className="scrollable-x-auto">
//                         <table className="table table-border text-sm" data-datatable-table="true">
//                             <thead>
//                                 <tr>
//                                     <th className="w-[60px]">
//                                         <input className="checkbox checkbox-sm" data-datatable-check="true" type="checkbox" />
//                                     </th>
//                                     <th>Customer</th>
//                                     <th>Order Amount</th>
//                                     <th>Order Date</th>
//                                     <th>Status</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {paginatedData.map((item, index) => (
//                                     <tr key={index}>
//                                         <td>
//                                             <input className="checkbox checkbox-sm" data-datatable-row-check="true" type="checkbox" value={item.id} />
//                                         </td>
//                                         <td>{item.cust_name}</td>
//                                         <td>${item.order_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
//                                         <td>{new Date(item.order_date).toLocaleDateString()}</td>
//                                         <td>{item.status}</td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                         <div className="card-footer justify-center md:justify-between flex-col md:flex-row gap-3 text-gray-600 text-2sm font-medium">
//                             <div className="flex items-center gap-2">
//                                 Show
//                                 <select
//                                     className="select select-sm w-16"
//                                     value={pageSize}
//                                     onChange={(e) => setPageSize(Number(e.target.value))}
//                                 >
//                                     {[5, 10, 15].map(size => (
//                                         <option key={size} value={size}>
//                                             {size}
//                                         </option>
//                                     ))}
//                                 </select>
//                                 per page
//                             </div>
//                             <div className="flex items-center gap-4">
//                                 <span>
//                                     Page {currentPage} of {totalPages}
//                                 </span>
//                                 <div className="pagination">
//                                     <button
//                                         onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
//                                         disabled={currentPage === 1}
//                                     >
//                                         Previous
//                                     </button>
//                                     <button
//                                         onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
//                                         disabled={currentPage === totalPages}
//                                     >
//                                         Next
//                                     </button>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }

// export default Table;
