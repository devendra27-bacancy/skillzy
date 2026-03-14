import type { FastifyReply } from "fastify";
import type { ApiError, ApiResult } from "@skillzy/types";

export function ok<T>(reply: FastifyReply, data: T, statusCode = 200) {
  return reply.code(statusCode).send({
    success: true,
    data
  } satisfies ApiResult<T>);
}

export function fail(
  reply: FastifyReply,
  code: string,
  message: string,
  statusCode = 400
) {
  return reply.code(statusCode).send({
    success: false,
    error: {
      code,
      message
    } satisfies ApiError
  } satisfies ApiResult<never>);
}
