import { configureStore } from "@reduxjs/toolkit";
import { fleetApi } from "../api/fleet-api.ts";

export const store = configureStore({
  reducer: { [fleetApi.reducerPath]: fleetApi.reducer },
  middleware: (getDefault) => getDefault().concat(fleetApi.middleware),
});
