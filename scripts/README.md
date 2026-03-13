# Scripts de Base de Datos

Este directorio contiene los scripts SQL para configurar y mantener la base de datos del Sistema IoT de Seguridad.

## Orden de Ejecución

### Configuración Inicial (Ejecutar una sola vez)

1. **001_setup_rls_policies.sql** - Configurar políticas de seguridad RLS iniciales.
2. **002_seed_chile_locations.sql** - Insertar ubicaciones macro de Chile
3. (Scripts 003 a 008) - Actualizaciones progresivas y fixes.
4. **009_create_assets_table.sql** - Creación del inventario unificado de hardware (Importante).
5. **011_generator_support.sql** - Expansión del esquema para el monitoreo de generadores, nivel de combustible y autonomía.

### Mantenimiento

- **000_reset_database.sql** / **006_clean_database.sql** - ⚠️ CUIDADO: Limpian gran parte de los eventos o datos transaccionales, regresando el sistema a un formato limpio.

## Cómo Ejecutar Scripts

Estos scripts se ejecutan automáticamente desde v0. Solo haz clic en el botón "Run" que aparece junto a cada script.

## Estructura de la Base de Datos

### Tablas Principales

#### `assets`
Inventario centralizado del hardware. Maneja IDs de ESP32 (`door_id`), tipo de activo (`door` o `generator`), ubicaciones y variables operacionales de petróleo (capacidad estanque, alertas).

#### `door_events`
Registra todos los eventos de telemetría de puertas (abierta, cerrada, forzada) y generadores (`power_up`, `power_down`, `fuel_refill`).

#### `door_status`
Estado actual de las operaciones físicas en tiempo real, enlazadas al hardware de `assets`.

#### `authorized_users`
Usuarios y empleados autorizados con tarjetas RFID

#### `alert_contacts`
Directorio telefónico y correos para despachar alarmas (Robos, Estanque Vacío).

#### `locations`
Ciudades base de la compañía en Chile.
