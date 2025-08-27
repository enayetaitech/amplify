## `C:\work\amplify-new\frontend\components.json`

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

## `C:\work\amplify-new\frontend\eslint.config.mjs`

```javascript
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
```

## `C:\work\amplify-new\frontend\package.json`

```json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build:shared": "tsc --build ../shared",
    "dev": "next dev",
    "build": "npm run build:shared && next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@hookform/resolvers": "^5.0.1",
    "@livekit/components-react": "^2.9.14",
    "@livekit/components-styles": "^1.1.6",
    "@radix-ui/react-accordion": "^1.2.10",
    "@radix-ui/react-alert-dialog": "^1.1.6",
    "@radix-ui/react-avatar": "^1.1.3",
    "@radix-ui/react-checkbox": "^1.1.4",
    "@radix-ui/react-dialog": "^1.1.7",
    "@radix-ui/react-dropdown-menu": "^2.1.6",
    "@radix-ui/react-label": "^2.1.2",
    "@radix-ui/react-popover": "^1.1.7",
    "@radix-ui/react-progress": "^1.1.7",
    "@radix-ui/react-radio-group": "^1.2.3",
    "@radix-ui/react-scroll-area": "^1.2.3",
    "@radix-ui/react-select": "^2.1.6",
    "@radix-ui/react-separator": "^1.1.2",
    "@radix-ui/react-slot": "^1.1.2",
    "@radix-ui/react-switch": "^1.2.4",
    "@radix-ui/react-tabs": "^1.1.3",
    "@radix-ui/react-tooltip": "^1.1.8",
    "@stripe/react-stripe-js": "^3.6.0",
    "@stripe/stripe-js": "^7.0.0",
    "@tanstack/react-query": "^5.71.10",
    "axios": "^1.8.4",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "date-fns": "^3.6.0",
    "livekit-client": "^2.15.5",
    "lucide-react": "^0.487.0",
    "next": "15.2.4",
    "next-themes": "^0.4.6",
    "react": "^19.0.0",
    "react-day-picker": "^8.10.1",
    "react-dom": "^19.0.0",
    "react-hook-form": "^7.55.0",
    "react-icons": "^5.5.0",
    "socket.io-client": "^4.8.1",
    "sonner": "^2.0.3",
    "tailwind-merge": "^3.1.0",
    "tw-animate-css": "^1.2.5",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3",
    "@tailwindcss/postcss": "^4.1.3",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "autoprefixer": "^10.4.21",
    "eslint": "^9",
    "eslint-config-next": "15.2.4",
    "postcss": "^8.5.3",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

## `C:\work\amplify-new\frontend\postcss.config.mjs`

```javascript
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}

export default config
```

## `C:\work\amplify-new\frontend\tailwind.config.ts`

```typescript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'custom-meet-bg': '#fde2d0',
        'custom-gray-1': '#E8E8E8',
        'custom-white': '#FFFFFF',
        'custom-gray-2': '#F7F7F9',
        'custom-black': '#000000',
        'custom-orange-1': '#FF6600',
        'custom-dark-blue-1': '#00293C',
        'custom-dark-blue-2': '#031F3A',
        'custom-light-blue-1': '#2976a5',
        'custom-pink': '#FF7E296E',
        'custom-light-blue-2': '#369CFF',
        'custom-light-blue-3': '#559FFB',
        'custom-red': '#FF3838',
        'custom-green': '#07C800',
        'custom-gray-3': '#707070',
        'custom-orange-2': '#FC6E15',
        'custom-gray-4': '#00000029',
        'custom-teal': '#1E656D',
        'custom-yellow': '#FCD860',
        'custom-orange-3': '#E39906',
        'custom-gray-5': '#A8A8A8',
        'custom-gray-6': '#AFAFAF',
        'custom-gray-7': '#EAEAEA',
        'custom-gray-8': '#EBEBEB',
      },
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
      },
      backgroundImage: {
        'sidebar-gradient':
          'linear-gradient(28deg, #FC6E15 0%, #031f3a 100%) 0% 0% no-repeat',
      },
    },
  },
  plugins: [],
}
```

## `C:\work\amplify-new\frontend\tsconfig.json`

```json
{
  "compilerOptions": {
    "composite": true,
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["../shared/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"],
  "references": [
    { "path": "../shared" }
  ]
}
```
