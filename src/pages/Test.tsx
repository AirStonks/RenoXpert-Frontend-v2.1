import { useEffect, useState } from "react";
import { KTDataTable, KTDataTableConfigInterface } from "../metronic/core/components/datatable";

function MyComponent() {
    const [dataTableInitialized, setDataTableInitialized] = useState(false);

    // DataTable initialization
    const apiUrl = `http://${window.location.hostname}:8000/api/packages`;
    const token = localStorage.getItem('token');

    const dataTableOptions: KTDataTableConfigInterface = {
        apiEndpoint: apiUrl,
        requestMethod: "GET",
        requestHeaders: {
            "Authorization": `Bearer ${token}`,
        },
        pageSize: 5,
        stateSave: false,
        columns: {
            id: {
                title: 'ID',
            },
        },
    };

    useEffect(() => {
        const element = document.querySelector("#product_cat_data_table") as HTMLElement;
        const datatable = new KTDataTable(element, dataTableOptions);
        // datatable = KTDataTable.getInstance(element);

        // const datatable = new KTDataTable(element, dataTableOptions);
        // datatable = KTDataTable.getInstance(datatableEl);

        setDataTableInitialized(true);

        // console.log(datatable);

    }, []);

    const handleRefresh = () => {
        // Handle Refresh
        const datatableEl = document.querySelector("#product_cat_data_table") as HTMLElement;
        const element = document.querySelector("#product_cat_data_table") as HTMLElement;
        
        const datatable = new KTDataTable(element, dataTableOptions);
        datatable = KTDataTable.getInstance(datatableEl);

        datatable.reload();
    };

    return (
        <>
            <div data-datatable="true" id="product_cat_data_table">
                <table className="table table-auto align-middle text-gray-700 font-medium text-sm" data-datatable-table="true">
                    <thead>
                        <tr>
                            <th className="w-[10px]" data-datatable-column="id">
                                <span className="sort">
                                    <span className="sort-label">ID</span>
                                    <span className="sort-icon"></span>
                                </span>
                            </th>
                        </tr>
                    </thead>
                </table>
            </div >

            {dataTableInitialized && (
                <button onClick={handleRefresh}>Refresh</button>
            )
            }
        </>
    );
}

export default MyComponent;