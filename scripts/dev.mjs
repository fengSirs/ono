process.env.NODE_ENV ||= "development";
process.env.ALLOW_DEV_GUESTS ||= "true";
await import("./build.mjs");
await import("./start.mjs");
