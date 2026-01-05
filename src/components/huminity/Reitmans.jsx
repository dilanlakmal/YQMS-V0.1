import React from 'react';
import { Package, Calendar, Users, MessageSquare, Image as ImageIcon, Clock, MapPin, Mail, Phone, Check, X, UploadCloud } from 'lucide-react';

const ReitmansForm = ({
  formData,
  setFormData,
  updateSectionData,
  handleImageUpload,
  removeImage,
  removeRecord,
  addRecord,
  errors,
  checkHistory = [],
  onBack,
  onNewInspection,
  handleSubmit,
  ribsAvailable,
  setPassFail,
  // Added suggestion props
  orderNoSearch,
  setOrderNoSearch,
  orderNoSuggestions,
  showOrderNoDropdown,
  setShowOrderNoDropdown,
  isLoadingOrderData,
  handleOrderNoSelect
}) => {
  // Lightweight helpers to avoid errors if props missing
  const safeSet = (key, value) => setFormData && setFormData(prev => ({ ...prev, [key]: value }));
  const dropdownRef = React.useRef(null);

  const setCurrentTimeIfEmpty = (field) => {
    if (!formData[field]) {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      safeSet(field, `${hh}:${mm}`);
    }
  };

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowOrderNoDropdown && setShowOrderNoDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowOrderNoDropdown]);

  return (
    <div className="max-w-[1500px] mx-auto p-6 bg-pink-50">

      {/* Beige header like the mock */}
      <div className="rounded-lg bg-white p-6 shadow-lg border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Style #</label>
            <div className="relative" ref={dropdownRef}>
              <input
                value={formData.factoryStyleNo || orderNoSearch || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setOrderNoSearch && setOrderNoSearch(val);
                  setFormData && setFormData(prev => ({ ...prev, factoryStyleNo: val }));
                }}
                onFocus={() => {
                  if (orderNoSuggestions && orderNoSuggestions.length > 0) {
                    setShowOrderNoDropdown && setShowOrderNoDropdown(true);
                  }
                }}
                className={`w-full rounded-lg border px-4 py-2 bg-white outline-none transition-all ${errors?.factoryStyleNo ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Search style..."
              />

              {showOrderNoDropdown && (
                <ul className="absolute z-[100] left-0 right-0 mt-1 max-h-60 overflow-auto bg-white border border-gray-200 rounded-xl shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  {isLoadingOrderData ? (
                    <li className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                      Searching styles...
                    </li>
                  ) : orderNoSuggestions?.length === 0 ? (
                    <li className="px-4 py-3 text-sm text-gray-500 italic text-center">No matching styles found</li>
                  ) : (
                    orderNoSuggestions?.map((ord, idx) => (
                      <li
                        key={ord._id || idx}
                        onClick={() => {
                          handleOrderNoSelect && handleOrderNoSelect(ord.moNo || ord.style || '');
                          setShowOrderNoDropdown && setShowOrderNoDropdown(false);
                        }}
                        className="px-4 py-3 hover:bg-rose-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0 group"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-gray-800 group-hover:text-rose-600 transition-colors">
                              {ord.moNo || ord.style}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5 font-medium italic">
                              {ord.buyer}
                            </div>
                          </div>
                          <div className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold group-hover:bg-rose-100 group-hover:text-rose-600 transition-colors">
                            {ord.product || 'Standard'}
                          </div>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
            {errors?.factoryStyleNo && (
              <p className="text-red-500 text-[11px] mt-1 font-bold italic">{errors.factoryStyleNo}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Composition:</label>
            <input
              value={formData?.composition || ''}
              onChange={(e) => safeSet('composition', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-gray-50 cursor-not-allowed"
              placeholder=""
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">PO #</label>
            <input
              value={formData?.poLine || ''}
              onChange={(e) => safeSet('poLine', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-gray-50 cursor-not-allowed"
              placeholder=""
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Time Checked:</label>
            <input
              type="time"
              value={formData?.timeChecked || ''}
              onChange={(e) => safeSet('timeChecked', e.target.value)}
              onFocus={() => setCurrentTimeIfEmpty('timeChecked')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Moisture rate before:</label>
            <input
              value={formData?.moistureRateBeforeDehumidify || ''}
              onChange={(e) => safeSet('moistureRateBeforeDehumidify', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white"
              placeholder=""
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">No. pc checked:</label>
            <input
              value={formData?.noPcChecked || ''}
              onChange={(e) => safeSet('noPcChecked', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white"
              placeholder=""
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Time in:</label>
            <input
              type="time"
              value={formData?.timeIn || ''}
              onChange={(e) => safeSet('timeIn', e.target.value)}
              onFocus={() => setCurrentTimeIfEmpty('timeIn')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Time out:</label>
            <input
              type="time"
              value={formData?.timeOut || ''}
              onChange={(e) => safeSet('timeOut', e.target.value)}
              onFocus={() => setCurrentTimeIfEmpty('timeOut')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Moisture rate after:</label>
            <input
              value={formData?.moistureRateAfter || ''}
              onChange={(e) => safeSet('moistureRateAfter', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white"
              placeholder=""
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Upper Centisimal index:</label>
            <input
              value={formData?.upperCentisimalIndex || ''}
              onChange={(e) => safeSet('upperCentisimalIndex', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white"
              placeholder=""
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Date:</label>
            <input
              type="date"
              value={formData?.date || ''}
              onChange={(e) => safeSet('date', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white"
            />
          </div>
        </div>

        <div className="mt-6 bg-rose-50 p-6 rounded-2xl shadow-inner border border-rose-100">
          <h3 className="text-2xl font-bold text-rose-700 mb-4 flex items-center gap-2"><Users className="text-rose-700" size={18} />Inspection Records</h3>
          <div className="flex flex-col items-center gap-6">
            {formData.inspectionRecords.map((record, index) => (
              <div key={index} className="w-full max-w-6xl mx-auto bg-white rounded-xl shadow-md p-5 mb-4 border border-gray-100">
                <div className="flex items-center justify-between mb-4 px-4">
                  <h3 className="text-lg font-extrabold text-slate-900">Reitmans Reading</h3>
                  {formData.inspectionRecords.length > 1 && (
                    <button onClick={() => removeRecord(index)} className="text-rose-600 hover:text-rose-800 text-2xl">✕</button>
                  )}
                </div>

                <div className="space-y-3">
                  {['top', 'middle', 'bottom'].map((section) => (
                    <div key={section} className="p-3 bg-pink-50 rounded-xl border border-pink-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-slate-700 capitalize">{section}</div>
                        <div>
                          {record[section].pass ? (
                            <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-semibold inline-flex items-center gap-1"><Check size={12} />Pass</span>
                          ) : record[section].fail ? (
                            <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-semibold inline-flex items-center gap-1"><X size={12} />Fail</span>
                          ) : (
                            <span className="text-slate-500 text-xs">N/A</span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                        <input
                          type="number"
                          value={record[section].body}
                          onChange={(e) => updateSectionData(index, section, 'body', e.target.value)}
                          placeholder="Body"
                          className="col-span-3 w-full rounded-lg border border-gray-200 px-4 py-3 bg-white focus:outline-none"
                          disabled={!formData.factoryStyleNo}
                        />
                        {ribsAvailable ? (
                          <input
                            type="number"
                            value={record[section].ribs}
                            onChange={(e) => updateSectionData(index, section, 'ribs', e.target.value)}
                            placeholder="Ribs"
                            className="w-full rounded-lg border border-gray-200 px-4 py-3 bg-white focus:outline-none"
                            disabled={!formData.factoryStyleNo}
                          />
                        ) : (
                          <div />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <div className="text-sm font-medium text-slate-600 mb-2">Inspection Photos</div>
                  <div className="flex flex-col gap-3">
                    <label className={`w-full rounded-lg p-4 border-2 ${formData.factoryStyleNo ? 'border-dashed border-rose-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-80'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <UploadCloud className="text-rose-600" size={18} />
                          <div className="text-sm text-slate-600">{formData.factoryStyleNo ? 'Click to upload or drag images here (PNG/JPG/WebP, ≤5MB)' : 'Select Factory Style No to enable uploads'}</div>
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => document.getElementById(`image-upload-${index}`)?.click()}
                            className={`bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm ${!formData.factoryStyleNo ? 'opacity-60 cursor-not-allowed' : ''}`}
                            disabled={!formData.factoryStyleNo}
                          >
                            Upload
                          </button>
                        </div>
                      </div>
                      <input id={`image-upload-${index}`} type="file" multiple accept="image/jpeg,image/jpg,image/png,image/webp" onChange={(e) => handleImageUpload(index, e.target.files)} className="hidden" disabled={!formData.factoryStyleNo} />
                    </label>

                    <div className="flex items-center gap-3">
                      {record.images?.slice(0, 4).map((img, i) => (
                        <div key={img.id || i} className="relative w-16 h-16 rounded-md overflow-hidden border-2 border-white shadow-sm">
                          <img src={img.preview || ''} alt={img.name || `thumb-${i}`} className="w-full h-full object-cover" />
                          <button
                            onClick={(e) => { e.stopPropagation(); removeImage(index, img.id); }}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
                            aria-label="Remove image"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 ">
          <h3 className="text-xl font-bold text-gray-600 mb-4"><MessageSquare className="inline mr-2 text-gray-600" size={18} />Remark</h3>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <div>
              <textarea
                value={formData?.remark || ''}
                onChange={(e) => safeSet('remark', e.target.value)}
                className="w-full min-h-[120px] rounded-lg border border-slate-200 p-3"
                placeholder="Enter remark here..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save / Actions */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSubmit}
          className="bg-rose-500 hover:bg-rose-600 hover:scale-105 transition-all duration-300 text-white px-6 py-2 rounded-md font-semibold shadow"
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default ReitmansForm;
