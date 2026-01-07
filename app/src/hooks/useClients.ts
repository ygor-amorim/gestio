import { useState, useCallback, useEffect } from 'react'
import initialClientsData from '../data/clients.json'
import type { Client } from '../types'

const STORAGE_KEY = 'edge_clients'

// Load clients from localStorage or fall back to initial JSON data
const loadClients = (): Client[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (err) {
    console.error('Failed to load clients from localStorage:', err)
  }
  return initialClientsData as Client[]
}

// Save clients to localStorage
const saveClients = (clients: Client[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients))
  } catch (err) {
    console.error('Failed to save clients to localStorage:', err)
  }
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>(loadClients)

  // Persist to localStorage whenever clients change
  useEffect(() => {
    saveClients(clients)
  }, [clients])

  // Add a new client
  const addClient = useCallback((client: Client) => {
    setClients(prev => [...prev, client])
  }, [])

  // Update an existing client
  const updateClient = useCallback((file: string, updates: Partial<Client>) => {
    setClients(prev => prev.map(c =>
      c.File === file ? { ...c, ...updates } : c
    ))
  }, [])

  // Soft delete (set Active to false)
  const deactivateClient = useCallback((file: string) => {
    setClients(prev => prev.map(c =>
      c.File === file ? { ...c, Active: false } : c
    ))
  }, [])

  // Reactivate a client (set Active to true)
  const reactivateClient = useCallback((file: string) => {
    setClients(prev => prev.map(c =>
      c.File === file ? { ...c, Active: true } : c
    ))
  }, [])

  // Hard delete (remove from array)
  const deleteClient = useCallback((file: string) => {
    setClients(prev => prev.filter(c => c.File !== file))
  }, [])

  // Import clients (replace all)
  const importClients = useCallback((newClients: Client[]) => {
    setClients(newClients)
  }, [])

  return {
    clients,
    addClient,
    updateClient,
    deactivateClient,
    reactivateClient,
    deleteClient,
    importClients,
  }
}
