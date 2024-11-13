import { useEffect } from "react";
import KTComponent, { KTStepper } from "../metronic/core";

function Test() {

    useEffect(() => {
        KTComponent.init();
    });

    const handleGoTo = (step: number) => {
        const stepperEl = document.querySelector('#my_stepper') as HTMLElement;
        const stepper = KTStepper.getInstance(stepperEl);

        // console.log(stepper);
        stepper.go(step);
    }

    return (
        <>
            <form action="#" className="w-full" method="post">
                <div data-stepper="true" id="my_stepper">
                    <div className="card">
                        <div className="card-header flex flex-wrap justify-between items-center gap-4 py-8">
                            <div className="active flex gap-2.5 items-center" data-stepper-item="#stepper_1">
                                <div className="flex flex-col gap-0.5">
                                    <h4 className="text-sm font-medium text-gray-900 stepper-item-completed:text-gray-600 stepper-item-active:text-primary" onClick={() => handleGoTo(1)}>
                                        General
                                    </h4>
                                </div>
                            </div>
                            <div className="flex gap-2.5 items-center" data-stepper-item="#stepper_2">
                                <div className="flex flex-col gap-0.5">
                                    <h4 className="text-sm font-medium text-gray-900 stepper-item-completed:text-gray-600 stepper-item-active:text-primary" onClick={() => handleGoTo(2)}>
                                        Foyer & Entrance
                                    </h4>
                                </div>
                            </div>
                            <div className="flex gap-2.5 items-center" data-stepper-item="#stepper_3">
                                <div className="flex flex-col gap-0.5">
                                    <h4 className="text-sm font-medium text-gray-900 stepper-item-completed:text-gray-600 stepper-item-active:text-primary" onClick={() => handleGoTo(3)}>
                                        Kitchen
                                    </h4>
                                </div>
                            </div>
                            <div className="flex gap-2.5 items-center" data-stepper-item="#stepper_4">
                                <div className="flex flex-col gap-0.5">
                                    <h4 className="text-sm font-medium text-gray-900 stepper-item-completed:text-gray-600 stepper-item-active:text-primary" onClick={() => handleGoTo(4)}>
                                        Yard
                                    </h4>
                                </div>
                            </div>
                            <div className="flex gap-2.5 items-center" data-stepper-item="#stepper_5">
                                <div className="flex flex-col gap-0.5">
                                    <h4 className="text-sm font-medium text-gray-900 stepper-item-completed:text-gray-600 stepper-item-active:text-primary" onClick={() => handleGoTo(5)}>
                                        Living & Dining
                                    </h4>
                                </div>
                            </div>
                            <div className="flex gap-2.5 items-center" data-stepper-item="#stepper_6">
                                <div className="flex flex-col gap-0.5">
                                    <h4 className="text-sm font-medium text-gray-900 stepper-item-completed:text-gray-600 stepper-item-active:text-primary" onClick={() => handleGoTo(6)}>
                                        Balcony
                                    </h4>
                                </div>
                            </div>
                            <div className="flex gap-2.5 items-center" data-stepper-item="#stepper_7">
                                <div className="flex flex-col gap-0.5">
                                    <h4 className="text-sm font-medium text-gray-900 stepper-item-completed:text-gray-600 stepper-item-active:text-primary" onClick={() => handleGoTo(7)}>
                                        Hallway
                                    </h4>
                                </div>
                            </div>
                            <div className="flex gap-2.5 items-center" data-stepper-item="#stepper_8">
                                <div className="flex flex-col gap-0.5">
                                    <h4 className="text-sm font-medium text-gray-900 stepper-item-completed:text-gray-600 stepper-item-active:text-primary" onClick={() => handleGoTo(8)}>
                                        Bedrooms
                                    </h4>
                                </div>
                            </div>
                            <div className="flex gap-2.5 items-center" data-stepper-item="#stepper_9">
                                <div className="flex flex-col gap-0.5">
                                    <h4 className="text-sm font-medium text-gray-900 stepper-item-completed:text-gray-600 stepper-item-active:text-primary" onClick={() => handleGoTo(9)}>
                                        Bathrooms
                                    </h4>
                                </div>
                            </div>
                        </div>
                        <div className="card-body py-16">
                            <div className="" id="stepper_1">
                                <div className="flex items-center justify-center text-3xl font-semibold text-gray-900">
                                    Step 1
                                </div>
                            </div>
                            <div className="hidden" id="stepper_2">
                                <div className="flex items-center justify-center text-3xl font-semibold text-gray-900">
                                    Step 2
                                </div>
                            </div>
                            <div className="hidden" id="stepper_3">
                                <div className="flex items-center justify-center text-3xl font-semibold text-gray-900">
                                    Step 3
                                </div>
                            </div>
                            <div className="hidden" id="stepper_4">
                                <div className="flex items-center justify-center text-3xl font-semibold text-gray-900">
                                    Step 4
                                </div>
                            </div>
                            <div className="hidden" id="stepper_5">
                                <div className="flex items-center justify-center text-3xl font-semibold text-gray-900">
                                    Step 5
                                </div>
                            </div>
                            <div className="hidden" id="stepper_6">
                                <div className="flex items-center justify-center text-3xl font-semibold text-gray-900">
                                    Step 6
                                </div>
                            </div>
                            <div className="hidden" id="stepper_7">
                                <div className="flex items-center justify-center text-3xl font-semibold text-gray-900">
                                    Step 7
                                </div>
                            </div>
                            <div className="hidden" id="stepper_8">
                                <div className="flex items-center justify-center text-3xl font-semibold text-gray-900">
                                    Step 8
                                </div>
                            </div>
                            <div className="hidden" id="stepper_9">
                                <div className="flex items-center justify-center text-3xl font-semibold text-gray-900">
                                    Step 9
                                </div>
                            </div>
                        </div>
                        {/* <div className="card-footer py-8 flex justify-between">
                            <div>
                                <button className="btn btn-light stepper-first:hidden" data-stepper-back="true">
                                    Back
                                </button>
                            </div>
                            <div>
                                <button className="btn btn-light stepper-last:hidden" data-stepper-next="true">
                                    Next
                                </button>
                                <button className="btn btn-primary hidden stepper-last:inline-flex">
                                    Submit
                                </button>
                            </div>
                        </div> */}
                        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2">
                            <button
                                className="btn btn-lg btn-secondary rounded-3xl shadow-lg mr-4 stepper-first:hidden"
                                data-stepper-back="true"
                            // onClick={handleResetForm}
                            >
                                Back
                            </button>

                            <button
                                className="btn btn-lg btn-primary rounded-3xl shadow-lg stepper-last:hidden"
                                data-stepper-next="true"
                            // onClick={handleReadyToSubmit}
                            >
                                Next
                            </button>
                            <button
                                className="btn btn-lg btn-primary rounded-3xl shadow-lg hidden stepper-last:inline-flex"
                            // onClick={handleReadyToSubmit}
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </>

    );

}

export default Test;