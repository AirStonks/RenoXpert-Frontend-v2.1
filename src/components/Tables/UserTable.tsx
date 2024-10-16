
function UserTable() {
    return (
        <div className="grid">
            <div className="card card-grid min-w-full">
                <div className="card-header py-5 flex-wrap">
                    <h3 className="card-title">
                        Users
                    </h3>
                    <div className="flex gap-6">
                        <div className="relative">
                            <i className="ki-outline ki-magnifier leading-none text-md text-gray-500 absolute top-1/2 left-0 -translate-y-1/2 ml-3">
                            </i>
                            <input className="input input-sm pl-8" placeholder="Search Members" type="text" />
                        </div>
                    </div>
                </div>
                <div className="card-body">
                    <div data-datatable="true" data-datatable-page-size="5">
                        <div className="scrollable-x-auto">
                            <table className="table table-auto table-border" data-datatable-table="true" id="grid_table">
                                <thead>
                                    <tr>
                                        <th className="w-[60px]">
                                            <input className="checkbox checkbox-sm" data-datatable-check="true" type="checkbox" />
                                        </th>
                                        <th className="min-w-[175px]">
                                            <span className="sort asc">
                                                <span className="sort-label">
                                                    Member
                                                </span>
                                                <span className="sort-icon">
                                                </span>
                                            </span>
                                        </th>
                                        <th className="min-w-[150px]">
                                            <span className="sort">
                                                <span className="sort-label">
                                                    Location
                                                </span>
                                                <span className="sort-icon">
                                                </span>
                                            </span>
                                        </th>
                                        <th className="min-w-[125px]">
                                            <span className="sort">
                                                <span className="sort-label">
                                                    Status
                                                </span>
                                                <span className="sort-icon">
                                                </span>
                                            </span>
                                        </th>
                                        <th className="w-[80px]">
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <input className="checkbox checkbox-sm" data-datatable-row-check="true" type="checkbox" value="1" />
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2.5">
                                                <img alt="" className="h-9 rounded-full" src="/static/metronic/tailwind/docs/dist/assets/media/avatars/300-3.png" />
                                                <div className="flex flex-col gap-0.5">
                                                    <a className="leading-none font-semibold text-sm text-gray-900 hover:text-primary" href="#">
                                                        Tyler Hero
                                                    </a>
                                                    <span className="text-2sm text-gray-600">
                                                        26 tasks
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1.5">
                                                <img alt="flag" className="h-4 rounded-full" src="/static/metronic/tailwind/docs/dist/assets/media/flags/estonia.svg" />
                                                <span className="leading-none text-gray-700">
                                                    Estonia
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge badge-sm badge-outline badge-success">
                                                Active
                                            </span>
                                        </td>
                                        <td>
                                            <a className="btn btn-sm btn-light" href="#">
                                                Edit
                                            </a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <input className="checkbox checkbox-sm" data-datatable-row-check="true" type="checkbox" value="2" />
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2.5">
                                                <img alt="" className="h-9 rounded-full" src="/static/metronic/tailwind/docs/dist/assets/media/avatars/300-2.png" />
                                                <div className="flex flex-col gap-0.5">
                                                    <a className="leading-none font-semibold text-sm text-gray-900 hover:text-primary" href="#">
                                                        Esther Howard
                                                    </a>
                                                    <span className="text-2sm text-gray-600">
                                                        639 tasks
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1.5">
                                                <img alt="flag" className="h-4 rounded-full" src="/static/metronic/tailwind/docs/dist/assets/media/flags/malaysia.svg" />
                                                <span className="leading-none text-gray-700">
                                                    Malaysia
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge badge-sm badge-outline badge-warning">
                                                Pending
                                            </span>
                                        </td>
                                        <td>
                                            <a className="btn btn-sm btn-light" href="#">
                                                Edit
                                            </a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <input className="checkbox checkbox-sm" data-datatable-row-check="true" type="checkbox" value="3" />
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2.5">
                                                <img alt="" className="h-9 rounded-full" src="/static/metronic/tailwind/docs/dist/assets/media/avatars/300-11.png" />
                                                <div className="flex flex-col gap-0.5">
                                                    <a className="leading-none font-semibold text-sm text-gray-900 hover:text-primary" href="#">
                                                        Jacob Jones
                                                    </a>
                                                    <span className="text-2sm text-gray-600">
                                                        125 tasks
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1.5">
                                                <img alt="flag" className="h-4 rounded-full" src="/static/metronic/tailwind/docs/dist/assets/media/flags/ukraine.svg" />
                                                <span className="leading-none text-gray-700">
                                                    Ukraine
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge badge-sm badge-outline badge-primary">
                                                Active
                                            </span>
                                        </td>
                                        <td>
                                            <a className="btn btn-sm btn-light" href="#">
                                                Edit
                                            </a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <input className="checkbox checkbox-sm" data-datatable-row-check="true" type="checkbox" value="4" />
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2.5">
                                                <img alt="" className="h-9 rounded-full" src="/static/metronic/tailwind/docs/dist/assets/media/avatars/300-2.png" />
                                                <div className="flex flex-col gap-0.5">
                                                    <a className="leading-none font-semibold text-sm text-gray-900 hover:text-primary" href="#">
                                                        Cody Fisher
                                                    </a>
                                                    <span className="text-2sm text-gray-600">
                                                        81 tasks
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1.5">
                                                <img alt="flag" className="h-4 rounded-full" src="/static/metronic/tailwind/docs/dist/assets/media/flags/canada.svg" />
                                                <span className="leading-none text-gray-700">
                                                    Canada
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge badge-sm badge-outline badge-danger">
                                                Deleted
                                            </span>
                                        </td>
                                        <td>
                                            <a className="btn btn-sm btn-light" href="#">
                                                Edit
                                            </a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <input className="checkbox checkbox-sm" data-datatable-row-check="true" type="checkbox" value="5" />
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2.5">
                                                <img alt="" className="h-9 rounded-full" src="/static/metronic/tailwind/docs/dist/assets/media/avatars/300-5.png" />
                                                <div className="flex flex-col gap-0.5">
                                                    <a className="leading-none font-semibold text-sm text-gray-900 hover:text-primary" href="#">
                                                        Leslie Alexander
                                                    </a>
                                                    <span className="text-2sm text-gray-600">
                                                        203 tasks
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1.5">
                                                <img alt="flag" className="h-4 rounded-full" src="/static/metronic/tailwind/docs/dist/assets/media/flags/india.svg" />
                                                <span className="leading-none text-gray-700">
                                                    India
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge badge-sm badge-outline badge-success">
                                                Active
                                            </span>
                                        </td>
                                        <td>
                                            <a className="btn btn-sm btn-light" href="#">
                                                Edit
                                            </a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <input className="checkbox checkbox-sm" data-datatable-row-check="true" type="checkbox" value="6" />
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2.5">
                                                <img alt="" className="h-9 rounded-full" src="/static/metronic/tailwind/docs/dist/assets/media/avatars/300-6.png" />
                                                <div className="flex flex-col gap-0.5">
                                                    <a className="leading-none font-semibold text-sm text-gray-900 hover:text-primary" href="#">
                                                        Martha Craig
                                                    </a>
                                                    <span className="text-2sm text-gray-600">
                                                        344 tasks
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1.5">
                                                <img alt="flag" className="h-4 rounded-full" src="/static/metronic/tailwind/docs/dist/assets/media/flags/brazil.svg" />
                                                <span className="leading-none text-gray-700">
                                                    Brazil
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge badge-sm badge-outline badge-warning">
                                                Pending
                                            </span>
                                        </td>
                                        <td>
                                            <a className="btn btn-sm btn-light" href="#">
                                                Edit
                                            </a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <input className="checkbox checkbox-sm" data-datatable-row-check="true" type="checkbox" value="7" />
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2.5">
                                                <img alt="" className="h-9 rounded-full" src="/static/metronic/tailwind/docs/dist/assets/media/avatars/300-7.png" />
                                                <div className="flex flex-col gap-0.5">
                                                    <a className="leading-none font-semibold text-sm text-gray-900 hover:text-primary" href="#">
                                                        Ronald Richards
                                                    </a>
                                                    <span className="text-2sm text-gray-600">
                                                        187 tasks
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1.5">
                                                <img alt="flag" className="h-4 rounded-full" src="/static/metronic/tailwind/docs/dist/assets/media/flags/japan.svg" />
                                                <span className="leading-none text-gray-700">
                                                    Japan
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge badge-sm badge-outline badge-success">
                                                Active
                                            </span>
                                        </td>
                                        <td>
                                            <a className="btn btn-sm btn-light" href="#">
                                                Edit
                                            </a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <input className="checkbox checkbox-sm" data-datatable-row-check="true" type="checkbox" value="8" />
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2.5">
                                                <img alt="" className="h-9 rounded-full" src="/static/metronic/tailwind/docs/dist/assets/media/avatars/300-8.png" />
                                                <div className="flex flex-col gap-0.5">
                                                    <a className="leading-none font-semibold text-sm text-gray-900 hover:text-primary" href="#">
                                                        Jane Cooper
                                                    </a>
                                                    <span className="text-2sm text-gray-600">
                                                        45 tasks
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1.5">
                                                <img alt="flag" className="h-4 rounded-full" src="/static/metronic/tailwind/docs/dist/assets/media/flags/south_africa.svg" />
                                                <span className="leading-none text-gray-700">
                                                    South Africa
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge badge-sm badge-outline badge-secondary">
                                                Inactive
                                            </span>
                                        </td>
                                        <td>
                                            <a className="btn btn-sm btn-light" href="#">
                                                Edit
                                            </a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <input className="checkbox checkbox-sm" data-datatable-row-check="true" type="checkbox" value="9" />
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2.5">
                                                <img alt="" className="h-9 rounded-full" src="/static/metronic/tailwind/docs/dist/assets/media/avatars/300-9.png" />
                                                <div className="flex flex-col gap-0.5">
                                                    <a className="leading-none font-semibold text-sm text-gray-900 hover:text-primary" href="#">
                                                        Robert Fox
                                                    </a>
                                                    <span className="text-2sm text-gray-600">
                                                        512 tasks
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1.5">
                                                <img alt="flag" className="h-4 rounded-full" src="/static/metronic/tailwind/docs/dist/assets/media/flags/germany.svg" />
                                                <span className="leading-none text-gray-700">
                                                    Germany
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge badge-sm badge-outline badge-success">
                                                Active
                                            </span>
                                        </td>
                                        <td>
                                            <a className="btn btn-sm btn-light" href="#">
                                                Edit
                                            </a>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="card-footer justify-center md:justify-between flex-col md:flex-row gap-3 text-gray-600 text-2sm font-medium">
                            <div className="flex items-center gap-2">
                                Show
                                <select className="select select-sm w-16" data-datatable-size="true" name="perpage">
                                </select>
                                per page
                            </div>
                            <div className="flex items-center gap-4">
                                <span data-datatable-info="true">
                                </span>
                                <div className="pagination" data-datatable-pagination="true">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserTable;