import { useState, useEffect } from 'react'
import type { Client, Property } from '../types'
import { useEscapeKey } from '../hooks'
import { XIcon } from './icons'

type ClientModalProps = {
  client?: Client | null
  isOpen: boolean
  existingFiles?: string[]
  onClose: () => void
  onSave: (client: Client) => void
}

const EMPTY_PROPERTY: Property = {
  Address: '',
  ServiceType: '',
  Fee: '',
  Invoice: '',
  RenewalDate: '',
  Condo: '',
  CondoContact: '',
  CondoPayment: '',
  Insurance: '',
  Tenant: '',
  TenantContact: '',
  Rent: '',
  LeaseStart: '',
  LeaseEnd: '',
  Observations: '',
}

const EMPTY_CLIENT: Client = {
  File: '',
  Name: '',
  FolderLink: '',
  Email: '',
  AlternativeEmails: [],
  NIF: '',
  Agent: '',
  Bank: '',
  Source: 'Full PM',
  Active: true,
  RenewalMonth: undefined,
  Properties: [{ ...EMPTY_PROPERTY }],
}

export function ClientModal({ client, isOpen, existingFiles = [], onClose, onSave }: ClientModalProps) {
  const [formData, setFormData] = useState<Client>(EMPTY_CLIENT)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [altEmailsInput, setAltEmailsInput] = useState('')

  const isEditing = !!client

  // Reset form when modal opens/closes or client changes
  useEffect(() => {
    if (isOpen) {
      setFormData(client ? { ...client, Properties: client.Properties.map(p => ({ ...p })) } : { ...EMPTY_CLIENT, Properties: [{ ...EMPTY_PROPERTY }] })
      setAltEmailsInput((client?.AlternativeEmails || []).join(', '))
      setErrors({})
    }
  }, [isOpen, client])

  // Handle escape key
  useEscapeKey(isOpen, onClose)

  if (!isOpen) return null

  const handleChange = (field: keyof Client, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handlePropertyChange = (index: number, field: keyof Property, value: string) => {
    setFormData(prev => ({
      ...prev,
      Properties: prev.Properties.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      ),
    }))
  }

  const addProperty = () => {
    setFormData(prev => ({
      ...prev,
      Properties: [...prev.Properties, { ...EMPTY_PROPERTY }],
    }))
  }

  const removeProperty = (index: number) => {
    if (formData.Properties.length <= 1) return
    setFormData(prev => ({
      ...prev,
      Properties: prev.Properties.filter((_, i) => i !== index),
    }))
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.File.trim()) {
      newErrors.File = 'Ficheiro obrigatório'
    } else if (!isEditing && existingFiles.includes(formData.File.trim())) {
      newErrors.File = 'Este ficheiro já existe'
    }
    if (!formData.Name.trim()) {
      newErrors.Name = 'Nome obrigatório'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSave(formData)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl shadow-black/50 m-4">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-neutral-900 border-b border-neutral-800">
          <h2 className="text-lg font-semibold text-white">
            {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            aria-label="Fechar"
          >
            <XIcon />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">Dados Básicos</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* File number */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Ficheiro <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.File}
                  onChange={(e) => handleChange('File', e.target.value)}
                  disabled={isEditing}
                  placeholder="0000-00"
                  className={`w-full px-3 py-2 bg-neutral-800 border rounded-lg text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors ${
                    errors.File ? 'border-red-500' : 'border-neutral-700'
                  } ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {errors.File && <p className="mt-1 text-xs text-red-400">{errors.File}</p>}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Nome <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.Name}
                  onChange={(e) => handleChange('Name', e.target.value)}
                  placeholder="Nome do cliente"
                  className={`w-full px-3 py-2 bg-neutral-800 border rounded-lg text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors ${
                    errors.Name ? 'border-red-500' : 'border-neutral-700'
                  }`}
                />
                {errors.Name && <p className="mt-1 text-xs text-red-400">{errors.Name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">Email</label>
                <input
                  type="email"
                  value={formData.Email}
                  onChange={(e) => handleChange('Email', e.target.value)}
                  placeholder="email@exemplo.com"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
                />
              </div>

              {/* Alternative Emails */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Emails CC <span className="text-neutral-500 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={altEmailsInput}
                  onChange={(e) => setAltEmailsInput(e.target.value)}
                  onBlur={() => {
                    const emails = altEmailsInput
                      .split(',')
                      .map(email => email.trim())
                      .filter(email => email.length > 0)
                    setFormData(prev => ({ ...prev, AlternativeEmails: emails.length > 0 ? emails : [] }))
                  }}
                  placeholder="pai@exemplo.com, mae@exemplo.com"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors text-sm"
                />
                <p className="mt-1 text-xs text-neutral-500">Separar por vírgula</p>
              </div>

              {/* NIF */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">NIF</label>
                <input
                  type="text"
                  value={formData.NIF}
                  onChange={(e) => handleChange('NIF', e.target.value)}
                  placeholder="000000000"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
                />
              </div>

              {/* Source */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">Tipo</label>
                <select
                  value={formData.Source}
                  onChange={(e) => handleChange('Source', e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 focus:outline-none focus:border-neutral-600 transition-colors"
                >
                  <option value="Full PM">Full PM</option>
                  <option value="Condo">Condo</option>
                  <option value="AIDA">AIDA</option>
                </select>
              </div>

              {/* Bank */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">Banco</label>
                <input
                  type="text"
                  value={formData.Bank}
                  onChange={(e) => handleChange('Bank', e.target.value)}
                  placeholder="NB, BCP, etc."
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
                />
              </div>

              {/* Agent */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">Agente</label>
                <input
                  type="text"
                  value={formData.Agent}
                  onChange={(e) => handleChange('Agent', e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
                />
              </div>

              {/* Renewal Month */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">Mês de Renovação</label>
                <select
                  value={formData.RenewalMonth ?? ''}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10)
                    setFormData(prev => ({ ...prev, RenewalMonth: !isNaN(parsed) ? parsed : undefined }))
                  }}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 focus:outline-none focus:border-neutral-600 transition-colors"
                >
                  <option value="">—</option>
                  <option value="1">Janeiro</option>
                  <option value="2">Fevereiro</option>
                  <option value="3">Março</option>
                  <option value="4">Abril</option>
                  <option value="5">Maio</option>
                  <option value="6">Junho</option>
                  <option value="7">Julho</option>
                  <option value="8">Agosto</option>
                  <option value="9">Setembro</option>
                  <option value="10">Outubro</option>
                  <option value="11">Novembro</option>
                  <option value="12">Dezembro</option>
                </select>
              </div>

              {/* Folder link */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">Pasta (UNC)</label>
                <input
                  type="text"
                  value={formData.FolderLink}
                  onChange={(e) => handleChange('FolderLink', e.target.value)}
                  placeholder="\\server\path\to\folder"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* Properties */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">Propriedades</h3>
              <button
                type="button"
                onClick={addProperty}
                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                + Adicionar propriedade
              </button>
            </div>

            {formData.Properties.map((property, index) => (
              <div
                key={index}
                className="p-4 bg-neutral-800/50 border border-neutral-800 rounded-xl space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-300">Propriedade {index + 1}</span>
                  {formData.Properties.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeProperty(index)}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Remover
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Address */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Endereço</label>
                    <input
                      type="text"
                      value={property.Address}
                      onChange={(e) => handlePropertyChange(index, 'Address', e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
                    />
                  </div>

                  {/* Tenant */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Inquilino</label>
                    <input
                      type="text"
                      value={property.Tenant}
                      onChange={(e) => handlePropertyChange(index, 'Tenant', e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
                    />
                  </div>

                  {/* Tenant Contact */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Contato Inquilino</label>
                    <input
                      type="text"
                      value={property.TenantContact}
                      onChange={(e) => handlePropertyChange(index, 'TenantContact', e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
                    />
                  </div>

                  {/* Rent */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Renda</label>
                    <input
                      type="text"
                      value={property.Rent}
                      onChange={(e) => handlePropertyChange(index, 'Rent', e.target.value)}
                      placeholder="1.000,00 €"
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
                    />
                  </div>

                  {/* Condo */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Condomínio</label>
                    <input
                      type="text"
                      value={property.Condo}
                      onChange={(e) => handlePropertyChange(index, 'Condo', e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
                    />
                  </div>

                  {/* Invoice */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Fatura</label>
                    <input
                      type="text"
                      value={property.Invoice}
                      onChange={(e) => handlePropertyChange(index, 'Invoice', e.target.value)}
                      placeholder="FA 2024L-XXX"
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
                    />
                  </div>

                  {/* Observations */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Observações</label>
                    <textarea
                      value={property.Observations}
                      onChange={(e) => handlePropertyChange(index, 'Observations', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isEditing ? 'Guardar' : 'Criar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
