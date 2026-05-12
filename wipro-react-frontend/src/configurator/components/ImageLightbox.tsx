import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'

interface Props {
    src: string;
    alt: string;
    className?: string;
}

const ImageLightbox = ({ src, alt, className }: Props) => {
    const [open, setOpen] = useState(false)

    return (
        <>
            <img
                src={src}
                alt={alt}
                className={`${className ?? ''} cursor-zoom-in`}
                onClick={(e) => { e.stopPropagation(); setOpen(true); }}
            />

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 cursor-zoom-out"
                        onClick={() => setOpen(false)}
                    >
                        <motion.img
                            src={src}
                            alt={alt}
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.6, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl cursor-default"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

export default ImageLightbox
