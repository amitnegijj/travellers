// Every process.env read in the application happens here and nowhere else,
// so the full set of things this service needs from its environment is one
// file you can read top to bottom.
import "dotenv/config";

const DEV_AUTH_SECRET = "dev_only_secret_change_me_in_production_0123456789abcdef";

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction: process.env.NODE_ENV === "production",

  port: Number(process.env.PORT ?? 4000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",

  databaseUrl:
    process.env.DATABASE_URL ??
    "postgresql://travel:travel_dev_password@localhost:5544/travel",
  // "true" | "false" forces it; unset means on for any non-local host.
  databaseSsl: process.env.DATABASE_SSL,

  authSecret: process.env.AUTH_SECRET,
});

export { DEV_AUTH_SECRET };
