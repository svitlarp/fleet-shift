import type { FleetRowIssue } from "@fleetshift/core";
import { useState } from "react";
import type { ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import type { ApiQueryError } from "../api/axios-base-query.ts";
import {
  useCreateDemoFleetMutation,
  useDeleteFleetMutation,
  useGetFleetsQuery,
  useImportFleetMutation,
} from "../api/fleet-api.ts";
import { Loader } from "../components/loader/Loader.tsx";
import { t } from "../i18n/en.ts";

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

  return (
    <>
      <section className="card">
        <h1>{t.home.title}</h1>
        <p className="muted">{t.home.lead}</p>
        <div className="actions">
          <label className="btn btn-primary">
            {t.home.upload}
            <input
              type="file"
              accept=".csv,.json"
              hidden
              disabled={isBusy}
              onChange={(e) => void handleFile(e)}
            />
          </label>
          <button
            className="btn"
            type="button"
            disabled={isBusy}
            onClick={() => void handleDemo()}
          >
            {t.home.demo}
          </button>
          <a className="btn" href="/api/fleets/template.csv">
            {t.home.template}
          </a>
        </div>
      </section>

      {rowErrors.length > 0 && (
        <section className="card" role="alert">
          <h2>{t.home.rowErrors}</h2>
          <ul>
            {rowErrors.map((e) => (
              <li key={`${String(e.row)}-${e.field}-${e.message}`}>
                {t.home.row} {e.row}, {e.field}: {e.message}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <h2>{t.home.savedFleets}</h2>
        {fleets.isLoading && <Loader />}
        {fleets.isError && <p role="alert">{t.common.genericError}</p>}
        {fleets.data?.length === 0 && (
          <p className="muted">{t.home.noFleets}</p>
        )}
        {fleets.data && fleets.data.length > 0 && (
          <div className="table-wrap">
            <table>
              <tbody>
                {fleets.data.map((fleet) => (
                  <tr key={fleet.id}>
                    <td>
                      <Link to={`/fleets/${fleet.id}`}>{fleet.name}</Link>
                    </td>
                    <td className="muted">
                      {fleet.vehicleCount} {t.home.vehicles}
                    </td>
                    <td className="num">
                      <button
                        className="btn"
                        type="button"
                        aria-label={`${t.common.delete} ${fleet.name}`}
                        onClick={() => void deleteFleet(fleet.id)}
                      >
                        {t.common.delete}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
