import { NextFunction, Request, RequestHandler, Response } from "express";

export function h<Req extends Request = Request, Res extends Response = Response>(
  fn: (req: Req, res: Res, next: NextFunction) => unknown
): RequestHandler {
  return (req, res, next) => Promise.resolve(fn(req as Req, res as Res, next)).catch(next);
}