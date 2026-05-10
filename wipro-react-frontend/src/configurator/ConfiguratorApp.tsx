import { Provider } from 'react-redux'
import { store } from '@/store/index'
import App from '@/app/App'
import '@/i18n/i18n'
import '@/index.css'

export default function ConfiguratorApp() {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  )
}
