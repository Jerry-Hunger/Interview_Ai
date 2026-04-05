# AGENTS.md - IntelliHire Codebase Guide

## Project Overview

IntelliHire is an AI-powered interview and hiring platform with:
- **Client**: React 19 + TypeScript + Vite + TailwindCSS v4 (in `/client`)
- **Server**: Node.js + Express + MongoDB + Mongoose (in `/server`)
- **Deployment**: Render (frontend + backend)

---

## Build Commands

### Client (React/Vite)

```bash
cd client

# Development
npm run dev              # Start dev server on port 5173

# Production
npm run build            # TypeScript check + Vite build
npm run preview          # Preview production build

# Linting
npm run lint             # Run ESLint on all .ts/.tsx files
```

### Server (Node/Express)

```bash
cd server

# Development
npm run dev              # Start with nodemon (auto-reload on changes)

# Production
node src/index.js        # Run production server

# Note: No ESLint/Prettier configured for server code
```

### Running a Single Test (if tests exist in future)

```bash
# Vitest
npm run test -- path/to/file.test.ts

# Jest
npm test -- path/to/file.test.js

# Specific test
npm run test -- --run src/components/Button.test.tsx
```

---

## Code Style Guidelines

### TypeScript (Client)

- **Strict Mode**: Enabled in `tsconfig.app.json` with:
  - `strict: true`
  - `noUnusedLocals: true`
  - `noUnusedParameters: true`
  - `noFallthroughCasesInSwitch: true`

### Imports

**React/Components (absolute paths with `@/` alias):**
```typescript
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { useTheme } from "@/contexts/ThemeContext";
import axiosInstance from "@/utils/axiosInstance";
```

**Third-party libraries:**
```typescript
import { useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, CheckCircle } from "lucide-react";
```

**Relative imports for same-level utilities:**
```typescript
import { useState, useEffect } from "react";
import type { Interview } from "../types";
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `StudentDashboard`, `Navigation` |
| Files | kebab-case or PascalCase | `student-dashboard.tsx` or `Dashboard.tsx` |
| Variables/Functions | camelCase | `fetchInterviews`, `isLoading` |
| Constants | camelCase or SCREAMING_SNAKE | `API_BASE_URL` or `apiBaseUrl` |
| Types/Interfaces | PascalCase | `Interview`, `ThemeProviderProps` |
| CSS Classes | kebab-case (Tailwind) | `bg-white`, `text-indigo-500` |

### Type Annotations

```typescript
// Explicit types for state
const [interviews, setInterviews] = useState<Interview[]>([]);
const [isOpen, setIsOpen] = useState(false);

// Type props explicitly
type ComponentProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  onClick?: () => void;
};

// Interface for API responses
type Interview = {
  _id: string;
  result: "success" | "failure" | "Quit";
  difficulty: string;
  type: "practice" | "company";
  createdAt: string;
};
```

### Error Handling

**Client-side (React):**
```typescript
try {
  const res = await axiosInstance.get("/interview/mine", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (Array.isArray(res.data)) {
    setInterviews(res.data);
  }
} catch (err) {
  console.error("Error fetching interviews", err);
  setInterviews([]);
}
```

**Server-side (Express):**
```javascript
export const register = async (req, res) => {
  try {
    const { role, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }
    // ... logic
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

### Styling (TailwindCSS)

- Use **Tailwind v4** with `@tailwindcss/vite` plugin
- Dark mode via `dark:` prefix with `class` strategy
- Custom colors extend `tailwind.config.js`:
  - `background.light/dark`
  - `foreground.light/dark`
  - `card.light/dark`
  - `border.light/dark`
- Apply dark mode class to root:
  ```typescript
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  ```

### Component Patterns

**Custom hooks for shared logic:**
```typescript
// src/hooks/use-toast.ts
export const useToast = () => { ... };
```

**Context providers:**
```typescript
// Wrap with provider pattern
export function ThemeProvider({ children, ...props }) {
  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}
```

**Route definitions (App.tsx):**
```typescript
// Place ALL custom routes ABOVE the catch-all "*" route
<Routes>
  <Route path="/" element={<Index />} />
  <Route path="/login" element={<Login />} />
  {/* ... more routes */}
  <Route path="*" element={<NotFound />} />
</Routes>
```

---

## Directory Structure

```
/client
├── src/
│   ├── assets/           # Static assets
│   ├── components/       # Shared UI components
│   │   ├── ui/           # shadcn/ui components (accordion, alert, alert-dialog, etc.)
│   │   ├── practice/     # Practice interview components
│   │   └── resume/       # Resume-related components
│   ├── contexts/         # React context providers
│   ├── hooks/            # Custom React hooks
│   ├── lib/               # Utility functions (utils.ts)
│   ├── pages/             # Page components
│   │   ├── auth/          # Login, Register
│   │   ├── student/       # Dashboard, Practice, Jobs, Applications
│   │   ├── company/       # Dashboard, Jobs, Applications, Profile
│   │   └── Index.tsx, NotFound.tsx
│   ├── utils/             # Helper utilities (axiosInstance, resumeExtractor)
│   ├── App.tsx
│   ├── App.css
│   ├── main.tsx
│   └── index.css
├── public/
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.app.json
└── tsconfig.json

/server
├── src/
│   ├── config/            # db.js - MongoDB connection
│   ├── controllers/       # Route handlers (auth, company, interview, job, application, resume, upload)
│   ├── middlewares/       # authMiddleware.js
│   ├── models/            # Mongoose schemas (User, JobOpening, Interview, Application, Resume)
│   ├── routes/            # Express routes (auth, company, interview, job, application, resume, upload)
│   ├── utils/             # Server utilities (oss.js, deepseek.js)
│   └── index.js           # Entry point
├── package.json
└── .env                   # Environment variables
```

---

## Environment Variables

**Server (`/server/.env`):**
```
PORT=5000
MONGODB_URI=...
JWT_SECRET=...
GEMINI_API_KEY=...
ALIYUN_OSS_REGION=...
ALIYUN_OSS_BUCKET=...
ALIYUN_OSS_ACCESS_KEY_ID=...
ALIYUN_OSS_ACCESS_KEY_SECRET=...
```

**Client**: Uses hardcoded API base URL in `src/utils/axiosInstance.ts`

---

## Common Patterns

### API Calls with React Query
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ["interviews"],
  queryFn: async () => {
    const token = localStorage.getItem("token");
    const res = await axiosInstance.get("/interview/mine", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
});
```

### Auth Token Handling
```typescript
// Store in localStorage
localStorage.setItem("token", token);
localStorage.setItem("role", user.role);

// Retrieve for API calls
const token = localStorage.getItem("token");

// Clear on logout
localStorage.removeItem("token");
localStorage.removeItem("role");
```

### Dark Mode Toggle
```typescript
const { theme, setTheme } = useTheme();
const toggleTheme = () => {
  setTheme(theme === "light" ? "dark" : "light");
};
```

---

## Linting & Type Checking

```bash
# Run before committing (client)
npm run lint

# TypeScript check (client)
npx tsc --noEmit
```

---

## Best Practices

1. **Always add `key` props** when mapping arrays in JSX
2. **Use explicit return types** for complex functions
3. **Prefer `const` over `let`** for immutable variables
4. **Use `axiosInstance`** for API calls (configured with base URL + credentials)
5. **Handle loading/error states** in async components
6. **Use `lucide-react`** for icons (already included)
7. **Group related imports** (React, third-party, components, types)
8. **Keep components focused** - extract logic to hooks when complex
