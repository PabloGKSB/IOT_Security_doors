# Guía de Limpieza de Base de Datos

## Opciones de Limpieza

Existen dos formas de limpiar la base de datos del sistema IoT:

### 1. Desde la Interfaz Web (Recomendado)

1. Navega a `/mantencion` en el dashboard web
2. En la parte superior verás la tarjeta "Limpiar Base de Datos"
3. Haz clic en el botón "Limpiar Todos los Datos"
4. Lee la advertencia cuidadosamente
5. Confirma la acción haciendo clic en "Confirmar Limpieza"
6. La página se recargará automáticamente después de la limpieza

**Datos que se eliminarán:**
- ✅ Todos los eventos registrados (door_events)
- ✅ Todos los contactos de alerta SMS (alert_contacts)
- ✅ Todos los usuarios autorizados (authorized_users)
- ✅ Referencias en el estado de puertas (door_status)

**Datos que se mantienen:**
- ✅ Estructura de las tablas
- ✅ Registros de estado de puertas (pero reseteados a cerrado)

### 2. Ejecutar Script SQL Directamente

Si prefieres usar SQL directamente en Supabase:

1. Ve al editor SQL en tu proyecto de Supabase
2. Ejecuta el script `scripts/006_clean_database.sql`
3. Verifica el mensaje de confirmación

## Después de la Limpieza

### Reconfigurar Contactos de Alerta SMS

1. Ve a `/mantencion`
2. En la sección "Contactos de Alerta SMS", agrega nuevos contactos
3. Usa formato internacional para números chilenos: `+56912345678`
4. Marca los contactos como activos

### Verificar Variables de Twilio

Asegúrate de que estas variables de entorno estén configuradas en Vercel:

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

### Agregar Usuarios Autorizados

1. En la sección "Gestión de Autorizaciones" de `/mantencion`
2. Agrega los usuarios autorizados con sus tarjetas RFID
3. Asigna las ubicaciones correspondientes

## Prueba del Sistema

Después de limpiar y reconfigurar:

1. Crea un evento manual para probar
2. Verifica que se reciban las alertas SMS
3. Revisa los logs en Vercel para confirmar el envío
4. Prueba con tu ESP32 físico

## Solución de Problemas

### No se reciben SMS después de la limpieza

1. Verifica que agregaste contactos con números válidos
2. Confirma las credenciales de Twilio en las variables de entorno
3. Revisa los logs en Vercel para ver errores de Twilio
4. Verifica que los contactos estén marcados como "activos"

### Error al limpiar desde la interfaz

1. Revisa los logs del navegador (F12 → Console)
2. Verifica los logs en Vercel
3. Intenta ejecutar el script SQL directamente en Supabase
4. Confirma que las políticas RLS estén correctamente configuradas

## Advertencias Importantes

⚠️ **La limpieza es PERMANENTE**
- No hay forma de recuperar los datos eliminados
- Asegúrate de exportar cualquier dato importante antes de limpiar

⚠️ **Backup Recomendado**
- Considera hacer un backup de la base de datos antes de limpiar
- En Supabase puedes usar: Database → Backups

⚠️ **Entorno de Producción**
- Ten mucho cuidado al limpiar datos en producción
- Considera tener un ambiente de desarrollo separado para pruebas
