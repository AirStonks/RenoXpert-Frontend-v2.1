import React from 'react'
import POPropertyView from './components/POPropertyView'

function POPropertyOverview() {
    return (
        <>
            <div className="flex justify-between items-center flex-wrap mb-6">
                <div className="flex gap-4 items-center">
                    <span className="text-2xl font-bold text-gray-900">
                        PO Property Overview
                    </span>
                </div>
                {/* <div className="flex">
                <label className="switch flex justify-center">
                    <input
                        name="advanceTableMode"
                        type="checkbox"
                        checked={advanceTableMode}
                        onChange={toggleTableMode}
                    />
                    <span className="text-gray-900">
                        Switch to Advance Table Mode
                    </span>
                </label>
            </div> */}
            </div>

            <POPropertyView />
        </>
    )
}

export default POPropertyOverview