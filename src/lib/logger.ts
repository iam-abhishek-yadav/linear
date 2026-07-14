import { NextResponse } from "next/server";
import { isDbConnectionError } from "@/lib/db";

type LogLevel = "debug" | "info" | "warn" | "error";

type LogFields = Record<string, unknown>;

type LogEntry = {
  timestamp: string;
  level: LogLevel;
  scope: string;
  event: string;
  durationMs?: number;
  error?: {
    name: string;
    message: string;
  };
} & LogFields;

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const SLOW_CALL_MS = 500;

function getMinLevel(): LogLevel {
  const configured = process.env.LOG_LEVEL?.toLowerCase();
  if (
    configured === "debug" ||
    configured === "info" ||
    configured === "warn" ||
    configured === "error"
  ) {
    return configured;
  }

  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_RANK[level] >= LEVEL_RANK[getMinLevel()];
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message };
  }

  return { name: "Error", message: String(error) };
}

function formatDevLine(entry: LogEntry): string {
  const time = entry.timestamp.slice(11, 23);
  const level = entry.level.toUpperCase().padEnd(5);
  const name = String(entry.event);
  const duration =
    typeof entry.durationMs === "number"
      ? ` ${entry.durationMs.toFixed(1)}ms`
      : "";
  const status =
    entry.status !== undefined ? ` status=${String(entry.status)}` : "";
  const method = entry.method ? ` ${String(entry.method)}` : "";
  const path = entry.path ? ` ${String(entry.path)}` : "";
  const outcome = entry.outcome ? ` ${String(entry.outcome)}` : "";
  const error = entry.error ? ` error=${entry.error.message}` : "";

  return `[${time}] ${level} ${entry.scope}.${name}${method}${path}${outcome}${status}${duration}${error}`;
}

function write(entry: LogEntry) {
  if (!shouldLog(entry.level)) {
    return;
  }

  if (process.env.NODE_ENV === "development") {
    const line = formatDevLine(entry);
    if (entry.level === "error") {
      console.error(line);
      return;
    }
    if (entry.level === "warn") {
      console.warn(line);
      return;
    }
    console.log(line);
    return;
  }

  console.log(JSON.stringify(entry));
}

function log(
  level: LogLevel,
  scope: string,
  event: string,
  fields: LogFields = {},
) {
  write({
    timestamp: new Date().toISOString(),
    level,
    scope,
    event,
    ...fields,
  });
}

export function createLogger(scope: string) {
  return {
    debug(event: string, fields?: LogFields) {
      log("debug", scope, event, fields);
    },
    info(event: string, fields?: LogFields) {
      log("info", scope, event, fields);
    },
    warn(event: string, fields?: LogFields) {
      log("warn", scope, event, fields);
    },
    error(event: string, fields?: LogFields) {
      log("error", scope, event, fields);
    },
    time(event: string, fields?: LogFields) {
      const start = performance.now();

      return {
        end(extra?: LogFields) {
          const durationMs = performance.now() - start;
          const level: LogLevel =
            durationMs >= SLOW_CALL_MS ? "warn" : "info";

          write({
            timestamp: new Date().toISOString(),
            level,
            scope,
            event,
            durationMs: Number(durationMs.toFixed(2)),
            outcome: "ok",
            ...(durationMs >= SLOW_CALL_MS ? { slow: true } : {}),
            ...fields,
            ...extra,
          });
        },
        fail(error: unknown, extra?: LogFields) {
          const durationMs = performance.now() - start;

          write({
            timestamp: new Date().toISOString(),
            level: "error",
            scope,
            event,
            durationMs: Number(durationMs.toFixed(2)),
            outcome: "error",
            error: serializeError(error),
            ...fields,
            ...extra,
          });
        },
      };
    },
  };
}

export async function logServerCall<T>(
  name: string,
  fn: () => Promise<T>,
  fields?: LogFields,
): Promise<T> {
  const timer = createLogger("server").time(name, fields);

  try {
    const result = await fn();
    timer.end();
    return result;
  } catch (error) {
    timer.fail(error);
    throw error;
  }
}

export function withApiRoute<TContext = unknown>(
  name: string,
  handler: (request: Request, context: TContext) => Promise<Response>,
): (request: Request, context: TContext) => Promise<Response> {
  return async (request, context) => {
    const url = new URL(request.url);
    const timer = createLogger("api").time(name, {
      method: request.method,
      path: url.pathname,
    });

    try {
      const response = await handler(request, context);
      timer.end({ status: response.status });
      return response;
    } catch (error) {
      if (isDbConnectionError(error)) {
        timer.fail(error, { status: 503 });
        return NextResponse.json(
          {
            error: {
              form: [
                "Unable to reach the database right now. Check that Postgres is running and DATABASE_URL is correct, then try again.",
              ],
            },
          },
          { status: 503 },
        );
      }

      timer.fail(error, { status: 500 });
      return NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 },
      );
    }
  };
}

export async function logPageRender<T>(
  name: string,
  fn: () => Promise<T>,
  fields?: LogFields,
): Promise<T> {
  return logServerCall(`page.${name}`, fn, { kind: "page", ...fields });
}
