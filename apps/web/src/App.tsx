import { lazy, Suspense } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import css from "./App.module.css";
import { Loader } from "./components/loader/Loader.tsx";
import { t } from "./i18n/en.ts";

const HomePage = lazy(() =>
  import("./pages/HomePage.tsx").then((m) => ({ default: m.HomePage })),
);
const FleetPage = lazy(() =>
  import("./pages/FleetPage.tsx").then((m) => ({ default: m.FleetPage })),
);
const AssumptionsPage = lazy(() =>
  import("./pages/AssumptionsPage.tsx").then((m) => ({
    default: m.AssumptionsPage,
  })),
);
const ResultsPage = lazy(() =>
  import("./pages/ResultsPage.tsx").then((m) => ({ default: m.ResultsPage })),
);

export function App() {
  return (
    <>
      <header className={css.header}>
        <nav className={css.nav}>
          <NavLink to="/" className={css.logo}>
            {t.appName}
          </NavLink>
          <NavLink to="/" className={css.link}>
            {t.nav.fleets}
          </NavLink>
        </nav>
      </header>
      <main className={css.main}>
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/fleets/:fleetId" element={<FleetPage />} />
            <Route
              path="/fleets/:fleetId/assumptions"
              element={<AssumptionsPage />}
            />
            <Route path="/fleets/:fleetId/results" element={<ResultsPage />} />
            <Route path="*" element={<p>{t.notFound}</p>} />
          </Routes>
        </Suspense>
      </main>
      <ToastContainer position="top-right" autoClose={4000} />
    </>
  );
}
