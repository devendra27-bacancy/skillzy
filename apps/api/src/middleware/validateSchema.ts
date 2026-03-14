import type { ZodTypeAny } from "zod";

export async function validateSchema<TSchema extends ZodTypeAny>(
  schema: TSchema,
  payload: unknown
) {
  return schema.parse(payload);
}
