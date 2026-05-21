export function TelstraHealthLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="36" rx="6" fill="#0047CC"/>
      <path d="M8 10h20v4h-8v12h-4V14H8v-4z" fill="white"/>
    </svg>
  )
}

export function TelstraHealthWordmark({ white = false }) {
  const color = white ? '#fff' : '#001A5C'
  const subColor = white ? 'rgba(255,255,255,0.7)' : '#5A6A8A'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <TelstraHealthLogo size={32} />
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color, letterSpacing: '-0.01em', lineHeight: 1.2 }}>Telstra Health</div>
        <div style={{ fontSize: 10, color: subColor, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Prior Authorisation</div>
      </div>
    </div>
  )
}
