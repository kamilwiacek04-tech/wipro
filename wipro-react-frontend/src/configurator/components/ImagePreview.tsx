import { images } from '@/constants/images';

interface Props {
    image: string;
    checkboxElement?: React.ReactNode;
}

const ImagePreview = ({image, checkboxElement}: Props) => {
  return (
    <div className="flex-[3] flex justify-center items-center flex-col">
        <img
            src={images[image].image}
            alt={images[image].alt}
        />
        {checkboxElement}
    </div>
  )
}

export default ImagePreview
