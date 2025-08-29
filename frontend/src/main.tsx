import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// ใช้ธีมไฟ


createRoot(document.getElementById('root')!).render(
  <>
    {/* พื้นหลังไฟแบบเคลื่อนไหว */}
    
    <App />
  </>
)
