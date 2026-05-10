import { motion } from 'framer-motion'
import { PropsWithChildren } from 'react'

const animationVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

const AnimatedPage = ({ children }: PropsWithChildren) => (
  <motion.div
    variants={animationVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={{ duration: 0.4 }}
    style={{ flex: 6, minWidth: 0, overflow: 'hidden' }}
  >
    {children}
  </motion.div>
)

export default AnimatedPage