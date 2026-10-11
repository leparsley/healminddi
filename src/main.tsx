import { createRoot } from 'react-dom/client';
import Portal from '../app/portal';
import DesignLab from '../app/design-lab/design-lab';
import '../app/globals.css';
import '../app/portal.css';

// Both routes are served by index.html. Nginx must enable the SPA fallback.
const isDesignLab = window.location.pathname.replace(/\/$/, '') === '/design-lab';
createRoot(document.getElementById('root')!).render(isDesignLab ? <DesignLab /> : <Portal />);
