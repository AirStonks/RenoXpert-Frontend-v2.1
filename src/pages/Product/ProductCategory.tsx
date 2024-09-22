// src\pages\Product\ProductCategory.tsx

import ProductCategoryTable from "../../components/Tables/ProductCategoryTable";
import AddProductCategoryModal from '../../components/Modals/AddProductCategoryModal';
import { KTDataTable } from "../../metronic/core";

function ProductCategory() {

    const handleRefresh = async ()  => {
        KTDataTable.init();
        KTDataTable.createInstances();

        const datatableEl = document.querySelector('#product_cat_data_table') as HTMLElement;
        const datatable = KTDataTable.getInstance(datatableEl);

        console.log(datatable);

        datatable.reload();
        datatable.showSpinner();
    }

    return (
        <>
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center flex-wrap">
                    <span className="text-2xl font-bold text-gray-900">
                        Category Overview
                    </span>
                    <div className="flex gap-3 flex-wrap">
                        <button className="btn btn-sm btn-info" disabled>
                            Go to Product Inventory
                        </button>
                        <button 
                            className="btn btn-sm btn-primary text-white"
                            data-modal-toggle="#add_prod_cat_modal"
                        >
                            <i className="ki-outline ki-plus-squared"></i>
                            Add Category
                        </button>
                    </div>
                </div>

                <ProductCategoryTable />
                <AddProductCategoryModal />
            </div>
        </>
    )
}

export default ProductCategory;