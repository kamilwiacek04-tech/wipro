import { motion } from 'framer-motion'
import { PropsWithChildren } from 'react'

const animationVariants = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
}

const AnimatedPageSide = ({ children }: PropsWithChildren) => (
  <motion.div
    variants={animationVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={{ duration: 0.4 }}
    style={{ flex: 2, minWidth: 0, overflow: 'hidden' }}
  >
    {children}
  </motion.div>
)

export default AnimatedPageSide