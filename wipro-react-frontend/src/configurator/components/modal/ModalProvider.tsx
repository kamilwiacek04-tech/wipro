import { RootState, useAppDispatch, useAppSelector } from '@/store'
import { PropsWithChildren } from 'react'
import MyModal from '@/components/modal/MyModal';
import CabinInfoModal from '@/components/CabinInfoModal';
import { closeModal } from '@/store/slices/modalSlice';

const ModalProvider = ({children}: PropsWithChildren) => {
    const modal = useAppSelector((state: RootState) => state.modal);
    const dispatch = useAppDispatch();

    return (
        <div style={{flex: 1}}>
            {children}
            {modal.visible && modal.type !== 'cabinInfo' && (
                <MyModal type={modal.type} />
            )}
            {modal.visible && modal.type === 'cabinInfo' && modal.cabinModel && (
                <CabinInfoModal item={modal.cabinModel} onClose={() => dispatch(closeModal())} />
            )}
        </div>
    )
}

export default ModalProvider