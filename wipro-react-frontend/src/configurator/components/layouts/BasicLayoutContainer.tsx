import { images } from '@/constants/images'
import { PropsWithChildren } from 'react'
import Footer from '@/components/Footer'

const BasicLayoutContainer = ({children}: PropsWithChildren) => {
  return (
    <div className="
      shadow-[0_4px_24px_rgba(0,0,0,0.06)] bg-white py-9 px-8 rounded-[14px]
      flex flex-col justify-center items-center w-[80%] max-w-[1100px] min-w-0 overflow-hidden gap-[18px]
      min-[1600px]:w-[75%] min-[1600px]:max-w-[1300px] min-[1600px]:py-11 min-[1600px]:px-10
      min-[2000px]:w-[70%] min-[2000px]:max-w-[1600px] min-[2000px]:py-[52px] min-[2000px]:px-12
      max-[768px]:w-[96%] max-[768px]:py-6 max-[768px]:px-[18px] max-[768px]:rounded-[10px]
      max-[480px]:w-full max-[480px]:rounded-none max-[480px]:py-5 max-[480px]:px-[14px] max-[480px]:shadow-none max-[480px]:border-t max-[480px]:border-[#f0f0f0]
    ">
      <img
        src={images.logo.image}
        alt={images.logo.alt}
        className="max-[500px]:w-[94%]"
      />
      <div className="w-full h-full flex flex-col gap-[15px] max-w-[1600px] px-5 min-[2000px]:max-w-[2000px]">
        {children}
      </div>
      <Footer />
    </div>
  )
}

export default BasicLayoutContainer
