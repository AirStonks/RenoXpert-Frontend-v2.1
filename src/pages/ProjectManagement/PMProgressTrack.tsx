import React, { useEffect } from 'react'
import PMAdvanceTable from './components/PMAdvanceTable'

function PMProgressTrack() {

    useEffect(() => {
        document.title = "Project Overview | RenoXpert";
    }, []);

    return (
        <>
            <div className="flex justify-between items-center flex-wrap mb-6">
                <div className="flex gap-4 items-center">
                    <span className="text-2xl font-bold text-gray-900">
                        Project Progress Tracker
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

            <PMAdvanceTable />
        </>
    )
}

export default PMProgressTrack