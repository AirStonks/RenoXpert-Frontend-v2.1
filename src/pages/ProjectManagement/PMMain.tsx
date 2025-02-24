import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { changeRenoProgressEndDate, changeRenoProgressStartDate, renoProgressIndex } from "../../services/api";
import { RenoProgress } from "../../types";
import { Slide, toast } from "react-toastify";
import Loading from "../../components/Loading";
import PMAdvanceTable from "./components/PMAdvanceTable";
import PMTable from "./components/PMTable";

function PMMain() {

    const [advanceTableMode, setAdvanceTableMode] = useState<boolean>(() => {
        return localStorage.getItem("advanceTableMode") === "true";
    });


    // const [selectedProduct, setSelectedProduct] = useState<{ id: number | string, name: s

    const toggleTableMode = () => {
        setAdvanceTableMode((prevMode) => {
            const newMode = !prevMode;
            localStorage.setItem("advanceTableMode", JSON.stringify(newMode));
            return newMode;
        });
    };


    useEffect(() => {
        document.title = "Project Management | RenoXpert";
    }, []);

    return (
        <>
            <div className="flex justify-between items-center flex-wrap mb-6">
                <div className="flex gap-4 items-center">
                    <span className="text-2xl font-bold text-gray-900">
                        Project Management
                    </span>
                </div>
                <div className="flex">
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
                </div>
            </div>

            {advanceTableMode ?
                <PMAdvanceTable />
                :
                <PMTable />
            }
        </>
    )
}

export default PMMain;