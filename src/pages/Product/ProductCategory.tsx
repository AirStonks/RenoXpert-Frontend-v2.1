// src\pages\Product\ProductCategory.tsx

import ProductCategoryTable from "../../components/Tables/ProductCategoryTable";
import AddProductCategoryModal from '../../components/Modals/AddProductCategoryModal';
import { KTDataTable } from "../../metronic/core";
import { useNavigate } from "react-router-dom";

function ProductCategory() {
    const navigate = useNavigate();

    const handleBackClick = () => {
        navigate('/products');
    };

    const handleRefresh = async () => {
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
            <div className="flex justify-between items-center flex-wrap mb-6">
                <div className="flex gap-4 items-center">
                    <button className='text-gray-800 dark:text-gray-400' onClick={handleBackClick}>
                        <i className="ki-solid ki-arrow-left"></i>
                    </button>
                    <span className="text-2xl font-bold text-gray-900">
                        Category Management
                    </span>
                </div>
                
                <div className="flex gap-4">
                    <button
                        className="btn btn-sm btn-primary text-white"
                        data-modal-toggle="#add_prod_cat_modal"
                    >
                        <i className="ki-outline ki-plus-squared"></i>
                        Add Category
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <ProductCategoryTable />
                <AddProductCategoryModal />
            </div>
        </>
    )
}

export default ProductCategory;