import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

const ASSET_PATH = "/assets/Wash-bold/";

const CARE_CATEGORIES = [
    {
        id: 'machineWash',
        label: 'MACHINE WASH',
        options: [
            { id: 'wash-tub', icon: 'machine-wash.png', items: ['machine-wash.png', 'machine-wash-permanent-press.png', 'machine-wash-delicate.png', 'hand-wasing.png', 'do-not-wash.png'] },
            { id: 'temp-30', icon: 'water-temperature30.png', items: ['water-temperature30.png', 'box-30.png', 'box-line1-30.png'] },
            { id: 'temp-40', icon: 'water-temperature40.png', items: ['water-temperature40.png', 'box-40.png', 'box-line1-40.png'] },
            { id: 'temp-50', icon: 'water-temperature50.png', items: ['water-temperature50.png', 'box-50.png'] },
            { id: 'temp-60', icon: 'num60-line2.png', items: ['num60-line2.png', 'box-60.png', 'box-line1-60.png'] },
        ]
    },
    {
        id: 'bleach',
        label: 'BLEACH',
        options: [
            { id: 'bleach-allowed', icon: 'bleach.png', items: ['bleach.png'] },
            { id: 'non-chlorine', icon: 'non-chlorine-bleach.png', items: ['non-chlorine-bleach.png'] },
            { id: 'do-not-bleach', icon: 'not-bleach.png', items: ['not-bleach.png', 'not-bleach1.png'] },
        ]
    },
    {
        id: 'tumbleDry',
        label: 'TUMBLE DRY',
        options: [
            { id: 'tumble-normal', icon: 'tumble-dry.png', items: ['tumble-dry.png'] },
            { id: 'tumble-low', icon: 'tb-dry-gentle-low-heat.png', items: ['tb-dry-gentle-low-heat.png', 'tb-dry-permanent-press-low-heat.png'] },
            { id: 'tumble-medium', icon: 'tb-dry-gentle-medium-heat.png', items: ['tb-dry-gentle-medium-heat.png', 'tb-dry-permanent-press-medium-heat.png'] },
            { id: 'tumble-no-heat', icon: 'tb-dry-gentle-no-heat.png', items: ['tb-dry-gentle-no-heat.png', 'tb-dry-permanent-press-no-heat.png'] },
            { id: 'do-not-tumble', icon: 'do-not-tumble-dry.png', items: ['do-not-tumble-dry.png'] },
        ]
    },
    {
        id: 'dry',
        label: 'DRY',
        options: [
            { id: 'line-dry', icon: 'line-dry.png', items: ['line-dry.png'] },
            { id: 'dry-flat', icon: 'dry-flat.png', items: ['dry-flat.png'] },
            { id: 'dip-dry', icon: 'dry.png', items: ['dry.png'] }, // Assuming 'dry.png' might be drip dry or generic
            { id: 'do-not-dry', icon: 'do-not-dry.png', items: ['do-not-dry.png'] },
        ]
    },
    {
        id: 'iron',
        label: 'IRON',
        options: [
            { id: 'iron-low', icon: 'iron-low-temp.png', items: ['iron-low-temp.png'] },
            { id: 'iron-medium', icon: 'iron-medium-temp.png', items: ['iron-medium-temp.png'] },
            { id: 'iron-high', icon: 'iron-hight-temp.png', items: ['iron-hight-temp.png'] },
            { id: 'no-steam', icon: 'no-steam.png', items: ['no-steam.png', 'no-steam-finishing.png'] },
            { id: 'do-not-iron', icon: 'do-not-iron.png', items: ['do-not-iron.png'] },
        ]
    },
    {
        id: 'dryClean',
        label: 'DRY CLEAN',
        options: [
            { id: 'dry-clean', icon: 'dry-clean.png', items: ['dry-clean.png', 'black-circle.png'] },
            { id: 'dry-clean-p', icon: 'petroleum-sovent-only.png', items: ['petroleum-sovent-only.png'] },
            { id: 'dry-clean-f', icon: 'dry-f-002.png', items: ['dry-f-002.png', 'dry-f-003.png'] },
            { id: 'wet-clean', icon: 'wet-cleaning.png', items: ['wet-cleaning.png'] },
            { id: 'do-not-dry-clean', icon: 'do-not-dryclean.png', items: ['do-not-dryclean.png'] },
        ]
    }
];

// Simplified Grid View for the Dropdown
const CareSymbolsSelector = ({ value = {}, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Initial value structure: { machineWash: 'icon.png', bleach: 'icon.png', ... }

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelect = (category, iconName) => {
        const newValue = { ...value, [category]: iconName };
        // Toggle off if already selected? No, usually replace. 
        // If clicking same, maybe clear? Let's keep it select to replace.
        if (value[category] === iconName) {
            const { [category]: removed, ...rest } = newValue;
            onChange(rest);
        } else {
            onChange(newValue);
        }
    };

    const selectedCount = Object.keys(value).length;

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CARE INSTRUCTIONS :</label>

            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full min-h-[50px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-left flex items-center justify-between hover:border-blue-400 transition-colors shadow-sm"
            >
                <div className="flex flex-wrap gap-2 items-center">
                    {selectedCount === 0 ? (
                        <span className="text-gray-400 italic">Select care symbols...</span>
                    ) : (
                        Object.entries(value).map(([category, icon]) => (
                            <div key={category} className="relative group">
                                <img
                                    src={`${ASSET_PATH}${icon}`}
                                    alt={category}
                                    className="w-8 h-8 object-contain"
                                    onError={(e) => e.target.style.display = 'none'}
                                />
                            </div>
                        ))
                    )}
                </div>
                <ChevronDown size={20} className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Content - The Grid */}
            {isOpen && (
                <div className="absolute z-50 mt-2 w-full min-w-[600px] lg:min-w-[800px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 overflow-x-auto">
                        <div className="grid grid-cols-6 gap-4 min-w-[700px]">
                            {CARE_CATEGORIES.map(cat => (
                                <div key={cat.id} className="flex flex-col gap-2">
                                    {/* Header */}
                                    <div className="pb-2 text-center border-b dark:border-gray-700">
                                        <span className="text-xs font-black text-gray-500 uppercase tracking-wider">{cat.label}</span>
                                    </div>

                                    <div className="flex flex-col gap-3 py-2 items-center">
                                        {cat.options.map((opt, idx) => (
                                            <div key={idx} className="flex flex-col gap-2 items-center w-full">
                                                {/* Render all items in this option group, or just the main one? 
                                                     The user image shows individual symbols.
                                                     My data 'items' array implies variants.
                                                     Let's flatten the list for selection.
                                                 */}
                                                {opt.items.map((itemIcon) => (
                                                    <button
                                                        key={itemIcon}
                                                        type="button"
                                                        onClick={() => handleSelect(cat.id, itemIcon)}
                                                        className={`p-2 rounded-lg transition-all hover:bg-blue-50 dark:hover:bg-gray-700 border-2 ${value[cat.id] === itemIcon ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-transparent'}`}
                                                        title={itemIcon}
                                                    >
                                                        <img
                                                            src={`${ASSET_PATH}${itemIcon}`}
                                                            alt={itemIcon}
                                                            className="w-8 h-8 md:w-10 md:h-10 object-contain block mx-auto"
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer / clear */}
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 border-t flex justify-between items-center">
                        <span className="text-xs text-gray-500">Select one symbol per column</span>
                        <button
                            type="button"
                            onClick={() => onChange({})}
                            className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1"
                        >
                            <X size={14} /> Clear All
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CareSymbolsSelector;
