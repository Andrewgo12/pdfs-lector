// Sistema de notificaciones toast simple
// Puede integrarse con una librería como sonner o react-hot-toast

const DEFAULT_DURATION = 3000;

class ToastManager {
  constructor() {
    this.toasts = [];
    this.listeners = [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener(this.toasts));
  }

  show(message, type = 'info', duration = DEFAULT_DURATION) {
    const id = Date.now();
    const toast = { id, message, type, duration };
    this.toasts.push(toast);
    this.notify();

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  }

  dismiss(id) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.notify();
  }

  success(message, duration) {
    console.log('✅', message);
    return this.show(message, 'success', duration);
  }

  error(message, duration) {
    console.error('❌', message);
    return this.show(message, 'error', duration);
  }

  warning(message, duration) {
    console.warn('⚠️', message);
    return this.show(message, 'warning', duration);
  }

  info(message, duration) {
    console.info('ℹ️', message);
    return this.show(message, 'info', duration);
  }
}

const toast = new ToastManager();

export default toast;
