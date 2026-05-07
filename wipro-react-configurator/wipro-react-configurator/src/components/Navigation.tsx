import '@/assets/styles/components/Navigation.css'
import NavigationStep from '@/components/NavigationStep';
import { useLocation, useNavigate } from 'react-router';
import { navigation } from '@/constants/navigation';
import { useEffect } from 'react';
import useAccessToCurrentSite from '@/hooks/useAccessToCurrentSite';
import { useTranslation } from 'react-i18next';

const Navigation = () => {
    const location = useLocation();
    const currentLocation = location.pathname.slice(1);
    const {lastCorectSchema} = useAccessToCurrentSite(currentLocation);
    const navigate = useNavigate();
    const {t} = useTranslation();

    useEffect(() => {
      if(currentLocation!==lastCorectSchema) {
        //navigate(`/${lastCorectSchema}`)
      }
    }, [currentLocation])

  return (
    <div className='navigationContainer'>
        {navigation.steps.map((step, index) => (
            <NavigationStep key={index} step={step} currentStep={index+1} current={currentLocation} />
        ))}
    </div>
  )
}

export default Navigation