import { useEffect, useState } from "react";
import { KTDataTable, KTDataTableConfigInterface } from "../metronic/core/components/datatable";

function MyComponent() {
    const [dataTableInitialized, setDataTableInitialized] = useState(false);

    useEffect(() => {
        // DataTable initialization
        const apiUrl = "apiUrl";
        const element = document.querySelector("#product_cat_data_table") as HTMLElement;
        const token = "token";

        const dataTableOptions: KTDataTableConfigInterface = {
            apiEndpoint: apiUrl,
            requestMethod: "GET",
            requestHeaders: {
                "Authorization": `Bearer ${token}`,
            },
            pageSize: 5,
            stateSave: false,
            columns: {
                //...
            },
        };

        const datatable = new KTDataTable(element, dataTableOptions);

        setDataTableInitialized(true);
    }, []);

    const handleRefresh = () => {
        // Handle Refresh
        const datatableEl = document.querySelector("#product_cat_data_table") as HTMLElement;
        const datatable = KTDataTable.getInstance(datatableEl);

        datatable.reload();
    };

    return (
        <>
            <div data-datatable="true" id="product_cat_data_table">
            </div >

            {dataTableInitialized && (
                <button onClick={handleRefresh}>Refresh</button>
            )
            }
        </>
    );
}

export default MyComponent;