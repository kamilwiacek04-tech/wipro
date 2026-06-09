import {images} from '@/constants/images'

interface Props {
    image: string;
    checkboxElement?: React.ReactNode;
}

const ImagePreview = ({image, checkboxElement}: Props) => {
    const src = (image.startsWith('http') || image.startsWith('/storage'))
        ? image
        : (images[image as keyof typeof images]?.image ?? null)

    return (
        <div className="flex-[3] flex justify-center items-center flex-col">
            {src ? (
                <img src={src} alt="" />
            ) : (
                <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center text-gray-300 text-sm">—</div>
            )}
            {checkboxElement}
        </div>
    )
}

export default ImagePreview
