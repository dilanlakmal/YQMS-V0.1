import { useState } from "react";
import { Book, Code2, Users, FileText, Globe, CheckSquare, Award, Layers, Database, Cpu, ArrowRight, GitMerge, Workflow, Server, Edit3, Save, Sparkles } from "lucide-react";

const Document = () => {
  const [activeTab, setActiveTab] = useState("user");

  return (
    <div className="bg-white min-h-full">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl mb-10 bg-slate-900 border border-white/10 shadow-2xl">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="ai-neural-glow -top-20 -left-20 opacity-40"></div>
          <div className="ai-neural-glow -bottom-20 -right-20 opacity-30"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 via-slate-900 to-indigo-900/50"></div>

          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        </div>

        <div className="relative z-10 p-12 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="max-w-2xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6 animate-pulse">
              <Sparkles size={12} /> Version 1.0 Live
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
              Knowledge Hub <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Translation AI</span>
            </h1>
            <p className="text-slate-400 text-lg md:text-xl leading-relaxed max-w-xl">
              The ultimate guide to mastering production instruction localization—from end-user workflows to neural architecture.
            </p>

            <div className="mt-8 flex flex-wrap justify-center md:justify-start gap-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <div className="w-1 h-1 rounded-full bg-blue-500"></div> User Documentation
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <div className="w-1 h-1 rounded-full bg-indigo-500"></div> Technical Specs
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <div className="w-1 h-1 rounded-full bg-emerald-500"></div> Future Roadmap
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-blue-500/20 blur-3xl group-hover:bg-blue-500/30 transition-all duration-700"></div>
            <div className="relative glass-morphism p-8 rounded-3xl border border-white/10 shadow-2xl transform hover:scale-105 transition-transform duration-500">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-xl">
                <Book size={64} className="animate-bounce" style={{ animationDuration: '3s' }} />
              </div>

              {/* Decorative floating bits */}
              <div className="absolute -top-4 -right-4 w-12 h-12 glass-morphism rounded-xl flex items-center justify-center text-blue-400 shadow-lg animate-pulse">
                <Sparkles size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-8 sticky top-0 bg-white z-20 overflow-x-auto">
        <button
          onClick={() => setActiveTab("user")}
          className={`flex items-center gap-2 px-8 py-4 font-medium text-sm transition-all border-b-2 whitespace-nowrap ${activeTab === "user"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
        >
          <Users size={18} />
          End User Guide
        </button>
        <button
          onClick={() => setActiveTab("dev")}
          className={`flex items-center gap-2 px-8 py-4 font-medium text-sm transition-all border-b-2 whitespace-nowrap ${activeTab === "dev"
            ? "border-emerald-600 text-emerald-600"
            : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
        >
          <Code2 size={18} />
          Contributor Guide
        </button>
        <button
          onClick={() => setActiveTab("plan")}
          className={`flex items-center gap-2 px-8 py-4 font-medium text-sm transition-all border-b-2 whitespace-nowrap ${activeTab === "plan"
            ? "border-purple-600 text-purple-600"
            : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
        >
          <GitMerge size={18} />
          Version & Planning
        </button>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto pb-20 px-4">
        {activeTab === "user" && <UserGuide />}
        {activeTab === "dev" && <ContributorGuide />}
        {activeTab === "plan" && <VersionPlanning />}
      </div>
    </div>
  );
};

const UserGuide = () => (
  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 ">
    <div className="prose prose-slate max-w-none">
      <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3 p-10 justify-center">
        Workflow Overview
      </h3>
      <p className="text-slate-600 text-lg">
        The Instruction Translation Wizard is designed to streamline the translation of complex manufacturing documents.
        Follow these 5 simple steps to convert your PDF instructions into localized, production-ready documents.
      </p>
    </div>

    <div className="space-y-8">
      <StepCard
        number="1"
        title="Select Team & Template"
        icon={Users}
        color="bg-blue-100 text-blue-700"
        description="Choose your production department. This determines the structural template used for parsing your document."
        details={[
          "Only supported teams are available for selection.",
          "Ensures the AI knows exactly how to read your specific document layout."
        ]}
      />

      <div className="flex justify-center"><ArrowRight className="text-slate-300 rotate-90" /></div>

      <StepCard
        number="2"
        title="Upload & Extraction"
        icon={FileText}
        color="bg-indigo-100 text-indigo-700"
        description="Upload your original PDF instruction file."
        details={[
          "The system automatically identifies text, images, and tables.",
          "Preview the extraction result instantly side-by-side.",
          "Confirm the document structure before proceeding."
        ]}
      />

      <div className="flex justify-center"><ArrowRight className="text-slate-300 rotate-90" /></div>

      <StepCard
        number="3"
        title="Configuration"
        icon={Globe}
        color="bg-purple-100 text-purple-700"
        description="Set your language pairs and terminology rules."
        details={[
          "Auto-detection: The system detects the source language automatically.",
          "Glossary Support: Upload Excel/CSV files or use the Manual Builder to define specific term translations.",
          "Bulk Paste: Quickly paste terms from other sources."
        ]}
      />

      <div className="flex justify-center"><ArrowRight className="text-slate-300 rotate-90" /></div>

      <StepCard
        number="4"
        title="Review & Refine"
        icon={CheckSquare}
        color="bg-amber-100 text-amber-700"
        description="The heart of the process. Review the AI translation in context."
        details={[
          "Toggle between Original and Translated views.",
          "Click any text field to manually edit corrections.",
          "Select text and click 'Mark as Glossary Entry' to teach the AI for future documents."
        ]}
      />

      <div className="flex justify-center"><ArrowRight className="text-slate-300 rotate-90" /></div>

      <StepCard
        number="5"
        title="Finalize & Export"
        icon={Award}
        color="bg-emerald-100 text-emerald-700"
        description="Generate your final output."
        details={[
          "Download the fully formatted PDF in the target language.",
          "The layout is preserved exactly as the original.",
          "Save your session data for record-keeping."
        ]}
      />
    </div>
  </div>
);

const StepCard = ({ number, title, icon: Icon, description, details, color }) => (
  <div className="flex gap-6 p-6 bg-slate-50 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
    <div className={`flex-shrink-0 w-16 h-16 ${color} rounded-2xl flex items-center justify-center`}>
      <Icon size={32} />
    </div>
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-white text-xs font-bold">
          {number}
        </span>
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
      </div>
      <p className="text-slate-700 font-medium">{description}</p>
      <ul className="list-disc ml-5 space-y-1 text-slate-500 text-sm">
        {details.map((d, i) => <li key={i}>{d}</li>)}
      </ul>
    </div>
  </div>
);

const ContributorGuide = () => (
  <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">

    {/* System Workflow Diagram Representation */}
    <div>
      <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
        <Workflow className="text-emerald-600" /> System Data Flow
      </h3>
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 overflow-x-auto">
        <div className="min-w-[800px] grid grid-cols-3 gap-8">
          {/* Lane 1: User */}
          <div className="space-y-6">
            <div className="text-center font-bold text-slate-400 uppercase text-xs tracking-wider border-b border-slate-200 pb-2">User Interaction</div>

            <FlowNode icon={Users} title="Select Team" color="blue" />
            <FlowArrow />
            <FlowNode icon={FileText} title="Upload Final Instruction PDF" color="blue" />
            <div className="h-32"></div> {/* Spacer for System Process */}
            <FlowNode icon={Edit3} title="Review Extracted Pages" color="blue" />
            <FlowArrow label="Modify?" />
            {/* Branching Logic Visual */}
            <div className="flex justify-center">
              <div className="bg-slate-200 px-3 py-1 rounded text-xs font-mono">Yes: Update DB</div>
            </div>
            <div className="h-4"></div>
            <FlowNode icon={Book} title="Add Glossaries" subtitle="File or Manual Entry" color="blue" />
            <div className="h-32"></div>
            <FlowNode icon={CheckSquare} title="Review Translation" color="blue" />
            <FlowArrow label="Correct?" />
            <div className="flex justify-center gap-4">
              <div className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-bold">NO</div>
              <div className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold">YES</div>
            </div>
            <div className="h-4"></div>
            <FlowNode icon={Save} title="Save / Submit" color="emerald" />
          </div>

          {/* Lane 2: System */}
          <div className="space-y-6">
            <div className="text-center font-bold text-slate-400 uppercase text-xs tracking-wider border-b border-slate-200 pb-2">System Processing</div>
            <div className="h-24"></div>

            <div className="bg-white p-4 rounded-lg border-2 border-dashed border-slate-300 text-center">
              <div className="text-xs text-slate-400 mb-2">Extraction Process</div>
              <p className="text-sm font-semibold text-slate-700">Split PDF &rarr; Apply Template &rarr; Extract Data</p>
            </div>
            <FlowArrow dir="left" />
            <div className="h-32"></div> {/* Spacer for User Review */}
            <div className="h-24"></div>
            <div className="bg-white p-4 rounded-lg border-2 border-dashed border-slate-300 text-center">
              <div className="text-xs text-slate-400 mb-2">Translation Process</div>
              <p className="text-sm font-semibold text-slate-700">Translate Template Content</p>
            </div>
            <FlowArrow dir="left" />
            <div className="h-16"></div>
            <FlowNode icon={Edit3} title="Mark as New Glossary Entry" color="amber" />
          </div>

          {/* Lane 3: Database */}
          <div className="space-y-6">
            <div className="text-center font-bold text-slate-400 uppercase text-xs tracking-wider border-b border-slate-200 pb-2">Databases</div>
            <div className="h-32"></div>
            <FlowNode icon={Database} title="team-instruction-data" color="slate" />
            <FlowArrow dir="left" label="Store/Update" />
            <div className="h-48"></div>
            <FlowNode icon={Database} title="team-instruction-glossary" color="slate" />
            <FlowArrow dir="left" label="Fetch for Translation" />
            <div className="h-16"></div>
            <FlowArrow dir="left" label="Update Terms" />
          </div>
        </div>
      </div>
    </div>

    <div className="space-y-8">
      <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
        <Cpu className="text-emerald-600" /> Technical Architecture
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <TechCard
          title="Component Architecture"
          icon={Layers}
          content={
            <ul className="space-y-3 text-sm text-slate-600">
              <li><strong className="text-slate-900">InstructionTranslation.jsx</strong>: Main orchestrator. Manages steps and global state.</li>
              <li><strong className="text-slate-900">InsertPdf.jsx</strong>: Handles file ingestion and initial production hydration.</li>
              <li><strong className="text-slate-900">SelectLanguage.jsx</strong>: Manages language APIs and Glossary CSV generation.</li>
              <li><strong className="text-slate-900">Result.jsx</strong>: Dual-mode rendering (Review vs Final). Implements selection capture.</li>
              <li><strong className="text-slate-900">GPRTTemplate.jsx</strong>: Hot-swappable rendering engine for GPRT layouts.</li>
            </ul>
          }
        />

        <TechCard
          title="Data Flow"
          icon={Database}
          content={
            <div className="space-y-3">
              <p className="text-sm text-slate-600">Single Source of Truth: <code className="bg-slate-100 px-1 py-0.5 rounded text-pink-600">production</code> state.</p>
              <div className="bg-slate-900 rounded-lg p-3 text-xs text-green-400 font-mono overflow-x-auto">
                {"{ documentId, title: { text: { en: '...', zh: '...' } }, glossary: [...] }"}
              </div>
            </div>
          }
        />
      </div>
    </div>
  </div>
);

const VersionPlanning = () => (
  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="prose prose-slate max-w-none">
      <h3>Project Roadmap</h3>
      <p className="text-slate-600 text-lg">
        The Instruction Translation System is evolving. While Version 1 focuses on translating existing instruction documents, Version 2 will introduce AI-driven instruction generation from raw sources.
      </p>
    </div>

    <div className="grid grid-cols-1 gap-8">
      {/* Version 1 */}
      <div className="relative p-8 bg-white rounded-2xl border-2 border-blue-100 shadow-sm overflow-hidden">
        <div className="absolute top-0 right-0 p-4 bg-blue-600 text-white rounded-bl-xl text-sm font-bold shadow-md">
          Current Version (V1)
        </div>
        <div className="flex items-start gap-6">
          <div className="p-4 bg-blue-50 rounded-xl text-blue-600">
            <FileText size={40} />
          </div>
          <div className="space-y-4">
            <h4 className="text-2xl font-bold text-slate-900">Final Instruction &rarr; Translation</h4>
            <p className="text-slate-600 leading-relaxed">
              The current implementation focuses on ingestion of finalized PDF artifacts.
              The workflow is optimized for post-production localization.
            </p>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-center gap-2"><CheckSquare size={16} className="text-blue-500" /> Input: <strong>Finalized PDF Instruction</strong></li>
                <li className="flex items-center gap-2"><CheckSquare size={16} className="text-blue-500" /> Process: <strong>OCR -&gt; Extraction -&gt; Translation</strong></li>
                <li className="flex items-center gap-2"><CheckSquare size={16} className="text-blue-500" /> Output: <strong>Translated PDF</strong></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Version 2 */}
      <div className="relative p-8 bg-slate-800 text-white rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 p-4 bg-emerald-500 text-white rounded-bl-xl text-sm font-bold shadow-md animate-pulse">
          Coming Soon (V2)
        </div>
        <div className="flex items-start gap-6">
          <div className="p-4 bg-slate-700 rounded-xl text-emerald-400">
            <Cpu size={40} />
          </div>
          <div className="space-y-4">
            <h4 className="text-2xl font-bold">Source Files &rarr; Instruction Generation &rarr; Translation</h4>
            <p className="text-slate-300 leading-relaxed">
              A completely new workflow that starts earlier in the chain. Instead of reading a done document,
              the system will ingest raw source materials and generate the layout from scratch before translation.
            </p>
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-600">
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <Server size={16} className="text-emerald-500" />
                  <span>Input: <strong>Raw Source Files</strong> (Tech packs, unstructured images, assets)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Layers size={16} className="text-emerald-500 mt-1" />
                  <div>
                    Process: <strong>11-Point Story Generation</strong>
                    <p className="text-xs text-slate-500 mt-1">We will perform 11 specific story points (logical steps) in each page to construct the instruction content intelligently.</p>
                  </div>
                </li>
                <li className="flex items-center gap-2">
                  <Globe size={16} className="text-emerald-500" />
                  <span>Output: <strong>Generated & Translated Instruction</strong></span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const FlowNode = ({ icon: Icon, title, subtitle, color }) => (
  <div className={`flex flex-col items-center justify-center p-4 bg-white rounded-lg border border-${color}-200 shadow-sm z-10 relative`}>
    <div className={`p-2 bg-${color}-50 text-${color}-600 rounded-full mb-2`}>
      <Icon size={20} />
    </div>
    <div className="text-xs font-bold text-slate-700 text-center">{title}</div>
    {subtitle && <div className="text-[10px] text-slate-500 text-center">{subtitle}</div>}
  </div>
);

const FlowArrow = ({ dir = "down", label }) => (
  <div className={`flex items-center justify-center ${dir === "left" ? "w-full my-2" : "h-8 flex-col"}`}>
    {dir === "down" && <div className="w-0.5 h-full bg-slate-300"></div>}
    {dir === "left" && <div className="h-0.5 w-full bg-slate-300"></div>}
    {label && <span className="bg-white px-2 py-0.5 text-[10px] text-slate-400 border border-slate-100 rounded absolute">{label}</span>}
  </div>
);

const TechCard = ({ title, icon: Icon, content }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
    <div className="flex items-center gap-3 mb-4 text-emerald-700">
      <Icon size={24} />
      <h4 className="font-bold">{title}</h4>
    </div>
    {content}
  </div>
);

export default Document;