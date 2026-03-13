# Sistema IoT de Seguridad - Chile

Sistema completo de monitoreo de puertas y control de acceso para sucursales en Chile, usando ESP32-S3, autenticación RFID, y dashboard web en tiempo real con autenticación de usuarios.

## Características Principales

- **🔐 Autenticación de Usuarios**: Login seguro con email y contraseña vía Supabase Auth
- **Control Centralizado de Activos**: Interfaz de administración para registrar dispositivos (Puertas y Generadores).
- **Monitoreo en Tiempo Real**: Estado de puertas y generadores con seguimiento en vivo.
- **Módulo de Generadores**: Visualización interactiva de niveles de combustible, consumo, estimación de autonomía y control de ignición (`power_up`/`power_down`).
- **Control de Acceso RFID**: Autorización de entrada con tarjetas RFID
- **Detección de Intrusos**: Alertas por entrada forzada o no autorizada
- **Notificaciones Dinámicas (SMS y Email)**: Envío automático de advertencias tempranas (robo, intrusión o combustible bajo).
- **Dashboard Profesional**: Interfaz moderna con actualizaciones en vivo y paneles duales (`/` para puertas, `/generator` para generadores).
- **Gestión de Usuarios**: CRUD completo de usuarios autorizados por ubicación
- **Reportes y Análisis**: Estadísticas detalladas y exportación CSV
- **Multi-Ubicación**: Soporte para múltiples sucursales en Chile

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
- API Routes para comunicación con ESP32 (`/api/door/event`, `/api/generator/status`)
- Supabase PostgreSQL con RLS (Tablas centralizadas como `assets`)
- Integración Twilio para SMS y Resend/Supabase Edge Functions para Emails

### Frontend
- React Server/Client Components
- Actualizaciones en tiempo real e intervalos de sondeo (`setInterval`)
- Elementos SVG dinámicos (Gauges interactivos para combustible)
- Diseño responsivo corporativo (Tailwind CSS v4)

## Inicio Rápido

### 1. Crear Usuario Administrador

Antes de acceder al sistema, debes crear una cuenta:

1. Ve a `/auth/sign-up`
2. Ingresa tu email y contraseña (mínimo 6 caracteres)
3. Confirma tu email (revisa tu bandeja de entrada)
4. Inicia sesión en `/auth/login`

**Nota**: El primer usuario en registrarse será el administrador principal.

### 2. Configurar Base de Datos

Ejecutar los scripts SQL en orden desde v0 (Ver `scripts/README.md`):

```bash
# 1. Limpiar políticas y configurar RLS
scripts/001_setup_rls_policies.sql

# 2. Insertar ubicaciones de Chile
scripts/002_seed_chile_locations.sql

# 3. Importante: Ejecutar progresivamente hasta llegar a crear `assets` y soportar `generators` (p. ej. scripts 009, 011).
```

### 3. Variables de Entorno

Ya configuradas vía integración de Supabase:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Para SMS (configurar en Vars de despliegue):
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

### 4. Desplegar a Vercel

Desde la consola o panel de v0:
1. Hacer clic en "Publish" o conectar el repositorio
2. Conectar a Vercel
3. Las variables de entorno se copian automáticamente

### 5. Configurar ESP32

Dependiendo de si el dispositivo actuará como puerta o generador, el hardware cambia.
1. Abrir `scripts/esp32_firmware.ino` (o `esp32_door_sensor.ino`)
2. Actualizar credenciales WiFi y URL de destino (`/api/door/event`)
3. **Configurar el identificador para la Base de Datos**:
   ```cpp
   const char* BOARD_NAME = "ESP32-SANTIAGO-01"; // Debe coincidir con el door_id en la tabla `assets`
   const char* LOCATION = "SANTIAGO CASA MATRIZ"; 
   ```
4. Flashear firmware al ESP32-S3

### 6. Configuración de Activos en el Dashboard

Antes de que un dispositivo funcione en la plataforma, **debe estar registrado**:
1. Ir a `/admin/assets`.
2. Crear un nuevo Activo.
3. Asignarle el ID del ESP32 (`door_id`), ubicación, y tipo (`door` o `generator`).
4. Si es generador, configurar estanque, consumo, y umbral de alerta.

### 7. Agregar Usuarios Autorizados (Para Puertas)
1. Ir a `/admin/users` en el dashboard
2. Ingresar el UID de la tarjeta RFID e información del empleado.

## Estructura del Proyecto

```
├── app/
│   ├── page.tsx                 # Dashboard principal de Puertas (protegido)
│   ├── generator/
│   │   └── page.tsx            # Dashboard de Generadores (protegido)
│   ├── auth/
│   │   ├── login/page.tsx      # Página de inicio de sesión
│   │   └── ...
│   ├── admin/
│   │   ├── page.tsx            # Panel de administración (Protegido)
│   │   ├── assets/page.tsx     # Gestión de Activos Críticos (Puertas/Generadores)
│   │   ├── users/page.tsx      # Gestión de usuarios RFID
│   │   ├── contacts/page.tsx   # Gestión de contactos de alertas
│   │   └── reports/page.tsx    # Análisis exportable a CSV
│   └── api/
│       ├── door/ 
│       │   ├── event/route.ts         # Ingesta de eventos (ESP32)
│       │   └── status/route.ts        # Polling de estado
│       ├── generator/
│       │   ├── alert/route.ts         # Disparo de simulaciones y alertas de combustible
│       │   ├── refill/route.ts        # Lógica de recarga de estanque
│       │   └── status/route.ts        # Cálculo matemático de consumo y estado
│       ├── assets/route.ts            # CRUD de dispositivos
│       ├── alerts/send/route.ts       # Backend para despachar SMS/Emails
│       └── ...
├── components/
│   ├── dashboard-monitor.tsx    # Monitor puertas
│   ├── ...
```
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
Endpoint unificado para ingestión de eventos del ESP32.
```json
{
  "board_name": "ESP32-SANTIAGO-01",
  "location": "SANTIAGO CASA MATRIZ",
  "event_type": "open|close|forced|authorized|unauthorized|power_up|power_down|fuel_refill",
  "authorized": true|false,
  "details": { "note": "Opcional. Ej. Sensor de puerta activado" }
}
```

### GET /api/generator/status?board_id=XYZ
Devuelve el cálculo en tiempo real (consumo, matemáticas de estanque y autonomía) de un generador específico.

### POST /api/generator/alert
Genera y despacha una alerta de nivel bajo de combustible (o en modo test simulado `alert_type: "test"`).

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

#### Activos Centralizados (`/admin/assets`)
- **Gestión principal del Hardware**. Identifica a cada módulo ESP32.
- Define si un microcontrolador funciona como `door` (Monitoreo de acceso) o `generator` (Monitoreo de energía).
- Configura métricas customizadas para generadores: tamaño de estanque, litros/h, % de Alerta Baja.

#### Usuarios Autorizados (`/admin/users`)
- Agregar y enlazar tarjetas RFID al perfil de los empleados.
- Asignar zonas físicas (locations) autorizadas.
- Activar/desactivar pases temporales.

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
