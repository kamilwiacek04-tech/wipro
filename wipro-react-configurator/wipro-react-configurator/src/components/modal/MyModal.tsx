import '@/assets/styles/components/Modal.css'
import { images } from '@/constants/images';
import { useAppDispatch, useAppSelector } from '@/store';
import { resetState } from '@/store/slices/formSlice';
import { closeModal, ModalType } from '@/store/slices/modalSlice';
import { useFormStore } from '@/store/zustand/formStore';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router';

interface Props {
    type: ModalType;
}

const MyModal = ({type}: Props) => {
    const stylePath = 'modalStyles';
    const textPath = type === 'success' ? 'general.modalSuccess' : 'general.modalError';
    const {t} = useTranslation();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { email } = useAppSelector((state) => state.form.data)

    const handleClick = () => {
        if(type === 'success') {
            useFormStore.persist.clearStorage();
            dispatch(resetState());
            dispatch(closeModal());
            navigate('/data');
            return;
        }else if (type === 'error') {
            dispatch(closeModal());
            return;
        }
    }

    return (
        <div className={`${stylePath}Container`}>
            <div className={`${stylePath}Modal`}>
                <div className={`${stylePath}IconContainer`}>
                    <img className={`${stylePath}Icon ${type === 'error' && 'modalStyleIconError'}`} src={images[type === 'success' ? 'checked' : 'cross'].image} alt={images['checked'].alt} />
                </div>
                <p className={`${stylePath}Text ${stylePath}TextHeader`}>{t(`${textPath}.info`)}</p>
                <p className={`${stylePath}Text ${stylePath}TextDetails`}>{t(`${textPath}.infoDetails`, { email: email})}</p>
                <input
                    className={`${stylePath}Button`}
                    type={'button'}
                    value={t(`${textPath}.confirm`)}
                    onClick={handleClick}
                />
                {type === 'success' && (
                    <Link
                        to='/konto/moje-zapytania'
                        className={`${stylePath}LinkButton`}
                        onClick={() => {
                            useFormStore.persist.clearStorage();
                            dispatch(resetState());
                            dispatch(closeModal());
                        }}
                    >
                        {t('general.modalSuccess.viewOffers')}
                    </Link>
                )}
            </div>
        </div>
    )
}

export default MyModal