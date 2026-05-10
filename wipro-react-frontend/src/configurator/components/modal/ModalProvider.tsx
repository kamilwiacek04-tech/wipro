import { RootState, useAppSelector } from '@/store'
import { PropsWithChildren } from 'react'
import MyModal from '@/components/modal/MyModal';

const ModalProvider = ({children}: PropsWithChildren) => {
    const modal = useAppSelector((state: RootState) => state.modal);
    
    return (
        <div style={{flex: 1}}>
            {children}
            {modal.visible && 
                <MyModal
                    type={modal.type}
                />
            }
        </div>
    )
}

export default ModalProvider