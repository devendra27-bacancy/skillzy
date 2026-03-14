import type { FastifyRequest } from "fastify";

export function getAuthenticatedUser(request: FastifyRequest) {
  return request.headers["x-skillzy-user"] ?? null;
}
