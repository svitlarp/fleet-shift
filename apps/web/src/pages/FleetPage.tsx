import type { FleetVehicle } from "@fleetshift/core";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import type { ApiQueryError } from "../api/axios-base-query.ts";
import {
  useAddVehicleMutation,
  useDeleteVehicleMutation,
  useGetFleetQuery,
  useUpdateVehicleMutation,
} from "../api/fleet-api.ts";
import { Loader } from "../components/loader/Loader.tsx";
import { VehicleForm } from "../components/vehicle-form/VehicleForm.tsx";
import { t } from "../i18n/en.ts";

type Editing = { mode: "add" } | { mode: "edit"; vehicle: FleetVehicle } | null;

export function FleetPage() {
  const { fleetId = "" } = useParams();
  const fleet = useGetFleetQuery(fleetId);
  const [addVehicle, addState] = useAddVehicleMutation();
  const [updateVehicle, updateState] = useUpdateVehicleMutation();
  const [deleteVehicle] = useDeleteVehicleMutation();
  const [editing, setEditing] = useState<Editing>(null);

  if (fleet.isLoading) return <Loader />;
  if (!fleet.data) return <p role="alert">{t.common.genericError}</p>;

  const handleSubmit = async (vehicle: FleetVehicle) => {
    try {
      if (editing?.mode === "edit") {
        await updateVehicle({
          fleetId,
          vehicleId: editing.vehicle.id,
          vehicle,
        }).unwrap();
      } else {
        await addVehicle({ fleetId, vehicle }).unwrap();
      }
      toast.success(t.fleet.saved);
      setEditing(null);
    } catch (error) {
      toast.error((error as ApiQueryError).error.message);
    }
  };

  const handleDelete = async (vehicleId: string) => {
    if (!window.confirm(t.fleet.confirmDelete)) return;
    try {
      await deleteVehicle({ fleetId, vehicleId }).unwrap();
      toast.success(t.fleet.deleted);
    } catch (error) {
      toast.error((error as ApiQueryError).error.message);
    }
  };

  return (
    <>
      <div className="page-head">
        <h1>{fleet.data.name}</h1>
        <div className="actions">
          <button
            className="btn"
            type="button"
            onClick={() => {
              setEditing({ mode: "add" });
            }}
          >
            {t.fleet.addVehicle}
          </button>
          <Link className="btn" to="assumptions">
            {t.fleet.assumptions}
          </Link>
          <Link className="btn btn-primary" to="results">
            {t.fleet.results}
          </Link>
        </div>
      </div>

      {editing && (
        <VehicleForm
          vehicle={editing.mode === "edit" ? editing.vehicle : null}
          isSaving={addState.isLoading || updateState.isLoading}
          onSubmit={handleSubmit}
          onCancel={() => {
            setEditing(null);
          }}
        />
      )}

      <section className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t.fleet.vehicle}</th>
              <th>{t.fleet.fuel}</th>
              <th className="num">{t.fleet.annualKm}</th>
              <th className="num">{t.fleet.maxDailyKm}</th>
              <th>{t.fleet.leaseEnd}</th>
              <th>{t.fleet.base}</th>
              <th>{t.fleet.depot}</th>
              <th>{t.fleet.actions}</th>
            </tr>
          </thead>
          <tbody>
            {fleet.data.vehicles.map((v) => (
              <tr key={v.id}>
                <td>
                  {v.make} {v.model}
                  <div className="muted">{v.id}</div>
                </td>
                <td>{v.fuelType}</td>
                <td className="num">{v.annualKm.toLocaleString("en-GB")}</td>
                <td className="num">{v.maxDailyKm}</td>
                <td>{v.leaseEndDate}</td>
                <td>{v.baseCommune}</td>
                <td>{v.hasDepotCharging ? t.fleet.yes : t.fleet.no}</td>
                <td>
                  <div className="actions">
                    <button
                      className="btn"
                      type="button"
                      aria-label={`${t.common.edit} ${v.id}`}
                      onClick={() => {
                        setEditing({ mode: "edit", vehicle: v });
                      }}
                    >
                      {t.common.edit}
                    </button>
                    <button
                      className="btn"
                      type="button"
                      aria-label={`${t.common.delete} ${v.id}`}
                      onClick={() => void handleDelete(v.id)}
                    >
                      {t.common.delete}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
