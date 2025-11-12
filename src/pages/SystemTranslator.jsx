import React, { useState } from 'react';
import Header from '../components/system-translator/Header';
import ModeSelector from '../components/system-translator/ModeSelector';
import TextTranslator from '../components/system-translator/TextTranslator';
import FileTranslator from '../components/system-translator/FileTranslator';
import '../components/system-translator/Translator_style.css';

function SystemTranslator() {
  const [mode, setMode] = useState('text');

  return (
    <div className="translator-system min-h-screen">
      <Header />
      <div className="px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="translator-card translator-rounded translator-border shadow-sm p-6 md:p-8">
            <ModeSelector mode={mode} setMode={setMode} />
            <div className="mt-8">
              {mode === "text" ? <TextTranslator /> : <FileTranslator />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SystemTranslator;