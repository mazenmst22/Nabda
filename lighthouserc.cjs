module.exports = {
  ci: {
    collect: {
      startServerCommand: "pnpm start",
      startServerReadyPattern: "Ready in|started server on|Local:",
      startServerReadyTimeout: 120000,
      url: [
        "http://localhost:3000/ar",
        "http://localhost:3000/ar/search",
        "http://localhost:3000/en",
        "http://localhost:3000/en/search",
      ],
      numberOfRuns: 3,
      settings: {
        formFactor: "mobile",
        throttlingMethod: "devtools",
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 1,
        },
        screenEmulation: {
          mobile: true,
          width: 390,
          height: 844,
          deviceScaleFactor: 2,
          disabled: false,
        },
        onlyCategories: ["performance"],
      },
    },
    assert: {
      assertions: {
        "largest-contentful-paint": ["error", { maxNumericValue: 1800 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "artifacts/lighthouse",
    },
  },
};
