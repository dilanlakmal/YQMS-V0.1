import { useState } from "react";
import { cn } from "../utils/cn";
import { BsMicrosoftTeams } from "react-icons/bs";
import { MdInsertPageBreak } from "react-icons/md";
import { FaLanguage } from "react-icons/fa";
import { GiProcessor } from "react-icons/gi";

function ProductionInstructionServices() {
    const [teams, setTeams] = useState([
        {
            name: "GPRT0007C"
        },
        {
            name: "GRX"
        }
    ]);
    const [currentStep, setCurrentStep] = useState(0);
    const steps = [
        {
            step: "Select Team",
            progressBar: 10,
            icon: <BsMicrosoftTeams className="w-full h-full"/>
        },
        {
            step: "Insert PDF", 
            progressBar: 35,
            icon: <BsMicrosoftTeams className="w-full h-full"/>

        },
        {
            step: "Select Language",
            progressBar: 65,
            icon: <BsMicrosoftTeams className="w-full h-full"/>

        },
        {
            step: "Result",
            progressBar: 100,
            icon: <BsMicrosoftTeams className="w-full h-full"/>

        }
    ]

    return (
        <div className="bg-black w-full h-full text-white flex items-center flex-col">
            <h1>Production Instruction Translation</h1>
            <div className="bg-white w-full h-full text-black flex  items-center ">
                <div className="relative bg-gray-500 h-[98%] w-1/5  flex">
                    <div className="absolute bottom-0 left-1/2 bg-white h-full w-[10%]">
                    </div>
                    <div className={cn("absolute top-10 left-44 translate-x-3  h-7 w-12 rounded-sm", currentStep >= 0? "bg-blue-500": "bg-white")}>
                        <BsMicrosoftTeams className="w-full h-full"/>

                    </div>
                    <div className="absolute flex top-10 left-1 h-7 w-1/3 items-center justify-end">
                        <span className={cn(currentStep >= 0? "bg-blue-500": "text-white")}> Select Team </span>
                    </div>
                    <div className={cn("absolute top-60 left-44 translate-x-3 h-7 w-12", currentStep >= 1 ? "bg-blue-500": "bg-white")}>
                        <MdInsertPageBreak className="w-full h-full"/>

                    </div>
                    <div className="absolute flex top-60 left-1 h-7 w-1/3 items-center justify-end">
                        <span className={cn(currentStep >= 1? "bg-blue-500": "text-white")}> Insert PDF </span>
                    </div>
                    <div className={cn("absolute bottom-80 left-44 translate-x-3 h-7 w-12", currentStep >= 2 ? "bg-blue-500": "bg-white")}>
                        <FaLanguage className="w-full h-full"/>

                    </div>
                    <div className="absolute flex bottom-80 left-1 h-7 items-center justify-end">
                        <span className={cn(currentStep >= 2? "bg-blue-500": "text-white")}> Select Language </span>
                    </div>
                    <div className={cn("absolute bottom-20 left-44 translate-x-3  h-7 w-12", currentStep >= 3 ? "bg-blue-500": "bg-white")}>
                        <GiProcessor className="w-full h-full"/>

                    </div>
                    <div className="absolute flex bottom-20 left-1 h-7 w-1/3 items-center justify-end">
                        <span className={cn(currentStep >= 3? "bg-blue-500": "text-white")}> Result </span>
                    </div>
                    <Progressing
                        steps={steps}
                        currentStep={currentStep}
                        setCurrentStep={setCurrentStep}
                    />

                </div>
                <div className="bg-neutral-700 h-full flex-1 items-center flex flex-col justify-center">
                    <div className="bg-yellow-50 w-[98%] justify-between flex">
                        <button 
                            onClick={() => setCurrentStep(prev => prev + 1)}
                            className="pl-5"
                        >
                            Next
                        </button>
                        <button 
                            onClick={() => setCurrentStep(prev => prev > -1 ? prev -1: prev)}
                            className="pr-5"
                        >
                            back
                        </button>
                    </div>
                    <div className="bg-slate-600 flex gap-10 h-[98%] w-[98%] items-center justify-center ">
                        {
                            currentStep === 0 && teams.map((team, index) => (
                            <button 
                                key={index}
                                onClick={() => setCurrentStep(prev => prev + 1)}
                                className="
                                    bg-blue-700
                                    rounded-lg
                                    border-15 
                                    w-1/4 
                                    h-1/4">
                            <span>{team.name}</span>
                        </button>    
                            ))
                        }
                        {currentStep === 1 && <InsertPDF/>}
                    </div>

                </div>

            </div>
        </div> 
    );

}

function Progressing({ steps, currentStep, setCurrentStep }) {
    // safely get progress bar height
    const progressBarHeight = () => {
        if (currentStep > steps.length - 1) {
            // Avoid calling setState in render!
            setCurrentStep(0)
            return steps[steps.length - 1]?.progressBar || 0;
        }
        return steps[currentStep]?.progressBar || 0;
    };

    return (
        <div
            className={cn("absolute top-0 left-1/2 bg-blue-500 w-[10%]")}
            style={{ height: `${progressBarHeight()}%` }} // dynamic height
        ></div>
    );
}

function InsertPDF () {
    return (
        <div>   
            <h1> Insert PDF</h1>
        </div>
    )
}



export default ProductionInstructionServices;