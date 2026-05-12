import { Outlet } from 'react-router'

const AuthLayout = () => {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
        backgroundImage: `
          linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%),
          radial-gradient(circle at 20% 80%, rgba(255,180,0,0.08) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255,180,0,0.05) 0%, transparent 50%)
        `,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 39px,
            rgba(255,255,255,0.02) 39px,
            rgba(255,255,255,0.02) 40px
          ), repeating-linear-gradient(
            90deg,
            transparent,
            transparent 39px,
            rgba(255,255,255,0.02) 39px,
            rgba(255,255,255,0.02) 40px
          )`,
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420 }}>
        <Outlet />
      </div>
    </div>
  )
}

export default AuthLayout
