// Componente BookCover — capa de livro com visual premium Lumethos
// Usa imagem base (placehold.co) + overlay de livro físico com detalhes dourados

const GOLD = '#C79A2E'
const DARK = '#0C1B33'
const LIGHT_GOLD = '#D9C48A'

export default function BookCover({ src, title, className = '' }) {
  // Extract text from placehold.co URL to create gold spine
  const textMatch = src?.match(/text=(.+)/)
  const displayText = textMatch ? decodeURIComponent(textMatch[1].replace(/\+/g, ' ')) : title || ''

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Imagem base */}
      <img
        src={src}
        alt={title || ''}
        className="w-full h-full object-cover"
        loading="lazy"
      />

      {/* Overlay gradiente — efeito de iluminação cinematográfica */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(to bottom, rgba(12,27,51,0.2) 0%, transparent 30%, transparent 70%, rgba(12,27,51,0.4) 100%),
            linear-gradient(to right, rgba(12,27,51,0.15) 0%, transparent 20%, transparent 80%, rgba(12,27,51,0.15) 100%)
          `
        }}
      />

      {/* Brilho sutil no canto superior esquerdo — iluminação */}
      <div
        className="absolute -top-1/3 -left-1/3 w-2/3 h-2/3 pointer-events-none opacity-30"
        style={{
          background: `radial-gradient(ellipse, rgba(199,154,46,0.15) 0%, transparent 70%)`,
        }}
      />

      {/* Detalhe dourado — filete superior tipo livro de couro */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none"
        style={{
          background: `linear-gradient(to right, transparent, ${GOLD}44, ${GOLD}88, ${GOLD}44, transparent)`
        }}
      />

      {/* Detalhe dourado — filete inferior */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] pointer-events-none"
        style={{
          background: `linear-gradient(to right, transparent, ${GOLD}33, ${GOLD}66, ${GOLD}33, transparent)`
        }}
      />

      {/* Filete vertical esquerdo — lombada */}
      <div
        className="absolute top-1 left-[3px] bottom-1 w-[1px] pointer-events-none"
        style={{
          background: `linear-gradient(to bottom, transparent, ${GOLD}44, ${GOLD}66, ${GOLD}44, transparent)`
        }}
      />

      {/* Filete vertical direito */}
      <div
        className="absolute top-1 right-[3px] bottom-1 w-[1px] pointer-events-none"
        style={{
          background: `linear-gradient(to bottom, transparent, ${GOLD}44, ${GOLD}66, ${GOLD}44, transparent)`
        }}
      />

      {/* Cantos decorativos — efeito de capa almofadada */}
      <div
        className="absolute top-[3px] left-[3px] w-4 h-4 pointer-events-none"
        style={{
          borderTop: `1.5px solid ${GOLD}55`,
          borderLeft: `1.5px solid ${GOLD}55`,
          borderRadius: '1px'
        }}
      />
      <div
        className="absolute top-[3px] right-[3px] w-4 h-4 pointer-events-none"
        style={{
          borderTop: `1.5px solid ${GOLD}55`,
          borderRight: `1.5px solid ${GOLD}55`,
          borderRadius: '1px'
        }}
      />
      <div
        className="absolute bottom-[3px] left-[3px] w-4 h-4 pointer-events-none"
        style={{
          borderBottom: `1.5px solid ${GOLD}55`,
          borderLeft: `1.5px solid ${GOLD}55`,
          borderRadius: '1px'
        }}
      />
      <div
        className="absolute bottom-[3px] right-[3px] w-4 h-4 pointer-events-none"
        style={{
          borderBottom: `1.5px solid ${GOLD}55`,
          borderRight: `1.5px solid ${GOLD}55`,
          borderRadius: '1px'
        }}
      />

      {/* Brilho tipo "hotspot" no hover via CSS — usa o group parent */}
    </div>
  )
}
