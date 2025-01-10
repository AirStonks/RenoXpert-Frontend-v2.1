// src\components\Modals\GenerateInvoiceModal.tsx

import { useCallback, useEffect, useRef, useState } from "react";
import { DiscountFee, Invoice, Sale } from "../../types";
import { createInvoice, fetchDiscountFees } from "../../services/api";
import { Slide, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { KTDropdown, KTModal } from "../../metronic/core";

interface GenerateInvoiceModalProps {
    saleDetail: Sale;
    handleUpdateSale: (sale: Sale) => void;
}

function GenerateInvoiceModal({ saleDetail, handleUpdateSale }: GenerateInvoiceModalProps) {
    const navigate = useNavigate();
    const [fees, setFees] = useState([]);
    const [discounts, setDiscounts] = useState([]);
    const [availableDiscountFees, setAvailableDiscountFees] = useState([]);
    const [searchDiscountFeeTerm, setSearchDiscountFeeTerm] = useState('');
    const [selectedType, setSelectedType] = useState('fee');
    const inputDiscountFeeRef = useRef(null);

    const [formData, setFormData] = useState({
        saleId: '',
        percentage: null,
        invoiceDiscounts: [],
        invoiceFees: [],
    });

    const notify = (type: 'success' | 'error', message: string) => {
        (toast[type] as (message: string, options?: object) => void)(message, {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: localStorage.getItem('theme'),
            transition: Slide,
        });
    };

    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            saleId: saleDetail.id,
        }));

        initDropdown();

    }, [saleDetail]);

    const initDropdown = async () => {
        const discountFeeDropdownEl = document.querySelector('#discount_fee_dropdown') as HTMLElement;
        const discountFeeDropdown = KTDropdown.getInstance(discountFeeDropdownEl);

        discountFeeDropdown.on('shown', async () => {
            try {
                const data = await fetchDiscountFees('', 6, 'fee');
                setAvailableDiscountFees(data.data);

            } catch (error) {
                console.error('Error fetching available fees:', error);
            }
        });
    }

    const handlePercentageSelect = useCallback(async (event: React.MouseEvent<HTMLButtonElement>) => {
        const target = event.currentTarget as HTMLElement;

        const percentButton = target.closest('[data-action="percentage"]') as HTMLElement;

        if (percentButton) {
            const percentValue = Number(percentButton.dataset.value);
            setFormData((prev) => ({
                ...prev,
                percentage: percentValue
            }));
        }

    }, []);

    const handleOtherPercentage = () => {
        // otherPercentage = 
    }

    const handleSearchDiscountFee = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const term = event.target.value;
        const type = selectedType; // Get the data-type value
        setSearchDiscountFeeTerm(term);

        try {
            const data = await fetchDiscountFees(term, 6, type);
            setAvailableDiscountFees(data.data);
        } catch (error) {
            console.error('Error fetching available fees:', error);
        }
    };

    const handleChangeType = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const dataType = event.target.dataset.type;
        console.log(dataType); // You can use this value as needed

        setSelectedType(dataType);
        setSearchDiscountFeeTerm('');

        try {
            const data = await fetchDiscountFees('', 6, dataType);
            setAvailableDiscountFees(data.data);
        } catch (error) {
            console.error('Error fetching available fees:', error);
        }
    }

    const handleSelectDiscountFee = (discountFee: DiscountFee) => {
        const { name, type, percentage, amount } = discountFee;

        const newDiscountFee = {
            name,
            type,
            value: percentage > 0 && percentage !== null ? percentage : amount,
            valueType: percentage > 0 && percentage !== null ? 'percentage' : 'amount',
        };

        if (type === 'discount') {
            setDiscounts((prevDiscounts) => [...prevDiscounts, newDiscountFee]);
        } else {
            setFees((prevFees) => [...prevFees, newDiscountFee]);
        }

        const discountFeeDropdownEl = document.querySelector('#discount_fee_dropdown') as HTMLElement;
        const discountFeeDropdown = KTDropdown.getInstance(discountFeeDropdownEl);
        discountFeeDropdown.hide();
    };

    const handleRemoveFee = (index: number) => {
        const newFees = fees.filter((_, i) => i !== index);
        setFees(newFees);
    };

    const handleRemoveDiscount = (index: number) => {
        const newDiscounts = discounts.filter((_, i) => i !== index);
        setDiscounts(newDiscounts);
    };

    const handleSubmit = async () => {
        setFormData((prev) => ({
            ...prev,
            invoiceDiscounts: discounts,
            invoiceFees: fees,
        }));

        const appliedDiscounts = [...discounts]; // Assuming discounts is already an array
        const appliedFees = [...fees]; // Assuming fees is already an array

        const newInvoice: Invoice = {
            sale_id: saleDetail.id,
            percentage: formData.percentage,
            discountsData: JSON.stringify(appliedDiscounts),
            feesData: JSON.stringify(appliedFees),
        };

        const response = await createInvoice(newInvoice);

        if (response?.success) {
            notify('success', "Payment Invoice Generated Successfully!");

            handleUpdateSale(response.data.sale);

            // Close Modal
            const modalEl = document.querySelector('#generate_invoice_modal') as HTMLElement;
            const modal = KTModal.getInstance(modalEl);

            modal.hide();

            setFees([]);
            setDiscounts([]);
            setFormData((prev) => ({
                ...prev,
                percentage: null
            }));


            navigate('/sales/' + saleDetail.id);
        } else {
            console.log(response);

        }

        console.log(response);
    }

    // Calculate total fees and discounts
    const totalFees = fees.reduce((total, fee) => {
        return total + (fee.valueType === 'percentage' ? fee.value * (saleDetail.total_amount * formData.percentage) : fee.value);
    }, 0);
    const totalDiscounts = discounts.reduce((total, discount) => {
        return total + (discount.valueType === 'percentage' ? discount.value * (saleDetail.total_amount * formData.percentage) : discount.value);
    }, 0);

    return (
        <>
            <div className="modal p-14" data-modal="true" id="generate_invoice_modal">
                <div className="modal-content modal-center-y max-w-4xl max-h-[95%]">
                    <div className="modal-header py-4 px-5">
                        <span className="text-lg text-gray-900 font-bold">Generate Invoice</span>
                        <button
                            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
                            data-modal-dismiss="true"
                        >
                            <i className="ki-filled ki-cross"></i>
                        </button>
                    </div>
                    <div className="modal-body pb-5 scrollable-y">
                        <div className="flex gap-4 mb-4">
                            <div className="card">
                                <div className="card-body">
                                    <table className="table-auto">
                                        <tbody>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                                    Sale No:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    {saleDetail.sales_no}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                                    Total Amount:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    RM {saleDetail.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                                    Balance (Amount):
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    RM {saleDetail.remaining_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                                    Balance (%):
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    {saleDetail.remaining_percentage * 100}%
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="card flex-auto">
                                <div className="card-body">
                                    <div className="flex flex-col">
                                        <span className="text-base text-gray-900 mb-1 font-semibold">{100 - (saleDetail.remaining_percentage * 100)}% Complete</span>
                                        <div className="progress progress-success mb-4">
                                            <div className="progress-bar" style={{
                                                width: `${100 - (saleDetail.remaining_percentage * 100)}%`,
                                                height: '12px'
                                            }}></div>
                                        </div>
                                        <div className="flex flex-wrap gap-4 justify-between">
                                            {[1, 0.5, 0.3, 0.2, 0.1].map(value => (
                                                <button
                                                    key={value}
                                                    className="btn btn-primary btn-outline btn-sm flex-auto w-1/4 flex justify-center"
                                                    data-value={value}
                                                    data-action='percentage'
                                                    onClick={handlePercentageSelect}
                                                    disabled={value > saleDetail.remaining_percentage}
                                                >
                                                    {value * 100}%
                                                </button>
                                            ))}
                                            <button
                                                className="btn btn-primary btn-outline btn-sm flex-auto w-1/4 flex justify-center"
                                                onClick={handleOtherPercentage}
                                            >
                                                ...
                                            </button>
                                        </div>
                                        {formData.percentage &&
                                            <span className="text-lg text-gray-900 font-medium mt-4">
                                                Selected Percentage: {formData.percentage * 100}%
                                            </span>
                                        }
                                    </div>

                                </div>
                            </div>
                        </div>
                        {/* <div className="flex mb-4">
                            <div className="card w-full">
                                <div className="card-body">
                                    <span className="text-md text-gray-600 font-semibold">
                                        Due date policies (4 generation): [ 14 days, 21 days, 1 Month (and Subsequence) ]
                                    </span>
                                </div>
                            </div>
                        </div> */}
                        <div className="flex flex-col mb-8">
                            <div className="flex flex-col mb-4">
                                <div className="flex">
                                    <h2 className="text-lg text-gray-900 font-semibold">Fees and Discounts</h2>
                                </div>
                                <div className="flex gap-4">
                                    <div
                                        className="dropdown mb-2"
                                        data-dropdown="true"
                                        data-dropdown-trigger="click"
                                        id="discount_fee_dropdown"
                                    >
                                        <button
                                            className="dropdown-toggle btn btn-info btn-outline btn-sm"
                                            data-modal-toggle="#add_dis_fee_modal"
                                        >
                                            <i className="ki-outline ki-plus-squared"></i>
                                            Add Discount/Fee
                                        </button>
                                        <div className="dropdown-content w-full max-w-80">
                                            <div className="px-4 pt-4 text-sm text-gray-900 font-medium">
                                                <div className="flex gap-12 mb-4">
                                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                        <input
                                                            className="radio radio-sm"
                                                            name="type"
                                                            type="radio"
                                                            data-type="fee"
                                                            value="fee"
                                                            checked={selectedType === 'fee'}
                                                            onChange={handleChangeType}
                                                        />
                                                        Fee
                                                    </label>
                                                    <label className="form-label flex items-center gap-2.5 text-nowrap">
                                                        <input
                                                            className="radio radio-sm"
                                                            name="type"
                                                            type="radio"
                                                            data-type="discount"
                                                            value="discount"
                                                            checked={selectedType === 'discount'}
                                                            onChange={handleChangeType}
                                                        />
                                                        Discount
                                                    </label>
                                                </div>
                                                <label className="input input-sm">
                                                    <i className="ki-filled ki-magnifier"></i>
                                                    <input
                                                        ref={inputDiscountFeeRef}
                                                        placeholder="Search Discount/Fee"
                                                        type="text"
                                                        value={searchDiscountFeeTerm}
                                                        onChange={handleSearchDiscountFee}
                                                    />
                                                </label>
                                            </div>
                                            <div className="menu menu-default flex flex-col w-full">
                                                {availableDiscountFees.map((availableDiscountFee: DiscountFee, index) => (
                                                    <div className="menu-item" key={index} data-id={availableDiscountFee.id}>
                                                        <button
                                                            className="menu-link"
                                                            data-id={availableDiscountFee.id}
                                                            onClick={() => handleSelectDiscountFee(availableDiscountFee)}
                                                        >
                                                            <span className="menu-title">{availableDiscountFee.name}</span>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4 justify-between">
                                {fees.map((fee, index) => (
                                    <div key={index} className="card flex-auto max-w-[49%] w-1/3">
                                        <div className="card-body">
                                            <div className="flex flex-col">
                                                <span className="text-gray-900 text-base font-medium mb-2">Fee</span>
                                                <div className="flex flex-col">
                                                    <span className="text-base text-gray-900 mb-1">
                                                        Fee Name: {fee.name}
                                                    </span>
                                                    <span className="text-base text-gray-900 mb-1">
                                                        Fee Charge: {fee.valueType === 'percentage' ? `${(fee.value * 100).toFixed(2)}% (RM ${((saleDetail.total_amount * formData.percentage) * fee.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})` : `RM ${fee.value}`}
                                                    </span>
                                                </div>
                                                <div className="flex">
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => handleRemoveFee(index)}
                                                    >
                                                        <i className="ki-outline ki-trash"></i>
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {discounts.map((discount, index) => (
                                    <div key={index} className="card flex-auto max-w-[49%] w-1/3">
                                        <div className="card-body">
                                            <div className="flex flex-col">
                                                <span className="text-gray-900 text-base font-medium mb-2">Discount</span>
                                                <div className="flex flex-col">
                                                    <span className="text-base text-gray-900 mb-1">
                                                        Discount Name: {discount.name}
                                                    </span>
                                                    <span>
                                                        Discount Type: {discount.valueType}
                                                    </span>
                                                    <span className="text-base text-gray-900 mb-1">
                                                        Discount Value: {discount.valueType === 'percentage' ? `${discount.value * 100}% (RM ${((saleDetail.total_amount * formData.percentage) * discount.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})` : `RM ${discount.value}`}
                                                    </span>
                                                </div>
                                                <div className="flex">
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => handleRemoveDiscount(index)}
                                                    >
                                                        <i className="ki-outline ki-trash"></i>
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-lg text-gray-900 font-semibold">Summary</h2>
                            <div className="card mb-4">
                                <div className="card-body">

                                    <table className="table-auto">
                                        <tbody>

                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                                    Bill amount (Before Fee and Discount):
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    RM {(saleDetail.total_amount * formData.percentage).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                                    Total Fees:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    RM {totalFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                                    Total Discount:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    RM {totalDiscounts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                                    Current % Rate:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    {formData.percentage * 100}%
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                                    Balance (Payment) after generated:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    RM {
                                                        (saleDetail.total_amount - (saleDetail.total_amount - saleDetail.remaining_amount) - (saleDetail.total_amount * formData.percentage) - totalDiscounts) < 0
                                                            ? 0
                                                            : (saleDetail.total_amount - (saleDetail.total_amount - saleDetail.remaining_amount) - (saleDetail.total_amount * formData.percentage) - totalDiscounts).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                                    }
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                                    Balance (%) after generated:
                                                </td>
                                                <td className="text-sm text-gray-900 pb-3">
                                                    {(saleDetail.remaining_percentage * 100) - (formData.percentage * 100)}%
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-lg text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                                    Bill amount:
                                                </td>
                                                <td className="text-lg text-gray-900 pb-3 font-semibold">
                                                    RM {((saleDetail.total_amount * formData.percentage) + totalFees - totalDiscounts).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex gap-4 justify-end">
                                <button className="btn btn-light" data-modal-dismiss="true">
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSubmit}
                                >
                                    Generate
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="modal p-14" data-modal="true" id="percentage_modal">
                <div className="modal-content modal-center-y max-w-[1024px] h-[580px] max-h-[580px]">
                    <div className="modal-header py-4 px-5">
                        <span className="text-lg text-gray-900 font-bold">Percentage Detail</span>
                        <button
                            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
                            data-modal-dismiss="true"
                        >
                            <i className="ki-filled ki-cross"></i>
                        </button>
                    </div>
                    <div className="modal-body">

                    </div>
                </div>
            </div>
        </>
    )
}

export default GenerateInvoiceModal;