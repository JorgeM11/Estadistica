# 🌿 Parchita Tracker - PWA de Control Agrícola

Progressive Web App (PWA) móvil responsiva diseñada para el registro, seguimiento y análisis de hitos agrícolas en una siembra de parchita (maracuyá). 

Este proyecto está construido con **Next.js (App Router)**, **Tailwind CSS v4**, **Recharts** para análisis visual, y **Supabase** como backend de base de datos con un sistema inteligente de fallback a almacenamiento local.

---

## 🚀 Comenzar (Getting Started)

### Requisitos Previos
* Node.js v18.0 o superior.
* Una cuenta de Supabase (opcional para modo local).

### Instalación y Ejecución en Desarrollo

1. Instala todas las dependencias del proyecto:
   ```bash
   npm install
   ```

2. Ejecuta el servidor en entorno de desarrollo:
   ```bash
   npm run dev
   ```

3. Abre [http://localhost:3000](http://localhost:3000) en tu navegador. La aplicación cargará automáticamente en **Modo Demostración** con almacenamiento local y datos históricos semilla simulados.

---

## 🗄️ Configuración de la Base de Datos (Supabase)

Para conectar tu base de datos en la nube y salir del modo demo:

1. Crea un archivo `.env.local` en la raíz del proyecto basándote en [.env.example](.env.example):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
   ```

2. Ejecuta la siguiente consulta SQL en la sección de **SQL Editor** de tu panel de Supabase para estructurar la tabla `registros_cosecha`:
   ```sql
   create table registros_cosecha (
     id uuid default gen_random_uuid() primary key,
     tipo_registro text not null check (tipo_registro in ('flores_polinizadas', 'kg_cosechados', 'pulpa_cosechada')),
     cantidad numeric not null check (cantidad > 0),
     fecha date not null default current_date,
     creado_en timestamp with time zone default timezone('utc'::text, now()) not null
   );

   -- Habilitar seguridad de nivel de fila (Row Level Security - RLS)
   alter table registros_cosecha enable row level security;
   create policy "Acceso público total" on registros_cosecha for all using (true) with check (true);
   ```

3. Reinicia tu servidor local (`npm run dev`). El sistema se conectará a Supabase y se mostrará un indicador LED verde parpadeante en la cabecera del tracker.

---

## 🏁 Historial de Hitos de Desarrollo (Registro de Avances)

A continuación se detallan todos los hitos y características que hemos implementado en la aplicación:

| Hito | Descripción | Estado | Componentes / Archivos Relacionados |
| :--- | :--- | :---: | :--- |
| **1. Cliente CRUD Híbrido** | Integración del cliente de `@supabase/supabase-js`. Implementación del CRUD unificado para la tabla `registros_cosecha` con un sistema transparente de fallback automático a `localStorage` poblado con datos históricos semilla para demostración inmediata. | 🟢 Completado | [lib/supabase.js](lib/supabase.js) |
| **2. Barra de Navegación Móvil** | Creación de pestañas (Tabs) interactivas estilo App nativa móvil para alternar entre el Dashboard de análisis y la sección de base de datos. | 🟢 Completado | [components/Tabs.js](components/Tabs.js) |
| **3. Dashboard e Indicadores** | Visualización interactiva con Recharts (cambio dinámico entre gráficos de Área y Barras). Controles de filtrado por categoría y escala de tiempo. Renombrado global de la categoría a 'Flores'. | 🟢 Completado | [components/Charts.js](components/Charts.js) |
| **4. Totales de Cosecha Globales** | Suma acumulada total e histórica de cantidad por categoría (Flores, Kg, Pulpa) registrada en la base de datos sin importar los filtros activos, ubicados en el tope superior del dashboard. | 🟢 Completado | [components/Charts.js](components/Charts.js) |
| **5. Lista de Hitos (CRUD)** | Listado detallado con iconos y colores temáticos. Controles táctiles grandes para Editar/Eliminar registros. **Incluye un panel de filtros (por categoría y fecha) y opciones de ordenamiento (más reciente, más antiguo, día con más unidades o menos unidades).** | 🟢 Completado | [components/RecordList.js](components/RecordList.js) |
| **6. FAB & Modal de Formulario** | Botón flotante móvil (FAB) para agilizar nuevos registros. Modal deslizante móvil para operaciones de guardar/editar. Validación de cantidad (>0), fecha y tipo de hito obligatorios. | 🟢 Completado | [components/RecordList.js](components/RecordList.js) |
| **7. Orquestador Responsivo** | Estructuración de `app/page.js` libre de marcos rígidos móviles para laptops. Mantiene estados entre pestañas y elimina etiquetas, advertencias y banners de tipo 'Demo' para una UI limpia. | 🟢 Completado | [app/page.js](app/page.js) |
| **8. Manifiesto & Iconografía** | Configuración del archivo de manifiesto PWA (`manifest.js`) con colores de tema y metadatos maskable. Creación de iconos de aplicación (`192x192` y `512x512`) con un logotipo agrícola de maracuyá premium generado. | 🟢 Completado | [app/manifest.js](app/manifest.js), [public/icon-192x192.png](public/icon-192x192.png), [public/icon-512x512.png](public/icon-512x512.png) |
| **9. Compilación Webpack / PWA** | Integración de `@ducanh2912/next-pwa`. Solución definitiva a los conflictos de Turbopack agregando `turbopack: {}` en `next.config.mjs` y forzando Webpack en los scripts `dev` y `build` de `package.json`. | 🟢 Completado | [next.config.mjs](next.config.mjs), [package.json](package.json) |
| **10. Plantilla de Entorno** | Creación del archivo `.env.example` con la estructura de variables requerida para la base de datos de producción. | 🟢 Completado | [.env.example](.env.example) |
| **11. Resumen por Día Actual** | Apartado especial de resumen temporal (diario, semanal o mensual) calculado de forma dinámica con respecto al día de hoy. | 🟢 Completado | [components/Charts.js](components/Charts.js) |
| **12. Granularidad & Scroll Horizontal** | Separación entre la escala de agrupación (Día, Semana, Mes, Año) y los filtros de fecha. Implementación de scroll horizontal responsive para navegar cronológicamente por las series temporales. | 🟢 Completado | [components/Charts.js](components/Charts.js) |
| **13. Agregación Automática por Fecha** | Lógica de negocio que unifica e incrementa las cantidades registradas si se ingresa un hito con la misma fecha y tipo que uno existente, evitando duplicidades. | 🟢 Completado | [lib/supabase.js](lib/supabase.js) |
| **14. Trazabilidad de Ciclo (60 Días)** | Modal interactivo que se abre al hacer clic en un registro y correlaciona la polinización (Día 0) con su posterior cosecha y pulpa (Día 60), mostrando un gráfico de barras comparativo y directo. | 🟢 Completado | [components/RecordList.js](components/RecordList.js) |
| **15. Selectores Personalizados (CustomSelect)** | Reemplazo de los elementos `select` genéricos del navegador por un componente de menú desplegable premium con animaciones fluidas, soporte de iconos y click-outside. | 🟢 Completado | [components/CustomSelect.js](components/CustomSelect.js) |
| **16. Conexión Supabase & Limpieza Header** | Configuración de credenciales de Supabase en `.env.local` decodificadas de los tokens provistos por el usuario. Remoción del badge de almacenamiento local en el header. | 🟢 Completado | [.env.local](.env.local), [app/page.js](app/page.js) |
| **17. Optimización SEO & Hidratación** | Implementación de metadatos SEO en el layout, traducción a idioma español (`lang="es"`), y guards de montaje (`isMounted`) para evitar errores de hidratación. | 🟢 Completado | [app/layout.js](app/layout.js), [components/Charts.js](components/Charts.js), [components/RecordList.js](components/RecordList.js) |
| **18. Leyenda de Gráficos Responsiva (Sticky)** | Extracción de la leyenda del contenedor de scroll horizontal del gráfico SVG, renderizándola como HTML estático debajo del gráfico para evitar cortes o desplazamientos extraños. | 🟢 Completado | [components/Charts.js](components/Charts.js) |

---

## 📱 Características PWA e Instalación en Dispositivo

* **Caching Offline:** Los archivos estáticos y las peticiones a la API del cliente se guardan en el Service Worker generado en producción, lo que permite que la aplicación cargue incluso sin conexión a internet.
* **Instalación:** En dispositivos móviles, puedes presionar "Añadir a pantalla de inicio" (Chrome/Safari) y la aplicación se abrirá como una App nativa e independiente, eliminando las barras del navegador y utilizando la paleta verde esmeralda y oro parchita definida en el manifiesto.
