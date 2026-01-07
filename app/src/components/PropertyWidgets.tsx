import type { Property } from '../types'
import { BriefcaseIcon, BuildingIcon, PersonIcon } from './icons'

type PropertyWidgetsProps = {
  property: Property
  clientSource: string
  isActive?: boolean
}

export function PropertyWidgets({ property, clientSource, isActive = true }: PropertyWidgetsProps) {
  const widgetBase = isActive
    ? 'widget-card rounded-xl p-4 border border-neutral-800/50'
    : 'bg-neutral-800/30 rounded-xl p-4 border border-neutral-800/30'

  const labelColor = isActive ? 'text-neutral-500' : 'text-neutral-600'
  const textColor = isActive ? 'text-neutral-200' : 'text-neutral-500'
  const subTextColor = isActive ? 'text-neutral-400' : 'text-neutral-500'
  const emptyColor = isActive ? 'text-neutral-600' : 'text-neutral-700'

  // Determine fee based on client type
  const fee = property.Fee ||
    (clientSource === 'Full PM' || clientSource === 'AIDA' ? '1.230,00 €/ano' :
     clientSource === 'Condo' ? '307,50 €/ano' : '—')

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {/* Service widget */}
      <div className={widgetBase}>
        <div className="flex items-center gap-2 mb-3">
          <BriefcaseIcon className={`w-4 h-4 ${labelColor}`} />
          <span className={`text-xs font-medium uppercase tracking-wider ${labelColor}`}>Serviço</span>
        </div>
        <div className="space-y-2">
          <div className={`text-sm font-medium ${textColor}`}>
            {property.ServiceType || (clientSource === 'AIDA' ? 'Full PM' : clientSource)}
          </div>
          {isActive && (
            <>
              <div className={`text-sm ${subTextColor}`}>{fee}</div>
              {property.RenewalDate && (
                <div className="text-xs text-neutral-500">Renova: {property.RenewalDate}</div>
              )}
              <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                property.Invoice
                  ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20'
                  : 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20 pulse-attention'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  property.Invoice ? 'bg-emerald-400 dot-glow-emerald' : 'bg-amber-400 dot-glow-amber'
                }`}></div>
                {property.Invoice ? `Faturado: ${property.Invoice}` : 'Não faturado'}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Condo widget */}
      <div className={widgetBase}>
        <div className="flex items-center gap-2 mb-3">
          <BuildingIcon className={`w-4 h-4 ${labelColor}`} />
          <span className={`text-xs font-medium uppercase tracking-wider ${labelColor}`}>Condomínio</span>
        </div>
        {property.Condo ? (
          <div className="space-y-2">
            <div className={`text-sm font-medium ${textColor}`}>{property.Condo}</div>
            {isActive && property.CondoPayment && (
              <div className={`text-sm ${subTextColor}`}>{property.CondoPayment}</div>
            )}
            {isActive && property.CondoContact && (
              <div className="text-xs text-neutral-500 break-all">{property.CondoContact}</div>
            )}
          </div>
        ) : (
          <div className={`text-sm italic ${emptyColor}`}>Sem condomínio</div>
        )}
      </div>

      {/* Tenant widget */}
      <div className={widgetBase}>
        <div className="flex items-center gap-2 mb-3">
          <PersonIcon className={`w-4 h-4 ${labelColor}`} />
          <span className={`text-xs font-medium uppercase tracking-wider ${labelColor}`}>Inquilino</span>
        </div>
        {property.Tenant ? (
          <div className="space-y-2">
            <div className={`text-sm font-medium ${textColor}`}>{property.Tenant}</div>
            {isActive && property.Rent && (
              <div className={`text-sm ${subTextColor}`}>{property.Rent}</div>
            )}
            {isActive && property.LeaseEnd && (
              <div className="text-xs text-neutral-500">Até: {property.LeaseEnd}</div>
            )}
            {isActive && property.TenantContact && (
              <div className="text-xs text-neutral-500 break-all">{property.TenantContact}</div>
            )}
          </div>
        ) : (
          <div className={`text-sm italic ${emptyColor}`}>Sem inquilino</div>
        )}
      </div>
    </div>
  )
}
