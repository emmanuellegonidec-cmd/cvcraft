import Link from 'next/link'

type SecureStorageNoticeProps = {
  compact?: boolean // version plus courte sur une seule ligne
  style?: React.CSSProperties // overrides optionnels
}

/**
 * Petit texte rassurant à placer sous les boutons d'upload/création de CV/LM.
 * Indique le stockage sécurisé + durée de conservation + lien vers la politique.
 *
 * Usage :
 *   <SecureStorageNotice />                    // version normale
 *   <SecureStorageNotice compact />            // version compacte 1 ligne
 *   <SecureStorageNotice style={{ color: '#999' }} />  // override style
 */
export default function SecureStorageNotice({ compact = false, style }: SecureStorageNoticeProps) {
  if (compact) {
    return (
      <p style={{
        margin: '8px 0 0 0',
        fontSize: 11,
        color: '#666',
        lineHeight: 1.5,
        fontFamily: 'Montserrat, sans-serif',
        ...style,
      }}>
        🔒 Stockage sécurisé · Conservation 2 ans ·{' '}
        <Link href="/confidentialite" target="_blank" style={{ color: '#555', textDecoration: 'underline' }}>
          En savoir plus
        </Link>
      </p>
    )
  }

  return (
    <p style={{
      margin: '10px 0 0 0',
      fontSize: 12,
      color: '#666',
      lineHeight: 1.5,
      fontFamily: 'Montserrat, sans-serif',
      ...style,
    }}>
      🔒 <strong>Stockage sécurisé</strong> · Vos données sont chiffrées et hébergées en UE. Conservation 2 ans après dernière connexion.{' '}
      <Link href="/confidentialite" target="_blank" style={{ color: '#555', textDecoration: 'underline', fontWeight: 600 }}>
        En savoir plus →
      </Link>
    </p>
  )
}
