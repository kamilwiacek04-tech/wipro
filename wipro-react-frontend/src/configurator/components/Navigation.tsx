import NavigationStep from '@/components/NavigationStep';
import { useLocation } from 'react-router';
import { navigation } from '@/constants/navigation';
import { useEffect } from 'react';
import useAccessToCurrentSite from '@/hooks/useAccessToCurrentSite';

const Navigation = () => {
    const location = useLocation();
    const currentLocation = location.pathname.slice(1);
    const {lastCorectSchema} = useAccessToCurrentSite(currentLocation);

    useEffect(() => {
      if(currentLocation!==lastCorectSchema) {
        //navigate(`/${lastCorectSchema}`)
      }
    }, [currentLocation])

  return (
    <div className="
      flex flex-row bg-[var(--secondary)] rounded-[20px] overflow-hidden justify-between cursor-default
      max-[600px]:flex-col max-[600px]:rounded-[10px]
      min-[800px]:gap-0
      min-[1600px]:gap-0.5
    ">
        {navigation.steps.map((step, index) => (
            <NavigationStep key={index} step={step} currentStep={index+1} current={currentLocation} />
        ))}
    </div>
  )
}

export default Navigation
