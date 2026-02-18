import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

const ASSET_PATH = "/assets/Wash-bold/";

const CARE_CATEGORIES = [
    {
        id: 'machineWash',
        label: 'MACHINE WASH',
        options: [
            {
                id: 'wash-type',
                icon: 'machine-wash.png',
                items: ['machine-wash.png', 'machine-wash-permanent-press.png', 'machine-wash-delicate.png', 'hand-wasing.png', 'do-not-wash.png']
            },
            {
                id: 'temp-dots',
                icon: 'water-temperature30.png',
                items: ['water-temperature30.png', 'water-temperature40.png', 'water-temperature50.png']
            },
            {
                id: 'temp-dots-lines',
                icon: 'dote1-line1.png',
                items: ['dote1-line1.png', 'dote2-line1.png', 'dote3-line1.png', 'dote1-line2.png', 'dote2-line2.png', 'dote3-line2.png']
            },
            {
                id: 'temp-numbers',
                icon: 'box-30.png',
                items: ['box-30.png', 'box-40.png', 'box-50.png', 'box-60.png', 'box-70.png', 'box-95.png']
            },
            {
                id: 'temp-numbers-lines',
                icon: 'box-line1-30.png',
                items: ['box-line1-30.png', 'box-line1-40.png', 'box-line1-60.png', 'num30-line2.png', 'num40-line2.png', 'num60-line2.png']
            },
        ]
    },
    {
        id: 'bleach',
        label: 'BLEACH',
        options: [
            { id: 'bleach-allowed', icon: 'bleach.png', items: ['bleach.png'] },
            { id: 'non-chlorine', icon: 'non-chlorine-bleach.png', items: ['non-chlorine-bleach.png'] },
            { id: 'chlorine', icon: 'chlorine.png', items: ['chlorine.png'] },
            { id: 'do-not-bleach', icon: 'not-bleach.png', items: ['not-bleach.png', 'not-bleach1.png'] },
        ]
    },
    {
        id: 'tumbleDry',
        label: 'TUMBLE DRY',
        options: [
            { id: 'tumble-normal', icon: 'tumble-dry.png', items: ['tumble-dry.png', 'tb-dry-normal-no-heat.png', 'tb-dry-permanent-press-no-heat.png', 'tb-dry-gentle-no-heat.png', 'low-heat1.png', 'medium-heat.png', 'high-heat.png'] },
            { id: 'tumble-low', icon: 'tb-dry-gentle-low-heat.png', items: ['tb-dry-permanent-press-low-heat.png', 'tb-dry-permanent-press-medium-heat.png', 'tb-dry-gentle-low-heat.png'] },
            { id: 'tumble-medium', icon: 'tb-dry-gentle-medium-heat.png', items: ['tb-dry-gentle-medium-heat.png'] },
            // { id: 'tumble-no-heat', icon: 'tb-dry-gentle-no-heat.png', items: [] },
            { id: 'do-not-tumble', icon: 'do-not-tumble-dry.png', items: ['do-not-tumble-dry.png'] },
        ]
    },
    {
        id: 'dry',
        label: 'DRY',
        options: [
            { id: 'dry-normal', icon: 'dry.png', items: ['dry.png'] },
            { id: 'do-not-dry', icon: 'do-not-dry34.png', items: ['do-not-dry34.png'] },
            { id: 'dry-custom', icon: 'care-label.png', items: ['care-label.png'] }, // Specific care label drying instruction
            { id: 'dry-flat', icon: 'dry-flat.png', items: ['dry-flat.png'] },
            { id: 'line-dry', icon: 'line-dry.png', items: ['line-dry.png'] },
            { id: 'wring', icon: 'Wring.png', items: ['Wring.png', 'do-not-wring.png'] },
        ]
    },
    {
        id: 'iron',
        label: 'IRON',
        options: [
            { id: 'iron-any', icon: 'iron-empty.png', items: ['iron-empty.png'] },
            { id: 'iron-low', icon: 'iron-low-temp.png', items: ['iron-low-temp.png'] },
            { id: 'iron-medium', icon: 'iron-medium-temp.png', items: ['iron-medium-temp.png'] },
            { id: 'iron-high', icon: 'iron-hight-temp.png', items: ['iron-hight-temp.png'] },
            { id: 'do-not-iron', icon: 'do-not-iron.png', items: ['do-not-iron.png'] },
            { id: 'no-steam', icon: 'no-steam.png', items: ['no-steam.png'] },
        ]
    },
    {
        id: 'dryClean',
        label: 'DRY CLEAN',
        options: [
            {
                id: 'dry-clean-all',
                icon: 'dry-clean.png',
                items: [
                    'dry-clean.png',
                    'do-not-dryclean.png',
                    'do-not-dry.png',
                    'wet-cleaning.png',
                    'any-solvent.png',
                    'petroleum-sovent-only.png',
                    'Any-sx-tetrachlorethylene.png',
                    'reduced.png',
                    'short-cycle.png',
                    'low-heat.png',
                    'no-steam-finishing.png',
                    'gentle-cleaning-pce.png',
                    'very-gentle-cleaning-pce.png',
                    'dry.png'
                ]
            }
        ]
    }
];

// Compact (edit modal) vs normal (create form) scales
const DEFAULT_SCALE_COMPACT = 'scale-100';
const DEFAULT_SCALE_NORMAL = 'scale-125';

const CUSTOM_SCALES_COMPACT = {
    // Machine Wash
    'machine-wash.png': 'scale-100',
    'hand-wasing.png': 'scale-100',
    'do-not-wash.png': 'scale-100',

    // Water Temp
    'water-temperature30.png': 'scale-100',
    'water-temperature40.png': 'scale-100',
    'water-temperature50.png': 'scale-100',

    // Bleach
    'bleach.png': 'scale-[0.9]',
    'non-chlorine-bleach.png': 'scale-[0.9]',
    'not-bleach.png': 'scale-[0.9]',
    'not-bleach1.png': 'scale-[0.9]',

    // Tumble Dry
    'tumble-dry.png': 'scale-[0.95]',
    'tb-dry-normal-no-heat.png': 'scale-[0.95]',
    'tb-dry-permanent-press-no-heat.png': 'scale-[1.0]',
    'tb-dry-gentle-no-heat.png': 'scale-[1.0]',
    'low-heat1.png': 'scale-[0.9]',
    'medium-heat.png': 'scale-[0.9]',
    'high-heat.png': 'scale-[0.9]',
    'tb-dry-permanent-press-low-heat.png': 'scale-[1.05]',
    'tb-dry-permanent-press-medium-heat.png': 'scale-[1.05]',
    'tb-dry-gentle-low-heat.png': 'scale-[1.05]',
    'tb-dry-gentle-medium-heat.png': 'scale-[1.05]',
    'do-not-tumble-dry.png': 'scale-[0.9]',

    // Dry
    'line-dry.png': 'scale-[1.0]',
    'dry-flat.png': 'scale-[1.0]',
    'dry.png': 'scale-[1.0]',
    'do-not-dry.png': 'scale-[1.0]',

    // Iron
    'iron-empty.png': 'scale-[1.1]',
    'iron-low-temp.png': 'scale-[1.1]',
    'iron-medium-temp.png': 'scale-[1.1]',
    'iron-hight-temp.png': 'scale-[1.1]',
    'no-steam.png': 'scale-[1.1]',
    'do-not-iron.png': 'scale-[1.1]',

    // Dry Clean
    'dry-clean.png': 'scale-[0.75]',
    'do-not-dryclean.png': 'scale-[1.2]',
    'wet-cleaning.png': 'scale-[0.9]',
    'any-solvent.png': 'scale-[0.9]',
    'petroleum-sovent-only.png': 'scale-[0.8]',
    'Any-sx-tetrachlorethylene.png': 'scale-[0.85]',
    'reduced.png': 'scale-[0.85]',
    'short-cycle.png': 'scale-[0.85]',
    'low-heat.png': 'scale-[0.85]',
    'no-steam-finishing.png': 'scale-[0.85]',
    'gentle-cleaning-pce.png': 'scale-[0.85]',
    'very-gentle-cleaning-pce.png': 'scale-[0.9]',
};

// Normal (create form) – larger symbols
const CUSTOM_SCALES_NORMAL = {
    'machine-wash.png': 'scale-125',
    'hand-wasing.png': 'scale-125',
    'do-not-wash.png': 'scale-125',
    'water-temperature30.png': 'scale-125',
    'water-temperature40.png': 'scale-125',
    'water-temperature50.png': 'scale-125',
    'bleach.png': 'scale-[1.0]',
    'non-chlorine-bleach.png': 'scale-[1.0]',
    'not-bleach.png': 'scale-[1.0]',
    'not-bleach1.png': 'scale-[1.0]',
    'tumble-dry.png': 'scale-[1.1]',
    'tb-dry-normal-no-heat.png': 'scale-[1.1]',
    'tb-dry-permanent-press-no-heat.png': 'scale-[1.2]',
    'tb-dry-gentle-no-heat.png': 'scale-[1.2]',
    'low-heat1.png': 'scale-[1.0]',
    'medium-heat.png': 'scale-[1.0]',
    'high-heat.png': 'scale-[1.0]',
    'tb-dry-permanent-press-low-heat.png': 'scale-[1.3]',
    'tb-dry-permanent-press-medium-heat.png': 'scale-[1.3]',
    'tb-dry-gentle-low-heat.png': 'scale-[1.3]',
    'tb-dry-gentle-medium-heat.png': 'scale-[1.3]',
    'do-not-tumble-dry.png': 'scale-[1.0]',
    'line-dry.png': 'scale-[1.2]',
    'dry-flat.png': 'scale-[1.2]',
    'dry.png': 'scale-[1.2]',
    'do-not-dry.png': 'scale-[1.2]',
    'iron-empty.png': 'scale-[1.5]',
    'iron-low-temp.png': 'scale-[1.5]',
    'iron-medium-temp.png': 'scale-[1.5]',
    'iron-hight-temp.png': 'scale-[1.5]',
    'no-steam.png': 'scale-[1.5]',
    'do-not-iron.png': 'scale-[1.5]',
    'dry-clean.png': 'scale-[0.8]',
    'do-not-dryclean.png': 'scale-[1.9]',
    'wet-cleaning.png': 'scale-[1.1]',
    'any-solvent.png': 'scale-[1.1]',
    'petroleum-sovent-only.png': 'scale-[0.9]',
    'Any-sx-tetrachlorethylene.png': 'scale-[1.0]',
    'reduced.png': 'scale-[1.0]',
    'short-cycle.png': 'scale-[1.0]',
    'low-heat.png': 'scale-[1.0]',
    'no-steam-finishing.png': 'scale-[1.0]',
    'gentle-cleaning-pce.png': 'scale-[1.0]',
    'very-gentle-cleaning-pce.png': 'scale-[1.1]',
};

const getIconScale = (iconName, compact) => {
    const map = compact ? CUSTOM_SCALES_COMPACT : CUSTOM_SCALES_NORMAL;
    const defaultScale = compact ? DEFAULT_SCALE_COMPACT : DEFAULT_SCALE_NORMAL;
    return map[iconName] || defaultScale;
};

const CareSymbolsSelector = ({ value = {}, onChange, compact = false }) => {
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
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-left flex items-center justify-between hover:border-blue-400 transition-colors shadow-sm ${compact ? 'min-h-[42px]' : 'min-h-[50px]'}`}
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
                                    className={`object-contain transform ${getIconScale(icon, compact)} origin-center ${compact ? 'w-6 h-6' : 'w-8 h-8'}`}
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
                <div className={`absolute z-50 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 ${compact ? 'max-w-[520px]' : 'min-w-[600px] lg:min-w-[800px]'}`}>
                    <div className={`overflow-x-auto overflow-y-auto ${compact ? 'p-2 max-h-[70vh]' : 'p-4'}`}>
                        <div className={`grid grid-cols-6 ${compact ? 'gap-2' : 'gap-4'} ${compact ? '' : 'min-w-[700px]'}`}>
                            {CARE_CATEGORIES.map(cat => (
                                <div key={cat.id} className={`flex flex-col ${compact ? 'gap-1' : 'gap-2'}`}>
                                    {/* Header */}
                                    <div className={`text-center border-b dark:border-gray-700 ${compact ? 'pb-1' : 'pb-2'}`}>
                                        <span className={`font-bold text-gray-500 uppercase tracking-wider ${compact ? 'text-[10px]' : 'text-xs'}`}>{cat.label}</span>
                                    </div>

                                    <div className={`flex flex-col items-center ${compact ? 'gap-1.5 py-1' : 'gap-3 py-2'}`}>
                                        {cat.options.map((opt, idx) => (
                                            <div key={idx} className={`flex flex-col items-center w-full ${compact ? 'gap-1' : 'gap-2'}`}>
                                                {opt.items.map((itemIcon) => (
                                                    <button
                                                        key={itemIcon}
                                                        type="button"
                                                        onClick={() => handleSelect(cat.id, itemIcon)}
                                                        className={`transition-all hover:bg-blue-50 dark:hover:bg-gray-700 border-2 ${value[cat.id] === itemIcon ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-transparent'} ${compact ? 'p-1 rounded-md' : 'p-2 rounded-lg'}`}
                                                        title={itemIcon}
                                                    >
                                                        <img
                                                            src={`${ASSET_PATH}${itemIcon}`}
                                                            alt={itemIcon}
                                                            className={`object-contain block mx-auto transform ${getIconScale(itemIcon, compact)} origin-center transition-transform ${compact ? 'w-6 h-6 hover:scale-110' : 'w-8 h-8 md:w-10 md:h-10 hover:scale-[1.8]'}`}
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
                    <div className={`bg-gray-50 dark:bg-gray-700/50 border-t flex justify-between items-center ${compact ? 'p-2' : 'p-3'}`}>
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
