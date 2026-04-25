'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

const GA_TRACKING_ID = 'G-LKZHGMP0WG'
const CONSENT_KEY = 'jfmj_cookie_consent'

export default function GoogleAnalytics() {
  const [hasConsent, setHasConsent] = useState(false)

  useEffect(() => {
    const checkConsent = () => {
      const stored = localStorage.getItem(CONSENT_KEY)
      if (!stored) {
        setHasConsent(false)
        return
      }
      try {
        const parsed = JSON.parse(stored)
        setHasConsent(parsed.analytics === true)
      } catch {
        setHasConsent(false)
      }
    }

    checkConsent()
    window.addEventListener('cookieConsentChanged', checkConsent)
    window.addEventListener('storage', checkConsent)

    return () => {
      window.removeEventListener('cookieConsentChanged', checkConsent)
      window.removeEventListener('storage', checkConsent)
    }
  }, [])

  if (!hasConsent) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_TRACKING_ID}', {
            anonymize_ip: true,
            cookie_flags: 'SameSite=None;Secure'
          });
        `}
      </Script>
    </>
  )
}