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
      🍪 Modifier mes préférences cookies
    </button>
  )
}