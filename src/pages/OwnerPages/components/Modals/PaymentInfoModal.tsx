import React from 'react'

function PaymentInfoModal() {
    return (
        <div className="modal p-6 text-xs" data-modal="true" id="payment_info_modal">
            <div className="modal-content modal-center-y max-h-[95%] bg-white rounded-lg shadow-xl">
                <div className="modal-header p-1 px-3 border-b border-gray-200 flex justify-between items-center">
                    <span className="text-sm text-gray-900 font-bold">Payment Information</span>
                    <button
                        className="btn btn-sm btn-icon btn-light btn-clear shrink-0 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700"
                        data-modal-dismiss="true"
                    >
                        <i className="ki-filled ki-cross text-xl"></i>
                    </button>
                </div>
                <div className="modal-body overflow-y-auto scrollable-y flex flex-col gap-6 justify-center my-2">
                    <div className="modal-title text-left text-xs">
                        Easy Monthly Plan – Terms & Conditions
                    </div>

                    <div className="text-gray-800 text-left text-2xs">
                        <ol className="list-decimal list-inside space-y-2 leading-tight">
                            <li>All EPP applications are subject to bank approval.</li>
                            <li>Participating banks, tenure options, and service fee rates are determined by the respective banks and may change without prior notice.</li>
                            <li>
                                EPP is offered in <strong>fixed tiers</strong> only. Any remaining amount must be paid via <strong>bank transfer or other methods</strong>.<br />
                                <span className="italic">Example: For RM27,000 total, if RM25,000 is the EPP tier, RM2,000 is payable separately.</span>
                            </li>
                            <li>We reserve the <strong>right to offer, modify, or cancel</strong> the EPP at our sole discretion.</li>
                            <li><strong>60-month plans</strong> are available from <strong>Ambank</strong> and <strong>Hong Leong Bank</strong> (min. spend: RM5,000–RM6,000).</li>
                            <li><strong>36-month plans</strong> are available from <strong>Maybank, Public Bank, UOB, RHB, OCBC, Affin Bank, and Hong Leong Bank.</strong></li>
                        </ol>
                    </div>

                    <div className="flex gap-4 justify-center">
                        <button
                            className="btn btn-secondary btn-sm"
                            data-modal-dismiss="true"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PaymentInfoModal