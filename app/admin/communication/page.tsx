'use client'

import { useState } from 'react'

export default function AdminCommunicationPage() {
  const [form, setForm] = useState({ subject: '', body: '' })
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setResult(null)
  }

  const handleSubmit = async () => {
    if (!form.subject.trim() || !form.body.trim()) return
    setSending(true)
    setShowConfirm(false)
    setResult(null)
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur lors de l\'envoi')
      setResult({ success: true, message: `✅ Email envoyé à ${data.recipients_count} inscrits.` })
      setForm({ subject: '', body: '' })
    } catch (err: unknown) {
      setResult({ success: false, message: err instanceof Error ? err.message : 'Erreur inconnue' })
    } finally {
      setSending(false)
    }
  }

  const canSend = form.subject.trim().length > 0 && form.body.trim().length > 0

  return (
    <div className="max-w-2xl">
      <h1
        className="text-3xl font-black mb-2"
        style={{ fontFamily: 'Montserrat, sans-serif', color: '#111' }}
      >
        📣 Communication
      </h1>
      <p className="text-gray-500 text-sm font-medium mb-8">
        Envoie un email à tous tes inscrits en un clic.
      </p>

      {result && (
        <div
          className="mb-6 px-4 py-3 rounded font-semibold text-sm"
          style={{
            backgroundColor: result.success ? '#dcfce7' : '#fee2e2',
            color: result.success ? '#16a34a' : '#E8151B',
            border: `1px solid ${result.success ? '#16a34a' : '#E8151B'}`,
          }}
        >
          {result.message}
        </div>
      )}

      <div
        className="bg-white rounded p-6 space-y-5"
        style={{ border: '2px solid #111', boxShadow: '4px 4px 0px #111' }}
      >
        {/* Objet */}
        <div>
          <label
            className="block text-sm font-black mb-1"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Objet de l'email *
          </label>
          <input
            type="text"
            name="subject"
            value={form.subject}
            onChange={handleChange}
            placeholder="Ex : Nouveauté sur Jean Find My Job 🚀"
            className="w-full px-4 py-3 rounded text-sm font-medium outline-none"
            style={{ border: '2px solid #111' }}
          />
        </div>

        {/* Corps */}
        <div>
          <label
            className="block text-sm font-black mb-1"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Corps du message *
          </label>
          <textarea
            name="body"
            value={form.body}
            onChange={handleChange}
            rows={10}
            placeholder="Écris ton message ici...&#10;&#10;Bonjour,&#10;&#10;Nous avons le plaisir de vous annoncer..."
            className="w-full px-4 py-3 rounded text-sm font-medium outline-none resize-y"
            style={{ border: '2px solid #111' }}
          />
          <p className="text-xs text-gray-400 mt-1">
            Le message sera envoyé en texte brut à tous les inscrits à la newsletter.
          </p>
        </div>
      </div>

      {/* Bouton envoyer */}
      <div className="mt-6">
        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            disabled={!canSend || sending}
            className="px-6 py-3 font-black text-sm rounded transition-all"
            style={{
              fontFamily: 'Montserrat, sans-serif',
              backgroundColor: canSend ? '#F5C400' : '#f3f4f6',
              color: canSend ? '#111' : '#aaa',
              border: `2px solid ${canSend ? '#111' : '#ddd'}`,
              boxShadow: canSend ? '3px 3px 0px #111' : 'none',
              cursor: canSend ? 'pointer' : 'not-allowed',
            }}
          >
            📣 Envoyer à tous les inscrits
          </button>
        ) : (
          <div
            className="p-4 rounded flex items-center gap-4"
            style={{ backgroundColor: '#fff9e6', border: '2px solid #F5C400' }}
          >
            <span className="text-sm font-bold text-gray-700">
              ⚠️ Confirmes-tu l'envoi à tous tes inscrits ?
            </span>
            <button
              onClick={handleSubmit}
              disabled={sending}
              className="px-4 py-2 font-black text-sm rounded"
              style={{
                fontFamily: 'Montserrat, sans-serif',
                backgroundColor: '#E8151B',
                color: '#fff',
                border: '2px solid #E8151B',
                opacity: sending ? 0.6 : 1,
              }}
            >
              {sending ? 'Envoi...' : 'Oui, envoyer'}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="px-4 py-2 font-bold text-sm rounded"
              style={{ backgroundColor: '#f3f4f6', color: '#555', border: '2px solid #ddd' }}
            >
              Annuler
            </button>
          </div>
        )}
      </div>

      {/* Historique placeholder */}
      <div
        className="mt-8 p-5 rounded"
        style={{ border: '2px dashed #ddd', backgroundColor: '#fafafa' }}
      >
        <p className="text-sm font-semibold text-gray-400 text-center">
          L'historique des emails envoyés sera affiché ici prochainement.
        </p>
      </div>
    </div>
  )
}
