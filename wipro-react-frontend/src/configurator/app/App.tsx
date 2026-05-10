import BasicLayout from '@/components/layouts/BasicLayout'
import BasicLayoutContainer from '@/components/layouts/BasicLayoutContainer'
import Navigation from '@/components/Navigation'
import MainContent from '@/components/MainContent'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router'
import Data from '@/components/multiStepWizard/Data'
import ShaftParameters from '@/components/multiStepWizard/ShaftParameters'
import FinishesAndAccessories from '@/components/multiStepWizard/FinishesAndAccessories'
import { AnimatePresence } from 'framer-motion'

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Navigate to="/data" replace />} />
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
