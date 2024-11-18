import { useEffect } from "react";
import { Link } from "react-router-dom";

function PMMain() {

    useEffect(() => {
        document.title = "Project Management | RenoXpert";
    })
    return (
        <>
            <div className="flex justify-between items-center flex-wrap mb-6">
                <div className="flex gap-4 items-center">
                    <span className="text-2xl font-bold text-gray-900">
                        Project Management
                    </span>
                </div>
            </div>

            {/* <Link to={'/reno-progress/1'} className="btn btn-primary">
                [TEMP] Reno Progress 1
            </Link> */}

            <div className="card">
                <div className="card-header">
                    <div className="card-title">
                        Project Overview
                    </div>
                </div>
                <div className="card-table">
                    <table className="table align-middle text-gray-700 font-medium text-sm">
                        <thead>
                            <tr>
                                <th className='w-[10px] text-center'>ID</th>
                                <th className='w-[100px] text-center'>Sales</th>
                                <th className='w-[100px] text-center'>Condo</th>
                                <th className='w-[100px] text-center'>Start Date</th>
                                <th className='w-[100px] text-center'>End Date</th>
                                <th className='w-[100px] text-center'>Remaining Date</th>
                                <th className='w-[100px] text-center'>Pre-Reno</th>
                                <th className='w-[100px] text-center'>Reno</th>
                                <th className='w-[100px] text-center'>Post-Reno</th>
                                <th className='w-[100px] text-center'>Completion</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="text-center">1</td>
                                <td className="text-center">
                                    <Link
                                        to={'/sales/1'}
                                        className="link text-orange-500"
                                    >
                                        S000001
                                    </Link>
                                    <div className="w-full bg-gray-200 rounded-full h-[8px] mt-1 mb-1 relative overflow-hidden">
                                        {/* Issued progress bar (outer) */}
                                        <div
                                            className="absolute top-0 left-0 h-full bg-blue-200 transition-all duration-300"
                                            style={{
                                                width: `80%`,
                                                height: '8px'
                                            }}
                                        />

                                        {/* Paid progress bar (inner) */}
                                        <div
                                            className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                            style={{
                                                width: `30%`,
                                                height: '8px'
                                            }}
                                        />
                                    </div>
                                </td>
                                <td className="text-center">
                                    <div className="flex flex-col items-center">
                                        <span className="font-semibold mb-1">Ara Tre'</span>
                                        <span className="badge badge-xs badge-pill text-xs text-gray-600">B-15-15</span>
                                    </div>
                                </td>
                                <td className="text-center">
                                    <input type="date" className="input input-sm" />
                                </td>
                                <td className="text-center">
                                    <input type="date" className="input input-sm" />
                                </td>
                                <td className="text-center">1M 29D</td>
                                <td className="text-center">
                                    <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                                        {/* Issued progress bar (outer) */}
                                        <div
                                            className="absolute top-0 left-0 h-full bg-blue-200 transition-all duration-300"
                                            style={{
                                                width: `60%`,
                                                height: '8px'
                                            }}
                                        />

                                        {/* Paid progress bar (inner) */}
                                        <div
                                            className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                            style={{
                                                width: `25%`,
                                                height: '8px'
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs">60%</span>
                                </td>
                                <td className="text-center">
                                    <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                                        {/* Issued progress bar (outer) */}
                                        <div
                                            className="absolute top-0 left-0 h-full bg-blue-200 transition-all duration-300"
                                            style={{
                                                width: `15%`,
                                                height: '8px'
                                            }}
                                        />

                                        {/* Paid progress bar (inner) */}
                                        <div
                                            className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                            style={{
                                                width: `0%`,
                                                height: '8px'
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs">20%</span>
                                </td>
                                <td className="text-center">
                                    <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                                        {/* Issued progress bar (outer) */}
                                        <div
                                            className="absolute top-0 left-0 h-full bg-blue-200 transition-all duration-300"
                                            style={{
                                                width: `0%`,
                                                height: '8px'
                                            }}
                                        />

                                        {/* Paid progress bar (inner) */}
                                        <div
                                            className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                            style={{
                                                width: `0%`,
                                                height: '8px'
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs">0%</span>
                                </td>
                                <td className="text-center">
                                    <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                                        {/* Issued progress bar (outer) */}
                                        <div
                                            className="absolute top-0 left-0 h-full bg-blue-200 transition-all duration-300"
                                            style={{
                                                width: `8%`,
                                                height: '8px'
                                            }}
                                        />

                                        {/* Paid progress bar (inner) */}
                                        <div
                                            className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                            style={{
                                                width: `0%`,
                                                height: '8px'
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs">8%</span>
                                </td>
                            </tr>
                            <tr>
                                <td className="text-center">2</td>
                                <td className="text-center">
                                    <Link
                                        to={'/sales/2'}
                                        className="link text-orange-500"
                                    >
                                        S000002
                                    </Link>
                                    <div className="w-full bg-gray-200 rounded-full h-[8px] mt-1 mb-1 relative overflow-hidden">
                                        {/* Issued progress bar (outer) */}
                                        <div
                                            className="absolute top-0 left-0 h-full bg-blue-200 transition-all duration-300"
                                            style={{
                                                width: `100%`,
                                                height: '8px'
                                            }}
                                        />

                                        {/* Paid progress bar (inner) */}
                                        <div
                                            className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                            style={{
                                                width: `70%`,
                                                height: '8px'
                                            }}
                                        />
                                    </div>
                                </td>
                                <td className="text-center">
                                    <div className="flex flex-col items-center">
                                        <span className="font-semibold mb-1">Meta City</span>
                                        <span className="badge badge-xs badge-pill text-xs text-gray-600">A-22-08</span>
                                    </div>
                                </td>
                                <td className="text-center">
                                    <input type="date" className="input input-sm" />
                                </td>
                                <td className="text-center">
                                    <input type="date" className="input input-sm" />
                                </td>
                                <td className="text-center">28D</td>
                                <td className="text-center">
                                    <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                                        {/* Issued progress bar (outer) */}
                                        <div
                                            className="absolute top-0 left-0 h-full bg-blue-200 transition-all duration-300"
                                            style={{
                                                width: `100%`,
                                                height: '8px'
                                            }}
                                        />

                                        {/* Paid progress bar (inner) */}
                                        <div
                                            className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                            style={{
                                                width: `100%`,
                                                height: '8px'
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs">100%</span>
                                </td>
                                <td className="text-center">
                                    <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                                        {/* Issued progress bar (outer) */}
                                        <div
                                            className="absolute top-0 left-0 h-full bg-blue-200 transition-all duration-300"
                                            style={{
                                                width: `70%`,
                                                height: '8px'
                                            }}
                                        />

                                        {/* Paid progress bar (inner) */}
                                        <div
                                            className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                            style={{
                                                width: `60%`,
                                                height: '8px'
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs">70%</span>
                                </td>
                                <td className="text-center">
                                    <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                                        {/* Issued progress bar (outer) */}
                                        <div
                                            className="absolute top-0 left-0 h-full bg-blue-200 transition-all duration-300"
                                            style={{
                                                width: `0%`,
                                                height: '8px'
                                            }}
                                        />

                                        {/* Paid progress bar (inner) */}
                                        <div
                                            className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                            style={{
                                                width: `0%`,
                                                height: '8px'
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs">0%</span>
                                </td>
                                <td className="text-center">
                                    <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                                        {/* Issued progress bar (outer) */}
                                        <div
                                            className="absolute top-0 left-0 h-full bg-blue-200 transition-all duration-300"
                                            style={{
                                                width: `72%`,
                                                height: '8px'
                                            }}
                                        />

                                        {/* Paid progress bar (inner) */}
                                        <div
                                            className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                            style={{
                                                width: `68%`,
                                                height: '8px'
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs">72%</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

        </>
    )
}

export default PMMain;