import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Order, Package, Product } from "../../types";
import { KTDropdown } from '../../metronic/core/components/dropdown/dropdown';
import { fetchOrders } from "../../services/api";

function CreatePO() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const saleId = id ? parseInt(id, 10) : null;

    const inputOrderRef = useRef(null);
    const inputVendorRef = useRef(null);
    const [searchOrderTerm, setSearchOrderTerm] = useState('');
    const [searchVendorTerm, setSearchVendorTerm] = useState('');

    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const [selectedPOProducts, setSelectedPOProducts] = useState<Product[]>([]);

    const [formData, setFormData] = useState({
        order_id: '',
    });

    const handleBackClick = () => {
        navigate('/sales/' + saleId);
    };

    useEffect(() => {
        // Get the order
        initDropdown();
        console.log('yes');

        if (!saleId) {
            //
        }

    }, [saleId]);

    const initDropdown = async () => {
        const orderEl = document.querySelector('#order_dropdown') as HTMLElement;
        const orderDropdown = KTDropdown.getInstance(orderEl);

        orderDropdown.on('show', async () => {
            inputOrderRef.current.focus();

            try {
                const data = await fetchOrders('', 15);
                setOrders(data.data);

            } catch (error) {
                console.error('Failed to fetch quotations:', error);
            }
        });
    }

    const handleSearchOrder = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const term = event.target.value;
        setSearchOrderTerm(term);

        try {
            const data = await fetchOrders(term, 15);
            setOrders(data.data);

        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleSelectOrder = (order: Order) => {
        setFormData((prev) => ({
            ...prev,
            order_id: order.id,
        }));
        setSelectedOrder(order);
        setSearchOrderTerm('');
        setOrders([]);
    }

    if (selectedOrder) {
        selectedOrder.latest_quotation_test.quotation.packages.map((prodPackage: Package) => {
            console.log('item:', prodPackage.name);

        })
    }


    return (
        <>
            <div className="flex justify-between items-center flex-wrap mb-6">
                <div className="flex gap-4 items-center">
                    <button className='text-gray-800 dark:text-gray-400' onClick={handleBackClick}>
                        <i className="ki-solid ki-arrow-left"></i>
                    </button>
                    <span className="text-2xl font-bold text-gray-900">
                        Create New Purchase Order
                    </span>
                </div>
            </div>

            <div className="flex gap-8">
                <div className="flex flex-col flex-[2] gap-4">
                    <div className="card">
                        <div className="card-header">
                            <span className="font-semibold">General</span>
                        </div>
                        <div className="card-group py-4 flex items-center">
                            <span className="text-sm text-gray-600 pe-4 lg:pe-8 font-semibold">
                                Order:
                            </span>
                            <div className="dropdow" data-dropdown="true" data-dropdown-trigger="click" id='order_dropdown'>
                                <button className="dropdown-toggle btn btn-light w-full flex justify-between items-center">
                                    <span>{selectedOrder ? selectedOrder.order_no : 'Select an Order'}</span>
                                    <i className="ki-filled ki-down"></i>
                                </button>

                                <div className="dropdown-content w-full max-w-80">
                                    <div className="px-4 pt-4 text-sm text-gray-900 font-medium">
                                        <label className="input input-sm">
                                            <input
                                                ref={inputOrderRef}
                                                placeholder="Select an Order"
                                                type="text"
                                                value={searchOrderTerm}
                                                onChange={handleSearchOrder}
                                            />
                                        </label>
                                    </div>
                                    <div className="menu menu-default flex flex-col">
                                        {orders.length > 0 ? (
                                            orders.map((order, key) => (
                                                <div className="menu-item" key={key} data-id={order.id}>
                                                    <button
                                                        className="menu-link"
                                                        onClick={() => handleSelectOrder(order)}
                                                    >
                                                        <span className="menu-title">{order.order_no}</span>
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="menu-item">
                                                <button
                                                    className="menu-link"
                                                >
                                                    <span className="menu-title">No orders found</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card-group py-4 flex items-center">
                            <span className="text-sm text-gray-600 pe-4 lg:pe-8 font-semibold">
                                Vendor:
                            </span>
                            <div className="dropdow" data-dropdown="true" data-dropdown-trigger="click" id='vendor_dropdown'>
                                <button className="dropdown-toggle btn btn-light w-full flex justify-between items-center">
                                    <span>Select a Vendor</span>
                                    <i className="ki-filled ki-down"></i>
                                </button>

                                <div className="dropdown-content w-full max-w-80">
                                    <div className="px-4 pt-4 text-sm text-gray-900 font-medium">
                                        <label className="input input-sm">
                                            <input
                                                ref={inputVendorRef}
                                                placeholder="Select a vendor"
                                                type="text"
                                                value={searchVendorTerm}
                                            // onChange={handleSearchOrder}
                                            />
                                        </label>
                                    </div>
                                    <div className="menu menu-default flex flex-col">
                                        {/* {orders.length > 0 ? (
                                            orders.map((order, key) => (
                                                <div className="menu-item" key={key} data-id={order.id}>
                                                    <button
                                                        className="menu-link"
                                                        onClick={() => handleSelectOrder(order)}
                                                    >
                                                        <span className="menu-title">{order.order_no}</span>
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="menu-item">
                                                <button
                                                    className="menu-link"
                                                >
                                                    <span className="menu-title">No orders found</span>
                                                </button>
                                            </div>
                                        )} */}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <span className="font-semibold">Total Amount</span>
                        </div>
                        <div className="card-body">
                            <span>RM [total_price]</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-[5]">
                    {selectedOrder && (
                        <div className="card w-full">
                            <div className="card-body flex flex-col">
                                <h2 className="text-2xl font-semibold mb-4">Selected Products</h2>
                                <div className="flex flex-col mb-4">
                                    <div className="card">
                                        <div className="card-body">
                                            {selectedPOProducts.length > 0 ?
                                                <div className="flex flex-col">

                                                </div>
                                                :
                                                // <span className="text-sm">Added Product will display on here</span>
                                                <table className="table align-middle text-gray-700 font-medium text-sm">
                                                    <thead className="sticky top-0 bg-white z-5 rounded">
                                                        <tr>
                                                            <th className='w-[10px] text-center'></th>
                                                            <th className='w-[10px] text-center'>Supply</th>
                                                            <th className='w-[10px] text-center'>Install</th>
                                                            <th className='w-[250px]'>Product</th>
                                                            <th className='w-[250px]'>Description</th>
                                                            <th className='w-[100px] text-center'>Quantity</th>
                                                            <th className='w-[100px] text-center'>Unit Price</th>
                                                            <th className='w-[100px] text-center'>Discount</th>
                                                            <th className='w-[100px] text-center'>Total Price</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td>
                                                                <button className="btn btn-danger btn-xs">
                                                                    <i className="ki-outline ki-cross"></i>
                                                                </button>
                                                            </td>
                                                            <td className="text-center">
                                                                <input
                                                                    className="checkbox"
                                                                    name="sel_prod"
                                                                    type="checkbox"
                                                                // checked={!!product.pivot.includeSupply}
                                                                // readOnly
                                                                />
                                                            </td>
                                                            <td className="text-center">
                                                                <input
                                                                    className="checkbox"
                                                                    name="sel_prod"
                                                                    type="checkbox"
                                                                // checked={!!product.pivot.includeSupply}
                                                                // readOnly
                                                                />
                                                            </td>
                                                            <td>Built-In 3 Doors Swing Wardrobe</td>
                                                            <td>with full height mirror (1200mm (W) x 2400mm (H) x 480mm (D),Fabricated w/ LED strip & 2nos 13A plugpoints</td>
                                                            <td className="text-center">1</td>
                                                            <td className="text-center">RM 415</td>
                                                            <td className="text-center"></td>
                                                            <td className="text-center">	RM 415</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            }
                                        </div>
                                    </div>
                                </div>
                                <hr className="mb-12" />
                                <div className="text-sm text-gray-900 font-medium w-1/2 mb-4">
                                    <label className="input">
                                        <input
                                            ref={inputVendorRef}
                                            placeholder="Select product"
                                            type="text"
                                            value={searchVendorTerm}
                                            onChange={handleSearchOrder}
                                        />
                                    </label>
                                </div>
                                <div className="overflow-y-auto max-h-[450px] scrollable-y">
                                    <table className="table align-middle text-gray-700 font-medium text-sm">
                                        <thead className="sticky top-0 bg-white z-5 rounded">
                                            <tr>
                                                <th className='w-[10px] text-center'>Select</th>
                                                {/* <th className='w-[10px] text-center'>Install</th> */}
                                                <th className='w-[250px]'>Product</th>
                                                <th className='w-[250px]'>Description</th>
                                                <th className='w-[100px] text-center'>Quantity</th>
                                                <th className='w-[100px] text-center'>Unit Price</th>
                                                <th className='w-[100px] text-center'>Discount</th>
                                                <th className='w-[100px] text-center'>Total Price</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedOrder.latest_quotation_test.quotation.packages.map((prodPackage: Package) => (
                                                <React.Fragment key={prodPackage.id}>
                                                    <tr>
                                                        <td colSpan={7} className="bg-gray-200">{prodPackage.name}</td>
                                                    </tr>
                                                    {prodPackage.products.map((product) => (
                                                        <tr key={product.id}>
                                                            <td className="text-center">
                                                                <input
                                                                    className="checkbox"
                                                                    name="sel_prod"
                                                                    type="checkbox"
                                                                // checked={!!product.pivot.includeSupply}
                                                                // readOnly
                                                                />
                                                            </td>
                                                            <td>{product.name}</td>
                                                            <td>{product.description}</td>
                                                            <td className="text-center">{product.pivot.quantity}</td>
                                                            <td className="text-center">RM {product.product_cost_of_good_sold}</td>
                                                            <td className="text-center"></td>
                                                            <td className="text-center">RM {product.product_cost_of_good_sold * product.pivot.quantity}</td>
                                                        </tr>
                                                    ))}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </>
    );
}

export default CreatePO;