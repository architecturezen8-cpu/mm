'use client';

import ClientLayout from '@/components/ClientLayout';
import { motion } from 'framer-motion';
import PlayingXITab from '@/components/tabs/PlayingXITab';

export default function PlayingXIPage() {
  return (
    <ClientLayout>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <PlayingXITab />
      </motion.div>
    </ClientLayout>
  );
}
