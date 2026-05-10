interface Props {
    title: string;
    onPress?: (data: any) => void;
    className?: string;
}

const SubmitButton = ({title, onPress, className}: Props) => {
  return (
    <button className={`conf-btn ${className ?? ''}`} type='submit' onClick={onPress}>{title}</button>
  )
}

export default SubmitButton
