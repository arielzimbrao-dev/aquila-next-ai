// The package identity read by the shared code (generated; technology-specific values live here).
export const PROFILE = {
  "pkg": "aquila-next-ai",
  "stack": "Next.js",
  "id": "nextjs",
  "preset": "node-next",
  "framework": "next",
  "frameworkRange": "^15.0.0",
  "lintPeers": {
    "eslint": "^9.24.0 || ^10.0.0",
    "typescript-eslint": "^8.20.0",
    "eslint-plugin-sonarjs": "^3.0.0 || ^4.0.0",
    "eslint-plugin-jest": "^28.10.0 || ^29.0.0",
    "eslint-plugin-unicorn": ">=65.0.1"
  },
  "lint": {
    "plugins": {},
    "jsx": true,
    "envAccess": [
      "process.env"
    ],
    "envHint": "import it from the env/config module",
    "decoratorMetadata": false
  },
  "qa": {
    "apiCollection": null,
    "environment": "dev",
    "database": null,
    "correlationHeader": null
  }
};
