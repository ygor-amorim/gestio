import { useState, useMemo, useCallback } from 'react'
import type { Client, YearlyStatus, RenewalStatus } from './types'
import { useClients, useTodos, usePayments } from './hooks'
import {
  SearchIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardIcon,
  PlusIcon,
} from './components'
import { CopyFolderButton } from './components/CopyFolderButton'
import { ClientDetail } from './components/ClientDetail'
import { ClientModal } from './components/ClientModal'
import { ConfirmDialog } from './components/ConfirmDialog'

// Tab type
type Tab = 'clientes' | 'tarefas'
type TypeFilter = 'all' | 'fullpm' | 'condo'
type InvoiceFilter = 'all' | 'invoiced' | 'uninvoiced'
type SortField = 'name' | 'file'
type SortDir = 'asc' | 'desc'

// Constants
const INACTIVE_PREVIEW_COUNT = 3

// Filter button config with explicit Tailwind classes (no dynamic interpolation)
const TYPE_FILTERS = [
  { value: 'all' as const, label: 'Todos', activeClass: 'bg-neutral-800 text-white shadow-md', hoverClass: 'text-neutral-400 hover:text-white hover:bg-neutral-800/50' },
  { value: 'fullpm' as const, label: 'Full PM', activeClass: 'bg-emerald-500/20 text-emerald-400 shadow-md glow-emerald', hoverClass: 'text-neutral-400 hover:text-emerald-400 hover:bg-emerald-500/10' },
  { value: 'condo' as const, label: 'Condo', activeClass: 'bg-amber-500/20 text-amber-400 shadow-md glow-amber', hoverClass: 'text-neutral-400 hover:text-amber-400 hover:bg-amber-500/10' },
]

// Sort button config
const SORT_FIELDS = [
  { field: 'name' as const, label: 'Nome' },
  { field: 'file' as const, label: 'Ficheiro' },
]

// Helper functions (outside component to avoid recreation)
const hasUninvoiced = (client: Client) => client.Properties.some(p => !p.Invoice)

const getClientType = (client: Client) => {
  if (client.Source === 'Full PM' || client.Source === 'AIDA') return 'fullpm'
  if (client.Source === 'Condo') return 'condo'
  return 'other'
}

function App() {
  // Client data from hook with localStorage persistence
  const { clients, addClient, updateClient, deactivateClient, reactivateClient, deleteClient, importClients } = useClients()
  const { todos, addTodo, toggleTodo, deleteTodo, importTodos } = useTodos()
  const { payments, addPayment, togglePaymentField, deletePayment, importPayments } = usePayments()

  // UI State
  const [activeTab, setActiveTab] = useState<Tab>('clientes')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedClient, setExpandedClient] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [copiedFolder, setCopiedFolder] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [showAllInactive, setShowAllInactive] = useState(false)
  const [invoiceFilter, setInvoiceFilter] = useState<InvoiceFilter>('all')
  const [showInvoiceMenu, setShowInvoiceMenu] = useState(false)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    variant: 'danger' | 'warning' | 'default'
    onConfirm: () => void
  }>({ isOpen: false, title: '', message: '', variant: 'default', onConfirm: () => {} })

  // Painel state
  const [newTodoText, setNewTodoText] = useState('')
  const [newPaymentClient, setNewPaymentClient] = useState('')
  const [newPaymentDesc, setNewPaymentDesc] = useState('')
  const [showPaymentReport, setShowPaymentReport] = useState(false)
  const [reportMonth, setReportMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const tarefasCount = todos.filter(t => !t.done).length + payments.filter(p => !p.dossie).length

  // Toggle sort
  const toggleSort = useCallback((field: SortField) => {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDir('asc')
    }
  }, [sortBy])

  // Copy folder path to clipboard
  const copyFolderPath = useCallback(async (client: Client, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!client.FolderLink) return

    try {
      await navigator.clipboard.writeText(client.FolderLink)
      setCopiedFolder(client.File)
      setTimeout(() => setCopiedFolder(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [])

  // Toggle client expansion with keyboard support
  const handleClientToggle = useCallback((clientFile: string) => {
    setExpandedClient(current => current === clientFile ? null : clientFile)
  }, [])

  const handleClientKeyDown = useCallback((e: React.KeyboardEvent, clientFile: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClientToggle(clientFile)
    }
  }, [handleClientToggle])

  // CRUD handlers
  const handleNewClient = useCallback(() => {
    setEditingClient(null)
    setIsModalOpen(true)
  }, [])

  const handleEditClient = useCallback((client: Client) => {
    setEditingClient(client)
    setIsModalOpen(true)
  }, [])

  const handleSaveClient = useCallback((client: Client) => {
    if (editingClient) {
      updateClient(client.File, client)
    } else {
      addClient(client)
    }
  }, [editingClient, updateClient, addClient])

  const handleDeactivateClient = useCallback((client: Client) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Desativar Cliente',
      message: `Tem certeza que deseja desativar "${client.Name}"? O cliente será movido para a seção de inativos.`,
      variant: 'warning',
      onConfirm: () => {
        deactivateClient(client.File)
        setExpandedClient(null)
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      },
    })
  }, [deactivateClient])

  const handleReactivateClient = useCallback((client: Client) => {
    reactivateClient(client.File)
    setExpandedClient(null)
  }, [reactivateClient])

  const handleDeleteClient = useCallback((client: Client) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Cliente',
      message: `Tem certeza que deseja eliminar permanentemente "${client.Name}"? Esta ação não pode ser desfeita.`,
      variant: 'danger',
      onConfirm: () => {
        deleteClient(client.File)
        setExpandedClient(null)
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      },
    })
  }, [deleteClient])

  const handleWipeInvoices = useCallback((clientsToWipe: Client[]) => {
    const withInvoices = clientsToWipe.filter(c => c.Properties.some(p => p.Invoice))
    if (withInvoices.length === 0) return

    setConfirmDialog({
      isOpen: true,
      title: 'Limpar Faturas',
      message: `Isto irá limpar as faturas de ${withInvoices.length} cliente(s) visíveis. Esta ação não pode ser desfeita.`,
      variant: 'warning',
      onConfirm: () => {
        withInvoices.forEach(client => {
          updateClient(client.File, {
            ...client,
            Properties: client.Properties.map(p => ({ ...p, Invoice: '' }))
          })
        })
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
        setShowInvoiceMenu(false)
      },
    })
  }, [updateClient])

  const handleStatusChange = useCallback((client: Client, field: keyof YearlyStatus) => {
    const currentStatus = client.status2026 || {
      fundos: false, q1: false, q2: false, q3: false, q4: false, seguro: false, faturacao: false
    }
    updateClient(client.File, {
      ...client,
      status2026: { ...currentStatus, [field]: !currentStatus[field] }
    })
  }, [updateClient])

  const handleRenewalChange = useCallback((client: Client, field: keyof RenewalStatus) => {
    const currentRenewal = client.renewal2026 || {
      mensagemEnviada: false, pagamentoRecebido: false, faturado: false
    }
    updateClient(client.File, {
      ...client,
      renewal2026: { ...currentRenewal, [field]: !currentRenewal[field] }
    })
  }, [updateClient])

  // Export all data to JSON file
  const handleExport = useCallback(() => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      clients,
      todos,
      payments,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gestio-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [clients, todos, payments])

  // Import data from JSON file
  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        if (data.clients) importClients(data.clients)
        if (data.todos) importTodos(data.todos)
        if (data.payments) importPayments(data.payments)
        alert('Dados importados com sucesso!')
      } catch {
        alert('Erro ao importar dados. Verifique se o ficheiro é válido.')
      }
    }
    reader.readAsText(file)
    e.target.value = '' // Reset input
  }, [importClients, importTodos, importPayments])

  // Filter and sort clients (memoized)
  const { activeClients, inactiveClients, filteredCount } = useMemo(() => {
    const term = searchTerm.toLowerCase()

    // Filter
    const filtered = clients.filter(client => {
      // Client-level fields
      const matchesClient =
        client.Name.toLowerCase().includes(term) ||
        client.File.toLowerCase().includes(term) ||
        client.NIF.toLowerCase().includes(term) ||
        client.Email.toLowerCase().includes(term) ||
        client.Source.toLowerCase().includes(term)

      // Property-level fields
      const matchesProperty = client.Properties.some(p =>
        p.Address.toLowerCase().includes(term) ||
        p.Condo.toLowerCase().includes(term) ||
        p.CondoContact.toLowerCase().includes(term) ||
        p.Tenant.toLowerCase().includes(term) ||
        p.TenantContact.toLowerCase().includes(term)
      )

      // Type filter
      const matchesType =
        typeFilter === 'all' ||
        (typeFilter === 'fullpm' && (client.Source === 'Full PM' || client.Source === 'AIDA')) ||
        (typeFilter === 'condo' && client.Source === 'Condo')

      // Invoice filter
      const allInvoiced = client.Properties.every(p => p.Invoice && p.Invoice.trim().length > 0)
      const matchesInvoice =
        invoiceFilter === 'all' ||
        (invoiceFilter === 'invoiced' && allInvoiced) ||
        (invoiceFilter === 'uninvoiced' && !allInvoiced)

      return (matchesClient || matchesProperty) && matchesType && matchesInvoice
    })

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let compare = 0
      if (sortBy === 'name') {
        compare = a.Name.localeCompare(b.Name, 'pt')
      } else {
        const aNum = parseInt(a.File.split('-')[0]) || 0
        const bNum = parseInt(b.File.split('-')[0]) || 0
        compare = aNum - bNum
      }
      return sortDir === 'asc' ? compare : -compare
    })

    return {
      activeClients: sorted.filter(c => c.Active),
      inactiveClients: sorted.filter(c => !c.Active),
      filteredCount: filtered.length,
    }
  }, [clients, searchTerm, typeFilter, invoiceFilter, sortBy, sortDir])

  const totalActive = clients.filter(c => c.Active).length
  const totalInactive = clients.filter(c => !c.Active).length

  return (
    <div className="min-h-screen ambient-bg noise-overlay text-neutral-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800/50 header-glow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <span className="text-sm font-bold text-white drop-shadow-sm">G</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-white">Gestio</h1>
                <p className="text-[10px] text-neutral-500 -mt-0.5 tracking-wide">PROPERTY MANAGEMENT</p>
              </div>
            </div>

            {/* Nav tabs */}
            <nav className="flex items-center gap-1 bg-neutral-900/60 p-1.5 rounded-xl border border-neutral-800/50">
              {(['clientes', 'tarefas'] as const).map(tab => {
                const isActive = activeTab === tab
                const count = tab === 'clientes' ? activeClients.length : tarefasCount
                const badgeColor = tab === 'clientes'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/20 text-amber-400'
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-neutral-800 text-white shadow-lg shadow-black/20'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full transition-all ${
                      isActive ? badgeColor : 'bg-neutral-700/50 text-neutral-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'clientes' && (
          <div className="space-y-6">
            {/* Search and filters */}
            <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
              {/* Search input */}
              <div className="relative flex-1 max-w-xl group">
                <input
                  type="text"
                  placeholder="Buscar por nome, NIF, endereço, condomínio, inquilino..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Buscar clientes"
                  className="w-full pl-11 pr-4 py-3 bg-neutral-900/80 border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 focus:bg-neutral-900 transition-all duration-200 focus:shadow-lg focus:shadow-black/20"
                />
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 transition-colors group-focus-within:text-neutral-400" />
              </div>

              {/* Type filter buttons */}
              <div className="flex gap-1 bg-neutral-900/60 p-1.5 rounded-xl border border-neutral-800/50 self-start">
                {TYPE_FILTERS.map(({ value, label, activeClass, hoverClass }) => (
                  <button
                    key={value}
                    onClick={() => setTypeFilter(value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      typeFilter === value ? activeClass : hoverClass
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Sort buttons */}
              <div className="flex items-center gap-2 self-start">
                <span className="text-xs text-neutral-500 hidden sm:inline">Ordenar:</span>
                <div className="flex gap-1 bg-neutral-900/60 p-1 rounded-lg border border-neutral-800/50">
                  {SORT_FIELDS.map(({ field, label }) => (
                    <button
                      key={field}
                      onClick={() => toggleSort(field)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                        sortBy === field
                          ? 'bg-neutral-800 text-white'
                          : 'text-neutral-500 hover:text-white hover:bg-neutral-800/50'
                      }`}
                    >
                      {label}
                      {sortBy === field && (
                        <span className={`transition-transform ${sortDir === 'desc' ? 'rotate-180' : ''}`}>
                          <ChevronUpIcon />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* New client button */}
              <button
                onClick={handleNewClient}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors self-start"
              >
                <PlusIcon />
                Novo Cliente
              </button>
            </div>

            {/* Stats bar */}
            <div className="flex items-center gap-8 text-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 dot-glow-emerald"></div>
                <span className="text-neutral-300 font-medium">{totalActive}</span>
                <span className="text-neutral-500">ativos</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-neutral-500 dot-glow-neutral"></div>
                <span className="text-neutral-400">{totalInactive}</span>
                <span className="text-neutral-500">inativos</span>
              </div>
              {searchTerm && (
                <div className="flex items-center gap-2 px-3 py-1 bg-neutral-800/50 rounded-full">
                  <span className="text-neutral-400 text-xs">
                    {filteredCount} resultado{filteredCount !== 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {/* Invoice filter menu */}
              <div className="relative ml-auto">
                <button
                  onClick={() => setShowInvoiceMenu(!showInvoiceMenu)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    invoiceFilter !== 'all' || showInvoiceMenu
                      ? 'bg-neutral-800 text-neutral-300'
                      : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Faturas
                  {invoiceFilter !== 'all' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  )}
                </button>

                {showInvoiceMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowInvoiceMenu(false)} />
                    <div className="absolute right-0 top-full mt-2 z-50 w-48 bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl shadow-black/30 overflow-hidden">
                      <div className="p-1.5">
                        <button
                          onClick={() => { setInvoiceFilter('all'); setShowInvoiceMenu(false) }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            invoiceFilter === 'all' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-white'
                          }`}
                        >
                          Todos
                        </button>
                        <button
                          onClick={() => { setInvoiceFilter('invoiced'); setShowInvoiceMenu(false) }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            invoiceFilter === 'invoiced' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-white'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Faturados
                          </span>
                        </button>
                        <button
                          onClick={() => { setInvoiceFilter('uninvoiced'); setShowInvoiceMenu(false) }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            invoiceFilter === 'uninvoiced' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-white'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            Não faturados
                          </span>
                        </button>
                      </div>
                      <div className="border-t border-neutral-800 p-1.5">
                        <button
                          onClick={() => handleWipeInvoices(activeClients)}
                          className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          Limpar faturas visíveis
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Client list */}
            <div className="space-y-3">
              {activeClients.map((client) => {
                const clientType = getClientType(client)
                const isExpanded = expandedClient === client.File
                const uninvoiced = hasUninvoiced(client)

                return (
                  <div key={client.File} className="group">
                    {/* Client row */}
                    <div
                      onClick={() => handleClientToggle(client.File)}
                      onKeyDown={(e) => handleClientKeyDown(e, client.File)}
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      className={`card-lift bg-neutral-900/60 border rounded-xl p-4 cursor-pointer ${
                        isExpanded
                          ? clientType === 'fullpm'
                            ? 'border-emerald-500/30 bg-neutral-900 glow-emerald'
                            : clientType === 'condo'
                            ? 'border-amber-500/30 bg-neutral-900 glow-amber'
                            : 'border-neutral-600 bg-neutral-900 glow-white'
                          : 'border-neutral-800/50 hover:border-neutral-700/50 hover:bg-neutral-900/80 hover:shadow-xl hover:shadow-black/20'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        {/* Status indicator + File number + Folder quick action */}
                        <div className="flex items-center gap-3 sm:w-36">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${
                            uninvoiced
                              ? 'bg-amber-500 dot-glow-amber pulse-attention'
                              : 'bg-emerald-500 dot-glow-emerald'
                          }`}></div>
                          <span className="text-sm font-mono text-neutral-500">{client.File}</span>
                          {client.FolderLink && (
                            <CopyFolderButton
                              folderPath={client.FolderLink}
                              isCopied={copiedFolder === client.File}
                              onCopy={(e) => copyFolderPath(client, e)}
                              variant="icon"
                            />
                          )}
                        </div>

                        {/* Name and badge */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5">
                            <span className="font-medium text-neutral-100 truncate">{client.Name}</span>
                            <span className={`shrink-0 inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${
                              clientType === 'fullpm'
                                ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20'
                                : clientType === 'condo'
                                ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20'
                                : 'bg-neutral-800 text-neutral-400'
                            }`}>
                              {client.Source === 'AIDA' ? 'Full PM' : client.Source}
                            </span>
                          </div>
                          {client.NIF && (
                            <div className="text-xs text-neutral-500 mt-0.5">NIF: {client.NIF}</div>
                          )}
                        </div>

                        {/* Properties count */}
                        <div className="hidden sm:flex items-center gap-2 text-sm">
                          <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="text-neutral-300 font-medium">{client.Properties.length}</span>
                        </div>

                        {/* Status 2026 indicator */}
                        {(() => {
                          const s = client.status2026
                          const done = s ? [s.fundos, s.q1, s.q2, s.q3, s.q4, s.seguro, s.faturacao].filter(Boolean).length : 0
                          if (done === 0) return null
                          return (
                            <div className="hidden sm:flex items-center gap-1.5" title={`Status 2026: ${done}/7`}>
                              <span className={`text-xs font-medium ${done === 7 ? 'text-emerald-400' : 'text-neutral-500'}`}>
                                {done}/7
                              </span>
                              <div className="flex gap-0.5">
                                {[...Array(7)].map((_, i) => (
                                  <div
                                    key={i}
                                    className={`w-1 h-3 rounded-sm ${i < done ? 'bg-emerald-500' : 'bg-neutral-700'}`}
                                  />
                                ))}
                              </div>
                            </div>
                          )
                        })()}

                        {/* Email */}
                        <div className="hidden lg:block text-sm text-neutral-500 truncate max-w-44">
                          {client.Email || '—'}
                        </div>

                        {/* Expand indicator */}
                        <div className={`hidden sm:flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${
                          isExpanded
                            ? 'bg-neutral-700 rotate-180'
                            : 'bg-neutral-800/50 group-hover:bg-neutral-800'
                        }`}>
                          <ChevronDownIcon className="text-neutral-400" />
                        </div>
                      </div>
                    </div>

                    {/* Expanded section */}
                    {isExpanded && (
                      <ClientDetail
                        client={client}
                        isActive={true}
                        copiedFolder={copiedFolder}
                        onCopyFolder={copyFolderPath}
                        onEdit={handleEditClient}
                        onDeactivate={handleDeactivateClient}
                        onDelete={handleDeleteClient}
                        onStatusChange={handleStatusChange}
                      />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Empty state */}
            {activeClients.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-black/20">
                  <SearchIcon className="w-7 h-7 text-neutral-600" />
                </div>
                <p className="text-neutral-300 font-medium text-lg">Nenhum cliente encontrado</p>
                <p className="text-sm text-neutral-500 mt-1">Tente ajustar os filtros ou a busca</p>
              </div>
            )}

            {/* Inactive clients section */}
            {inactiveClients.length > 0 && (
              <div className="mt-14 pt-8 border-t border-neutral-800/50">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-sm font-medium text-neutral-500 flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-neutral-600 dot-glow-neutral"></div>
                    Inativos
                    <span className="text-neutral-600 bg-neutral-800/50 px-2 py-0.5 rounded-full text-xs">{inactiveClients.length}</span>
                  </h2>
                  {inactiveClients.length > INACTIVE_PREVIEW_COUNT && (
                    <button
                      onClick={() => setShowAllInactive(!showAllInactive)}
                      className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                    >
                      {showAllInactive ? 'Mostrar menos' : `Mostrar todos (${inactiveClients.length})`}
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {(showAllInactive ? inactiveClients : inactiveClients.slice(0, INACTIVE_PREVIEW_COUNT)).map((client) => {
                    const isExpanded = expandedClient === client.File

                    return (
                      <div key={client.File} className="group">
                        {/* Inactive client row */}
                        <div
                          onClick={() => handleClientToggle(client.File)}
                          onKeyDown={(e) => handleClientKeyDown(e, client.File)}
                          role="button"
                          tabIndex={0}
                          aria-expanded={isExpanded}
                          className={`card-lift bg-neutral-900/30 border rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                            isExpanded
                              ? 'border-neutral-600 bg-neutral-900/60'
                              : 'border-neutral-800/30 hover:border-neutral-700/50 hover:bg-neutral-900/50'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3 w-28">
                              <div className="w-2 h-2 rounded-full bg-neutral-600 shrink-0"></div>
                              <span className="text-sm font-mono text-neutral-600">{client.File}</span>
                            </div>
                            <span className="text-sm flex-1 text-neutral-400">{client.Name}</span>
                            <span className="text-xs text-neutral-600 bg-neutral-800/50 px-2 py-1 rounded-full">Inativo</span>
                            <div className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-300 ${
                              isExpanded ? 'bg-neutral-700 rotate-180' : 'bg-neutral-800/30 group-hover:bg-neutral-800/60'
                            }`}>
                              <ChevronDownIcon className="text-neutral-500" />
                            </div>
                          </div>
                        </div>

                        {/* Expanded section for inactive client */}
                        {isExpanded && (
                          <ClientDetail
                            client={client}
                            isActive={false}
                            copiedFolder={copiedFolder}
                            onCopyFolder={copyFolderPath}
                            onEdit={handleEditClient}
                            onReactivate={handleReactivateClient}
                            onDelete={handleDeleteClient}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tarefas' && (
          <div className="space-y-6">
            {/* Renewals Section */}
            {(() => {
              const currentMonth = new Date().getMonth() + 1 // 1-12
              const monthNames = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
              const renewalClients = clients.filter(c => c.Active && c.RenewalMonth === currentMonth)
              const pendingRenewals = renewalClients.filter(c => !c.renewal2026?.faturado).length

              return (
                <div className="bg-neutral-900/60 border border-neutral-800/50 rounded-xl p-5">
                  <h2 className="text-lg font-medium text-neutral-200 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Renovações - {monthNames[currentMonth]}
                    <span className="ml-auto text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full">
                      {pendingRenewals} pendente{pendingRenewals !== 1 ? 's' : ''}
                    </span>
                  </h2>

                  {renewalClients.length === 0 ? (
                    <p className="text-sm text-neutral-500 text-center py-6">Nenhuma renovação este mês</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {renewalClients.map(client => {
                        const r = client.renewal2026 || { mensagemEnviada: false, pagamentoRecebido: false, faturado: false }
                        const steps = [
                          { key: 'mensagemEnviada' as const, label: 'Msg Enviada' },
                          { key: 'pagamentoRecebido' as const, label: 'Pago' },
                          { key: 'faturado' as const, label: 'Faturado' },
                        ]
                        return (
                          <div
                            key={client.File}
                            className={`p-3 rounded-lg transition-colors ${
                              r.faturado ? 'bg-neutral-800/30' : 'bg-neutral-800/50'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-mono text-neutral-500">{client.File}</span>
                              <span className={`text-sm font-medium truncate ${r.faturado ? 'text-neutral-500' : 'text-neutral-200'}`}>
                                {client.Name}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              {steps.map(({ key, label }) => (
                                <button
                                  key={key}
                                  onClick={() => handleRenewalChange(client, key)}
                                  className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors ${
                                    r[key]
                                      ? 'bg-emerald-500/20 text-emerald-400'
                                      : 'bg-neutral-700/50 text-neutral-500 hover:bg-neutral-700'
                                  }`}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })()}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* TO-DO Column */}
            <div className="bg-neutral-900/60 border border-neutral-800/50 rounded-xl p-5">
              <h2 className="text-lg font-medium text-neutral-200 mb-4 flex items-center gap-2">
                <ClipboardIcon className="w-5 h-5 text-neutral-500" />
                TO-DO
                <span className="ml-auto text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full">
                  {todos.filter(t => !t.done).length}
                </span>
              </h2>

              {/* Add todo form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (newTodoText.trim()) {
                    addTodo(newTodoText.trim())
                    setNewTodoText('')
                  }
                }}
                className="flex gap-2 mb-4"
              >
                <input
                  type="text"
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  placeholder="Nova tarefa..."
                  className="flex-1 px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
                />
                <button
                  type="submit"
                  disabled={!newTodoText.trim()}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <PlusIcon />
                </button>
              </form>

              {/* Todo list */}
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {todos.map(todo => (
                  <div
                    key={todo.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      todo.done ? 'bg-neutral-800/30' : 'bg-neutral-800/50'
                    }`}
                  >
                    <button
                      onClick={() => toggleTodo(todo.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        todo.done
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-neutral-600 hover:border-neutral-500'
                      }`}
                    >
                      {todo.done && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <span className={`flex-1 text-sm ${todo.done ? 'text-neutral-500 line-through' : 'text-neutral-200'}`}>
                      {todo.text}
                    </span>
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="p-1 text-neutral-600 hover:text-red-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                {todos.length === 0 && (
                  <p className="text-sm text-neutral-500 text-center py-8">Nenhuma tarefa</p>
                )}
              </div>
            </div>

            {/* Payments Column */}
            <div className="bg-neutral-900/60 border border-neutral-800/50 rounded-xl p-5">
              <h2 className="text-lg font-medium text-neutral-200 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Pagamentos
                <button
                  onClick={() => setShowPaymentReport(true)}
                  className="ml-auto p-1.5 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors"
                  title="Relatório Mensal"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
                <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full">
                  {payments.filter(p => !p.dossie).length}
                </span>
              </h2>

              {/* Add payment form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (newPaymentClient.trim() && newPaymentDesc.trim()) {
                    const client = clients.find(c => c.File === newPaymentClient || c.Name.toLowerCase().includes(newPaymentClient.toLowerCase()))
                    addPayment({
                      clientFile: client?.File || newPaymentClient,
                      clientName: client?.Name || newPaymentClient,
                      description: newPaymentDesc.trim(),
                      fatura: false,
                      comprovativo: false,
                      recibo: false,
                      enviado: false,
                      dossie: false,
                    })
                    setNewPaymentClient('')
                    setNewPaymentDesc('')
                  }
                }}
                className="flex gap-2 mb-4"
              >
                <input
                  type="text"
                  value={newPaymentClient}
                  onChange={(e) => setNewPaymentClient(e.target.value)}
                  placeholder="Cliente..."
                  className="w-32 px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
                />
                <input
                  type="text"
                  value={newPaymentDesc}
                  onChange={(e) => setNewPaymentDesc(e.target.value)}
                  placeholder="Descrição..."
                  className="flex-1 px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
                />
                <button
                  type="submit"
                  disabled={!newPaymentClient.trim() || !newPaymentDesc.trim()}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <PlusIcon />
                </button>
              </form>

              {/* Payments list */}
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {payments.map(payment => {
                  const steps = [
                    { key: 'fatura' as const, label: 'Fat' },
                    { key: 'comprovativo' as const, label: 'Comp' },
                    { key: 'recibo' as const, label: 'Rec' },
                    { key: 'enviado' as const, label: 'Env' },
                    { key: 'dossie' as const, label: 'Dos' },
                  ]
                  return (
                    <div
                      key={payment.id}
                      className={`p-3 rounded-lg transition-colors ${
                        payment.dossie ? 'bg-neutral-800/30' : 'bg-neutral-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="min-w-0">
                          <span className={`text-sm font-medium ${payment.dossie ? 'text-neutral-500' : 'text-neutral-200'}`}>
                            {payment.clientName}
                          </span>
                          <p className={`text-xs truncate ${payment.dossie ? 'text-neutral-600' : 'text-neutral-400'}`}>
                            {payment.description}
                          </p>
                        </div>
                        <button
                          onClick={() => deletePayment(payment.id)}
                          className="p-1 text-neutral-600 hover:text-red-400 transition-colors shrink-0"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex gap-1">
                        {steps.map(({ key, label }) => (
                          <button
                            key={key}
                            onClick={() => togglePaymentField(payment.id, key)}
                            className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                              payment[key]
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-neutral-700/50 text-neutral-500 hover:bg-neutral-700'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
                {payments.length === 0 && (
                  <p className="text-sm text-neutral-500 text-center py-8">Nenhum pagamento</p>
                )}
              </div>
            </div>
            </div>

            {/* Data Management */}
            <div className="flex items-center justify-between p-4 bg-neutral-900/40 border border-neutral-800/30 rounded-xl">
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-3-3v6" />
                </svg>
                Gestão de Dados
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Exportar
                </button>
                <label className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Importar
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Client Modal */}
      <ClientModal
        client={editingClient}
        isOpen={isModalOpen}
        existingFiles={clients.map(c => c.File)}
        onClose={() => {
          setIsModalOpen(false)
          setEditingClient(null)
        }}
        onSave={handleSaveClient}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        confirmLabel={confirmDialog.variant === 'danger' ? 'Eliminar' : 'Confirmar'}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Payment Report Modal */}
      {showPaymentReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPaymentReport(false)} />
          <div className="relative bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-neutral-800">
              <h3 className="text-lg font-medium text-neutral-200">Relatório Mensal de Pagamentos</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Imprimir
                </button>
                <button
                  onClick={() => setShowPaymentReport(false)}
                  className="p-2 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-5 overflow-y-auto max-h-[60vh]">
              {(() => {
                const [year, month] = reportMonth.split('-').map(Number)
                const monthNames = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
                return (
                  <>
                    {/* Print-only month header */}
                    <p className="hidden print:block text-lg font-medium text-black mb-4">{monthNames[month]} {year}</p>
                    {/* Month selector (hidden in print) */}
                    <div className="flex items-center gap-3 mb-5 print:hidden">
                      <label className="text-sm text-neutral-400">Mês:</label>
                      <input
                        type="month"
                        value={reportMonth}
                        onChange={(e) => setReportMonth(e.target.value)}
                        className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-neutral-100 focus:outline-none focus:border-neutral-600"
                      />
                    </div>
                  </>
                )
              })()}
              {(() => {
                const [year, month] = reportMonth.split('-').map(Number)
                const monthPayments = payments.filter(p => {
                  const date = new Date(p.createdAt)
                  return date.getFullYear() === year && date.getMonth() + 1 === month
                })
                const completed = monthPayments.filter(p => p.dossie)
                const pending = monthPayments.filter(p => !p.dossie)
                const monthNames = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

                return (
                  <>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-neutral-800/50 rounded-xl text-center">
                        <div className="text-2xl font-bold text-neutral-200">{monthPayments.length}</div>
                        <div className="text-xs text-neutral-500">Total</div>
                      </div>
                      <div className="p-4 bg-emerald-500/10 rounded-xl text-center">
                        <div className="text-2xl font-bold text-emerald-400">{completed.length}</div>
                        <div className="text-xs text-neutral-500">Concluídos</div>
                      </div>
                      <div className="p-4 bg-amber-500/10 rounded-xl text-center">
                        <div className="text-2xl font-bold text-amber-400">{pending.length}</div>
                        <div className="text-xs text-neutral-500">Pendentes</div>
                      </div>
                    </div>

                    {monthPayments.length === 0 ? (
                      <p className="text-sm text-neutral-500 text-center py-8">Nenhum pagamento em {monthNames[month]} {year}</p>
                    ) : (
                      <div className="space-y-2">
                        {monthPayments.map(p => (
                          <div key={p.id} className={`p-3 rounded-lg ${p.dossie ? 'bg-neutral-800/30' : 'bg-neutral-800/50'}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-sm font-medium ${p.dossie ? 'text-neutral-500' : 'text-neutral-200'}`}>
                                {p.clientName}
                              </span>
                              <span className="text-xs text-neutral-600">
                                {new Date(p.createdAt).toLocaleDateString('pt-PT')}
                              </span>
                            </div>
                            <p className={`text-xs ${p.dossie ? 'text-neutral-600' : 'text-neutral-400'}`}>{p.description}</p>
                            <div className="flex gap-1 mt-2">
                              {[
                                { key: 'fatura', label: 'Fat' },
                                { key: 'comprovativo', label: 'Comp' },
                                { key: 'recibo', label: 'Rec' },
                                { key: 'enviado', label: 'Env' },
                                { key: 'dossie', label: 'Dos' },
                              ].map(({ key, label }) => (
                                <span
                                  key={key}
                                  className={`flex-1 px-2 py-0.5 text-xs text-center rounded ${
                                    p[key as keyof typeof p]
                                      ? 'bg-emerald-500/20 text-emerald-400'
                                      : 'bg-neutral-700/30 text-neutral-600'
                                  }`}
                                >
                                  {label}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
