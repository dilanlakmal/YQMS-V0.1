src/
└── components/
    └── ai/
        ├── services/                 # Core AI logic & API integrations
        │   ├── productionInstructionService.ts
        │   └── translationService.ts
        │
        ├── processors/               # Business logic for processing input/output
        │   └── instructionProcessor.ts
        │
        ├── types/                    # TypeScript types/interfaces
        │   └── ai.d.ts
        │
        ├── utils/                    # Helper functions
        │   └── fileUtils.ts          # Read/write digital formats
        │   └── languageUtils.ts      # Target language mapping or conversions
        │
        └── index.ts                  # Barrel file to export AI services
