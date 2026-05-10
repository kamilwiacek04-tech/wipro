import { images } from '@/constants/images'

const DataSummary = () => {
  return (
    <div className="flex items-center justify-center h-full">
        <img
            src={images.dataSummary.image}
            alt={images.dataSummary.alt}
            className="w-[75%] rounded-[10px]"
        />
    </div>
  )
}

export default DataSummary
