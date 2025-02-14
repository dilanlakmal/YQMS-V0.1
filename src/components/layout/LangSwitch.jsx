// src/components/LanguageSwitcher.jsx

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu } from '@headlessui/react';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState('en'); // Default language is English

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setSelectedLanguage(lng);
  };

  const languageOptions = {
    en: 'English',
    kh: 'Khmer',
    ch: 'Chinese',
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500">
          {languageOptions[selectedLanguage]}
        </Menu.Button>
      </div>

      <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
        <div className="py-1">
          {Object.keys(languageOptions).map((lng) => (
            <Menu.Item key={lng}>
              {({ active }) => (
                <button
                  onClick={() => changeLanguage(lng)}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } block px-4 py-2 text-sm text-gray-700 w-full text-left`}
                >
                  {languageOptions[lng]}
                </button>
              )}
            </Menu.Item>
          ))}
        </div>
      </Menu.Items>
    </Menu>
  );
};

export default LanguageSwitcher;
