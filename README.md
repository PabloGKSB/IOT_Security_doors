# Sistema IoT de Seguridad - Chile

Sistema completo de monitoreo de puertas y control de acceso para sucursales en Chile, usando ESP32-S3, autenticación RFID, y dashboard web en tiempo real con autenticación de usuarios.

## Características Principales

- **🔐 Autenticación de Usuarios**: Login seguro con email y contraseña vía Supabase Auth
- **Monitoreo en Tiempo Real**: Estado de puertas con seguimiento de duración en vivo
- **Control de Acceso RFID**: Autorización de entrada con tarjetas RFID
- **Detección de Intrusos**: Alertas por entrada forzada o no autorizada
- **Notificaciones SMS**: Envío de alertas automáticas a contactos registrados vía Twilio
- **Dashboard Profesional**: Interfaz moderna con actualizaciones en vivo
- **Gestión de Usuarios**: CRUD completo de usuarios autorizados por ubicación
- **Reportes y Análisis**: Estadísticas detalladas y exportación CSV
- **Multi-Ubicación**: Soporte para 5 sucursales en Chile

## Ubicaciones Configuradas

El sistema está configurado para las siguientes ubicaciones:
- **SANTIAGO CASA MATRIZ**
- **ANTOFAGASTA**
- **COQUIMBO**
- **CONCEPCION**
- **PUERTO MONTT**

## Arquitectura

### Hardware
- ESP32-S3 microcontroller
- Sensor magnético reed switch
- Módulo RFID-RC522 para autenticación
- (Opcional) Buzzer para alertas locales

### Backend
- Next.js 16 con App Router
- API Routes para comunicación con ESP32
- Supabase PostgreSQL con RLS
- Integración Twilio para SMS

### Frontend
- React Server/Client Components
- Actualizaciones en tiempo real
- Diseño responsivo profesional
- Tema oscuro corporativo

## Inicio Rápido

### 1. Crear Usuario Administrador

Antes de acceder al sistema, debes crear una cuenta:

1. Ve a `/auth/sign-up`
2. Ingresa tu email y contraseña (mínimo 6 caracteres)
3. Confirma tu email (revisa tu bandeja de entrada)
4. Inicia sesión en `/auth/login`

**Nota**: El primer usuario en registrarse será el administrador principal.

### 2. Configurar Base de Datos

Ejecutar los scripts SQL en orden desde v0:

```bash
# 1. Limpiar políticas y configurar RLS
scripts/001_setup_rls_policies.sql

# 2. Insertar ubicaciones de Chile
scripts/002_seed_chile_locations.sql
```

### 3. Variables de Entorno

Ya configuradas vía integración de Supabase:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Para SMS (configurar en Vars):
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

### 4. Desplegar a Vercel

Desde v0:
1. Hacer clic en "Publish"
2. Conectar a Vercel
3. Las variables de entorno se copian automáticamente

### 5. Configurar ESP32

1. Abrir `scripts/esp32_firmware.ino`
2. Actualizar credenciales WiFi:
   ```cpp
   const char* WIFI_SSID = "TU_WIFI";
   const char* WIFI_PASSWORD = "TU_PASSWORD";
   ```
3. Actualizar URL de tu deployment:
   ```cpp
   const char* API_URL = "https://tu-proyecto.vercel.app/api/door/event";
   ```
4. **Configurar ubicación para cada ESP32**:
   ```cpp
   const char* BOARD_NAME = "Puerta Principal";
   const char* LOCATION = "SANTIAGO CASA MATRIZ";  // Cambiar según ubicación
   ```
5. Flashear firmware al ESP32-S3

### 6. Agregar Usuarios Autorizados

1. Ir a `/admin/users` en el dashboard
2. Hacer clic en "Agregar Usuario"
3. Completar datos y seleccionar ubicaciones autorizadas
4. Agregar UID de tarjeta RFID
5. Guardar

## Estructura del Proyecto

```
├── app/
│   ├── page.tsx                 # Dashboard principal (protegido)
│   ├── auth/
│   │   ├── login/page.tsx      # Página de inicio de sesión
│   │   ├── sign-up/page.tsx    # Página de registro
│   │   └── callback/route.ts   # Callback de confirmación email
│   ├── admin/
│   │   ├── page.tsx            # Panel de administración (protegido)
│   │   ├── users/page.tsx      # Gestión de usuarios (protegido)
│   │   ├── contacts/page.tsx   # Gestión de contactos SMS (protegido)
│   │   └── reports/page.tsx    # Reportes y análisis (protegido)
│   └── api/
│       ├── door/
│       │   ├── event/route.ts         # Registrar eventos ESP32
│       │   ├── events/route.ts        # Obtener historial
│       │   └── status/route.ts        # Estado actual
│       ├── authorized-users/route.ts  # CRUD usuarios
│       ├── alert-contacts/route.ts    # CRUD contactos
│       ├── alerts/send/route.ts       # Enviar SMS
│       └── stats/route.ts             # Estadísticas
├── components/
│   ├── dashboard-monitor.tsx    # Monitor en tiempo real
│   ├── events-table.tsx         # Tabla de eventos
│   ├── stats-cards.tsx          # Tarjetas estadísticas
│   ├── manual-event-form.tsx    # Formulario eventos manuales
│   └── user-nav.tsx             # Navegación usuario (logout)
├── lib/
│   └── supabase/
│       ├── client.ts            # Cliente navegador
│       └── server.ts            # Cliente servidor
├── proxy.ts                      # Middleware de autenticación
└── scripts/
    ├── 001_setup_rls_policies.sql       # Configurar RLS
    ├── 002_seed_chile_locations.sql     # Datos iniciales
    └── esp32_firmware.ino               # Firmware ESP32
```

## API Endpoints

### POST /api/door/event
Registrar evento desde ESP32
```json
{
  "board_name": "Puerta Principal",
  "location": "SANTIAGO CASA MATRIZ",
  "event_type": "open|close|forced|authorized|unauthorized",
  "authorized": true|false,
  "details": { "note": "Mensaje opcional" }
}
```

### GET /api/door/status
Obtener estado actual de todas las puertas

### GET /api/door/events?location=SANTIAGO
Obtener eventos (opcional: filtrar por ubicación)

### GET /api/stats?location=SANTIAGO
Obtener estadísticas (opcional: filtrar por ubicación)

### POST /api/alerts/send
Enviar alerta SMS a contactos activos

## Funcionalidades del Dashboard

### Autenticación (`/auth/login` y `/auth/sign-up`)
- Registro con email y contraseña
- Confirmación por correo electrónico
- Inicio de sesión seguro
- Cierre de sesión desde cualquier página
- Redirección automática al login si no está autenticado

### Página Principal (`/`) - 🔐 Requiere Autenticación
- **Estadísticas Generales**: 4 tarjetas con métricas clave
  - Total de eventos
  - Eventos autorizados
  - Alertas de seguridad
  - Duración promedio
- **Monitor en Tiempo Real**: Estado actual de cada puerta
  - Nombre del tablero y ubicación
  - Estado (abierta/cerrada)
  - Duración en tiempo real si está abierta
- **Historial de Eventos**: Tabla completa con filtros por ubicación
- **Crear Evento Manual**: Botón para registrar eventos manualmente
- **Navegación de Usuario**: Dropdown con email y opción de logout

### Panel de Administración (`/admin`) - 🔐 Requiere Autenticación

#### Usuarios Autorizados (`/admin/users`)
- Agregar, editar y eliminar usuarios
- Asignar ubicaciones autorizadas
- Registrar tarjetas RFID
- Activar/desactivar acceso

#### Contactos de Alertas (`/admin/contacts`)
- Gestionar números para SMS
- Formato chileno: +56912345678
- Activar/desactivar contactos
- Botón de prueba SMS
- Banner informativo sobre cuenta Twilio Trial

#### Reportes (`/admin/reports`)
- Filtrar por ubicación
- Ver estadísticas detalladas
- Exportar a CSV
- Análisis de uso por ubicación

## Seguridad en Producción

### Autenticación
- ✅ Supabase Auth con email/password
- ✅ Middleware protege todas las rutas automáticamente
- ✅ Sesiones seguras con cookies HTTP-only
- ✅ Confirmación de email obligatoria
- ✅ Redirección automática al login

### Base de Datos
- ✅ Row Level Security (RLS) habilitado
- ✅ Políticas de acceso configuradas
- ✅ Conexión encriptada con Supabase

### API
- ✅ HTTPS obligatorio en producción
- ✅ Variables de entorno seguras
- ⚠️ Considerar: Autenticación API key para ESP32
- ⚠️ Considerar: Rate limiting

### Hardware
- ⚠️ Instalar en ubicación segura
- ⚠️ Detector de manipulación
- ⚠️ Respaldo de batería

## Solución de Problemas

### No puedo acceder al dashboard
- Asegúrate de haber creado una cuenta en `/auth/sign-up`
- Confirma tu email (revisa spam)
- Intenta iniciar sesión en `/auth/login`
- Verifica que el middleware (proxy.ts) esté funcionando

### Error al crear cuenta
- Verifica que la contraseña tenga al menos 6 caracteres
- Asegúrate que el email sea válido
- Confirma que Supabase Auth esté habilitado en tu proyecto

### Redirige constantemente al login
- Confirma tu email desde el link enviado
- Verifica las variables de entorno de Supabase
- Limpia cookies del navegador y vuelve a intentar

### ESP32 no conecta
- Verificar credenciales WiFi
- Confirmar red 2.4GHz disponible
- Revisar URL de API (debe incluir `/api/door/event`)
- Verificar Serial Monitor para errores

### Eventos no aparecen
- Ejecutar scripts SQL en orden
- Verificar variables de entorno en Vars
- Revisar logs de API en Vercel
- Confirmar que board_name y location se envían

### SMS no se envían (cuenta Twilio Trial)
- ⚠️ Las cuentas Trial solo envían SMS a números verificados
- Verifica números en: https://www.twilio.com/console/phone-numbers/verified
- O actualiza a cuenta de pago para enviar a cualquier número
- El banner en `/admin/contacts` muestra esta información

### Error "Multiple GoTrueClient instances"
- ✅ **RESUELTO**: El nuevo código sigue exactamente los patrones oficiales de Supabase
- Cliente del navegador exporta función `createClient()` que devuelve nueva instancia
- Cliente del servidor usa `createServerClient` con manejo de cookies
- Middleware maneja correctamente la sesión del usuario
- Sin problemas de singleton

## Tecnologías Utilizadas

- **Frontend**: Next.js 16, React 19, Tailwind CSS v4
- **Backend**: Next.js API Routes, Supabase
- **Base de Datos**: PostgreSQL (Supabase)
- **Hardware**: ESP32-S3, MFRC522 RFID
- **SMS**: Twilio API
- **Deployment**: Vercel

## Licencia

MIT License

## Soporte

Para problemas o consultas:
1. Revisar esta documentación
2. Verificar logs en Vercel
3. Revisar Serial Monitor del ESP32
4. Contactar soporte técnico

---

Desarrollado con ❤️ para sucursales en Chile
