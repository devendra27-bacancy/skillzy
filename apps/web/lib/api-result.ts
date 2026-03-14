import type { ApiResult } from "@skillzy/types";

export async function unwrapApiResult<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const payload = (await response.json()) as ApiResult<T> | T;
  if (typeof payload === "object" && payload && "success" in payload) {
    if (!payload.success) {
      throw new Error(payload.error.message);
    }
    return payload.data;
  }
  return payload as T;
}
