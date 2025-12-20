

const Document = () => {
  return (
    <div className="bg-white w-full h-full text-black flex">
      
      {/* Main Documentation */}
      <main className="flex-1 p-6">
        
        {/* Header */}
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Documentation</h1>
          <p className="text-gray-600 mt-2">
            Instruction Production Translation Procedure
          </p>
        </header>

        {/* Content */}
        <section className="max-w-3xl mx-auto text-left space-y-4">

          <h2 className="text-lg font-semibold">
            Overview
          </h2>

          <p>
            This document explains the full workflow for the Instruction Production
            Translation process.
          </p>

          <p>
            To achieve the best results, your uploaded PDF should have a clean and
            well-structured layout.
          </p>

          <h2 className="text-lg font-semibold mt-6">
            Steps to Follow
          </h2>

          <ol className="list-decimal ml-6 space-y-2">
            <li>
              <strong>Select the Team:</strong> Choose the correct team. Each team uses a
              different predefined template.
            </li>

            <li>
              <strong>Insert PDF:</strong> Upload your final production instruction as a
              PDF. The system will convert it into a clean digital format.
            </li>

            <li>
              <strong>Select Language:</strong> Choose the export language from the
              available options.
            </li>

            <li>
              <strong>Result:</strong> Preview the final output. If you find any incorrect
              translations or technical issues, please mark and correct them.
            </li>
          </ol>
        </section>
      </main>

      {/* Optional Aside Panel */}
      <aside className="w-64 border-l p-4 hidden md:block">
        <p className="text-sm text-gray-500">
          Tips, status, or quick help can go here.
        </p>
      </aside>

    </div>
  );
};
export default Document;