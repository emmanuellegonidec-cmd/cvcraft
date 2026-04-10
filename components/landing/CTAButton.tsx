'use client'

import Link from 'next/link'

declare global {
  interface Window { gtag: (...args: unknown[]) => void }
}

interface CTAButtonProps {
  label: string
  href: string
  eventName: string
  className?: string
  style?: React.CSSProperties
}

export default function CTAButton({ label, href, eventName, className, style }: CTAButtonProps) {
  const handleClick = () => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, {
        event_category: 'CTA',
        event_label: label,
      })
    }
  }

  return (
    <Link href={href} className={className} style={style} onClick={handleClick}>
      {label}
    </Link>
  )
}