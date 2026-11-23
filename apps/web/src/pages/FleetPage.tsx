import type { FleetVehicle } from "@fleetshift/core";
import {
  BarChart3,
  CalendarClock,
  Check,
  Fuel,
  Gauge,
  MapPin,
  Minus,
  Pencil,
  PlugZap,
  Plus,
  Route,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import type { ApiQueryError } from "../api/axios-base-query.ts";
import {
  useAddVehicleMutation,
  useDeleteVehicleMutation,
  useGetFleetQuery,
  useUpdateVehicleMutation,
} from "../api/fleet-api.ts";
import { BrandLogo } from "../components/brand-logo/BrandLogo.tsx";
import { Loader } from "../components/loader/Loader.tsx";
import { Badge } from "../components/ui/Badge.tsx";
import { Button, ButtonLink } from "../components/ui/Button.tsx";
import { Card } from "../components/ui/Card.tsx";
import tableCss from "../components/ui/Table.module.css";
import { VehicleForm } from "../components/vehicle-form/VehicleForm.tsx";
import { t } from "../i18n/en.ts";
import css from "./Page.module.css";

type Editing = { mode: "add" } | { mode: "edit"; vehicle: FleetVehicle } | null;

function HeaderCell({
  icon: Icon,
  label,
  numeric = false,
}: {
  icon: LucideIcon;
  label: string;
  numeric?: boolean;
}) {
  return (
    <th className={numeric ? tableCss.num : undefined}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        <Icon size={13} aria-hidden="true" />
        {label}
      </span>
    </th>
  );
}

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
      <div className={css.head}>
        <h1>{fleet.data.name}</h1>
        <div className={css.actions}>
          <Button
            icon={Plus}
            onClick={() => {
              setEditing({ mode: "add" });
            }}
          >
            {t.fleet.addVehicle}
          </Button>
          <ButtonLink icon={SlidersHorizontal} to="assumptions">
            {t.fleet.assumptions}
          </ButtonLink>
          <ButtonLink variant="primary" icon={BarChart3} to="results">
            {t.fleet.results}
          </ButtonLink>
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

      <Card className={tableCss.wrap}>
        <table className={tableCss.table}>
          <thead>
            <tr>
              <th>{t.fleet.vehicle}</th>
              <HeaderCell icon={Fuel} label={t.fleet.fuel} />
              <HeaderCell icon={Route} label={t.fleet.annualKm} numeric />
              <HeaderCell icon={Gauge} label={t.fleet.maxDailyKm} numeric />
              <HeaderCell icon={CalendarClock} label={t.fleet.leaseEnd} />
              <HeaderCell icon={MapPin} label={t.fleet.base} />
              <HeaderCell icon={PlugZap} label={t.fleet.depot} />
              <th>{t.fleet.actions}</th>
            </tr>
          </thead>
          <tbody>
            {fleet.data.vehicles.map((v) => (
              <tr key={v.id}>
                <td>
                  <span className={tableCss.vehicle}>
                    <BrandLogo brand={v.make} />
                    <span>
                      {v.make} {v.model}
                      <span
                        className={tableCss.muted}
                        style={{ display: "block" }}
                      >
                        {v.id}
                      </span>
                    </span>
                  </span>
                </td>
                <td>
                  <Badge icon={Fuel}>{v.fuelType}</Badge>
                </td>
                <td className={tableCss.num}>
                  {v.annualKm.toLocaleString("en-GB")}
                </td>
                <td className={tableCss.num}>{v.maxDailyKm}</td>
                <td>{v.leaseEndDate}</td>
                <td>{v.baseCommune}</td>
                <td>
                  {v.hasDepotCharging ? (
                    <Badge tone="good" icon={Check}>
                      {t.fleet.yes}
                    </Badge>
                  ) : (
                    <Badge icon={Minus}>{t.fleet.no}</Badge>
                  )}
                </td>
                <td>
                  <div className={css.actions}>
                    <Button
                      variant="ghost"
                      icon={Pencil}
                      aria-label={`${t.common.edit} ${v.id}`}
                      onClick={() => {
                        setEditing({ mode: "edit", vehicle: v });
                      }}
                    />
                    <Button
                      variant="ghost"
                      icon={Trash2}
                      aria-label={`${t.common.delete} ${v.id}`}
                      onClick={() => void handleDelete(v.id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
