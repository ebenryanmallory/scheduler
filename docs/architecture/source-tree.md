# Source Tree

```text
scheduler/
├── .github/                    # GitHub Actions workflows
├── docs/                       # Documentation (PRD, Arch, etc.)
├── server/                     # Backend Application
│   ├── src/
│   │   ├── config/             # Configuration
│   │   ├── controllers/        # Route controllers
│   │   ├── routes/             # API Routes
│   │   ├── services/           # Business logic (Git, File, AI)
│   │   ├── types/              # Backend types
│   │   └── utils/              # Utilities
│   ├── index.ts                # Entry point
│   └── package.json
├── src/                        # Frontend Application
│   ├── assets/                 # Static assets
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   └── ...                 # Feature components
│   ├── hooks/                  # Custom hooks
│   ├── lib/                    # Utilities
│   ├── pages/                  # Page components
│   ├── services/               # API clients & Local services
│   ├── store/                  # Zustand stores
│   ├── types/                  # Shared types (symlinked or copied)
│   ├── App.tsx
│   └── main.tsx
├── shared/                     # Shared types/utils (optional workspace)
├── package.json                # Root package.json
├── tsconfig.json               # Base TS config
└── vite.config.ts              # Vite config
```

---
