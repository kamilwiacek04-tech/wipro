import { useTranslation } from "react-i18next";

interface Props {
    title: string;
    onPress?: (data: any) => void;
    className?: string;
    isLoading?: boolean;
}

const SubmitButton = ({title, onPress, className, isLoading}: Props) => {
  const {t} = useTranslation();

  return (
    <button className={`conf-btn ${className ?? ''}`} type='submit' onClick={onPress} disabled={isLoading}>{
      !!isLoading ? t('general.loading') : title
    }</button>
  )
}

export default SubmitButton
