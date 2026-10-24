# FleetShift

FleetShift is a web app that helps a leasing broker or a fleet owner to plan the transition of small fleets to electric vehicles.

For a fleet of 5–30 cars and vans in the PACA region of France, it answers four questions:

- **which** vehicles should be replaced,
- **which EV models** fit each of them,
- **when** the replacement should happen (2027–2028, never before the end of the lease),
- **how much** it saves, as a range rather than a single number.

The broker or fleet owner enters the fleet, a yearly budget and a few assumptions; the app returns a
year-by-year replacement plan and a client-ready report.

## How it works

1. **Fleet import** - CSV or form: vehicle type, fuel use, yearly and peak daily mileage,
   seats or payload, end of lease, home base and whether charging is available there.
2. **Suitability** - each vehicle is matched against an EV catalogue, filtered by type,
   seats or cargo and winter range, with public charging coverage taken into account.
3. **TCO** - a 5-year total cost of ownership for the current vehicle and for the top 3
   EV candidates: leasing or purchase, energy, maintenance, residual value.
4. **Scenarios** - 1,000 seeded Monte Carlo simulations of fuel prices, electricity prices
   and mileage per vehicle–model pair, reported as median savings, a P10–P90 range, the
   share of scenarios that pay back, and the mean of the worst 10 % (CVaR).
5. **Plan** - a budget-constrained yearly schedule of replacements.
6. **Report** - dashboard, charging map and a PDF for the broker's client.

Every figure in the report carries its provenance: open data, user input or a stated
assumption.

## Data sources

| Dataset | Used for |
| --- | --- |
| Prix des carburants (data.gouv.fr) | fuel price history and scenarios |
| IRVE charging stations (data.gouv.fr) | charging coverage around each base |
| OpenEV Data / EEA CO₂ | EV catalogue: battery, WLTP range, consumption |

Raw downloads are stored under `data/raw/` and are not committed.

## Stack

TypeScript everywhere, npm workspaces.

| Package | Contents |
| --- | --- |
| `apps/web` | React + Vite, TanStack Query, React Hook Form + zod, Recharts, Leaflet |
| `apps/api` | Fastify + zod, Drizzle ORM, PostgreSQL, Playwright (PDF) |
| `packages/core` | pure calculation: suitability, chargers, TCO, scenarios, planner |
| `packages/data` | scripts for the open datasets |


## Getting started

Requirements: Node.js 20+, npm 10+, Docker (for PostgreSQL).

```bash
npm install
docker compose up -d db
npm run dev
```

## Commands

```bash
npm run lint            # ESLint
npm run format          # Prettier --write
npm run typecheck       # tsc --noEmit in all packages
npm test                # Vitest
npm run test:coverage   # Vitest with coverage thresholds (70 %)
```

## Status

Early development. The 6-week build starts on 2026-10-26; 

## Scope

Out of scope for the MVP: accounts and login, payments, telematics, an ILP optimizer, live
AFIR data, trucks over 3.5 t, a mobile app, a public API and ML price
forecasting.

## Licence and data

Demo fleets are synthetic. No real client data is kept in this repository.
