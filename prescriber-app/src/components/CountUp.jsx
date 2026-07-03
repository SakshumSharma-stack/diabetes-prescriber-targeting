import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'

export default function CountUp({ value, format = (n) => Math.round(n).toLocaleString('en-US'), duration = 1.1 }) {
  const motionValue = useMotionValue(0)
  const rounded = useTransform(motionValue, (v) => format(v))
  const prevValue = useRef(0)

  useEffect(() => {
    const controls = animate(motionValue, value, { duration, ease: 'easeOut' })
    prevValue.current = value
    return controls.stop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <motion.span>{rounded}</motion.span>
}
