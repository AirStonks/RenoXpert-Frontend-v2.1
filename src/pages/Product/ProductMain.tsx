// src\pages\Product\ProductMain.tsx

import Button from '../../components/Buttons/Button';
import KTComponent from '../../metronic/core';
import { useEffect } from 'react';
import ProductTable from '../../components/Tables/ProductTable';

function ProductMain() {
    useEffect(() => {
        KTComponent.init();
    }, []);

    return (
        <>
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center flex-wrap">
                    <span className="text-2xl font-bold text-gray-900">
                        Product Overview
                    </span>
                    <div className="flex gap-3 flex-wrap">
                        <button className="btn btn-sm btn-info" disabled>
                            Go to Product Inventory
                        </button>
                        <Button 
                            url='/products/create'
                            btnText='Add Product'
                            btnSize='btn-sm' 
                            icon='ki-outline ki-plus-squared'
                        />
                        <Button 
                            url='/products/category'
                            btnText='Manage Category'
                            btnSize='btn-sm' 
                            btnColor='btn-warning'
                        />
                    </div>
                </div>

                <ProductTable />
            </div>
        </>
    );
}

export default ProductMain;