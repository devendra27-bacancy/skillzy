export * from "./user";
export * from "./question";
export * from "./response";
export * from "./session";

export interface ApiError {
  code: string;
  message: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  error: ApiError;
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;
