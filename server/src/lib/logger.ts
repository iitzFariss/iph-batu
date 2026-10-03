type Level = "info" | "warn" | "error";

type Meta = Record<string, unknown> | undefined;

function emit(level: Level, msg: string, meta?: Meta): void {
  const baris = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    msg,
    ...(meta ?? {}),
  });
  if (level === "error") console.error(baris);
  else console.log(baris);
}

export const log = {
  info: (msg: string, meta?: Meta) => emit("info", msg, meta),
  warn: (msg: string, meta?: Meta) => emit("warn", msg, meta),
  error: (msg: string, meta?: Meta) => emit("error", msg, meta),
};