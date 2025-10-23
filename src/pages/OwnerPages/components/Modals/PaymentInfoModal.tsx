import React from 'react'


function PaymentInfoModal({ paymentMethod = 'normal' }) {
    const renderTnCSection = () => {
        switch (paymentMethod) {
            case 'rnpl':
                return (
                    <div className="text-gray-800 text-left text-2xs">
                        <div className="font-bold mb-3">3.B RenoNow PayLater Method</div>
                        <ol className="list-decimal list-inside space-y-2 leading-tight">
                            <li><strong>Initial Down Payment:</strong> The Owner shall pay the upfront down payment as stated in the quotation upon signing of this quotation. No renovation or procurement works shall commence until the Initial Down Payment has been received in full.</li>
                            <li><strong>Deferred Balance & Rental Deduction Mechanism:</strong>
                                <ol className="list-decimal list-inside ml-4 mt-2 space-y-1">
                                    <li>The remaining renovation balance shall be recovered by Company through monthly deductions from the gross rental proceeds collected under the Owner Collaboration Agreement.</li>
                                    <li>The Owner hereby irrevocably authorises Company to deduct the agreed monthly repayment directly from rental income before remitting the balance to the Owner.</li>
                                    <li>Monthly deductions shall commence from the first month in which the Property generates rental income under Company's management.</li>
                                    <li>Any month without rental income shall not waive or extinguish the payment obligation; such instalments shall automatically carry forward and be recovered from subsequent months or directly from the Owner upon demand.</li>
                                </ol>
                            </li>
                            <li><strong>Repayment Duration and Liability:</strong>
                                <ol className="list-decimal list-inside ml-4 mt-2 space-y-1">
                                    <li>The Deferred Balance shall be repaid in full within the agreed repayment period stated in the quotation.</li>
                                    <li>The Owner remains wholly liable for the entire Deferred Balance, irrespective of tenancy turnover, vacancy periods, or temporary rental shortfall.</li>
                                    <li>Upon termination, sale, or transfer of ownership of the Property, all outstanding Deferred Balance shall become immediately due and payable in full.</li>
                                </ol>
                            </li>
                            <li><strong>Exclusive Management & Rental Control:</strong> During the Repayment Period, the Owner shall not rent, market, or manage the Property through any third party or directly without Company's written consent.</li>
                            <li><strong>Payment Default and Enforcement:</strong> Any unpaid instalment outstanding for more than fourteen (14) days shall accrue interest at eight percent (8%) per annum until full payment.</li>
                            <li><strong>Non-Refundability:</strong> All payments made under this quotation shall be deemed irrevocably earned and strictly non-refundable, including in cases of Owner's withdrawal, termination of engagement, or vacancy of the property for any reason.</li>
                            <li><strong>Retention of Title:</strong> All furniture, fixtures, and installations supplied under this arrangement shall remain the sole and exclusive property of Company until the full Deferred Balance is received and settled.</li>
                        </ol>
                    </div>
                )
            case 'bePowered':
                return (
                    <div className="text-gray-800 text-left text-2xs">
                        <div className="font-bold mb-3">3.C Payment Terms – Reno Subscription Method (60-Month Tenure)</div>
                        <ol className="list-decimal list-inside space-y-2 leading-tight">
                            <li><strong>Initial Down Payment:</strong> The Owner shall pay the agreed upfront down payment as stated in the quotation upon signing of this quotation. No renovation, furnishing, or procurement works shall commence until full payment of the Initial Down Payment and fulfilment of all commencement conditions.</li>
                            <li><strong>Subscription Tenure and Fixed Monthly Payment:</strong>
                                <ol className="list-decimal list-inside ml-4 mt-2 space-y-1">
                                    <li>The remaining renovation balance shall be payable by the Owner to Company in sixty (60) consecutive fixed monthly instalments as specified in the quotation.</li>
                                    <li>Each Subscription Payment shall be due on the same calendar date of every month, commencing from the month following the handover or issuance of the completion notice, whichever occurs first.</li>
                                    <li>The Subscription Payments are fixed and shall not vary regardless of the Property's rental income, occupancy rate, or tenancy status.</li>
                                </ol>
                            </li>
                            <li><strong>Authorisation for Automatic Deduction:</strong>
                                <ol className="list-decimal list-inside ml-4 mt-2 space-y-1">
                                    <li>The Owner irrevocably authorises Company to deduct each monthly Subscription Payment directly from the rental proceeds collected under the Owner Collaboration Agreement, prior to releasing any balance to the Owner.</li>
                                    <li>In months where the rental proceeds are insufficient to cover the due Subscription Payment, the Owner shall settle the shortfall directly to Company within seven (7) calendar days of written notice.</li>
                                    <li>Any outstanding balance shall automatically carry forward and be recoverable from subsequent rental proceeds or direct payments without prejudice to Company's rights to enforce full recovery.</li>
                                </ol>
                            </li>
                            <li><strong>Owner's Commitment and Continuing Liability:</strong>
                                <ol className="list-decimal list-inside ml-4 mt-2 space-y-1">
                                    <li>The Owner acknowledges that this Subscription arrangement constitutes a fixed payment obligation, not a profit-sharing or rental-dependent scheme.</li>
                                    <li>The Owner shall remain fully liable for all Subscription Payments throughout the 60-month tenure, irrespective of occupancy rate, vacancy, tenant behaviour, or rental performance.</li>
                                    <li>In the event of any sale, transfer of ownership, or early termination of the OCA, all remaining unpaid Subscription Payments shall become immediately due and payable in full.</li>
                                </ol>
                            </li>
                            <li><strong>Default and Enforcement:</strong> Any Subscription Payment not received within fourteen (14) days of its due date shall accrue interest at eight percent (8%) per annum until full settlement.</li>
                            <li><strong>Retention of Title and Ownership:</strong> All furniture, fixtures, fittings, and materials installed or supplied under the Reno Subscription program shall remain the sole and exclusive property of Company until the Owner has fully settled all 60 Subscription Payments and any outstanding charges, fees, or penalties.</li>
                            <li><strong>Non-Refundability and Termination:</strong> All payments made under this quotation are strictly non-refundable and deemed earned for services rendered or work completed. Should the Owner terminate the collaboration or transfer management before the expiry of the 60-month Subscription tenure, all remaining unpaid Subscription Payments shall become immediately due in full.</li>
                        </ol>
                    </div>
                )
            default:
                return (
                    <div className="text-gray-800 text-left text-2xs">
                        <div className="font-bold mb-3">3.A Full Payment (50–50 Method)</div>
                        <ol className="list-decimal list-inside space-y-2 leading-tight">
                            <li>The Owner agrees to pay the total renovation contract sum in two (2) equal instalments of fifty percent (50%) each, in accordance with the following schedule:
                                <ol className="list-decimal list-inside ml-4 mt-2 space-y-1">
                                    <li><strong>First 50% (Downpayment):</strong> Payable upon signing of this quotation and before commencement of Phase 1 works.</li>
                                    <li><strong>Second 50%:</strong> Payable upon completion of Phase 1 works (wiring, painting, and installation of smart devices) and before commencement of Phase 2 works (installation of built-in furniture, kitchen cabinets, wardrobes, beds, and other fittings).</li>
                                </ol>
                            </li>
                            <li>The Company shall issue progress notifications, site updates, and photographic evidence (where applicable) to the Owner before requesting each milestone payment.</li>
                            <li>The Company shall not be obliged to commence or continue any work unless and until the respective milestone payment has been received in full. Any delay in payment shall automatically entitle the Company to suspend work, extend the renovation period without penalty, and reschedule activities on a best-effort basis.</li>
                            <li>If the Owner fails to make any due payment within three (3) working days of notification, the Company reserves the right to:
                                <ol className="list-decimal list-inside ml-4 mt-2 space-y-1">
                                    <li>Suspend all works on-site without liability;</li>
                                    <li>Impose compensation for idle manpower, material storage, or project rescheduling costs; and</li>
                                    <li>Recover from the Owner any additional expenses, damages, or losses arising directly or indirectly from the delay.</li>
                                </ol>
                            </li>
                            <li>All payments made by the Owner to the Company shall be deemed fully earned and are strictly non-refundable, including in cases of cancellation, withdrawal, or termination by the Owner after the commencement of any preparatory or renovation works.</li>
                            <li>Payments may be made via bank transfer, FPX, or credit/debit card. A two percent (2%) administrative fee applies for credit/debit card transactions, and all bank, gateway, or financing charges (including Easy Payment Plan or similar schemes) shall be borne solely by the Owner.</li>
                            <li><strong>Default Interest Rate:</strong> Any overdue payment shall accrue interest at eight percent (8%) per annum from the due date until full settlement.</li>
                            <li><strong>Retention of Title:</strong> Ownership and legal title to all furniture, fixtures, fittings, and materials supplied or installed under this quotation shall remain vested exclusively in the Company until full and final settlement of all sums due and payable.</li>
                        </ol>
                    </div>
                )
        }
    }

    return (
        <div className="modal p-6 text-xs" data-modal="true" id="payment_info_modal">
            <div className="modal-content modal-center-y max-h-[95%] max-w-4xl bg-white rounded-lg shadow-xl">
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
                    

                    {renderTnCSection()}

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