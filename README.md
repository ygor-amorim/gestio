# Gestio

A property management client tracker built with React + TypeScript + Tailwind CSS.

## Features

### Clientes Tab
- Searchable, filterable client list
- Client detail view with property widgets
- CRUD operations (add, edit, deactivate, delete)
- Invoice filter + mass wipe
- Status 2026 yearly checklist (Fundos, Q1-Q4, Seguro, Faturacao)

### Painel Tab
- **Renewals tracker**: Shows clients renewing in current month with workflow
- **TO-DO list**: General tasks with add/toggle/delete
- **Payments tracker**: Document workflow (Fatura -> Comprovativo -> Recibo -> Enviado -> Dossie)
- **Monthly report**: View and print payment reports by month

### Data Management
- Export/Import all data as JSON (for backup and portability)
- All data persists in localStorage

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Data | localStorage |

## Getting Started

```bash
# Install dependencies
cd app
npm install

# Copy sample data (first time only)
cp src/data/clients.sample.json src/data/clients.json

# Run dev server
npm run dev

# Build for production (single HTML file)
npm run build
```

## Single-File Build

The production build creates a single `index.html` file that works without a server. Just double-click to open in any browser.

## Data Privacy

The `clients.json` file is gitignored to keep real client data private. The repo includes `clients.sample.json` as a template.

## License

Private project.
