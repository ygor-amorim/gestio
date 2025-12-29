import { useState } from 'react'
import clientsData from './data/clients.json'
import type { Client, Tarefa } from './types'

// Type assertion for JSON import
const clients: Client[] = clientsData as Client[]

// Tab type
type Tab = 'clientes' | 'tarefas'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('clientes')
  const [searchTerm, setSearchTerm] = useState('')
  const [tarefas] = useState<Tarefa[]>(() => {
    const saved = localStorage.getItem('tarefas')
    return saved ? JSON.parse(saved) : []
  })

  // Filter clients by search term
  const filteredClients = clients.filter(client => {
    const term = searchTerm.toLowerCase()
    return (
      client.Name.toLowerCase().includes(term) ||
      client.File.toLowerCase().includes(term) ||
      client.Properties.some(p => p.Address.toLowerCase().includes(term))
    )
  })

  // Active clients only
  const activeClients = filteredClients.filter(c => c.Active)
  const inactiveClients = filteredClients.filter(c => !c.Active)

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Header */}
      <header className="bg-neutral-900 border-b border-neutral-800/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-medium tracking-tight text-white">Edge</h1>
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('clientes')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
                activeTab === 'clientes'
                  ? 'bg-white/10 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Clientes
              <span className="ml-1.5 text-neutral-500">{activeClients.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('tarefas')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
                activeTab === 'tarefas'
                  ? 'bg-white/10 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Tarefas
              <span className="ml-1.5 text-neutral-500">{tarefas.filter(t => t.status !== 'Concluído').length}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="p-6">
        {activeTab === 'clientes' && (
          <div>
            {/* Search */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Buscar por nome, file ou endereço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full max-w-md px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-md text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-colors duration-150"
              />
            </div>

            {/* Stats */}
            <div className="mb-6 flex gap-3 text-sm text-neutral-500">
              <span>{clients.length} clientes</span>
              <span className="text-neutral-700">•</span>
              <span>{clients.filter(c => c.Active).length} ativos</span>
              <span className="text-neutral-700">•</span>
              <span>{clients.filter(c => !c.Active).length} inativos</span>
            </div>

            {/* Client list */}
            <div className="bg-neutral-900 rounded-lg border border-neutral-800/50 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-800/50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">File</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Nome</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Tipo</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Propriedades</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Contato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                  {activeClients.map((client) => (
                    <tr
                      key={client.File}
                      className="hover:bg-white/[0.02] cursor-pointer transition-colors duration-150"
                    >
                      <td className="px-4 py-3 text-sm font-mono text-neutral-400">{client.File}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-neutral-100">{client.Name}</div>
                        {client.NIF && <div className="text-xs text-neutral-600 mt-0.5">{client.NIF}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded whitespace-nowrap ${
                          client.Source === 'Full PM' || client.Source === 'AIDA'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : client.Source === 'Condo'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}>
                          {client.Source === 'AIDA' ? 'Full PM' : client.Source}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-400">
                        <span className="text-neutral-300">{client.Properties.length}</span>
                        <span className="ml-1">{client.Properties.length === 1 ? 'propriedade' : 'propriedades'}</span>
                        {client.Properties[0]?.Address && (
                          <div className="text-xs text-neutral-600 truncate max-w-xs mt-0.5">
                            {client.Properties[0].Address}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-500">
                        {client.Email || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Inactive clients section */}
            {inactiveClients.length > 0 && (
              <div className="mt-10">
                <h2 className="text-sm font-medium text-neutral-500 mb-3">
                  Inativos
                  <span className="ml-2 text-neutral-600">{inactiveClients.length}</span>
                </h2>
                <div className="bg-neutral-900/50 rounded-lg border border-neutral-800/30 overflow-hidden">
                  <table className="w-full">
                    <tbody className="divide-y divide-neutral-800/30">
                      {inactiveClients.slice(0, 5).map((client) => (
                        <tr
                          key={client.File}
                          className="hover:bg-white/[0.01] transition-colors duration-150"
                        >
                          <td className="px-4 py-2.5 text-sm font-mono text-neutral-600">{client.File}</td>
                          <td className="px-4 py-2.5 text-sm text-neutral-500">{client.Name}</td>
                          <td className="px-4 py-2.5 text-sm text-neutral-600">Deixou de ter PM</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {inactiveClients.length > 5 && (
                    <div className="px-4 py-2 text-xs text-neutral-600">
                      + {inactiveClients.length - 5} mais
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tarefas' && (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
            <div className="w-12 h-12 rounded-lg bg-neutral-900 border border-neutral-800/50 flex items-center justify-center mb-4">
              <span className="text-xl">📋</span>
            </div>
            <p className="text-sm font-medium text-neutral-400">Tarefas</p>
            <p className="text-xs text-neutral-600 mt-1">Em desenvolvimento</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
