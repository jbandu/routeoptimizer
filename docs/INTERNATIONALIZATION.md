# Internationalization (i18n) Guide

## Overview

The COPA Route Optimizer supports multiple languages with authentic, aviation-specific translations. The application defaults to Spanish (Español) as COPA Airlines is based in Panama, with English as a secondary language option.

## Features

- **Two Languages**: Spanish (es) and English (en)
- **Authentic Aviation Spanish**: Professional terminology appropriate for airline dispatchers
- **Persistent Preference**: Language selection saved in localStorage
- **Smooth Switching**: Instant language switching without page reload
- **Complete Coverage**: All UI text is translatable

## Technology Stack

| Library | Purpose |
|---------|---------|
| `i18next` | Core i18n framework |
| `react-i18next` | React bindings for i18next |
| `i18next-browser-languagedetector` | Automatic language detection |
| `@google/generative-ai` | Gemini API for generating authentic translations |

## Architecture

### File Structure

```
src/
├── i18n/
│   ├── config.js              # i18n configuration
│   └── locales/
│       ├── en.json            # English translations
│       └── es.json            # Spanish translations
├── components/
│   └── LanguageSwitcher.jsx   # Language selector component
└── main.tsx                   # i18n initialization

scripts/
└── generate-translations.js    # Gemini-powered translation generator
```

### Configuration

**Location:** `src/i18n/config.js`

```javascript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      es: { translation: esTranslations }
    },
    fallbackLng: 'es',  // Default to Spanish
    lng: localStorage.getItem('copa-language') || 'es',
    // ...
  });
```

### Language Detection

The app detects language in this order:
1. **localStorage**: Previously saved preference (`copa-language` key)
2. **Browser**: User's browser language setting
3. **Fallback**: Spanish (es) as default

## Usage

### Using Translations in Components

#### 1. Import the hook

```javascript
import { useTranslation } from 'react-i18next';
```

#### 2. Use the `t` function

```javascript
function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('dashboard.subtitle')}</p>
      <button>{t('common.save')}</button>
    </div>
  );
}
```

#### 3. Access nested translations

Translation keys use dot notation:

```javascript
// Access: dashboard.totalOptimizations
t('dashboard.totalOptimizations')

// Access: approval.urgency.critical
t('approval.urgency.critical')

// Access: status.success
t('status.success')
```

### Language Switcher Component

**Location:** `src/components/LanguageSwitcher.jsx`

The `LanguageSwitcher` component provides a dropdown to switch between languages:

```jsx
import LanguageSwitcher from './components/LanguageSwitcher';

function App() {
  return (
    <nav>
      <LanguageSwitcher />
    </nav>
  );
}
```

**Features:**
- Displays current language with flag emoji
- Dropdown menu with all available languages
- Highlights currently selected language
- Saves preference automatically

### Programmatic Language Change

```javascript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { i18n } = useTranslation();

  const changeToSpanish = () => {
    i18n.changeLanguage('es');
  };

  const changeToEnglish = () => {
    i18n.changeLanguage('en');
  };

  // Get current language
  const currentLang = i18n.language; // 'es' or 'en'
}
```

## Translation Structure

### Translation Files

**English:** `src/i18n/locales/en.json`
**Spanish:** `src/i18n/locales/es.json`

### Categories

The translations are organized into logical categories:

| Category | Description | Example Keys |
|----------|-------------|--------------|
| `nav` | Navigation menu items | `dashboard`, `map`, `approval` |
| `dashboard` | Dashboard page text | `title`, `totalSavings`, `successRate` |
| `approval` | Approval workflow | `pending`, `approve`, `reject` |
| `map` | Map visualization | `legend`, `switchTo3D`, `waypoint` |
| `wind` | Wind optimization | `optimalAltitude`, `timeSavings` |
| `fuel` | Fuel tankering | `recommended`, `tankerAmount` |
| `turbulence` | Turbulence alerts | `detected`, `severity`, `zones` |
| `savings` | Savings dashboard | `totalFlights`, `co2Reduced` |
| `common` | Common UI elements | `save`, `cancel`, `loading`, `error` |
| `status` | Status labels | `running`, `success`, `pending` |
| `units` | Measurement units | `nm`, `ft`, `gallons`, `knots` |
| `errors` | Error messages | `fetchFailed`, `networkError` |

### Example Translations

```json
{
  "dashboard": {
    "title": "COPA Airlines AI Route Optimizer",
    "totalSavings": "Total Savings",
    "loading": "Loading dashboard..."
  },
  "approval": {
    "approve": "Approve Optimization",
    "reject": "Reject Optimization",
    "urgency": {
      "critical": "Critical",
      "high": "High",
      "normal": "Normal"
    }
  },
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "loading": "Loading..."
  }
}
```

Spanish equivalent (`es.json`):

```json
{
  "dashboard": {
    "title": "Optimizador de Rutas IA de COPA Airlines",
    "totalSavings": "Ahorros Totales",
    "loading": "Cargando panel de control..."
  },
  "approval": {
    "approve": "Aprobar Optimización",
    "reject": "Rechazar Optimización",
    "urgency": {
      "critical": "Crítica",
      "high": "Alta",
      "normal": "Normal"
    }
  },
  "common": {
    "save": "Guardar",
    "cancel": "Cancelar",
    "loading": "Cargando..."
  }
}
```

## Generating Translations with Gemini

For authentic, aviation-specific Spanish translations, use the Gemini-powered translation generator.

### Prerequisites

1. **Gemini API Key**: Get one from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Usage

```bash
# Set your API key
export GEMINI_API_KEY=your_api_key_here

# Run the generator
node scripts/generate-translations.js
```

### What It Does

The script:
1. Takes English translations from the code
2. Sends them to Gemini with aviation-specific instructions
3. Generates authentic Latin American Spanish translations
4. Maintains proper aviation terminology
5. Uses professional tone for dispatchers
6. Preserves technical terms (IATA codes, units, etc.)
7. Outputs both `en.json` and `es.json` files

### Gemini Prompt Features

The generator uses a specialized prompt that ensures:
- **Regional Spanish**: Latin American (Panama/Central America)
- **Aviation Terminology**: Industry-standard Spanish aviation terms
- **Professional Tone**: Appropriate for airline operations staff
- **Technical Preservation**: Keeps codes, units, and abbreviations in English
- **Context Awareness**: Understands dispatcher vs. passenger contexts

### Example Output

```bash
$ GEMINI_API_KEY=xxx node scripts/generate-translations.js

🚀 Starting translation generation...

🌐 Generating authentic Spanish translations using Gemini...

✅ Translations generated successfully!

📝 English translations saved to: src/i18n/locales/en.json
📝 Spanish translations saved to: src/i18n/locales/es.json

✨ Translation generation complete!

Sample Spanish translations:
- Dashboard: Optimizador de Rutas IA de COPA Airlines
- Approval: Aprobación de Optimizaciones
- Savings: Ahorros Totales
```

## Adding New Translations

### 1. Add to English File

Edit `src/i18n/locales/en.json`:

```json
{
  "myNewFeature": {
    "title": "My New Feature",
    "description": "This is a new feature",
    "action": "Take Action"
  }
}
```

### 2. Add to Spanish File

**Option A: Manual Translation**

Edit `src/i18n/locales/es.json`:

```json
{
  "myNewFeature": {
    "title": "Mi Nueva Función",
    "description": "Esta es una nueva función",
    "action": "Realizar Acción"
  }
}
```

**Option B: Use Gemini (Recommended)**

1. Update the `englishTranslations` object in `scripts/generate-translations.js`
2. Run the generator: `GEMINI_API_KEY=xxx node scripts/generate-translations.js`
3. Review and commit the generated files

### 3. Use in Component

```javascript
import { useTranslation } from 'react-i18next';

function MyNewFeature() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('myNewFeature.title')}</h1>
      <p>{t('myNewFeature.description')}</p>
      <button>{t('myNewFeature.action')}</button>
    </div>
  );
}
```

## Best Practices

### 1. Always Use Translation Keys

❌ **Bad:**
```javascript
<h1>Dashboard</h1>
<p>Total Savings: $5000</p>
```

✅ **Good:**
```javascript
<h1>{t('dashboard.title')}</h1>
<p>{t('dashboard.totalSavings')}: ${amount}</p>
```

### 2. Keep Technical Terms Untranslated

Certain terms should remain in English:
- Airport codes (PTY, BOG, MIA)
- Aircraft types (738, 73J, E90)
- Technical units (nm, ft, kts)
- COPA brand name
- Technical abbreviations (RLS, API, URL)

### 3. Use Interpolation for Dynamic Content

```javascript
// ❌ Bad
<p>{t('message')} {username}</p>

// ✅ Good - with interpolation
t('greeting', { name: username })

// Translation file:
{
  "greeting": "Hello, {{name}}!"
}
```

### 4. Organize by Feature

Group related translations together:

```json
{
  "dashboard": { ... },
  "approval": { ... },
  "map": { ... }
}
```

### 5. Provide Context

Use descriptive keys:

```javascript
// ❌ Bad
t('button1')
t('text2')

// ✅ Good
t('approval.approve')
t('dashboard.subtitle')
```

### 6. Handle Plurals

For plural forms:

```json
{
  "flights": "{{count}} flight",
  "flights_plural": "{{count}} flights"
}
```

```javascript
t('flights', { count: 1 })  // "1 flight"
t('flights', { count: 5 })  // "5 flights"
```

## Testing

### Manual Testing

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open the app in your browser

3. Click the language switcher (🇵🇦 Español / 🇺🇸 English)

4. Verify all text changes language

5. Reload the page - language preference should persist

### Automated Testing

```javascript
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n/config';

describe('Dashboard with i18n', () => {
  it('renders in Spanish by default', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Dashboard />
      </I18nextProvider>
    );

    expect(screen.getByText(/Optimizador de Rutas/i)).toBeInTheDocument();
  });

  it('switches to English', async () => {
    await i18n.changeLanguage('en');

    render(
      <I18nextProvider i18n={i18n}>
        <Dashboard />
      </I18nextProvider>
    );

    expect(screen.getByText(/Route Optimizer/i)).toBeInTheDocument();
  });
});
```

## Troubleshooting

### Translations Not Showing

1. **Check import**: Ensure `'./i18n/config'` is imported in `main.tsx`
2. **Check hook**: Component must use `useTranslation()` hook
3. **Check keys**: Verify translation key exists in JSON files
4. **Check syntax**: Ensure proper dot notation (`dashboard.title`)

### Language Not Persisting

1. **Check localStorage**: Inspect browser's localStorage for `copa-language` key
2. **Check config**: Verify `detection.caches: ['localStorage']` in config
3. **Clear cache**: Try clearing browser cache and localStorage

### Spanish Not Default

1. **Check config**: Ensure `fallbackLng: 'es'` in `src/i18n/config.js`
2. **Check localStorage**: Delete `copa-language` key and reload
3. **Check initialization**: Verify `lng: localStorage.getItem('copa-language') || 'es'`

### Gemini Script Fails

1. **API Key**: Verify `GEMINI_API_KEY` environment variable is set
2. **Network**: Check internet connection
3. **Rate Limits**: Gemini has rate limits - wait a moment and retry
4. **JSON Format**: Ensure input translations are valid JSON

## Advanced Features

### Language-Specific Formatting

```javascript
import { useTranslation } from 'react-i18next';

function formatCurrency(amount, language) {
  return new Intl.NumberFormat(language === 'es' ? 'es-PA' : 'en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

function MyComponent() {
  const { i18n } = useTranslation();

  return (
    <p>{formatCurrency(5000, i18n.language)}</p>
    // Spanish: USD 5,000.00
    // English: $5,000.00
  );
}
```

### Date Formatting

```javascript
function formatDate(date, language) {
  return new Intl.DateTimeFormat(language === 'es' ? 'es-PA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}
```

### Namespace Organization (Future)

For larger apps, organize translations into namespaces:

```javascript
// i18n config
resources: {
  en: {
    dashboard: dashboardEn,
    approval: approvalEn,
    common: commonEn
  },
  es: {
    dashboard: dashboardEs,
    approval: approvalEs,
    common: commonEs
  }
}

// Usage
const { t } = useTranslation('dashboard');
t('title'); // Looks in dashboard namespace
```

## Contributing Translations

### Translation Guidelines

When adding or updating Spanish translations:

1. **Use Aviation Spanish**: Consult ICAO/IATA Spanish documentation
2. **Be Consistent**: Use the same term for the same concept
3. **Professional Tone**: Write for airline operations staff
4. **Regional Spanish**: Use Latin American Spanish (not European)
5. **Verify with Native Speakers**: Have a Spanish-speaking dispatcher review

### Common Aviation Terms

| English | Spanish |
|---------|---------|
| Flight | Vuelo |
| Route | Ruta |
| Optimization | Optimización |
| Savings | Ahorros |
| Fuel | Combustible |
| Tankering | Tankering (keep in English) |
| Waypoint | Punto de Referencia |
| Altitude | Altitud |
| Turbulence | Turbulencia |
| Dispatcher | Despachador |
| Approval | Aprobación |
| Aircraft | Aeronave |
| Flight Level | Nivel de Vuelo |
| Tailwind | Viento de Cola |
| Headwind | Viento de Frente |

## Resources

- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)
- [Google Gemini API](https://ai.google.dev/)
- [ICAO Aviation Spanish](https://www.icao.int/safety/pages/spanish.aspx)
- [Intl API (Formatting)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)

## Quick Reference

### Common Commands

```bash
# Generate translations with Gemini
GEMINI_API_KEY=xxx node scripts/generate-translations.js

# Start development server
npm run dev

# Clear localStorage (reset language)
localStorage.clear()  # In browser console
```

### Common Patterns

```javascript
// Simple translation
t('key')

// Nested key
t('section.subsection.key')

// With interpolation
t('key', { variable: value })

// Change language
i18n.changeLanguage('es')

// Get current language
const lang = i18n.language

// Check if translation exists
i18n.exists('key')
```

---

**Questions or issues?** Check the [Developer Guide](./DEVELOPER_GUIDE.md) or open a GitHub issue.
