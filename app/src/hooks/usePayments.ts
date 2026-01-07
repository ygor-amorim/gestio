import { useState, useEffect, useCallback } from 'react'
import type { Payment } from '../types'

const STORAGE_KEY = 'edge_payments'

function loadPayments(): Payment[] {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) return []
  return JSON.parse(saved)
}

function savePayments(payments: Payment[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payments))
}

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>(loadPayments)

  useEffect(() => {
    savePayments(payments)
  }, [payments])

  const addPayment = useCallback((payment: Omit<Payment, 'id' | 'createdAt'>) => {
    const newPayment: Payment = {
      ...payment,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    setPayments(prev => [newPayment, ...prev])
    return newPayment
  }, [])

  const deletePayment = useCallback((id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id))
  }, [])

  const togglePaymentField = useCallback((id: string, field: keyof Pick<Payment, 'fatura' | 'comprovativo' | 'recibo' | 'enviado' | 'dossie'>) => {
    setPayments(prev => prev.map(p =>
      p.id === id ? { ...p, [field]: !p[field] } : p
    ))
  }, [])

  const importPayments = useCallback((newPayments: Payment[]) => {
    setPayments(newPayments)
  }, [])

  return {
    payments,
    addPayment,
    deletePayment,
    togglePaymentField,
    importPayments,
  }
}
