import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexto/AuthContext';
import { ThemeProvider } from './contexto/ThemeContext';
import { useSessionManager } from './hooks/useSessionManager';
import BackendStatus from './componentes/BackendStatus';
import Inicio from './paginas/Inicio';
import Procesamiento from './paginas/Procesamiento';
import Resultados from './paginas/Resultados';
import Editor from './paginas/Editor';
import Historial from './paginas/Historial';
import OCR from './paginas/OCR';
import Login from './paginas/Login';
import NoEncontrado from './paginas/NoEncontrado';

function AppContent() {
  // Hook para gestión automática de sesión
  useSessionManager();
  
  return (
    <>
      <BackendStatus />
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<Login />} />
        <Route path="/procesamiento" element={<Procesamiento />} />
        <Route path="/resultados" element={<Resultados />} />
        <Route path="/editor" element={<Editor />} />
        <Route path="/historial" element={<Historial />} />
        <Route path="/ocr" element={<OCR />} />
        <Route path="*" element={<NoEncontrado />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
