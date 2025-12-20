import GPRTTemplate from "./templates/GPRT/GPRTTemplate";


const Result = ({team}) => {
    return (
                <section className="mt-5 h-full w-full overflow-y-hidden  pb-10 bg-white ">
                    {team === "GPRT0007C" ? (
                        <div className="overflow-y-auto w-full h-full p-20">
                            <GPRTTemplate
                                editable={false}
                                step={"complete"}
                            />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center text-gray-500">
                            <p>Select a supported team to view the template.</p>
                        </div>
                    )}  
                </section>    
    )
}

export default Result;