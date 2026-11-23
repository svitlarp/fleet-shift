import type {
  Assumptions,
  FleetAnalysis,
  FleetRowIssue,
  FleetVehicle,
} from "@fleetshift/core";
import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "./axios-base-query.ts";

export interface FleetSummary {
  id: string;
  name: string;
  createdAt: string;
  vehicleCount: number;
}

export interface FleetDetail extends FleetSummary {
  vehicles: FleetVehicle[];
  assumptions: Assumptions;
}

export interface SavedAnalysis {
  id: string;
  fleetId: string;
  createdAt: string;
  result: FleetAnalysis;
}

interface CreatedFleet {
  fleet: FleetDetail;
  warnings: FleetRowIssue[];
}

export const fleetApi = createApi({
  reducerPath: "fleetApi",
  baseQuery: axiosBaseQuery,
  tagTypes: ["Fleets", "Fleet", "Analysis"],
  endpoints: (build) => ({
    getFleets: build.query<FleetSummary[], void>({
      query: () => ({ url: "/fleets" }),
      providesTags: ["Fleets"],
    }),
    getFleet: build.query<FleetDetail, string>({
      query: (id) => ({ url: `/fleets/${id}` }),
      providesTags: (_result, _error, id) => [{ type: "Fleet", id }],
    }),
    createDemoFleet: build.mutation<CreatedFleet, void>({
      query: () => ({ url: "/fleets/demo", method: "POST" }),
      invalidatesTags: ["Fleets"],
    }),
    importFleet: build.mutation<CreatedFleet, FormData>({
      query: (data) => ({ url: "/fleets/import", method: "POST", data }),
      invalidatesTags: ["Fleets"],
    }),
    deleteFleet: build.mutation<void, string>({
      query: (id) => ({ url: `/fleets/${id}`, method: "DELETE" }),
      invalidatesTags: ["Fleets"],
    }),
    addVehicle: build.mutation<
      FleetVehicle,
      { fleetId: string; vehicle: FleetVehicle }
    >({
      query: ({ fleetId, vehicle }) => ({
        url: `/fleets/${fleetId}/vehicles`,
        method: "POST",
        data: vehicle,
      }),
      invalidatesTags: (_r, _e, { fleetId }) => [
        "Fleets",
        { type: "Fleet", id: fleetId },
      ],
    }),
    updateVehicle: build.mutation<
      FleetVehicle,
      { fleetId: string; vehicleId: string; vehicle: FleetVehicle }
    >({
      query: ({ fleetId, vehicleId, vehicle }) => ({
        url: `/fleets/${fleetId}/vehicles/${encodeURIComponent(vehicleId)}`,
        method: "PUT",
        data: vehicle,
      }),
      invalidatesTags: (_r, _e, { fleetId }) => [
        { type: "Fleet", id: fleetId },
      ],
    }),
    deleteVehicle: build.mutation<void, { fleetId: string; vehicleId: string }>(
      {
        query: ({ fleetId, vehicleId }) => ({
          url: `/fleets/${fleetId}/vehicles/${encodeURIComponent(vehicleId)}`,
          method: "DELETE",
        }),
        invalidatesTags: (_r, _e, { fleetId }) => [
          "Fleets",
          { type: "Fleet", id: fleetId },
        ],
      },
    ),
    saveAssumptions: build.mutation<
      Assumptions,
      { fleetId: string; assumptions: Assumptions }
    >({
      query: ({ fleetId, assumptions }) => ({
        url: `/fleets/${fleetId}/assumptions`,
        method: "PUT",
        data: assumptions,
      }),
      invalidatesTags: (_r, _e, { fleetId }) => [
        { type: "Fleet", id: fleetId },
      ],
    }),
    getLatestAnalysis: build.query<SavedAnalysis | null, string>({
      queryFn: async (fleetId, api, _options, baseQuery) => {
        const response = await baseQuery({
          url: `/fleets/${fleetId}/analyses/latest`,
          signal: api.signal,
        });
        if (response.error?.status === 404) return { data: null };
        if (response.error) return { error: response.error };
        return { data: response.data as SavedAnalysis };
      },
      providesTags: (_result, _error, id) => [{ type: "Analysis", id }],
    }),
    runAnalysis: build.mutation<SavedAnalysis, string>({
      query: (fleetId) => ({
        url: `/fleets/${fleetId}/analyses`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, id) => [{ type: "Analysis", id }],
    }),
  }),
});

export const {
  useAddVehicleMutation,
  useCreateDemoFleetMutation,
  useDeleteFleetMutation,
  useDeleteVehicleMutation,
  useGetFleetQuery,
  useGetFleetsQuery,
  useGetLatestAnalysisQuery,
  useImportFleetMutation,
  useRunAnalysisMutation,
  useSaveAssumptionsMutation,
  useUpdateVehicleMutation,
} = fleetApi;
