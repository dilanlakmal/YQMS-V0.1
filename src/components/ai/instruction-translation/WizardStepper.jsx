const WizardStepper = ({ currentStep = 3, steps }) => {


  return (
    <div className="mt-10 p-6 rounded-lg">
      <div className="relative">
        {steps.map((step, index) => {
          const isCompleted = index + 1 < currentStep;
          const isActive = index + 1 === currentStep;

          return (
            <div key={index} className="flex items-start relative">
              {/* Circle and vertical line */}
              <div className="flex flex-col items-center mr-4 relative">
                {/* Circle */}
                <div
                  className={`w-9 h-9 flex items-center justify-center rounded-full border-2 font-bold z-20
                    ${isCompleted ? 'bg-blue-600 border-blue-600 text-white' : isActive ? 'border-blue-600 text-blue-400' : 'border-gray-600 text-gray-400'}`}
                >
                  {isCompleted ? '✔' : index + 1}
                </div>

                {/* Connector line */}
                {index !== steps.length - 1 && (
                  <div
                    className={`absolute top-10 left-1/2 transform -translate-x-1/2 w-0.5 h-12 
                      ${isCompleted ? 'bg-blue-600' : 'bg-gray-600'}`}
                  />
                )}
              </div>

              {/* Step text */}
              <div className="pb-12">
                <h3
                  className={`text-md font-semibold ${isActive ? 'text-blue-400' : isCompleted ? 'text-blue-700' : 'text-gray-400'
                    }`}
                >
                  {step.title}
                </h3>
                <p className="text-gray-400 text-sm">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WizardStepper;
