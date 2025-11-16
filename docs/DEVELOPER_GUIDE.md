# Developer Guide

## Table of Contents

- [Getting Started](#getting-started)
- [Development Environment Setup](#development-environment-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Debugging](#debugging)
- [Database Management](#database-management)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
  ```bash
  node --version  # Should be >= 18.0.0
  ```

- **npm** (v9 or higher)
  ```bash
  npm --version   # Should be >= 9.0.0
  ```

- **Git**
  ```bash
  git --version
  ```

- **Code Editor** (VS Code recommended)

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/routeoptimizer.git
   cd routeoptimizer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the project root:
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your credentials:
   ```bash
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_MAPBOX_TOKEN=your_mapbox_access_token
   ```

   **How to get credentials:**

   - **Supabase:**
     1. Go to [supabase.com](https://supabase.com)
     2. Create a new project or use existing
     3. Go to Settings > API
     4. Copy the URL and anon/public key

   - **Mapbox:**
     1. Go to [mapbox.com](https://mapbox.com)
     2. Create account or sign in
     3. Go to Account > Access Tokens
     4. Create or copy an access token

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**

   Navigate to `http://localhost:5173`

## Development Environment Setup

### VS Code Extensions

Recommended extensions for optimal development experience:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "dsznajder.es7-react-js-snippets",
    "christian-kohler.path-intellisense",
    "formulahendry.auto-rename-tag",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

Install all recommended extensions:
```bash
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss
```

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ],
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

### Git Configuration

Set up Git hooks for code quality:

```bash
# Initialize git hooks
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lint"
```

## Project Structure

```
routeoptimizer/
├── .bolt/                  # Bolt.new configuration
├── .github/                # GitHub workflows
├── docs/                   # Documentation
│   ├── API.md
│   ├── COMPONENTS.md
│   ├── ARCHITECTURE.md
│   ├── DEVELOPER_GUIDE.md
│   └── data-model.md
├── public/                 # Static assets
├── src/
│   ├── assets/            # Images, fonts, etc.
│   ├── components/        # React components
│   │   ├── Dashboard.jsx
│   │   ├── MapView.jsx
│   │   └── ...
│   ├── lib/               # Library configurations
│   │   └── supabase.js
│   ├── services/          # Business logic
│   │   ├── fuelService.js
│   │   ├── weatherService.js
│   │   └── turbulenceService.js
│   ├── utils/             # Utility functions
│   │   └── sampleRouteData.js
│   ├── App.jsx            # Main app component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── supabase/
│   └── migrations/        # Database migrations
├── .env.local             # Environment variables (gitignored)
├── .env.example           # Environment template
├── .gitignore
├── eslint.config.js       # ESLint configuration
├── index.html             # HTML entry point
├── package.json           # Dependencies
├── postcss.config.js      # PostCSS config
├── README.md              # Project overview
├── tailwind.config.js     # Tailwind configuration
├── tsconfig.json          # TypeScript config
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.js         # Vite configuration
```

## Development Workflow

### Daily Development Cycle

1. **Pull latest changes**
   ```bash
   git pull origin main
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Make changes and test**
   - Edit code
   - Check browser for changes
   - Test functionality

5. **Run linter**
   ```bash
   npm run lint
   ```

6. **Type check**
   ```bash
   npm run typecheck
   ```

7. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

8. **Push to remote**
   ```bash
   git push origin feature/your-feature-name
   ```

9. **Create Pull Request**
   - Open GitHub
   - Create PR from your branch to main
   - Request review

### Branch Naming Conventions

- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `test/` - Test additions/updates
- `chore/` - Maintenance tasks

Examples:
```
feature/wind-optimization-ui
fix/fuel-calculation-bug
refactor/component-structure
docs/api-documentation
```

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**
```bash
feat(dashboard): add real-time execution updates
fix(fuel-service): correct tankering calculation
docs(readme): update installation instructions
refactor(components): extract reusable StatCard
test(fuel-service): add tankering calculation tests
chore(deps): update dependencies
```

## Coding Standards

### JavaScript/React Style

#### Component Structure

```jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ServiceFunction } from '../services/someService';

/**
 * ComponentName - Brief description
 *
 * @param {Object} props - Component props
 * @param {string} props.param1 - Description
 * @param {number} props.param2 - Description
 */
export default function ComponentName({ param1, param2 }) {
  // 1. State declarations
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. Effects
  useEffect(() => {
    fetchData();
  }, []);

  // 3. Event handlers and functions
  async function fetchData() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('table')
        .select('*');

      if (error) throw error;
      setData(data);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // 4. Conditional returns
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  // 5. Main render
  return (
    <div className="container">
      {/* Component JSX */}
    </div>
  );
}
```

#### Naming Conventions

**Components:**
```javascript
// PascalCase for components
export default function DashboardView() { }
export function StatCard() { }
```

**Functions:**
```javascript
// camelCase for functions
function fetchUserData() { }
async function calculateTankering() { }
```

**Constants:**
```javascript
// UPPER_SNAKE_CASE for constants
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_ATTEMPTS = 3;
```

**Files:**
```
ComponentName.jsx        # Components (PascalCase)
serviceName.js          # Services (camelCase)
utilityFunction.js      # Utilities (camelCase)
```

### CSS/Tailwind Guidelines

**Prefer Tailwind utilities:**
```jsx
// Good
<div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">

// Avoid
<div className="custom-container">
```

**Responsive design:**
```jsx
<div className="
  w-full
  md:w-1/2
  lg:w-1/3
  p-4
  md:p-6
  lg:p-8
">
```

**COPA brand colors:**
```jsx
// Use brand colors consistently
<button className="bg-[#003B7A] hover:bg-[#0066CC] text-white">
<span className="text-[#FFB81C]">
```

**Custom classes (when needed):**
```css
/* index.css */
@layer components {
  .btn-primary {
    @apply bg-[#003B7A] text-white px-4 py-2 rounded-lg
           hover:bg-[#0066CC] transition-colors font-medium;
  }

  .card {
    @apply bg-white rounded-lg shadow-md p-6;
  }
}
```

### Code Quality Rules

**1. No console.log in production**
```javascript
// Development only
if (import.meta.env.DEV) {
  console.log('Debug info:', data);
}
```

**2. Always handle errors**
```javascript
// Good
try {
  const result = await riskyOperation();
} catch (error) {
  console.error('Operation failed:', error);
  // Show user-friendly message
}

// Bad
await riskyOperation(); // No error handling
```

**3. Validate props**
```javascript
// Use prop types or TypeScript
ComponentName.propTypes = {
  data: PropTypes.array.isRequired,
  onUpdate: PropTypes.func
};

// Or TypeScript
interface Props {
  data: Array<any>;
  onUpdate?: () => void;
}
```

**4. Clean up effects**
```javascript
useEffect(() => {
  const subscription = supabase
    .channel('updates')
    .subscribe();

  // Always clean up
  return () => {
    supabase.removeChannel(subscription);
  };
}, []);
```

**5. Avoid prop drilling**
```javascript
// For deeply nested props, consider Context or state management
const UserContext = createContext();

function App() {
  const [user, setUser] = useState(null);

  return (
    <UserContext.Provider value={user}>
      <ChildComponents />
    </UserContext.Provider>
  );
}
```

## Testing

### Testing Setup

Install testing libraries:
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest
```

### Unit Tests

**Component Test Example:**

```javascript
// Dashboard.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from './Dashboard';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({
            data: [],
            error: null
          }))
        }))
      }))
    }))
  }
}));

describe('Dashboard', () => {
  it('renders without crashing', () => {
    render(<Dashboard />);
    expect(screen.getByText(/COPA Airlines/i)).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    render(<Dashboard />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('fetches and displays data', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Total Optimizations/i)).toBeInTheDocument();
    });
  });
});
```

**Service Test Example:**

```javascript
// fuelService.test.js
import { describe, it, expect, vi } from 'vitest';
import { calculateTankering } from './fuelService';

describe('calculateTankering', () => {
  it('recommends tankering when price difference is significant', async () => {
    const result = await calculateTankering('PTY', 'BOG', '738', 562);

    expect(result).toHaveProperty('recommended');
    expect(result).toHaveProperty('savings');

    if (result.recommended) {
      expect(result.savings).toBeGreaterThan(0);
      expect(result.tankerAmountGallons).toBeGreaterThan(0);
    }
  });

  it('does not recommend tankering when price difference is small', async () => {
    // Mock prices to be equal
    const result = await calculateTankering('PTY', 'PTY', '738', 100);

    expect(result.recommended).toBe(false);
    expect(result.reason).toContain('price difference');
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test Dashboard.test.jsx
```

### Integration Tests

```javascript
// App.integration.test.jsx
describe('App Integration', () => {
  it('navigates between views', async () => {
    render(<App />);

    // Click map button
    const mapButton = screen.getByText(/Map/i);
    fireEvent.click(mapButton);

    // Verify map is displayed
    await waitFor(() => {
      expect(screen.getByText(/Legend/i)).toBeInTheDocument();
    });
  });

  it('loads and displays real data', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Total Optimizations/i)).toBeInTheDocument();
    });

    // Verify stats are populated
    const statCards = screen.getAllByRole('region');
    expect(statCards.length).toBeGreaterThan(0);
  });
});
```

## Debugging

### Browser DevTools

**React DevTools:**
1. Install React DevTools extension
2. Open browser DevTools
3. Go to "Components" tab
4. Inspect component props and state

**Console Debugging:**
```javascript
// Add breakpoints
debugger;

// Inspect values
console.log('Current state:', { data, loading, error });

// Table view for arrays
console.table(arrayData);

// Group related logs
console.group('Fetch Operation');
console.log('Fetching from:', url);
console.log('With params:', params);
console.groupEnd();
```

### Network Debugging

**Monitor API calls:**
1. Open DevTools > Network tab
2. Filter by "WS" for WebSocket (Supabase Realtime)
3. Filter by "XHR" for database requests
4. Inspect request/response payloads

**Supabase Debugging:**
```javascript
// Enable debug mode
const { data, error } = await supabase
  .from('table')
  .select('*')
  .explain({ analyze: true, verbose: true });

console.log('Query plan:', data);
```

### VS Code Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src",
      "sourceMapPathOverrides": {
        "webpack:///src/*": "${webRoot}/*"
      }
    }
  ]
}
```

## Database Management

### Supabase Studio

Access Supabase Studio:
1. Go to your Supabase project
2. Navigate to Table Editor
3. View and edit data directly

### Running Migrations

**Via Supabase CLI:**

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Create new migration
supabase migration new migration_name
```

**Migration File Example:**

```sql
-- supabase/migrations/20241025000000_add_feature.sql

-- Create new table
CREATE TABLE new_feature (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index
CREATE INDEX idx_new_feature_name ON new_feature(name);

-- Enable RLS
ALTER TABLE new_feature ENABLE ROW LEVEL SECURITY;

-- Add policy
CREATE POLICY "Users can view all records"
ON new_feature FOR SELECT
USING (true);
```

### Seeding Data

**Create seed script:**

```javascript
// scripts/seed.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function seed() {
  // Insert airports
  const { error } = await supabase
    .from('airports')
    .insert([
      {
        iata_code: 'PTY',
        name: 'Tocumen International Airport',
        city: 'Panama City',
        country: 'Panama',
        latitude: 9.0714,
        longitude: -79.3834
      },
      // ... more airports
    ]);

  if (error) {
    console.error('Seed error:', error);
  } else {
    console.log('Seed completed successfully');
  }
}

seed();
```

Run seed:
```bash
node scripts/seed.js
```

## Deployment

### Build for Production

```bash
# Type check
npm run typecheck

# Lint
npm run lint

# Build
npm run build

# Preview build
npm run preview
```

### Environment Variables

**Production environment file (.env.production):**

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
VITE_MAPBOX_TOKEN=your_production_mapbox_token
```

### Deployment Platforms

#### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

**Configure via vercel.json:**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_SUPABASE_URL": "@supabase-url",
    "VITE_SUPABASE_ANON_KEY": "@supabase-key",
    "VITE_MAPBOX_TOKEN": "@mapbox-token"
  }
}
```

#### Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy

# Deploy to production
netlify deploy --prod
```

**Configure via netlify.toml:**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Troubleshooting

### Common Issues

#### 1. Dependencies Won't Install

```bash
# Clear cache
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### 2. Build Fails

```bash
# Check TypeScript errors
npm run typecheck

# Check linting errors
npm run lint

# Verbose build
npm run build -- --debug
```

#### 3. Supabase Connection Issues

```javascript
// Test connection
const { data, error } = await supabase
  .from('airports')
  .select('count');

console.log('Connection test:', { data, error });

// Verify environment variables
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Key present:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
```

#### 4. Map Not Loading

- Verify Mapbox token is valid
- Check browser console for errors
- Ensure container has height: `className="h-screen"`

#### 5. Real-time Not Working

```javascript
// Debug realtime connection
supabase.channel('test')
  .on('system', {}, (payload) => {
    console.log('System event:', payload);
  })
  .subscribe((status) => {
    console.log('Subscription status:', status);
  });
```

### Getting Help

1. **Check documentation:** Review this guide and other docs
2. **Search issues:** Look for similar problems in GitHub Issues
3. **Ask the team:** Post in team chat/Slack
4. **Create issue:** Open detailed GitHub issue with reproduction steps

## Contributing

### Pull Request Process

1. **Create feature branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes and commit**
   ```bash
   git add .
   git commit -m "feat: description"
   ```

3. **Update documentation** if needed

4. **Run tests and checks**
   ```bash
   npm run typecheck
   npm run lint
   npm test
   ```

5. **Push to remote**
   ```bash
   git push origin feature/my-feature
   ```

6. **Create Pull Request**
   - Fill out PR template
   - Link related issues
   - Request reviewers

7. **Address review feedback**

8. **Merge after approval**

### Code Review Guidelines

**For Authors:**
- Write clear PR descriptions
- Keep PRs focused and small
- Add screenshots for UI changes
- Respond to feedback promptly

**For Reviewers:**
- Be constructive and kind
- Test the changes locally
- Check for edge cases
- Approve or request changes clearly

### Documentation

**When to update docs:**
- New features added
- API changes
- Configuration changes
- Architecture changes

**Doc files to update:**
- `README.md` - Overview and quick start
- `docs/API.md` - API changes
- `docs/COMPONENTS.md` - Component changes
- `docs/ARCHITECTURE.md` - System design changes
- `docs/data-model.md` - Database schema changes

## Best Practices Summary

1. ✅ **Always** handle errors gracefully
2. ✅ **Always** clean up effects and subscriptions
3. ✅ **Always** validate user input
4. ✅ **Always** check for null/undefined
5. ✅ **Use** TypeScript or PropTypes for type safety
6. ✅ **Use** meaningful variable and function names
7. ✅ **Use** consistent formatting (Prettier)
8. ✅ **Write** tests for critical functionality
9. ✅ **Document** complex logic with comments
10. ✅ **Review** your own code before PR

## Additional Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Mapbox GL JS Documentation](https://docs.mapbox.com/mapbox-gl-js/)
- [Deck.gl Documentation](https://deck.gl/)
- [Testing Library Documentation](https://testing-library.com/)

## Quick Reference

### Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run preview         # Preview production build
npm run lint            # Run ESLint
npm run typecheck       # Check TypeScript

# Testing
npm test                # Run tests
npm test -- --watch     # Watch mode
npm test -- --coverage  # With coverage

# Database
supabase db push        # Push migrations
supabase db reset       # Reset database

# Deployment
vercel --prod          # Deploy to Vercel
netlify deploy --prod  # Deploy to Netlify
```

### Keyboard Shortcuts (VS Code)

- `Cmd/Ctrl + P` - Quick file open
- `Cmd/Ctrl + Shift + P` - Command palette
- `Cmd/Ctrl + B` - Toggle sidebar
- `Cmd/Ctrl + /` - Toggle comment
- `Cmd/Ctrl + D` - Select next occurrence
- `Alt + Up/Down` - Move line up/down
- `Shift + Alt + F` - Format document
- `F12` - Go to definition
- `Shift + F12` - Find all references

---

**Happy coding! If you have questions, check the docs or ask the team.**
