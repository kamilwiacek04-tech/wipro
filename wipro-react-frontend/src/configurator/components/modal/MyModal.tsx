import { images } from '@/constants/images';
import { useAppDispatch, useAppSelector } from '@/store';
import { resetState } from '@/store/slices/formSlice';
import { closeModal, ModalType } from '@/store/slices/modalSlice';
import { useFormStore } from '@/store/zustand/formStore';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

interface Props {
    type: ModalType;
}

const MyModal = ({type}: Props) => {
    const textPath = type === 'success' ? 'general.modalSuccess' : 'general.modalError';
    const {t} = useTranslation();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { email } = useAppSelector((state) => state.form.data)

    const handleClick = () => {
        if(type === 'success') {
            useFormStore.getState().resetStore();
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
        <div className="fixed top-0 left-0 w-screen h-screen bg-black/50 z-[1000] flex justify-center items-center">
            <div className="
                bg-white rounded-[20px] flex flex-col justify-center items-center
                w-[35%] max-[1200px]:w-[55%] max-[600px]:w-[90%] min-[2000px]:w-[28%] min-[2000px]:max-w-[700px]
                p-[25px_10px] shadow-[7px_7px_15px_rgba(255,255,255,0.3)] gap-[15px]
            ">
                <div className="rounded-[20px] mb-[10px]">
                    <img
                        className={`border-[3px] rounded-[50px] w-[35px] ${type === 'error' ? 'border-[#f44336]' : 'border-[#5fbb94]'}`}
                        src={images[type === 'success' ? 'checked' : 'cross'].image}
                        alt={images['checked'].alt}
                    />
                </div>
                <p className="leading-normal m-0 text-center text-[24px] font-medium">{t(`${textPath}.info`)}</p>
                <p className="leading-normal m-0 text-center text-[var(--grey)] font-normal text-[18px]">{t(`${textPath}.infoDetails`, { email: email})}</p>
                <input
                    className="mt-5 w-[80%] border-none bg-[var(--primary)] rounded-[10px] text-[var(--black)] py-[15px] font-semibold text-[17px] cursor-pointer hover:scale-[1.05] transition-transform"
                    type={'button'}
                    value={t(`${textPath}.confirm`)}
                    onClick={handleClick}
                />
            </div>
        </div>
    )
}

export default MyModal
