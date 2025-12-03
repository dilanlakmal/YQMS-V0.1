import React, { useState, useRef, useEffect } from 'react';
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Type, Palette, Link, Image,
  Undo, Redo, Copy, Scissors, ClipboardPaste,
  Indent, Outdent, Quote, Code, Table,
  FileText, Download, Upload
} from 'lucide-react';

const RichTextEditor = ({ 
  value = '', 
  onChange, 
  placeholder = 'Start typing...', 
  height = '400px',
  className = '',
  showWordCount = true,
  allowFileOperations = true
}) => {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);
  const [showFontFamilyPicker, setShowFontFamilyPicker] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [currentFontSize, setCurrentFontSize] = useState('10');
  const [currentFontFamily, setCurrentFontFamily] = useState('Times New Roman'); 
  
  // NEW: State to track active formatting
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
    justifyFull: false,
    insertUnorderedList: false,
    insertOrderedList: false
  });

  // Font families
  const fontFamilies = [
    'Arial', 'Times New Roman', 'Calibri', 'Helvetica', 'Georgia', 
    'Verdana', 'Tahoma', 'Trebuchet MS', 'Impact', 'Comic Sans MS'
  ];

  // Font sizes
  const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];
  
  // Colors
  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
    '#800000', '#008000', '#000080', '#808000', '#800080', '#008080', '#C0C0C0',
    '#808080', '#FF9999', '#99FF99', '#9999FF', '#FFFF99', '#FF99FF', '#99FFFF',
    '#FFFFFF', '#F0F0F0', '#DCDCDC', '#D3D3D3', '#A9A9A9', '#696969', '#2F4F4F'
  ];

  // NEW: Function to check active formatting states
  const updateActiveFormats = () => {
    if (!editorRef.current) return;

    try {
      const newActiveFormats = {
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikeThrough: document.queryCommandState('strikeThrough'),
        justifyLeft: document.queryCommandState('justifyLeft'),
        justifyCenter: document.queryCommandState('justifyCenter'),
        justifyRight: document.queryCommandState('justifyRight'),
        justifyFull: document.queryCommandState('justifyFull'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        insertOrderedList: document.queryCommandState('insertOrderedList')
      };
      
      setActiveFormats(newActiveFormats);

      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        let element = range.commonAncestorContainer;
        
        // If it's a text node, get its parent element
        if (element.nodeType === Node.TEXT_NODE) {
          element = element.parentElement;
        }

        // Traverse up to find font styling
        while (element && element !== editorRef.current) {
          const computedStyle = window.getComputedStyle(element);
          
          // Get font size
          const fontSize = computedStyle.fontSize;
          if (fontSize) {
            // Convert px to number (remove 'px' suffix)
            const sizeValue = parseInt(fontSize.replace('px', ''));
            setCurrentFontSize(sizeValue.toString());
          }

          // Get font family
          const fontFamily = computedStyle.fontFamily;
          if (fontFamily) {
            // Clean up font family name (remove quotes and get first font)
            const cleanFontFamily = fontFamily.split(',')[0].replace(/['"]/g, '').trim();
            setCurrentFontFamily(cleanFontFamily);
          }

          element = element.parentElement;
        }
      }
    } catch (error) {
      // Some browsers might not support all queryCommandState calls
      console.warn('Error checking command states:', error);
    }
  };

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
      updateWordCount();
    }
  }, [value]);

  // NEW: Add event listeners for selection change
  useEffect(() => {
    const handleSelectionChange = () => {
      updateActiveFormats();
    };

    const handleKeyUp = () => {
      updateActiveFormats();
    };

    const handleMouseUp = () => {
      updateActiveFormats();
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    
    if (editorRef.current) {
      editorRef.current.addEventListener('keyup', handleKeyUp);
      editorRef.current.addEventListener('mouseup', handleMouseUp);
      editorRef.current.addEventListener('focus', handleSelectionChange);
    }

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (editorRef.current) {
        editorRef.current.removeEventListener('keyup', handleKeyUp);
        editorRef.current.removeEventListener('mouseup', handleMouseUp);
        editorRef.current.removeEventListener('focus', handleSelectionChange);
      }
    };
  }, []);

  const handleCommand = (command, value = null) => {
    if (editorRef.current) {
      editorRef.current.focus();
      
      setTimeout(() => {
        document.execCommand(command, false, value);
        handleContentChange();
        // Update active formats after command execution
        setTimeout(updateActiveFormats, 10);
      }, 10);
    }
  };

  const handleContentChange = () => {
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML);
      updateWordCount();
    }
  };

  const updateWordCount = () => {
    if (editorRef.current && showWordCount) {
      const text = editorRef.current.innerText || '';
      const words = text.trim().split(/\s+/).filter(word => word.length > 0);
      setWordCount(words.length);
    }
  };

  const insertTable = () => {
    const rows = prompt('Number of rows:', '3');
    const cols = prompt('Number of columns:', '3');
    if (rows && cols) {
      let tableHTML = '<table border="1" style="border-collapse: collapse; width: 100%;">';
      for (let i = 0; i < parseInt(rows); i++) {
        tableHTML += '<tr>';
        for (let j = 0; j < parseInt(cols); j++) {
          tableHTML += '<td style="padding: 8px; border: 1px solid #ccc;">&nbsp;</td>';
        }
        tableHTML += '</tr>';
      }
      tableHTML += '</table>';
      handleCommand('insertHTML', tableHTML);
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      handleCommand('createLink', url);
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      handleCommand('insertImage', url);
    }
  };

  const exportToHTML = () => {
    const content = editorRef.current.innerHTML;
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFromFile = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (editorRef.current) {
          editorRef.current.innerHTML = e.target.result;
          handleContentChange();
        }
      };
      reader.readAsText(file);
    }
  };

  // UPDATED: ToolbarButton now accepts and uses active prop
  const ToolbarButton = ({ onClick, active = false, children, title, disabled = false }) => (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      title={title}
      disabled={disabled}
      className={`p-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        active 
          ? 'bg-blue-500 text-white shadow-md' // Active state styling
          : 'text-gray-600 hover:bg-gray-200' // Inactive state styling
      }`}
    >
      {children}
    </button>
  );

  const Separator = () => (
    <div className="w-px h-6 bg-gray-300 mx-1"></div>
  );

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setShowColorPicker(false);
        setShowBgColorPicker(false);
        setShowFontSizePicker(false);
        setShowFontFamilyPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <div className={`border border-gray-300 rounded-lg overflow-hidden bg-white ${className}`}>
        {/* Toolbar */}
        <div className="bg-gray-50 border-b border-gray-300 p-2">
          {/* First Row */}
          <div className="flex flex-wrap items-center gap-1 mb-2">
            {/* File Operations */}
            {allowFileOperations && (
              <>
                <ToolbarButton onClick={() => fileInputRef.current?.click()} title="Import File">
                  <Upload size={16} />
                </ToolbarButton>
                <ToolbarButton onClick={exportToHTML} title="Export HTML">
                  <Download size={16} />
                </ToolbarButton>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".html,.txt"
                  onChange={importFromFile}
                  className="hidden"
                />
                <Separator />
              </>
            )}

            {/* Undo/Redo */}
            <ToolbarButton onClick={() => handleCommand('undo')} title="Undo">
              <Undo size={16} />
            </ToolbarButton>
            <ToolbarButton onClick={() => handleCommand('redo')} title="Redo">
              <Redo size={16} />
            </ToolbarButton>
            
            <Separator />

            {/* Font Family */}
            <div className="relative dropdown-container">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowFontFamilyPicker(!showFontFamilyPicker)}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 min-w-[100px] text-left"
              >
                Font
              </button>
              {showFontFamilyPicker && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 max-h-40 overflow-y-auto min-w-[150px]">
                  {fontFamilies.map(font => (
                    <button
                      key={font}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        handleCommand('fontName', font);
                        setShowFontFamilyPicker(false);
                      }}
                      className="block w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                      style={{ fontFamily: font }}
                    >
                      {font}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Font Size */}
            <div className="relative dropdown-container">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowFontSizePicker(!showFontSizePicker)}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 min-w-[60px] flex items-center gap-1"
                title={`Current size: ${currentFontSize}px`}
              >
                <Type size={16} />
                <span className="text-xs">{currentFontSize}</span>
              </button>
              {showFontSizePicker && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 max-h-40 overflow-y-auto">
                  {fontSizes.map(size => (
                    <button
                      key={size}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        handleCommand('fontSize', size);
                        setCurrentFontSize(size.toString());
                        setShowFontSizePicker(false);
                      }}
                      className={`block w-full px-3 py-1 text-left hover:bg-gray-100 text-sm ${
                        currentFontSize === size.toString() ? 'bg-blue-100 font-semibold' : ''
                      }`}
                    >
                      {size}px
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Second Row */}
          <div className="flex flex-wrap items-center gap-1">
            {/* Text Formatting - NOW WITH ACTIVE STATES */}
            <ToolbarButton 
              onClick={() => handleCommand('bold')} 
              title="Bold"
              active={activeFormats.bold}
            >
              <Bold size={16} />
            </ToolbarButton>
            <ToolbarButton 
              onClick={() => handleCommand('italic')} 
              title="Italic"
              active={activeFormats.italic}
            >
              <Italic size={16} />
            </ToolbarButton>
            <ToolbarButton 
              onClick={() => handleCommand('underline')} 
              title="Underline"
              active={activeFormats.underline}
            >
              <Underline size={16} />
            </ToolbarButton>
            <ToolbarButton 
              onClick={() => handleCommand('strikeThrough')} 
              title="Strikethrough"
              active={activeFormats.strikeThrough}
            >
              <Strikethrough size={16} />
            </ToolbarButton>

            <Separator />

            {/* Colors */}
            <div className="relative dropdown-container">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-2 rounded hover:bg-gray-200 text-gray-600"
                title="Text Color"
              >
                <Palette size={16} />
              </button>
              {showColorPicker && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 p-2">
                  <div className="text-xs mb-2 font-semibold">Text Color</div>
                  <div className="grid grid-cols-7 gap-1">
                    {colors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          handleCommand('foreColor', color);
                          setShowColorPicker(false);
                        }}
                        className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative dropdown-container">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowBgColorPicker(!showBgColorPicker)}
                className="p-2 rounded hover:bg-gray-200 text-gray-600"
                title="Background Color"
              >
                <div className="w-4 h-4 border-2 border-current"></div>
              </button>
              {showBgColorPicker && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 p-2">
                  <div className="text-xs mb-2 font-semibold">Background Color</div>
                  <div className="grid grid-cols-7 gap-1">
                    {colors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          handleCommand('backColor', color);
                          setShowBgColorPicker(false);
                        }}
                        className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Alignment - NOW WITH ACTIVE STATES */}
            <ToolbarButton 
              onClick={() => handleCommand('justifyLeft')} 
              title="Align Left"
              active={activeFormats.justifyLeft}
            >
              <AlignLeft size={16} />
            </ToolbarButton>
            <ToolbarButton 
              onClick={() => handleCommand('justifyCenter')} 
              title="Align Center"
              active={activeFormats.justifyCenter}
            >
              <AlignCenter size={16} />
            </ToolbarButton>
            <ToolbarButton 
              onClick={() => handleCommand('justifyRight')} 
              title="Align Right"
              active={activeFormats.justifyRight}
            >
              <AlignRight size={16} />
            </ToolbarButton>
            <ToolbarButton 
              onClick={() => handleCommand('justifyFull')} 
              title="Justify"
              active={activeFormats.justifyFull}
            >
              <AlignJustify size={16} />
            </ToolbarButton>

            <Separator />

            {/* Lists and Indentation - NOW WITH ACTIVE STATES */}
            <ToolbarButton 
              onClick={() => handleCommand('insertUnorderedList')} 
              title="Bullet List"
              active={activeFormats.insertUnorderedList}
            >
              <List size={16} />
            </ToolbarButton>
            <ToolbarButton 
              onClick={() => handleCommand('insertOrderedList')} 
              title="Numbered List"
              active={activeFormats.insertOrderedList}
            >
              <ListOrdered size={16} />
            </ToolbarButton>
            <ToolbarButton onClick={() => handleCommand('indent')} title="Increase Indent">
              <Indent size={16} />
            </ToolbarButton>
            <ToolbarButton onClick={() => handleCommand('outdent')} title="Decrease Indent">
              <Outdent size={16} />
            </ToolbarButton>

            <Separator />

            {/* Special Formatting */}
            <ToolbarButton onClick={() => handleCommand('formatBlock', 'blockquote')} title="Quote">
              <Quote size={16} />
            </ToolbarButton>
            <ToolbarButton onClick={() => handleCommand('formatBlock', 'pre')} title="Code Block">
              <Code size={16} />
            </ToolbarButton>

            <Separator />

            {/* Insert */}
            <ToolbarButton onClick={insertLink} title="Insert Link">
              <Link size={16} />
            </ToolbarButton>
            <ToolbarButton onClick={insertImage} title="Insert Image">
              <Image size={16} />
            </ToolbarButton>
            <ToolbarButton onClick={insertTable} title="Insert Table">
              <Table size={16} />
            </ToolbarButton>
          </div>
        </div>

        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleContentChange}
          onBlur={handleContentChange}
          className="rich-text-editor p-4 outline-none overflow-y-auto focus:ring-2 focus:ring-blue-500 focus:ring-inset"
          style={{ height, minHeight: '200px' }}
          data-placeholder={placeholder}
          suppressContentEditableWarning={true}
        />

        {/* Status Bar */}
        {showWordCount && (
          <div className="bg-gray-50 border-t border-gray-300 px-4 py-2 text-sm text-gray-600 flex justify-between items-center">
            <span>Words: {wordCount}</span>
            <span>Characters: {editorRef.current?.innerText?.length || 0}</span>
          </div>
        )}
      </div>

      {/* Global Styles */}
      <style >{`
        .rich-text-editor:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        .rich-text-editor:focus:before {
          content: '';
        }
        .rich-text-editor table {
          border-collapse: collapse;
          width: 100%;
          margin: 10px 0;
        }
        .rich-text-editor table td,
        .rich-text-editor table th {
          border: 1px solid #ccc;
          padding: 8px;
          text-align: left;
        }
        .rich-text-editor blockquote {
          border-left: 4px solid #ccc;
          margin: 10px 0;
          padding-left: 16px;
          color: #666;
        }
        .rich-text-editor pre {
          background-color: #f5f5f5;
          border: 1px solid #ccc;
          border-radius: 4px;
          padding: 10px;
          font-family: 'Courier New', monospace;
          overflow-x: auto;
        }
      `}</style>
    </>
  );
};

export default RichTextEditor;
