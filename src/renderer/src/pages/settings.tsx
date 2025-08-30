import { createRoot } from 'react-dom/client'

const SettingsApp = () => {
  return (
    <div style={{ padding: 20 }}>
      <h1>Cài đặt trình duyệt</h1>
      <p>Ở đây bạn có thể thêm các tùy chọn của trình duyệt.</p>
    </div>
  )
}

export default SettingsApp

const root = createRoot(document.getElementById('root')!)
root.render(<SettingsApp />)
