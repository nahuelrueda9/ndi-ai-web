"use function";
"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export default function FadeInScroll({ children, delay = 0 }: { children: ReactNode, delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay: delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}