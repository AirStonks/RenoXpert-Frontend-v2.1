import { useState } from "react";
import InputFieldGroup from "../../../components/Forms/TextFields/InputFieldGroup";
import Dropdown from "../../../components/Forms/Dropdown/Dropdown";
import { Slide, toast } from "react-toastify";

interface NewPaymentDetailModalProps {
    invoiceId: number | null;
}

const initFormData = {
    transaction_no: '',
    payment_method: '',
    payment_channel: '',
    payment_date: '',
    receive_account: '',
    remark: '',
    bank: '',
}

const paymentOptions = {
    online: [
        { value: "credit_card", label: "Credit Card" },
        { value: "epp", label: "EPP" },
        { value: "bank_transfer", label: "Bank Transfer" },
        { value: "fpx", label: "FPX" },
        { value: "e_wallet", label: "E-Wallet" },
    ],
    offline: [
        { value: "cash", label: "Cash" },
    ],
};

const maxFiles = 10;

function NewPaymentDetailModal({ invoiceId }: NewPaymentDetailModalProps) {

    const [formData, setFormData] = useState(initFormData);
    const [pendingUploadItems, setPendingUploadItems] = useState<File[]>([]);
    const [dragging, setDragging] = useState(false);
    const [documentItems, setDocumentItems] = useState<[]>([]);

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === 'payment_channel') {
            if (value === 'online') {
                setFormData((prevData) => ({
                    ...prevData,
                    payment_method: 'credit_card',
                }));
            } else if (value === 'offline') {
                setFormData((prevData) => ({
                    ...prevData,
                    payment_method: 'cash',
                }));
            }
        }

        setFormData((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(event.target.files ?? []);

        // Filter for image files based on MIME types
        const imageFiles = selectedFiles.filter(file =>
            ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'].includes(file.type)
        );

        const newPendingUploadItems = [...pendingUploadItems, ...imageFiles];

        if (newPendingUploadItems.length + documentItems.length > maxFiles) {
            notify('error', `You can only upload up to ${maxFiles} files.`);
            return;
        }

        if (imageFiles.length < selectedFiles.length) {
            notify('error', 'Only image files are allowed.');
        }

        setPendingUploadItems(newPendingUploadItems);
    };

    // Handle drag over event
    const handleDragOver = (event) => {
        event.preventDefault();
        setDragging(true); // Set dragging state to true when dragging over
    };

    // Handle drag leave event
    const handleDragLeave = () => {
        setDragging(false); // Set dragging state to false when dragging leaves
    };

    // Handle drop event
    const handleDrop = (event) => {
        event.preventDefault();
        const droppedFiles = event.dataTransfer.files;

        // Filter for image files based on MIME types
        // const imageFiles = Array.from(droppedFiles).filter(file =>
        //     ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'].includes(file.type)
        // );

        if (pendingUploadItems.length + droppedFiles.length + documentItems.length <= maxFiles) {
            if (droppedFiles.length > 0) {
                setPendingUploadItems((prevItems) => [
                    ...prevItems,
                    ...droppedFiles,
                ]);
            } else {
                notify('error', 'Only image files are allowed.');
            }
        } else {
            notify('error', `You can only upload up to ${maxFiles} files.`);
        }
        setDragging(false); // Reset dragging state when drop occurs
    };

    const removeFile = (index) => {
        setPendingUploadItems((prevItems) => prevItems.filter((_, i) => i !== index));
    };

    const formatFileSize = (size: number) => {
        const KB = 1024;
        const MB = KB * 1024;
        if (size >= MB) {
            return `${(size / MB).toFixed(2)} MB`;
        }
        return `${(size / KB).toFixed(2)} KB`;
    };

    const formValidation = () => {
        //
    }

    const handleSubmit = async () => {
        //
    }

    return (
        <>
            <div className="modal p-14" data-modal="true" data-modal-backdrop-static="true" data-modal-keyboard="false" id="new_payment_detail_modal">
                <div className="modal-content modal-center-y max-w-xl max-h-[95%]">
                    <div className="modal-header py-4 px-5">
                        <span className="text-lg text-gray-900 font-bold">New Payment Detail</span>
                        <button
                            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
                            data-modal-toggle="#payment_invoice_modal"
                            onClick={() => setFormData(initFormData)}
                        >
                            <i className="ki-filled ki-cross"></i>
                        </button>
                    </div>
                    <div className="modal-body pb-5 scrollable-y">
                        {/* Transaction No */}
                        <InputFieldGroup
                            fieldTitle="Transaction No."
                            description="The payment transaction number for this invoice"
                            placeholder="ABC123"
                            type="text"
                            name="transaction_no"
                            value={formData.transaction_no}
                            onChange={handleChange}
                        />

                        {/* Payment Channel */}
                        <div className="flex flex-col mb-8">
                            <label className='mb-2 text-sm font-medium text-gray-900'>
                                Payment Channel
                            </label>

                            <span className="text-xs text-gray-600 tracking-wide mb-4">
                                Select a payment channel for this invoice.
                            </span>
                            <div className="flex flex-col items-start gap-4">
                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                    <input
                                        className="radio"
                                        name="payment_channel"
                                        type="radio"
                                        value="online"
                                        checked={formData.payment_channel === 'online'}
                                        onChange={handleChange}
                                    />
                                    Online
                                </label>
                                <label className="form-label flex items-center gap-2.5 text-nowrap">
                                    <input
                                        className="radio"
                                        name="payment_channel"
                                        type="radio"
                                        value="offline"
                                        checked={formData.payment_channel === 'offline'}
                                        onChange={handleChange}
                                    />
                                    Offline
                                </label>
                            </div>
                        </div>

                        {formData.payment_channel != '' && (
                            <>
                                {/* Payment Method */}
                                <div className="flex flex-col mb-8">
                                    <label className='mb-2 text-sm font-medium text-gray-900'>
                                        Payment Method
                                    </label>

                                    <span className="text-xs text-gray-600 tracking-wide mb-2">
                                        Select a payment method for this invoice.
                                    </span>

                                    <Dropdown
                                        options={formData.payment_channel === "online" ? paymentOptions.online : paymentOptions.offline}
                                        name="payment_method"
                                        value={formData.payment_method}
                                        onChange={handleChange}
                                    />
                                </div>

                                {/* Payment Date */}
                                <div className="flex flex-col mb-8">
                                    <label className='mb-2 text-sm font-medium text-gray-900'>
                                        Payment Date
                                    </label>

                                    <span className="text-xs text-gray-600 tracking-wide mb-4">
                                        Select a date of when the payment was made.
                                    </span>
                                    <input
                                        type="date"
                                        name="payment_date"
                                        className="input input-sm"
                                        value={formData.payment_date || ''}
                                        onChange={handleChange}
                                    />
                                </div>

                                {/* Bank */}
                                <div className="flex flex-col mb-8">
                                    <label className='mb-2 text-sm font-medium text-gray-900'>
                                        Bank
                                    </label>

                                    <span className="text-xs text-gray-600 tracking-wide mb-2">
                                        Select a bank for this invoice.
                                    </span>

                                    <Dropdown
                                        options={[
                                            { value: "", label: "Select a bank" },
                                            { value: "Affin Bank Berhad", label: "Affin Bank Berhad" },
                                            { value: "Affin Islamic Bank Berhad", label: "Affin Islamic Bank Berhad" },
                                            { value: "Alliance Bank Malaysia Berhad", label: "Alliance Bank Malaysia Berhad" },
                                            { value: "Alliance Islamic Bank Malaysia Berhad", label: "Alliance Islamic Bank Malaysia Berhad" },
                                            { value: "Al Rajhi Banking & Investment Corporation (Malaysia) Berhad", label: "Al Rajhi Banking & Investment Corporation (Malaysia) Berhad" },
                                            { value: "AmBank (M) Berhad", label: "AmBank (M) Berhad" },
                                            { value: "Bank Islam Malaysia Berhad", label: "Bank Islam Malaysia Berhad" },
                                            { value: "Bank Muamalat Malaysia Berhad", label: "Bank Muamalat Malaysia Berhad" },
                                            { value: "Bank of China (Malaysia) Berhad", label: "Bank of China (Malaysia) Berhad" },
                                            { value: "Bank SimpananNasional", label: "Bank SimpananNasional" },
                                            { value: "CIMB Bank Berhad", label: "CIMB Bank Berhad" },
                                            { value: "CIMB Islamic Bank Berhad", label: "CIMB Islamic Bank Berhad" },
                                            { value: "Citibank Berhad", label: "Citibank Berhad" },
                                            { value: "Hong Leong Bank Berhad", label: "Hong Leong Bank Berhad" },
                                            { value: "Hong Leong Islamic Bank Berhad", label: "Hong Leong Islamic Bank Berhad" },
                                            { value: "HSBC Amanah Malaysia Berhad", label: "HSBC Amanah Malaysia Berhad" },
                                            { value: "HSBC Bank Malaysia Berhad", label: "HSBC Bank Malaysia Berhad" },
                                            { value: "Kuwait Finance House", label: "Kuwait Finance House" },
                                            { value: "OCBC Bank (Malaysia) Berhad", label: "OCBC Bank (Malaysia) Berhad" },
                                            { value: "Public Bank Berhad", label: "Public Bank Berhad" },
                                            { value: "RHB Bank Berhad", label: "RHB Bank Berhad" },
                                            { value: "RHB Islamic Berhad", label: "RHB Islamic Berhad" },
                                            { value: "Standard Chartered Bank Malaysia Berhad", label: "Standard Chartered Bank Malaysia Berhad" },
                                            { value: "United Overseas Bank (Malaysia) Berhad", label: "United Overseas Bank (Malaysia) Berhad" },
                                        ]}
                                        name="payment_method"
                                        value={formData.payment_method}
                                        onChange={handleChange}
                                    />
                                </div>

                                {/* Receiving Account */}
                                <div className="flex flex-col mb-8">
                                    <label className='mb-2 text-sm font-medium text-gray-900'>
                                        Receiving Account
                                    </label>

                                    <span className="text-xs text-gray-600 tracking-wide mb-2">
                                        The receiving account for this invoice.
                                    </span>

                                    <Dropdown
                                        options={[
                                            { value: "", label: "Select an account" },
                                            { value: "BeLive", label: "BeLive" },
                                            { value: "Smart Living", label: "Smart Living" },
                                        ]}
                                        name="receive_account"
                                        value={formData.receive_account}
                                        onChange={handleChange}
                                    />
                                </div>

                                {/* Remark */}
                                <div className="flex flex-col mb-8">
                                    <label className='mb-2 text-sm font-medium text-gray-900'>
                                        Remark (Optional)
                                    </label>
                                    <span className="text-xs text-gray-600 tracking-wide mb-2">
                                        Remark for this invoice.
                                    </span>
                                    <textarea
                                        className="textarea"
                                        name="remark"
                                        placeholder="Remark"
                                        rows={5}
                                        onChange={handleChange}
                                        value={formData.remark || ''}
                                    >
                                    </textarea>
                                </div>

                                {/* Attachments */}
                                <div className="flex flex-col mb-8">
                                    <label className='mb-2 text-sm font-medium text-gray-900'>
                                        Attachments
                                    </label>

                                    <span className="text-xs text-gray-600 tracking-wide mb-4">
                                        Upload files to attach to this invoice.
                                    </span>

                                    <label
                                        className={`flex bg-center w-full p-1 lg:p-2 bg-no-repeat bg-[length:550px] border border-gray-300 rounded-xl border-dashed branding-bg mb-4 
                                    ${dragging ? 'border-primary border-1 bg-gray-100' : ''}`} // Add custom styles when dragging
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        htmlFor="file-upload"
                                    >
                                        <div className="flex flex-col place-items-center place-content-center text-center rounded-xl w-full cursor-pointer">
                                            <div className="flex items-center mb-2.5">
                                                <div className="relative size-11 shrink-0">
                                                    <svg
                                                        className="w-full h-full stroke-brand-clarity fill-light"
                                                        fill="none"
                                                        height="48"
                                                        viewBox="0 0 44 48"
                                                        width="44"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                    >
                                                        <path d="M16 2.4641C19.7128 0.320509 24.2872 0.320508 28 2.4641L37.6506 8.0359C41.3634 10.1795 43.6506 14.141 43.6506 18.4282V29.5718C43.6506 33.859 41.3634 37.8205 37.6506 39.9641L28 45.5359C24.2872 47.6795 19.7128 47.6795 16 45.5359L6.34937 39.9641C2.63655 37.8205 0.349365 33.859 0.349365 29.5718V18.4282C0.349365 14.141 2.63655 10.1795 6.34937 8.0359L16 2.4641Z" fill=""></path>
                                                        <path d="M16.25 2.89711C19.8081 0.842838 24.1919 0.842837 27.75 2.89711L37.4006 8.46891C40.9587 10.5232 43.1506 14.3196 43.1506 18.4282V29.5718C43.1506 33.6804 40.9587 37.4768 37.4006 39.5311L27.75 45.1029C24.1919 47.1572 19.8081 47.1572 16.25 45.1029L6.59937 39.5311C3.04125 37.4768 0.849365 33.6803 0.849365 29.5718V18.4282C0.849365 14.3196 3.04125 10.5232 6.59937 8.46891L16.25 2.89711Z" stroke="" strokeOpacity="0.2"></path>
                                                    </svg>
                                                    <div className="absolute leading-none left-2/4 top-2/4 -translate-y-2/4 -translate-x-2/4">
                                                        <i className="ki-filled ki-picture text-xl ps-px text-brand"></i>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Input for file selection */}
                                            <input
                                                type="file"
                                                id="file-upload"
                                                multiple
                                                onChange={handleFileSelect}
                                                className="hidden"
                                            />
                                            <span
                                                className="text-gray-900 text-xs font-medium hover:text-primary-active mb-px cursor-pointer"
                                            >
                                                Click or Drag & Drop
                                            </span>

                                            <span className="text-2xs text-gray-700 text-nowrap">
                                                max size: 50MB | max files: {maxFiles}
                                            </span>
                                        </div>
                                    </label>

                                    {pendingUploadItems.length > 0 && (
                                        <div className="flex flex-col gap-4 mb-8">
                                            {pendingUploadItems.map((file, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between flex-wrap grow border border-gray-200 rounded-xl gap-2 px-3.5 py-2.5 relative" // Add 'relative' for positioning the button
                                                >
                                                    <div className="flex items-center flex-wrap gap-3.5">
                                                        <div className="relative size-[50px] shrink-0">
                                                            <svg
                                                                className="w-full h-full stroke-gray-300 fill-gray-100"
                                                                fill="none"
                                                                height="48"
                                                                viewBox="0 0 44 48"
                                                                width="44"
                                                                xmlns="http://www.w3.org/2000/svg"
                                                            >
                                                                <path d="M16 2.4641C19.7128 0.320509 24.2872 0.320508 28 2.4641L37.6506 8.0359C41.3634 10.1795 43.6506 14.141 43.6506 18.4282V29.5718C43.6506 33.859 41.3634 37.8205 37.6506 39.9641L28 45.5359C24.2872 47.6795 19.7128 47.6795 16 45.5359L6.34937 39.9641C2.63655 37.8205 0.349365 33.859 0.349365 29.5718V18.4282C0.349365 14.141 2.63655 10.1795 6.34937 8.0359L16 2.4641Z" fill=""></path>
                                                                <path d="M16.25 2.89711C19.8081 0.842838 24.1919 0.842837 27.75 2.89711L37.4006 8.46891C40.9587 10.5232 43.1506 14.3196 43.1506 18.4282V29.5718C43.1506 33.6804 40.9587 37.4768 37.4006 39.5311L27.75 45.1029C24.1919 47.1572 19.8081 47.1572 16.25 45.1029L6.59937 39.5311C3.04125 37.4768 0.849365 33.6803 0.849365 29.5718V18.4282C0.849365 14.3196 3.04125 10.5232 6.59937 8.46891L16.25 2.89711Z" stroke=""></path>
                                                            </svg>
                                                            <div className="absolute leading-none start-2/4 top-2/4 -translate-y-2/4 -translate-x-2/4 rtl:translate-x-2/4">
                                                                <i className="ki-filled ki-sms text-xl text-gray-500"></i>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <a
                                                                className="text-sm font-medium text-gray-900 hover:text-primary-active mb-px"
                                                                href={URL.createObjectURL(file)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                {file.name}
                                                            </a>
                                                            <span className="text-2sm text-gray-700">
                                                                {formatFileSize(file.size)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* 'X' Button */}
                                                    <button
                                                        className="absolute top-2 right-2 text-md text-red-600 hover:text-red-800"
                                                        onClick={() => removeFile(index)}
                                                    >
                                                        <i className="ki-filled ki-cross text-md text-red-600 hover:text-red-800"></i>
                                                    </button>
                                                </div>
                                            ))}

                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

export default NewPaymentDetailModal;