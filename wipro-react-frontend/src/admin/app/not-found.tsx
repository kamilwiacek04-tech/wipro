import { useNavigate } from 'react-router'
import { Button } from '@admin/components/Button'

const NotFound = () => {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <p className="text-gray-600 mb-6">Strona nie została znaleziona</p>
        <Button onClick={() => navigate('/dashboard')}>Wróć do dashboardu</Button>
      </div>
    </div>
  )
}

export default NotFound
