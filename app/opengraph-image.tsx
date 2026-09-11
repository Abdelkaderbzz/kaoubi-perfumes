import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

export const alt = 'KAOUBI PERFUMES — Parfumerie a Douz'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function OpenGraphImage() {
  const logo = await readFile(join(process.cwd(), 'public/logo.png'))
  const logoSrc = `data:image/png;base64,${logo.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '36px 56px',
            border: '1px solid rgba(212, 175, 55, 0.35)',
          }}
        >
          <img src={logoSrc} width={380} height={380} alt="KAOUBI PERFUMES" />
          <div
            style={{
              marginTop: 8,
              fontSize: 20,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: '#d4af37',
            }}
          >
            Douz, Kébili
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
