import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, History, Scan, FileSignature, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexto/ThemeContext';

export default function Navigation() {
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useTheme();

  const links = [
    { to: '/', icon: Home, label: 'Inicio' },
    { to: '/historial', icon: History, label: 'Historial' },
    { to: '/ocr', icon: Scan, label: 'OCR' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-8 right-8 z-50">
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg rounded-2xl shadow-2xl p-2 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.to);

            return (
              <Link
                key={link.to}
                to={link.to}
                className="relative group"
              >
                <motion.div
                  className={`p-3 rounded-xl transition-all ${
                    active
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="w-5 h-5" />
                </motion.div>

                {/* Tooltip */}
                <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-900 dark:bg-slate-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {link.label}
                </div>
              </Link>
            );
          })}

          {/* Separador */}
          <div className="h-px bg-slate-200 dark:bg-slate-700 my-1"></div>

          {/* Toggle Dark Mode */}
          <button
            onClick={toggleDarkMode}
            className="relative group"
            title={darkMode ? 'Modo claro' : 'Modo oscuro'}
          >
            <motion.div
              className="p-3 rounded-xl transition-all hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.div>

            {/* Tooltip */}
            <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-900 dark:bg-slate-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              {darkMode ? 'Modo claro' : 'Modo oscuro'}
            </div>
          </button>
        </div>
      </div>
    </nav>
  );
}
