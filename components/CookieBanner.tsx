'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const CONSENT_KEY = 'jfmj_cookie_consent'

type StoredConsent = {
  value: 'accepted' | 'refused' | 'custom'
  necessary: true
  analytics: boolean
  timestamp: string
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [showCustomize, setShowCustomize] = useState(false)
  const [analyticsConsent, setAnalyticsConsent] = useState(false)

  useEffect(() => {
    const existing = localStorage.getItem(CONSENT_KEY)
    if (!existing) {
      setVisible(true)
    }
  }, [])

  const saveConsent = (analytics: boolean, value: StoredConsent['value']) => {
    const details: StoredConsent = {
      value,
      necessary: true,
      analytics,
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem(CONSENT_KEY, JSON.stringify(details))
    setVisible(false)
    setShowCustomize(false)
    window.dispatchEvent(new Event('cookieConsentChanged'))
  }

  const acceptAll = () => saveConsent(true, 'accepted')
  const refuseAll = () => saveConsent(false, 'refused')
  const saveCustom = () => saveConsent(analyticsConsent, 'custom')

  if (!visible) return null

  return (
    <>
      {!showCustomize && (
        <div
          role="dialog"
          aria-label="Bandeau de consentement aux cookies"
          className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-4 border-black"
          style={{ fontFamily: 'Montserrat, sans-serif', boxShadow: '0 -8px 0 0 rgba(0,0,0,1)' }}
        >
          <div className="max-w-6xl mx-auto p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: '#111' }}>
                  🍪 Vos cookies, votre choix
                </h2>
                <p className="text-sm md:text-base leading-relaxed" style={{ color: '#111' }}>
                  Nous utilisons des cookies strictement nécessaires au fonctionnement du site (authentification) et, avec votre accord, des cookies analytiques (Google Analytics) pour comprendre comment notre site est utilisé. Aucun cookie publicitaire n&apos;est utilisé.{' '}
                  <Link href="/cookies" className="underline font-bold hover:opacity-70">
                    En savoir plus
                  </Link>
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 md:flex-shrink-0">
                <button
                  onClick={refuseAll}
                  className="px-5 py-3 bg-white font-bold border-2 border-black hover:bg-black hover:text-white transition-colors text-sm whitespace-nowrap"
                  style={{ color: '#111' }}
                >
                  Tout refuser
                </button>
                <button
                  onClick={() => setShowCustomize(true)}
                  className="px-5 py-3 bg-white font-bold border-2 border-black transition-colors text-sm whitespace-nowrap hover:text-white"
                  style={{ color: '#111' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1B4F72'
                    e.currentTarget.style.borderColor = '#1B4F72'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white'
                    e.currentTarget.style.borderColor = '#111'
                    e.currentTarget.style.color = '#111'
                  }}
                >
                  Personnaliser
                </button>
                <button
                  onClick={acceptAll}
                  className="px-5 py-3 font-bold border-2 border-black transition-all text-sm whitespace-nowrap"
                  style={{
                    backgroundColor: '#F5C400',
                    color: '#111',
                    boxShadow: '4px 4px 0 0 rgba(0,0,0,1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.transform = 'translate(4px, 4px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '4px 4px 0 0 rgba(0,0,0,1)'
                    e.currentTarget.style.transform = 'translate(0, 0)'
                  }}
                >
                  Tout accepter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCustomize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="bg-white border-4 border-black max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{ fontFamily: 'Montserrat, sans-serif', boxShadow: '8px 8px 0 0 rgba(0,0,0,1)' }}
          >
            <div className="p-6 md:p-8 border-b-4 border-black">
              <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: '#111' }}>
                🍪 Préférences cookies
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: '#111' }}>
                Choisissez les cookies que vous souhaitez accepter. Vos préférences pourront être modifiées à tout moment depuis la page{' '}
                <Link href="/cookies" className="underline font-bold">
                  Politique des cookies
                </Link>
                .
              </p>
            </div>

            <div className="p-6 md:p-8 space-y-5">
              <div className="border-2 border-black p-4 bg-gray-50">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="font-bold text-base" style={{ color: '#111' }}>
                    Cookies strictement nécessaires
                  </h3>
                  <span
                    className="text-xs font-bold px-2 py-1 whitespace-nowrap"
                    style={{ backgroundColor: '#111', color: 'white' }}
                  >
                    TOUJOURS ACTIFS
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#111' }}>
                  Indispensables au fonctionnement du site (authentification, session). Ces cookies ne peuvent pas être désactivés.
                </p>
              </div>

              <div className="border-2 border-black p-4">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="font-bold text-base" style={{ color: '#111' }}>
                    Cookies analytiques (Google Analytics)
                  </h3>
                  <button
                    onClick={() => setAnalyticsConsent(!analyticsConsent)}
                    role="switch"
                    aria-checked={analyticsConsent}
                    className="relative w-14 h-7 border-2 border-black transition-colors flex-shrink-0"
                    style={{ backgroundColor: analyticsConsent ? '#F5C400' : 'white' }}
                  >
                    <span
                      className="absolute top-0.5 w-5 h-5 transition-transform"
                      style={{
                        backgroundColor: '#111',
                        transform: analyticsConsent ? 'translateX(28px)' : 'translateX(2px)',
                      }}
                    />
                  </button>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#111' }}>
                  Nous aident à comprendre comment vous utilisez le site (pages visitées, durée, parcours) pour l&apos;améliorer. Données anonymisées via Google Analytics 4.
                </p>
              </div>
            </div>

            <div className="p-6 md:p-8 border-t-4 border-black flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={() => setShowCustomize(false)}
                className="px-5 py-3 bg-white font-bold border-2 border-black hover:bg-black hover:text-white transition-colors text-sm"
                style={{ color: '#111' }}
              >
                Annuler
              </button>
              <button
                onClick={saveCustom}
                className="px-5 py-3 font-bold border-2 border-black transition-all text-sm"
                style={{
                  backgroundColor: '#F5C400',
                  color: '#111',
                  boxShadow: '4px 4px 0 0 rgba(0,0,0,1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.transform = 'translate(4px, 4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '4px 4px 0 0 rgba(0,0,0,1)'
                  e.currentTarget.style.transform = 'translate(0, 0)'
                }}
              >
                Enregistrer mes préférences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}