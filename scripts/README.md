# Scripts de Base de Datos

Este directorio contiene los scripts SQL para configurar y mantener la base de datos del Sistema IoT de Seguridad.

## Orden de Ejecución

### Configuración Inicial (Ejecutar una sola vez)

1. **001_setup_rls_policies.sql** - Configurar políticas de seguridad RLS
2. **002_seed_chile_locations.sql** - Insertar ubicaciones de Chile

### Mantenimiento

- **000_reset_database.sql** - ⚠️ CUIDADO: Limpia TODOS los datos de la base de datos

## Cómo Ejecutar Scripts

Estos scripts se ejecutan automáticamente desde v0. Solo haz clic en el botón "Run" que aparece junto a cada script.

## Estructura de la Base de Datos

### Tablas Principales

#### `door_events`
Registra todos los eventos de puertas (abierta, cerrada, forzada, etc.)

#### `door_status`
Estado actual de cada puerta en tiempo real

#### `authorized_users`
Usuarios autorizados con sus tarjetas RFID

#### `alert_contacts`
Contactos para recibir alertas SMS

#### `locations`
Ubicaciones de las sucursales en Chile
