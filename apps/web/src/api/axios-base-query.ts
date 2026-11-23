import type { BaseQueryFn } from "@reduxjs/toolkit/query";
import axios from "axios";
import type { AxiosRequestConfig } from "axios";

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiQueryError {
  status: number | null;
  error: ApiErrorBody;
}

const client = axios.create({ baseURL: "/api" });

export const axiosBaseQuery: BaseQueryFn<
  AxiosRequestConfig,
  unknown,
  ApiQueryError
> = async (config, { signal }) => {
  try {
    const { data } = await client.request<unknown>({ ...config, signal });
    return { data };
  } catch (error) {
    if (axios.isAxiosError<{ error?: ApiErrorBody }>(error)) {
      return {
        error: {
          status: error.response?.status ?? null,
          error: error.response?.data.error ?? {
            code: "network_error",
            message: error.message,
          },
        },
      };
    }
    throw error;
  }
};
