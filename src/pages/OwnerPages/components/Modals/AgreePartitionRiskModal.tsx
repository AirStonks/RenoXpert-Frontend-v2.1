import React from 'react'
import { KTModal } from '../../../../metronic/core';

interface AgreePartitionRiskModalProps {
    onChange: (isAgree: boolean) => void
}

function AgreePartitionRiskModal({ onChange }: AgreePartitionRiskModalProps) {

    const agreePartitonRisk = (agreeMode: 'decline' | 'agree') => {
        if (agreeMode === 'decline') {
            onChange(false);
        }

        if (agreeMode === 'agree') {
            const modalEl = document.querySelector('#agree_partition_risk_modal') as HTMLElement;
            const modal = KTModal.getInstance(modalEl);
            modal.hide();
            onChange(true);
        }
    }

    return (
        <div className="modal p-6 text-xs" data-modal="true" id="agree_partition_risk_modal">
            <div className="modal-content modal-center-y max-h-[90%] max-w-2xl bg-white rounded-lg shadow-xl">
                <div className="modal-header p-1 px-3 border-b border-gray-200 flex justify-between items-center">
                    <span className="text-sm text-gray-900 font-bold">Understand and Acknowledgement</span>
                    <button
                        className="btn btn-sm btn-icon btn-light btn-clear shrink-0 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700"
                        data-modal-dismiss="true"
                    >
                        <i className="ki-filled ki-cross text-xl"></i>
                    </button>
                </div>
                <div className="modal-body overflow-y-auto scrollable-y flex flex-col gap-6 my-2">
                    <div className="text-gray-800 text-left text-2xs space-y-4">
                        <p>
                            Partitioning a unit — such as converting part of the living or common area into an additional rentable room — is a common approach adopted by many property investors to enhance rental yield through co-living arrangements.
                        </p>
                        <p>
                            While this method is widely practiced and the associated risks are generally manageable, it is important to be transparent and make owners aware of the following:
                        </p>
                        <p>
                            <ol className='my-2 space-y-4'>
                                <li>
                                    <strong>1. Condominium House Rules</strong>
                                    <p className='my-1'>
                                        Some condominiums expressly prohibit room partitioning under their strata by-laws. If partitioning is found to breach these rules, the management may:
                                        <ol className='list-disc list-inside indent-4 my-2 space-y-1'>
                                            <li>Withhold the renovation deposit</li>
                                            <li>Instruct the owner to dismantle the partition</li>
                                            <li>Impose penalties or administrative charges</li>
                                        </ol>
                                    </p>
                                </li>
                                <li>
                                    <strong>2. Inspection Waiver Risk</strong>
                                    <p className='my-1'>
                                        If the owner chooses not to request a post-renovation inspection by the building management, the renovation deposit will be deemed forfeited regardless of compliance.
                                    </p>
                                </li>
                                <li>
                                    <strong>3. Future Enforcement Risk</strong>
                                    <p className="my-1">
                                        Local authorities (e.g. DBKL) have issued directives discouraging partitioning in stratified residential units. Although enforcement is not consistent, future regulatory changes may result in a requirement to dismantle existing partitions.
                                    </p>
                                </li>
                                <li>
                                    <strong>4. Cost of Dismantling</strong>
                                    <p className='my-1'>
                                        In the event removal is required, the cost of dismantling partitions is generally low and does not involve major structural work.
                                    </p>
                                </li>
                            </ol>
                        </p>
                        <p>
                            While the benefits of partitioning in terms of rental return often outweigh these risks, it is important that owners proceed with full awareness.
                        </p>
                        <p>
                            By acknowledging this statement, the owner confirms understanding of the above and accepts responsibility for any consequences that may arise now or in the future.
                        </p>
                    </div>

                    <div className="flex gap-4 justify-end">
                        <button
                            className="btn btn-secondary btn-sm"
                            data-modal-dismiss="true"
                            onClick={() => agreePartitonRisk('decline')}
                        >
                            Decline
                        </button>
                        <button
                            className="btn btn-success btn-sm"
                            onClick={() => agreePartitonRisk('agree')}
                        >
                            Agree
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AgreePartitionRiskModal