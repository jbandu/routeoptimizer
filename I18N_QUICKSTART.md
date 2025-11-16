# Spanish Localization - Quick Start Guide

## Overview

Your COPA Route Optimizer now supports both **Spanish (Español)** and **English**, with authentic aviation-specific translations. The app defaults to Spanish, perfect for COPA's Panamanian operations.

## What's Included

✅ **Complete Spanish Translation** - All UI text translated with aviation terminology
✅ **Language Switcher** - Easy toggle between Spanish and English in the nav bar
✅ **Persistent Preference** - Language choice saved automatically
✅ **Gemini Integration** - Script to generate authentic translations using AI

## Quick Test

1. **Start the app:**
   ```bash
   npm install  # Install new i18n dependencies
   npm run dev
   ```

2. **Look for the language switcher** in the top-right of the navigation bar
   - Shows: 🇵🇦 Español (default) or 🇺🇸 English

3. **Click to switch languages** - The entire app updates instantly!

## Current State

The app includes **hand-crafted Spanish translations** for:
- Navigation menu
- Dashboard
- Approval workflow
- Map controls
- Wind optimization
- Fuel tankering
- All common UI elements
- Error messages
- Status labels

## Generating Better Translations (Optional)

Want even more authentic Spanish? Use the Gemini AI script!

### Prerequisites

1. Get a free Gemini API key: https://makersuite.google.com/app/apikey

### Run the Generator

```bash
# Set your API key
export GEMINI_API_KEY=your_key_here

# Generate authentic translations
node scripts/generate-translations.js
```

### What It Does

The script uses Google's Gemini AI to generate:
- ✈️ **Aviation-specific Spanish** - Professional terminology for dispatchers
- 🌎 **Latin American Spanish** - Appropriate for Panama/Central America
- 🎯 **Context-aware** - Understands airline operations context
- 📝 **Authentic phrasing** - Natural Spanish, not literal translations

Example output:
```
🚀 Starting translation generation...
🌐 Generating authentic Spanish translations using Gemini...
✅ Translations generated successfully!

Sample Spanish translations:
- Dashboard: Optimizador de Rutas IA de COPA Airlines
- Approval: Aprobación de Optimizaciones
- Savings: Ahorros Totales
```

## File Structure

```
src/
├── i18n/
│   ├── config.js           # i18n setup
│   └── locales/
│       ├── en.json         # English translations
│       └── es.json         # Spanish translations
├── components/
│   └── LanguageSwitcher.jsx  # Language toggle component
└── main.tsx                # Initializes i18n

scripts/
└── generate-translations.js  # Gemini translator
```

## How It Works

### 1. Language Switcher

Located in the top navigation bar:
- 🇵🇦 **Español** (Panama flag)
- 🇺🇸 **English** (USA flag)

Click to switch - changes are instant and persistent!

### 2. Translation System

All text uses translation keys:

**Before (hardcoded):**
```jsx
<h1>Dashboard</h1>
<button>Approve</button>
```

**After (translatable):**
```jsx
<h1>{t('nav.dashboard')}</h1>
<button>{t('approval.approve')}</button>
```

The `t()` function looks up the right text based on the selected language.

### 3. Persistence

Your language choice is saved in the browser's localStorage:
- Key: `copa-language`
- Value: `'es'` or `'en'`

## Adding More Translations

### Quick Method (Manual)

1. **Edit** `src/i18n/locales/en.json`:
   ```json
   {
     "myFeature": {
       "title": "My Feature",
       "button": "Click Me"
     }
   }
   ```

2. **Edit** `src/i18n/locales/es.json`:
   ```json
   {
     "myFeature": {
       "title": "Mi Función",
       "button": "Haz Clic Aquí"
     }
   }
   ```

3. **Use in component**:
   ```jsx
   import { useTranslation } from 'react-i18next';

   function MyComponent() {
     const { t } = useTranslation();
     return <h1>{t('myFeature.title')}</h1>;
   }
   ```

### AI Method (Recommended)

1. **Update** `scripts/generate-translations.js` with new English text

2. **Run generator**:
   ```bash
   GEMINI_API_KEY=xxx node scripts/generate-translations.js
   ```

3. **Review** generated Spanish in `src/i18n/locales/es.json`

## Example Translations

### Navigation
| English | Spanish |
|---------|---------|
| Dashboard | Panel de Control |
| Savings | Ahorros |
| Approval | Aprobación |
| Map | Mapa |
| Optimizer | Optimizador |

### Aviation Terms
| English | Spanish |
|---------|---------|
| Total Optimizations | Total de Optimizaciones |
| Active Routes | Rutas Activas |
| Total Savings | Ahorros Totales |
| Success Rate | Tasa de Éxito |
| Fuel Tankering | Tankering de Combustible |
| Wind Optimization | Optimización de Vientos |
| Turbulence Alert | Alerta de Turbulencia |

### Actions
| English | Spanish |
|---------|---------|
| Approve Optimization | Aprobar Optimización |
| Reject Optimization | Rechazar Optimización |
| Analyze Winds | Analizar Vientos |
| Save | Guardar |
| Cancel | Cancelar |

## Testing

### Manual Testing

1. Start app: `npm run dev`
2. Navigate to different pages
3. Switch language using the language switcher
4. Verify all text changes
5. Reload page - language should persist

### Check Browser

Open DevTools > Application > Local Storage:
- Look for key: `copa-language`
- Value should be: `'es'` or `'en'`

## Troubleshooting

### Language Switcher Not Showing

Check that `LanguageSwitcher` is imported in `App.jsx`:
```jsx
import LanguageSwitcher from './components/LanguageSwitcher';
```

### Text Not Translating

1. Verify i18n is initialized in `main.tsx`:
   ```jsx
   import './i18n/config';
   ```

2. Check component uses the hook:
   ```jsx
   const { t } = useTranslation();
   ```

3. Verify translation key exists in both `en.json` and `es.json`

### Spanish Not Default

Clear localStorage and reload:
```javascript
// In browser console
localStorage.removeItem('copa-language');
location.reload();
```

### Gemini Script Fails

1. Verify API key is set:
   ```bash
   echo $GEMINI_API_KEY
   ```

2. Check internet connection

3. Try again - Gemini has rate limits, wait 30 seconds

## Next Steps

### For Developers

1. **Read full documentation**: See `docs/INTERNATIONALIZATION.md`
2. **Update components**: Replace hardcoded text with `t('key')`
3. **Add new features**: Include translations from the start
4. **Test thoroughly**: Check both languages for every feature

### For COPA Operations

1. **Test in Spanish**: Verify aviation terminology is correct
2. **Provide feedback**: Let us know if translations need adjustment
3. **Request changes**: Submit issues for terminology updates

## Benefits

### For COPA Airlines

✅ **Native Language Support** - Dispatchers work in Spanish
✅ **Authentic Terminology** - Professional aviation Spanish
✅ **Better Adoption** - More comfortable for Spanish-speaking staff
✅ **Regulatory Compliance** - Documentation in local language

### For International Use

✅ **English Available** - For international partners
✅ **Easy to Extend** - Add more languages later
✅ **Consistent UX** - Same experience in any language

## Technical Details

### Libraries Used

- **i18next**: Core internationalization framework
- **react-i18next**: React integration for i18next
- **i18next-browser-languagedetector**: Auto-detect browser language
- **@google/generative-ai**: Gemini API for AI translations

### Language Codes

- `es`: Spanish (Español) - Latin American variant
- `en`: English - US variant

### Default Behavior

1. App starts in Spanish (COPA's primary language)
2. Checks if user has previous language preference
3. Falls back to browser language if no preference
4. Saves every language change to localStorage

## Resources

- **Full Documentation**: `docs/INTERNATIONALIZATION.md`
- **Developer Guide**: `docs/DEVELOPER_GUIDE.md`
- **Component Docs**: `docs/COMPONENTS.md`
- **react-i18next**: https://react.i18next.com/
- **Gemini API**: https://ai.google.dev/

## Quick Commands

```bash
# Install dependencies
npm install

# Start development
npm run dev

# Generate AI translations (optional)
GEMINI_API_KEY=your_key node scripts/generate-translations.js

# Build for production
npm run build
```

## Support

Questions or issues?
1. Check `docs/INTERNATIONALIZATION.md` for detailed guide
2. Review example components in `src/components/`
3. Open a GitHub issue for bugs or feature requests

---

**¡Bienvenido a COPA Route Optimizer en Español! 🇵🇦**
