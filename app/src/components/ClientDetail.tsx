import type { Client, YearlyStatus } from '../types'
import { LocationIcon, EmailIcon, PencilIcon, ArchiveIcon, RefreshIcon, TrashIcon } from './icons'
import { CopyFolderButton } from './CopyFolderButton'
import { PropertyWidgets } from './PropertyWidgets'

type ClientDetailProps = {
  client: Client
  isActive: boolean
  copiedFolder: string | null
  onCopyFolder: (client: Client, e: React.MouseEvent) => void
  onEdit?: (client: Client) => void
  onDeactivate?: (client: Client) => void
  onReactivate?: (client: Client) => void
  onDelete?: (client: Client) => void
  onStatusChange?: (client: Client, field: keyof YearlyStatus) => void
}

const STATUS_FIELDS: { key: keyof YearlyStatus; label: string }[] = [
  { key: 'fundos', label: 'Fundos' },
  { key: 'q1', label: 'Q1' },
  { key: 'q2', label: 'Q2' },
  { key: 'q3', label: 'Q3' },
  { key: 'q4', label: 'Q4' },
  { key: 'seguro', label: 'Seguro' },
  { key: 'faturacao', label: 'Fat.' },
]

// Get client type for styling
const getClientType = (client: Client) => {
  if (client.Source === 'Full PM' || client.Source === 'AIDA') return 'fullpm'
  if (client.Source === 'Condo') return 'condo'
  return 'other'
}

export function ClientDetail({ client, isActive, copiedFolder, onCopyFolder, onEdit, onDeactivate, onReactivate, onDelete, onStatusChange }: ClientDetailProps) {
  const clientType = getClientType(client)

  const containerStyles = isActive
    ? `bg-neutral-900 border rounded-xl p-6 shadow-2xl shadow-black/30 animate-expand ${
        clientType === 'fullpm'
          ? 'border-emerald-500/20 gradient-border-emerald'
          : clientType === 'condo'
          ? 'border-amber-500/20 gradient-border-amber'
          : 'border-neutral-800'
      }`
    : 'bg-neutral-900/60 border border-neutral-700/50 rounded-xl p-6 animate-expand'

  return (
    <div className={`mt-2 ${containerStyles}`}>
      {/* Client header */}
      <div className={`${isActive ? 'animate-fade-up' : ''} flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6 pb-5 border-b border-neutral-800/50`}>
        <div>
          <h3 className={`text-xl font-semibold ${isActive ? 'text-white' : 'text-neutral-300'}`}>{client.Name}</h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-sm">
            {client.Email && (
              <a href={`mailto:${client.Email}`} className={`${isActive ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-neutral-300'} transition-colors flex items-center gap-1.5`}>
                <EmailIcon />
                {client.Email}
              </a>
            )}
            {client.AlternativeEmails && client.AlternativeEmails.length > 0 && (
              <span className={isActive ? 'text-neutral-500' : 'text-neutral-600'}>
                CC: {client.AlternativeEmails.join(', ')}
              </span>
            )}
            {client.NIF && <span className={isActive ? 'text-neutral-500' : 'text-neutral-600'}>NIF: {client.NIF}</span>}
            {isActive && client.Agent && <span className="text-neutral-500">Agent: {client.Agent}</span>}
            {isActive && client.Bank && <span className="text-neutral-500">Banco: {client.Bank}</span>}
            {isActive && client.RenewalMonth && (
              <span className="text-neutral-500">
                Renovação: {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][client.RenewalMonth - 1]}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-mono px-3 py-1.5 rounded-lg border border-neutral-700/50 ${isActive ? 'text-neutral-500 bg-neutral-800/80' : 'text-neutral-600 bg-neutral-800/60'}`}>
            {client.File}
          </span>
          {client.FolderLink && (
            <CopyFolderButton
              folderPath={client.FolderLink}
              isCopied={copiedFolder === client.File}
              onCopy={(e) => onCopyFolder(client, e)}
              variant="full"
              muted={!isActive}
            />
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-1 ml-2">
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(client) }}
                className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                title="Editar cliente"
                aria-label="Editar cliente"
              >
                <PencilIcon />
              </button>
            )}
            {isActive && onDeactivate && (
              <button
                onClick={(e) => { e.stopPropagation(); onDeactivate(client) }}
                className="p-2 rounded-lg text-neutral-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                title="Desativar cliente"
                aria-label="Desativar cliente"
              >
                <ArchiveIcon />
              </button>
            )}
            {!isActive && onReactivate && (
              <button
                onClick={(e) => { e.stopPropagation(); onReactivate(client) }}
                className="p-2 rounded-lg text-neutral-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                title="Reativar cliente"
                aria-label="Reativar cliente"
              >
                <RefreshIcon />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(client) }}
                className="p-2 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Eliminar cliente"
                aria-label="Eliminar cliente"
              >
                <TrashIcon />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status 2026 */}
      {isActive && onStatusChange && (
        <div className="mb-6 pb-5 border-b border-neutral-800/50">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider mr-2">2026</span>
            {STATUS_FIELDS.map(({ key, label }) => {
              const checked = client.status2026?.[key] ?? false
              return (
                <button
                  key={key}
                  onClick={(e) => { e.stopPropagation(); onStatusChange(client, key) }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    checked
                      ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                      : 'bg-neutral-800/50 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300'
                  }`}
                >
                  {checked ? '✓ ' : ''}{label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Properties */}
      <div className="space-y-5">
        {client.Properties.map((property, index) => (
          <div
            key={`${client.File}-${index}`}
            className={`${isActive ? 'animate-fade-up' : ''} ${index > 0 ? 'pt-5 border-t border-neutral-800/50' : ''}`}
            style={isActive ? { animationDelay: `${0.1 + index * 0.05}s` } : undefined}
          >
            {/* Property address */}
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isActive ? 'bg-neutral-800 ring-1 ring-neutral-700/50' : 'bg-neutral-800/60'}`}>
                <LocationIcon className={isActive ? 'text-neutral-400' : 'text-neutral-500'} />
              </div>
              <span className={`text-sm font-medium leading-relaxed ${isActive ? 'text-neutral-200' : 'text-neutral-400'}`}>
                {property.Address || 'Sem endereço'}
              </span>
            </div>

            {/* Widget grid */}
            <PropertyWidgets
              property={property}
              clientSource={client.Source}
              isActive={isActive}
            />

            {/* Observations */}
            {property.Observations && (
              <div className={`mt-4 px-4 py-3 rounded-xl border-l-2 ${
                isActive
                  ? 'bg-neutral-800/30 border-neutral-600'
                  : 'bg-neutral-800/20 border-neutral-700'
              }`}>
                <p className={`text-xs leading-relaxed ${isActive ? 'text-neutral-400' : 'text-neutral-500'}`}>
                  {property.Observations}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
