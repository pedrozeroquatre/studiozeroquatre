import Image from 'next/image'

// Full-bleed nav matching the public site's Nav (edge-to-edge bar, flush logo,
// h-20 height, full-width bottom border) — kept on the portal's dark palette.
export default function PortalNav({ children }) {
  return (
    <nav style={{ background: '#000', borderBottom: '1px solid #1e1e1e' }}>
      <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 16 }}>
        <Image
          src="/images/logo.jpg"
          alt="Studio Zeroquatre"
          width={600}
          height={120}
          style={{ height: 80, width: 'auto', objectFit: 'contain', filter: 'invert(1)' }}
          priority
        />
        {children}
      </div>
    </nav>
  )
}
