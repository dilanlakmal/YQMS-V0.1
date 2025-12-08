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
  const [currentFontSize, setCurrentFontSize] = useState('12');
  const [currentFontFamily, setCurrentFontFamily] = useState('Arial');
  
  // State to track active formatting
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

  // ✅ FIXED: Better function to check active formatting states
  const updateActiveFormats = () => {
    if (!editorRef.current) return;

    try {
      // Save current selection
      const selection = window.getSelection();
      if (selection.rangeCount === 0) return;

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

      // Get current font properties
      const range = selection.getRangeAt(0);
      let element = range.commonAncestorContainer;
      
      if (element.nodeType === Node.TEXT_NODE) {
        element = element.parentElement;
      }

      // Traverse up to find font styling
      while (element && element !== editorRef.current) {
        const computedStyle = window.getComputedStyle(element);
        
        // Get font size
        const fontSize = computedStyle.fontSize;
        if (fontSize) {
          const sizeValue = parseInt(fontSize.replace('px', ''));
          setCurrentFontSize(sizeValue.toString());
        }

        // Get font family
        const fontFamily = computedStyle.fontFamily;
        if (fontFamily) {
          const cleanFontFamily = fontFamily.split(',')[0].replace(/['"]/g, '').trim();
          setCurrentFontFamily(cleanFontFamily);
        }

        element = element.parentElement;
      }
    } catch (error) {
      console.warn('Error checking command states:', error);
    }
  };

  // ✅ FIXED: Better content synchronization
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      const selection = window.getSelection();
      const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
      const startOffset = range ? range.startOffset : 0;
      const endOffset = range ? range.endOffset : 0;

      editorRef.current.innerHTML = value;
      updateWordCount();

      // Restore cursor position if possible
      try {
        if (range && editorRef.current.firstChild) {
          const newRange = document.createRange();
          const textNode = editorRef.current.firstChild;
          if (textNode.nodeType === Node.TEXT_NODE) {
            newRange.setStart(textNode, Math.min(startOffset, textNode.textContent.length));
            newRange.setEnd(textNode, Math.min(endOffset, textNode.textContent.length));
            selection.removeAllRanges();
            selection.addRange(newRange);
          }
        }
      } catch (e) {
        // Ignore cursor restoration errors
      }
    }
  }, [value]);

  // Event listeners for selection change
  useEffect(() => {
    const handleSelectionChange = () => {
      if (document.activeElement === editorRef.current) {
        updateActiveFormats();
      }
    };

    const handleKeyUp = (e) => {
      // Update on specific keys that might change formatting
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
        updateActiveFormats();
      }
    };

    const handleMouseUp = () => {
      updateActiveFormats();
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    
    if (editorRef.current) {
      editorRef.current.addEventListener('keyup', handleKeyUp);
      editorRef.current.addEventListener('mouseup', handleMouseUp);
      editorRef.current.addEventListener('focus', updateActiveFormats);
    }

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (editorRef.current) {
        editorRef.current.removeEventListener('keyup', handleKeyUp);
        editorRef.current.removeEventListener('mouseup', handleMouseUp);
        editorRef.current.removeEventListener('focus', updateActiveFormats);
      }
    };
  }, []);

  // ✅ FIXED: Better command handling with proper focus management
  const handleCommand = (command, value = null) => {
    if (!editorRef.current) return;

    // Ensure editor has focus
    editorRef.current.focus();

    // Special handling for lists to fix the issue
    if (command === 'insertUnorderedList' || command === 'insertOrderedList') {
      // Check if we're already in a list
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        let element = range.commonAncestorContainer;
        
        if (element.nodeType === Node.TEXT_NODE) {
          element = element.parentElement;
        }

        // Check if we're inside a list
        const isInList = element.closest('ul, ol');
        
        if (isInList) {
          // If we're in a list, remove it first
          document.execCommand(command, false, value);
        } else {
          // If we're not in a list, create one
          document.execCommand(command, false, value);
        }
      } else {
        document.execCommand(command, false, value);
      }
    } else {
      // Regular command execution
      document.execCommand(command, false, value);
    }

    // Update content and formatting state
    handleContentChange();
    setTimeout(updateActiveFormats, 10);
  };

  // ✅ FIXED: Better content change handling
  const handleContentChange = () => {
    if (editorRef.current && onChange) {
      const content = editorRef.current.innerHTML;
      onChange(content);
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

  // ✅ IMPROVED: Better table insertion
  const insertTable = () => {
    const rows = prompt('Number of rows:', '3');
    const cols = prompt('Number of columns:', '3');
    if (rows && cols && parseInt(rows) > 0 && parseInt(cols) > 0) {
      let tableHTML = '<table border="1" style="border-collapse: collapse; width: 100%; margin: 10px 0;">';
      for (let i = 0; i < parseInt(rows); i++) {
        tableHTML += '<tr>';
        for (let j = 0; j < parseInt(cols); j++) {
          tableHTML += '<td style="padding: 8px; border: 1px solid #ccc; min-width: 50px;">&nbsp;</td>';
        }
        tableHTML += '</tr>';
      }
      tableHTML += '</table><p>&nbsp;</p>'; // Add paragraph after table
      handleCommand('insertHTML', tableHTML);
    }
  };

  const insertLink = () => {
    const selection = window.getSelection();
    const selectedText = selection.toString();
    const url = prompt('Enter URL:', 'https://');
    
    if (url && url !== 'https://') {
      if (selectedText) {
        handleCommand('createLink', url);
      } else {
        const linkText = prompt('Enter link text:', url);
        if (linkText) {
          handleCommand('insertHTML', `<a href="${url}" target="_blank">${linkText}</a>`);
        }
      }
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:', 'https://');
    if (url && url !== 'https://') {
      const alt = prompt('Enter alt text (optional):', '');
      handleCommand('insertHTML', `<img src="${url}" alt="${alt}" style="max-width: 100%; height: auto;" />`);
    }
  };

  // ✅ IMPROVED: Better export with proper HTML structure
  const exportToHTML = () => {
    const content = editorRef.current.innerHTML;
    const fullHTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Rich Text Document</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        table td, table th { border: 1px solid #ccc; padding: 8px; text-align: left; }
        blockquote { border-left: 4px solid #ccc; margin: 10px 0; padding-left: 16px; color: #666; }
        pre { background-color: #f5f5f5; border: 1px solid #ccc; border-radius: 4px; padding: 10px; font-family: 'Courier New', monospace; overflow-x: auto; }
    </style>
</head>
<body>
    ${content}
</body>
</html>`;
    
    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document_${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFromFile = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (editorRef.current) {
          let content = e.target.result;
          
          // If it's a full HTML document, extract body content
          if (content.includes('<body>')) {
            const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
            if (bodyMatch) {
              content = bodyMatch[1];
            }
          }
          
          editorRef.current.innerHTML = content;
          handleContentChange();
        }
      };
      reader.readAsText(file);
    }
    // Reset file input
    event.target.value = '';
  };

  const ToolbarButton = ({ onClick, active = false, children, title, disabled = false }) => (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        if (!disabled) onClick();
      }}
      title={title}
      disabled={disabled}
      className={`p-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        active 
          ? 'bg-blue-500 text-white shadow-md' 
          : 'text-gray-600 hover:bg-gray-200'
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
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 min-w-[120px] text-left"
              >
                {currentFontFamily}
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
                        setCurrentFontFamily(font);
                        setShowFontFamilyPicker(false);
                      }}
                      className={`block w-full px-3 py-2 text-left hover:bg-gray-100 text-sm ${
                        currentFontFamily === font ? 'bg-blue-100 font-semibold' : ''
                      }`}
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
            {/* Text Formatting */}
            <ToolbarButton 
              onClick={() => handleCommand('bold')} 
              title="Bold (Ctrl+B)"
              active={activeFormats.bold}
            >
              <Bold size={16} />
            </ToolbarButton>
            <ToolbarButton 
              onClick={() => handleCommand('italic')} 
              title="Italic (Ctrl+I)"
              active={activeFormats.italic}
            >
              <Italic size={16} />
            </ToolbarButton>
            <ToolbarButton 
              onClick={() => handleCommand('underline')} 
              title="Underline (Ctrl+U)"
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

            {/* Alignment */}
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

            {/* Lists and Indentation */}
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

        {/* ✅ IMPROVED: Editor with better event handling */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleContentChange}
          onBlur={handleContentChange}
          onKeyDown={(e) => {
            // Handle keyboard shortcuts
            if (e.ctrlKey || e.metaKey) {
              switch (e.key.toLowerCase()) {
                case 'b':
                  e.preventDefault();
                  handleCommand('bold');
                  break;
                case 'i':
                  e.preventDefault();
                  handleCommand('italic');
                  break;
                case 'u':
                  e.preventDefault();
                  handleCommand('underline');
                  break;
                case 'z':
                  if (e.shiftKey) {
                    e.preventDefault();
                    handleCommand('redo');
                  } else {
                    e.preventDefault();
                    handleCommand('undo');
                  }
                  break;
              }
            }
          }}
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

      {/* ✅ IMPROVED: Global Styles with better list styling */}
      <style>{`
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
          min-width: 50px;
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
        .rich-text-editor ul,
        .rich-text-editor ol {
          margin: 10px 0;
          padding-left: 30px;
        }
        .rich-text-editor ul li {
          list-style-type: disc;
          margin: 5px 0;
        }
        .rich-text-editor ol li {
          list-style-type: decimal;
          margin: 5px 0;
        }
        .rich-text-editor ul ul li {
          list-style-type: circle;
        }
        .rich-text-editor ul ul ul li {
          list-style-type: square;
        }
        .rich-text-editor p {
          margin: 5px 0;
        }
        .rich-text-editor h1, .rich-text-editor h2, .rich-text-editor h3,
        .rich-text-editor h4, .rich-text-editor h5, .rich-text-editor h6 {
          margin: 10px 0 5px 0;
          font-weight: bold;
        }
        .rich-text-editor a {
          color: #0066cc;
          text-decoration: underline;
        }
        .rich-text-editor img {
          max-width: 100%;
          height: auto;
          margin: 5px 0;
        }
      `}</style>
    </>
  );
};

export default RichTextEditor;
