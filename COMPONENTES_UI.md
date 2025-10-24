# 🎨 Componentes UI Profesionales

## ✅ **Componentes Creados**

He creado una biblioteca de componentes UI profesionales y reutilizables:

### **1. Input** 📝
Componente de input con soporte para:
- ✅ Iconos a la izquierda
- ✅ Labels automáticos
- ✅ Mensajes de error
- ✅ Focus states animados
- ✅ Dark mode
- ✅ Validación visual

### **2. Button** 🔘
Botón flexible con:
- ✅ 4 variantes (primary, secondary, outline, ghost)
- ✅ 3 tamaños (sm, md, lg)
- ✅ Estado de carga (loading)
- ✅ Soporte para iconos
- ✅ Animaciones suaves
- ✅ Dark mode

### **3. Card** 🎴
Sistema de tarjetas con:
- ✅ CardHeader
- ✅ CardContent
- ✅ CardFooter
- ✅ Bordes y sombras consistentes
- ✅ Dark mode

---

## 📚 **Cómo Usar**

### **Input**

```jsx
import { Input } from '@/componentes/ui';
import { Mail } from 'lucide-react';

<Input
  label="Correo electrónico"
  type="email"
  name="email"
  icon={Mail}
  value={email}
  onChange={handleChange}
  placeholder="tu@email.com"
  error={emailError}
  required
/>
```

**Props:**
- `label` (string): Etiqueta del input
- `icon` (Component): Ícono de Lucide React
- `error` (string): Mensaje de error a mostrar
- `className` (string): Clases adicionales
- Todos los props estándar de `<input>`

---

### **Button**

```jsx
import { Button } from '@/componentes/ui';
import { LogIn } from 'lucide-react';

<Button
  variant="primary"
  size="lg"
  loading={isLoading}
  icon={LogIn}
  onClick={handleClick}
>
  Iniciar Sesión
</Button>
```

**Variantes:**
- `primary` - Fondo oscuro (predeterminado)
- `secondary` - Fondo claro
- `outline` - Solo borde
- `ghost` - Transparente

**Tamaños:**
- `sm` - Pequeño
- `md` - Mediano (predeterminado)
- `lg` - Grande

**Props:**
- `variant` (string): Estilo del botón
- `size` (string): Tamaño del botón
- `loading` (boolean): Muestra spinner
- `icon` (Component): Ícono de Lucide React
- `className` (string): Clases adicionales
- Todos los props estándar de `<button>`

---

### **Card**

```jsx
import { Card, CardHeader, CardContent, CardFooter } from '@/componentes/ui';

<Card>
  <CardHeader>
    <h2>Título</h2>
  </CardHeader>
  
  <CardContent>
    <p>Contenido de la tarjeta</p>
  </CardContent>
  
  <CardFooter>
    <button>Acción</button>
  </CardFooter>
</Card>
```

---

## 🎨 **Características de Diseño**

### **Inputs:**
- ✅ Borde de 2px para mejor visibilidad
- ✅ Focus ring oscuro y prominente
- ✅ Iconos alineados perfectamente
- ✅ Placeholder con opacidad correcta
- ✅ Transiciones suaves (200ms)
- ✅ Estados disabled claros

### **Buttons:**
- ✅ Sombras que responden al hover
- ✅ Focus ring con offset
- ✅ Spinner de carga animado
- ✅ Transiciones suaves
- ✅ Estados disabled con opacidad

### **Cards:**
- ✅ Bordes sutiles
- ✅ Sombras consistentes
- ✅ Separadores entre secciones
- ✅ Padding consistente (p-6)

---

## 📁 **Estructura de Archivos**

```
src/
└── componentes/
    └── ui/
        ├── Input.jsx       ← Componente Input
        ├── Button.jsx      ← Componente Button
        ├── Card.jsx        ← Componentes Card
        └── index.js        ← Exports centralizados
```

---

## 🚀 **Ejemplo Completo: Formulario de Login**

```jsx
import { useState } from 'react';
import { Input, Button, Card, CardHeader, CardContent, CardFooter } from '@/componentes/ui';
import { Mail, Lock, LogIn } from 'lucide-react';

export default function LoginForm() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // ... lógica de login
    setLoading(false);
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <h1 className="text-2xl font-bold">Iniciar Sesión</h1>
        <p className="text-sm text-slate-500">Ingresa tus credenciales</p>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <Input
            label="Correo electrónico"
            type="email"
            name="email"
            icon={Mail}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
            placeholder="tu@email.com"
            required
          />

          <Input
            label="Contraseña"
            type="password"
            name="password"
            icon={Lock}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={errors.password}
            placeholder="••••••••"
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            icon={LogIn}
            className="w-full"
          >
            Iniciar Sesión
          </Button>
        </CardContent>

        <CardFooter>
          <p className="text-xs text-center text-slate-500">
            ¿Olvidaste tu contraseña?
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
```

---

## 🎯 **Ventajas de Estos Componentes**

### **1. Consistencia**
- Todos los inputs se ven iguales
- Todos los botones se comportan igual
- Estilos unificados en toda la app

### **2. Mantenibilidad**
- Cambios en un solo lugar
- Fácil de actualizar estilos
- Menos código repetido

### **3. Accesibilidad**
- Focus states claros
- Labels asociados correctamente
- Estados disabled visibles
- Feedback visual de errores

### **4. DX (Developer Experience)**
- API simple y clara
- Props intuitivos
- TypeScript-ready (si migras)
- Fácil de extender

---

## 📊 **Comparación: Antes vs Después**

### **Antes (HTML plano):**
```jsx
<div>
  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
    Email
  </label>
  <div className="relative">
    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
    <input
      type="email"
      className="w-full pl-10 pr-3 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-500 focus:border-transparent dark:text-slate-100"
      placeholder="tu@email.com"
    />
  </div>
</div>
```

### **Después (Componente):**
```jsx
<Input
  label="Email"
  type="email"
  icon={Mail}
  placeholder="tu@email.com"
/>
```

**Reducción de código: ~75%** 🎉

---

## 🔄 **Próximos Componentes (Opcional)**

Si quieres extender la biblioteca:

1. **Select** - Dropdown personalizado
2. **Checkbox** - Checkbox con label
3. **Radio** - Radio buttons
4. **Toggle** - Switch on/off
5. **Textarea** - Área de texto
6. **Alert** - Mensajes de alerta
7. **Badge** - Etiquetas pequeñas
8. **Avatar** - Imagen de usuario
9. **Modal** - Ventanas modales
10. **Toast** - Notificaciones

---

## ✅ **Login Actualizado**

El Login ahora usa todos estos componentes:

✅ **Inputs profesionales** con iconos y labels  
✅ **Botón con loading** state automático  
✅ **Card estructurada** con header/content/footer  
✅ **Mensajes de error** con ícono de alerta  
✅ **Código más limpio** y mantenible  

---

**¡Los componentes están listos para usar en toda tu aplicación!** 🎨
