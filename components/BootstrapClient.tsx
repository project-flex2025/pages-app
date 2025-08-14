'use client';

import { useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS

export default function BootstrapClient() {
  useEffect(() => {
    import('bootstrap').catch((err) => console.error('Bootstrap failed to load:', err));
  }, []);

  return null;
}
