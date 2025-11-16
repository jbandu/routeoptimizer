import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

/**
 * LanguageSwitcher component
 *
 * Allows users to switch between English and Spanish
 * with smooth transitions and persistent preference
 */
export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'es', label: 'Español', flag: '🇵🇦' },
    { code: 'en', label: 'English', flag: '🇺🇸' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
  };

  return (
    <div className="relative group">
      <button
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
        aria-label="Change language"
      >
        <Languages className="w-4 h-4" />
        <span className="text-sm font-medium hidden sm:inline">
          {currentLanguage.flag} {currentLanguage.label}
        </span>
      </button>

      {/* Dropdown menu */}
      <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors ${
              i18n.language === lang.code
                ? 'bg-blue-50 text-[#003B7A] font-semibold'
                : 'text-gray-700'
            }`}
          >
            <span className="mr-2">{lang.flag}</span>
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
}
