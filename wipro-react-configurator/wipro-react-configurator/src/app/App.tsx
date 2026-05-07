import BasicLayout from '@/components/layouts/BasicLayout'
import '@/assets/styles/appearance.css'
import '@/assets/styles/account.css'
import BasicLayoutContainer from '@/components/layouts/BasicLayoutContainer'
import Navigation from '@/components/Navigation'
import MainContent from '@/components/MainContent'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router'
import Data from '@/components/multiStepWizard/Data'
import ShaftParameters from '@/components/multiStepWizard/ShaftParameters'
import FinishesAndAccessories from '@/components/multiStepWizard/FinishesAndAccessories'
import { AnimatePresence } from 'framer-motion'
import '@/assets/styles/responsiveStyle.css'
import ClientLogin from '@/app/account/Login'
import ClientMyQuotes from '@/app/account/MyQuotes'
import ClientQuoteDetail from '@/app/account/QuoteDetail'
import SetPassword from '@/app/account/SetPassword'

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Navigate to="/data" replace />} />
        <Route path='/konto/logowanie' element={<ClientLogin />} />
        <Route path='/konto/moje-zapytania' element={<ClientMyQuotes />} />
        <Route path='/konto/zapytanie/:id' element={<ClientQuoteDetail />} />
        <Route path='/konto/ustaw-haslo' element={<SetPassword />} />
        <Route element={
          <BasicLayout>
            <BasicLayoutContainer>
              <Navigation />
              <MainContent>
                <AnimatePresence mode='wait'>
                  <Routes>
                    <Route path='data' element={<Data />} />
                    <Route path='shaftParameters' element={<ShaftParameters />} />
                    <Route path='finishesAndAccessories' element={<FinishesAndAccessories />} />
                  </Routes>
                </AnimatePresence>
              </MainContent>
            </BasicLayoutContainer>
          </BasicLayout>
        }>
          <Route path='data' element={null} />
          <Route path='shaftParameters' element={null} />
          <Route path='finishesAndAccessories' element={null} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
