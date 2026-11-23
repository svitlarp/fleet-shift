import type { FleetRowIssue } from "@fleetshift/core";
import {
  CarFront,
  CircleAlert,
  Download,
  Sparkles,
  Upload,
} from "lucide-react";
import { useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import type { ApiQueryError } from "../api/axios-base-query.ts";
import {
  useCreateDemoFleetMutation,
  useDeleteFleetMutation,
  useGetFleetsQuery,
  useImportFleetMutation,
} from "../api/fleet-api.ts";
import type { FleetListItem } from "../api/fleet-api.ts";
import { FleetCard } from "../components/fleet-card/FleetCard.tsx";
import { Loader } from "../components/loader/Loader.tsx";
import { Button, buttonClass } from "../components/ui/Button.tsx";
import { Card } from "../components/ui/Card.tsx";
import { t } from "../i18n/en.ts";
import css from "./Page.module.css";

function rowErrorsOf(error: ApiQueryError): FleetRowIssue[] {
  const details = error.error.details as
    { errors?: FleetRowIssue[] } | undefined;
  return details?.errors ?? [];
}

export function HomePage() {
  const navigate = useNavigate();
  const fleets = useGetFleetsQuery();
  const [createDemo, demoState] = useCreateDemoFleetMutation();
  const [importFleet, importState] = useImportFleetMutation();
  const [deleteFleet] = useDeleteFleetMutation();
  const [rowErrors, setRowErrors] = useState<FleetRowIssue[]>([]);
  const isBusy = demoState.isLoading || importState.isLoading;

  const finish = (id: string) => {
    toast.success(t.home.imported);
    void navigate(`/fleets/${id}`);
  };

  const handleFailure = (error: unknown) => {
    const apiError = error as ApiQueryError;
    setRowErrors(rowErrorsOf(apiError));
    toast.error(apiError.error.message);
  };

  const handleDemo = async () => {
    setRowErrors([]);
    try {
      finish((await createDemo().unwrap()).fleet.id);
    } catch (error) {
      handleFailure(error);
    }
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setRowErrors([]);
    const data = new FormData();
    data.append("file", file);
    try {
      finish((await importFleet(data).unwrap()).fleet.id);
    } catch (error) {
      handleFailure(error);
    }
  };

  const handleDelete = (fleet: FleetListItem) => {
    if (window.confirm(t.home.confirmDelete(fleet.name))) {
      void deleteFleet(fleet.id);
    }
  };

  return (
    <>
      <Card>
        <div className={css.hero}>
          <h1>{t.home.title}</h1>
          <p className={css.muted}>{t.home.lead}</p>
          <div className={css.actions}>
            <label className={`${buttonClass("primary")} ${css.uploadLabel}`}>
              <Upload size={16} aria-hidden="true" />
              {t.home.upload}
              <input
                className={css.fileInput}
                type="file"
                accept=".csv,.json"
                disabled={isBusy}
                onChange={(e) => void handleFile(e)}
              />
            </label>
            <Button
              icon={Sparkles}
              disabled={isBusy}
              onClick={() => void handleDemo()}
            >
              {t.home.demo}
            </Button>
            <a className={buttonClass("ghost")} href="/api/fleets/template.csv">
              <Download size={16} aria-hidden="true" />
              {t.home.template}
            </a>
          </div>
        </div>
      </Card>

      {rowErrors.length > 0 && (
        <Card role="alert">
          <h2 className={css.sectionTitle}>
            <CircleAlert size={18} aria-hidden="true" />
            {t.home.rowErrors}
          </h2>
          <ul className={css.errorList}>
            {rowErrors.map((e) => (
              <li key={`${String(e.row)}-${e.field}-${e.message}`}>
                {t.home.row} {e.row}, {e.field}: {e.message}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <section>
        <h2 className={css.sectionTitle}>
          <CarFront size={18} aria-hidden="true" />
          {t.home.savedFleets}
        </h2>
        {fleets.isLoading && <Loader />}
        {fleets.isError && <p role="alert">{t.common.genericError}</p>}
        {fleets.data?.length === 0 && (
          <div className={css.emptyState}>
            <CarFront size={28} aria-hidden="true" />
            {t.home.noFleets}
          </div>
        )}
        {fleets.data && fleets.data.length > 0 && (
          <div className={css.fleetGrid}>
            {fleets.data.map((fleet) => (
              <FleetCard key={fleet.id} fleet={fleet} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
