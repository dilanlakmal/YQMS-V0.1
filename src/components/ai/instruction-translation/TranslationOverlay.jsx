import { motion } from "framer-motion";
import {
    Globe,
    Languages,
    ArrowRightLeft,
    Loader2,
    Sparkles,
    BrainCircuit
} from "lucide-react";

/**
 * Global Translation Overlay Animation
 * Displays a full-screen overlay with animations while translation is processing.
 * 
 * @param {Object} props
 * @param {boolean} props.isTranslating - Whether translation is currently in progress
 * @param {Object} props.sourceLang - Source language object {value, label}
 * @param {Array} props.targetLangs - List of target language objects
 */
const TranslationOverlay = ({ isTranslating, sourceLang, targetLangs }) => {
    if (!isTranslating) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-8 overflow-hidden"
        >
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="ai-neural-glow top-1/4 left-1/4 opacity-30"></div>
                <div className="ai-neural-glow bottom-1/4 right-1/4 opacity-30"></div>

                {/* Floating Translation Particles (Letters/Symbols) */}
                {['A', 'あ', '中', 'Σ', 'Ω', '文', 'En', '한', 'ก'].map((char, i) => (
                    <div
                        key={i}
                        className="translation-letter text-2xl"
                        style={{
                            left: `${10 + Math.random() * 80}%`,
                            top: `${20 + Math.random() * 60}%`,
                            animationDelay: `${i * 0.4}s`,
                            opacity: 0.4
                        }}
                    >
                        {char}
                    </div>
                ))}
            </div>

            <div className="relative flex flex-col items-center">
                <div className="relative w-32 h-32 mb-8">
                    {/* Spinning World Icon */}
                    <div className="absolute inset-0 globe-spinning text-blue-500/20">
                        <Globe size={128} strokeWidth={0.5} />
                    </div>
                    {/* Main Sparkle Icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="p-6 bg-blue-600 rounded-2xl shadow-2xl shadow-blue-500/40 relative z-10 animate-pulse">
                            <Languages size={48} className="text-white" />
                        </div>
                    </div>
                    {/* Orbiting particles */}
                    <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-400 rounded-full shadow-lg shadow-blue-400"></div>
                    </div>
                </div>

                <div className="text-center space-y-4">
                    <h2 className="text-3xl font-bold text-white tracking-tight">
                        Translating Content
                    </h2>
                    <div className="flex items-center justify-center gap-3">
                        <span className="px-3 py-1 bg-white/10 rounded-full text-blue-300 text-sm font-medium border border-white/10 uppercase tracking-widest">
                            {sourceLang.label}
                        </span>
                        <ArrowRightLeft size={16} className="text-slate-500" />
                        <div className="flex gap-2">
                            {targetLangs.map((lang, idx) => (
                                <span
                                    key={idx}
                                    className="px-3 py-1 bg-blue-600/20 rounded-full text-blue-400 text-sm font-medium border border-blue-500/20 uppercase tracking-widest"
                                >
                                    {lang.label}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="w-64 h-1.5 bg-white/10 rounded-full mt-4 overflow-hidden mx-auto">
                        <motion.div
                            className="h-full bg-blue-500"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 3.5, ease: "easeInOut" }}
                        />
                    </div>

                    <div className="flex items-center justify-center gap-2 text-slate-400 text-sm italic mt-2">
                        <Loader2 size={14} className="animate-spin" />
                        <span>Applying YAI Neural Translation...</span>
                    </div>
                </div>
            </div>

            {/* Context hints floating around */}
            <div className="mt-16 flex gap-8">
                <div className="glass-morphism px-4 py-2 rounded-lg flex items-center gap-2 animate-bounce" style={{ animationDelay: '0s' }}>
                    <Sparkles size={14} className="text-blue-500" />
                    <span className="text-xs font-semibold text-slate-700">Glossary Applied</span>
                </div>
                <div className="glass-morphism px-4 py-2 rounded-lg flex items-center gap-2 animate-bounce" style={{ animationDelay: '0.2s' }}>
                    <BrainCircuit size={14} className="text-indigo-500" />
                    <span className="text-xs font-semibold text-slate-700">Context Aware</span>
                </div>
            </div>
        </motion.div>
    );
};

export default TranslationOverlay;
