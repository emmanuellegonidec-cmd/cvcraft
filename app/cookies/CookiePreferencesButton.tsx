'use client'

const CONSENT_KEY = 'jfmj_cookie_consent'

export default function CookiePreferencesButton() {
  const handleReset = () => {
    localStorage.removeItem(CONSENT_KEY)
    window.dispatchEvent(new Event('cookieConsentChanged'))
    window.location.reload()
  }

  return (
    <button
      onClick={handleReset}
      style={{
        fontFamily: "'Montserrat', sans-serif",
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: '#111',
        color: '#F5C400',
        border: '2.5px solid #111',
        borderRadius: 8,
        padding: '13px 28px',
        fontSize: 14,
        fontWeight: 800,
        cursor: 'pointer',
        textDecoration: 'none',
        boxShadow: '4px 4px 0 #E8151B',
        letterSpacing: '0.02em',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translate(-2px, -2px)'
        e.currentTarget.style.boxShadow = '6px 6px 0 #E8151B'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translate(0, 0)'
        e.currentTarget.style.boxShadow = '4px 4px 0 #E8151B'
      }}
    >
      🍪 Modifier mes préférences cookies
    </button>
  )
}