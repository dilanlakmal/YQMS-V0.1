import { useState, useMemo } from "react";
import Document from "../components/ai/instruction/translation/Document";
import StepList from "../components/ai/instruction/translation/StepList";
import SelectTeam from "../components/ai/instruction/translation/SelectTeam";
import InsertPdf from "../components/ai/instruction/translation/InsertPdf";
import { teams } from "../constants/teams";
import SelectLanguage from "../components/ai/instruction/translation/SelectLanguage";
import Result from "../components/ai/instruction/translation/Result";
const InstructionTranslation = () => {
    const [showDoc, setShowDoc] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [files, setFiles] = useState([]);
    const [preview, setPreview] = useState("");

    const steps = useMemo(() => [
        { title: 'Select team', description: 'Select your team.' },
        { title: 'Insert pdf', description: 'Insert pdf of your final instruction production.' },
        { title: 'Translate it', description: 'Select your target language.' },
        { title: 'Get result', description: 'Preview the result and export your pdf' },
        { title: 'Review Changes', description: 'Review the translated content.' },
        { title: 'Quality Check', description: 'Verify translation accuracy and formatting.' },
        { title: 'Finalize', description: 'Complete and save the final translation.' },
    ], []);
    
    // Enhanced Structure (Recommended)

    return (
        <div className="h-full bg-gray-50 pt-0 flex flex-col overflow-hidden">
            <header className="flex justify-between p-10 bg-gray-100 shadow-lg">
                <h1 className="ml-10 text-4xl font-bold text-gray-800">Translate Production Instruction</h1>
                <nav>
                    <ul>
                        <li>
                            <button 
                                className="
                                    bg-blue-500
                                    text-white
                                    font-bold
                                    py-2   
                                    px-4
                                    rounded
                                    hover:bg-blue-700
                                    transition duration-200
                                "
                                onClick={() => setShowDoc(!showDoc)}
                                aria-label="Toggle documentation view"
                            >
                                Toggle Documentation
                            </button>
                        </li>
                    </ul>
                </nav>

            </header>
                {
                showDoc ? 
                <Document />: 
                <main className="flex relative overflow-auto">
                    {/* Centered Step Title */}
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
                        <div className="bg-white px-6 py-3 rounded-lg shadow-lg border border-gray-200">
                            <span className="text-gray-800 font-bold text-xl">{steps[currentStep - 1]?.title}</span>
                        </div>
                    </div>
                    {/* Overlay Next/Previous buttons that stay on top without shifting layout */}
                    <div className="absolute top-4 right-6 z-50 flex gap-2">
                        <button
                            onClick={() => setCurrentStep(prev => prev > 1 ? prev - 1 : prev)}
                            className="bg-white text-gray-700 px-3 py-2 rounded shadow-md hover:bg-gray-100 transition duration-200"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setCurrentStep(s => Math.min(steps.length, s + 1))}
                            className="bg-blue-500 text-white px-3 py-2 rounded shadow-md hover:bg-blue-600 transition duration-200"
                        >
                            Next
                        </button>
                    </div>
                    <section className="bg-gray-200">
                        <StepList currentStep={currentStep} steps={steps}/>
                    </section>
                    <section className="flex flex-1 flex-col bg-gray-300 items-center justify-center p-10 pt-20 overflow-y-auto">
                        { currentStep === 1 && <SelectTeam teams={teams} setSelectedTeam={setSelectedTeam} currentStep={currentStep} setCurrentStep={setCurrentStep}/> }
                        { 
                            currentStep === 2 && 
                                <InsertPdf 
                                    team={selectedTeam} 
                                    files={files} 
                                    setFiles={setFiles}
                                    preview={preview} 
                                    setPreview={setPreview} 
                                    currentStep={currentStep} 
                                    setCurrentStep={setCurrentStep} 
                                /> 
                        }
                        {
                            currentStep === 3 && <SelectLanguage />
                        }
                        { currentStep === steps.length -1 && <Result team={selectedTeam}/>}
                    </section>
                </main>
            }
        </div>
    )

}

export default InstructionTranslation;