import { useState, useEffect } from "react";
import { useTranslate } from "@/hooks/useTranslate";
import { Book, Code2, Users, FileText, Globe, CheckSquare, Award, Layers, Database, Cpu, ArrowRight, GitMerge, Workflow, Server, Edit3, Save, Sparkles, Download } from "lucide-react";

const Guide = () => {
  const [activeTab, setActiveTab] = useState("user");
  const { translateBatch, userLang } = useTranslate();

  const [uiText, setUiText] = useState({
    version: "Version 1.1 Live",
    title: "Knowledge Hub",
    titleHighlight: "Translation AI",
    subtitle: "Official reference for the streamlined 4-step instruction localization engine.",
    tabUser: "End User Guide",
    tabDev: "Contributor Guide",
    tabPlan: "Version & Planning",
    workflowTitle: "How Instruction Translation Works",
    workflowDesc: "Follow this interactive workflow to transform your static PDF instructions into dynamic, multi-lingual assets using our AI-driven pipeline.",
    step1Title: "1. Context Setup",
    step1Desc: "Select your production team to calibrate the AI model.",
    step1Detail1: "This step tells the system which manufacturing standards and vocabulary to apply, ensuring high-precision context understanding.",
    step2Title: "2. Visual Extraction",
    step2Desc: "Upload your PDF. The system separates text from visual elements.",
    step2Detail1: "Our advanced OCR preserves your technical drawings and stamps while extracting editable text for translation.",
    step3Title: "3. Glossary & Language",
    step3Desc: "Choose target languages and inject custom terminology.",
    step3Detail1: "Use the Glossary feature to force specific translations for technical terms, ensuring consistency across all documents.",
    step3Detail2: "Real-time language detection automatically identifies your source language.",
    step4Title: "4. Synthesis & Review",
    step4Desc: "Generate and validate the translated document.",
    step4Detail1: "The AI reconstructs your document, inserting translated text back into the original layout.",
    step4Detail2: "Use the interactive preview to check every inch before downloading the final, multi-language PDF.",
    contribSystemFlow: "System Data Flow",
    contribUserInteraction: "User Interaction",
    contribAIProcessing: "AI Processing",
    contribPersistence: "Persistence & State",
    contribNeuralArch: "Neural Architecture & Database",
    contribCompTitle: "Core Components & Techniques",
    contribCompDetail: "Detailed React component hierarchy and hook integration.",
    contribSchemaTitle: "Database Schema (MongoDB)",
    contribSchemaDetail: "bilingual_instruction collection structure.",
    contribTechniqueTitle: "Translation Technique",
    contribTechniqueDetail: "Hybrid approach using Azure Cognitive Services + Local Glossary Injection.",
    contribNote: "Important: All UI text must use the useTranslate hook for full localization support.",
    contribBackendTitle: "Backend & Storage Infrastructure",
    contribBackendDetail: "High-performance Node.js runtime coupled with enterprise-grade cloud storage.",
    contribStackTitle: "Technology Stack",
    contribStackContent: "Node.js (Express), MongoDB (Metadata), Azure Blob Storage (Refined Artifacts).",
    contribStorageTitle: "Azure Blob Integration",
    contribStorageContent: "Secure, scalable storage for PDF binaries and extracted high-res assets.",
    contribRoleNote: "Restricted Access: Super Admin Configuration Only"
  });

  useEffect(() => {
    const translateContent = async () => {
      const keys = Object.keys(uiText);
      const values = Object.values(uiText);
      const translated = await translateBatch(values);

      const newUiText = {};
      keys.forEach((key, i) => {
        newUiText[key] = translated[i];
      });
      setUiText(prev => ({ ...prev, ...newUiText }));
    };

    if (userLang && userLang !== 'en') {
      translateContent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLang]);

  return (
    <div className="bg-white min-h-full">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl mb-10 bg-slate-900 border border-white/10 shadow-2xl">
        <div className="absolute inset-0 z-0">
          <div className="ai-neural-glow -top-20 -left-20 opacity-40"></div>
          <div className="ai-neural-glow -bottom-20 -right-20 opacity-30"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 via-slate-900 to-indigo-900/50"></div>
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        </div>

        <div className="relative z-10 p-12 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="max-w-2xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6 animate-pulse">
              <Sparkles size={12} /> {uiText.version}
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
              {uiText.title} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{uiText.titleHighlight}</span>
            </h1>
            <p className="text-slate-400 text-lg md:text-xl leading-relaxed max-w-xl">
              {uiText.subtitle}
            </p>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-blue-500/20 blur-3xl group-hover:bg-blue-500/30 transition-all duration-700"></div>
            <div className="relative glass-morphism p-8 rounded-3xl border border-white/10 shadow-2xl transform hover:scale-105 transition-transform duration-500">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-xl">
                <Book size={64} className="animate-bounce" style={{ animationDuration: '3s' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-8 sticky top-0 bg-white z-20 overflow-x-auto">
        <button
          onClick={() => setActiveTab("user")}
          className={`flex items-center gap-2 px-8 py-4 font-medium text-sm transition-all border-b-2 whitespace-nowrap ${activeTab === "user" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          <Users size={18} /> {uiText.tabUser}
        </button>
        <button
          onClick={() => setActiveTab("dev")}
          className={`flex items-center gap-2 px-8 py-4 font-medium text-sm transition-all border-b-2 whitespace-nowrap ${activeTab === "dev" ? "border-emerald-600 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          <Code2 size={18} /> {uiText.tabDev}
        </button>
        <button
          onClick={() => setActiveTab("plan")}
          className={`flex items-center gap-2 px-8 py-4 font-medium text-sm transition-all border-b-2 whitespace-nowrap ${activeTab === "plan" ? "border-purple-600 text-purple-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          <GitMerge size={18} /> {uiText.tabPlan}
        </button>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto pb-20 px-4">
        {activeTab === "user" && <UserGuide uiText={uiText} />}
        {activeTab === "dev" && <ContributorGuide uiText={uiText} />}
        {activeTab === "plan" && <VersionPlanning />}
      </div>
    </div>
  );
};

const UserGuide = ({ uiText }) => (
  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="prose prose-slate max-w-none">
      <h3 className="text-2xl font-bold text-slate-900 mb-4">{uiText.workflowTitle}</h3>
      <p className="text-slate-600 text-lg leading-relaxed">
        {uiText.workflowDesc}
      </p>
    </div>

    <div className="space-y-8">
      <StepCard
        number="1"
        title={uiText.step1Title}
        icon={Users}
        color="bg-blue-100 text-blue-700"
        description={uiText.step1Desc}
        details={[uiText.step1Detail1]}
      />
      <StepCard
        number="2"
        title={uiText.step2Title}
        icon={FileText}
        color="bg-indigo-100 text-indigo-700"
        description={uiText.step2Desc}
        details={[uiText.step2Detail1]}
      />
      <StepCard
        number="3"
        title={uiText.step3Title}
        icon={Globe}
        color="bg-purple-100 text-purple-700"
        description={uiText.step3Desc}
        details={[uiText.step3Detail1, uiText.step3Detail2]}
      />
      <StepCard
        number="4"
        title={uiText.step4Title}
        icon={Award}
        color="bg-emerald-100 text-emerald-700"
        description={uiText.step4Desc}
        details={[uiText.step4Detail1, uiText.step4Detail2]}
      />
    </div>
  </div>
);

const ContributorGuide = ({ uiText }) => (
  <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 text-amber-800 font-medium">
      <Sparkles size={20} />
      {uiText.contribNote}
    </div>

    <div className="space-y-8">
      <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
        <Workflow className="text-emerald-600" /> {uiText.contribSystemFlow}
      </h3>
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 overflow-x-auto">
        <div className="min-w-[800px] grid grid-cols-3 gap-8">
          <div className="space-y-6">
            <div className="text-center font-bold text-slate-400 text-xs uppercase border-b pb-2">{uiText.contribUserInteraction}</div>
            <FlowNode icon={Users} title="Team Selection" color="blue" />
            <FlowArrow />
            <FlowNode icon={FileText} title="Document Upload" color="blue" />
            <FlowArrow />
            <FlowNode icon={Book} title="Language Config" color="blue" />
            <FlowArrow />
            <FlowNode icon={Download} title="Final Export" color="emerald" />
          </div>
          <div className="space-y-6">
            <div className="text-center font-bold text-slate-400 text-xs uppercase border-b pb-2">{uiText.contribAIProcessing}</div>
            <div className="h-24"></div>
            <div className="bg-white p-4 rounded border-2 border-dashed border-slate-300 text-center">
              <p className="text-xs font-bold text-slate-700">Extraction Engine</p>
              <p className="text-[10px] text-slate-500">OCR &rarr; Template Mapping</p>
            </div>
            <FlowArrow dir="left" />
            <div className="h-16"></div>
            <div className="bg-white p-4 rounded border-2 border-dashed border-slate-300 text-center">
              <p className="text-xs font-bold text-slate-700">Translation Engine</p>
              <p className="text-[10px] text-slate-500">Azure Batch API &rarr; Re-synthesis</p>
            </div>
            <FlowArrow dir="left" />
          </div>
          <div className="space-y-6">
            <div className="text-center font-bold text-slate-400 text-xs uppercase border-b pb-2">{uiText.contribPersistence}</div>
            <div className="h-32"></div>
            <FlowNode icon={Database} title="production-data" color="slate" />
            <FlowArrow dir="left" label="Store/Fetch" />
            <div className="h-32"></div>
            <FlowNode icon={Database} title="glossary-store" color="slate" />
          </div>
        </div>
      </div>
    </div>

    <div className="space-y-8">
      <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
        <Cpu className="text-emerald-600" /> {uiText.contribNeuralArch}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <TechCard
          title={uiText.contribCompTitle}
          icon={Layers}
          content={
            <ul className="text-sm text-slate-600 space-y-2">
              <li><strong>DocumentUpload.jsx</strong>: PDF Ingestion Logic</li>
              <li><strong>LanguageConfig.jsx</strong>: AI API & Glossary Context</li>
              <li><strong>TranslationReview.jsx</strong>: Final Result & PDF UI</li>
              <li><strong>Guide.jsx</strong>: Dynamic Help System</li>
            </ul>
          }
        />
        <TechCard
          title={uiText.contribSchemaTitle}
          icon={Database}
          content={
            <div className="space-y-2">
              <p className="text-xs text-slate-500 italic">{uiText.contribSchemaDetail}</p>
              <div className="bg-slate-900 rounded p-4 text-[10px] text-green-400 font-mono">
                {"{ title: { text: { english: '...', chinese: '...' } } }"}
              </div>
            </div>
          }
        />
        <TechCard
          title={uiText.contribTechniqueTitle}
          icon={Sparkles}
          content={
            <p className="text-sm text-slate-600">
              {uiText.contribTechniqueDetail}
            </p>
          }
        />
      </div>
    </div>

    <div className="space-y-8 border-t border-slate-200 pt-10">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <Server className="text-emerald-600" /> {uiText.contribBackendTitle}
        </h3>
        <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
          <CheckSquare size={12} /> {uiText.contribRoleNote}
        </span>
      </div>
      <p className="text-slate-500">{uiText.contribBackendDetail}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <TechCard
          title={uiText.contribStackTitle}
          icon={Code2}
          content={
            <p className="text-sm text-slate-600 font-mono">
              {uiText.contribStackContent}
            </p>
          }
        />
        <TechCard
          title={uiText.contribStorageTitle}
          icon={Database}
          content={
            <p className="text-sm text-slate-600">
              {uiText.contribStorageContent}
            </p>
          }
        />
      </div>
    </div>
  </div>
);

const VersionPlanning = () => (
  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="p-8 bg-blue-50/50 rounded-2xl border-2 border-blue-100 border-dashed">
      <h4 className="text-2xl font-bold text-slate-900 mb-4">Roadmap: The 11-Point Story Engine</h4>
      <p className="text-slate-600 leading-relaxed mb-6">
        While Version 1 localizes existing PDF artifacts, <strong>Version 2</strong> will introduce the logic specified in the Story-Generation protocol.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
          <span className="text-blue-600 font-bold block mb-2">V1: Synthesis (Current)</span>
          <p className="text-xs text-slate-500">Ingest PDF &rarr; OCR &rarr; Translate &rarr; Re-draw single A4 page.</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl shadow-xl text-white">
          <span className="text-emerald-400 font-bold block mb-2">V2: Generation (Next)</span>
          <p className="text-xs text-slate-300">Raw Source &rarr; 11-Point Analysis &rarr; Full Instruction Construction.</p>
        </div>
      </div>
    </div>
  </div>
);

const StepCard = ({ number, title, icon: Icon, description, details, color }) => (
  <div className="flex gap-6 p-6 bg-slate-50 rounded-xl border border-slate-200">
    <div className={`flex-shrink-0 w-16 h-16 ${color} rounded-2xl flex items-center justify-center`}>
      <Icon size={32} />
    </div>
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span className="w-6 h-6 rounded-full bg-slate-800 text-white text-[10px] flex items-center justify-center font-bold">{number}</span>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      </div>
      <p className="text-sm text-slate-700 font-medium">{description}</p>
      <ul className="list-disc ml-5 text-xs text-slate-500 space-y-1">
        {details.map((d, i) => <li key={i}>{d}</li>)}
      </ul>
    </div>
  </div>
);

const FlowNode = ({ icon: Icon, title, subtitle, color }) => (
  <div className={`flex flex-col items-center justify-center p-3 bg-white rounded-lg border border-${color}-200 shadow-sm relative`}>
    <div className={`p-2 bg-${color}-50 text-${color}-600 rounded-full mb-2`}><Icon size={18} /></div>
    <div className="text-[10px] font-bold text-slate-700 text-center">{title}</div>
    {subtitle && <div className="text-[8px] text-slate-500 text-center">{subtitle}</div>}
  </div>
);

const FlowArrow = ({ dir = "down", label }) => (
  <div className={`flex items-center justify-center ${dir === "left" ? "w-full my-2" : "h-8 flex-col"}`}>
    {dir === "down" && <div className="w-0.5 h-full bg-slate-300" />}
    {dir === "left" && <div className="h-0.5 w-full bg-slate-300" />}
    {label && <span className="bg-white px-2 py-0.5 text-[8px] text-slate-400 border border-slate-100 rounded absolute">{label}</span>}
  </div>
);

const TechCard = ({ title, icon: Icon, content }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
    <div className="flex items-center gap-3 mb-4 text-emerald-700">
      <Icon size={24} />
      <h4 className="font-bold text-sm">{title}</h4>
    </div>
    {content}
  </div>
);

export default Guide;