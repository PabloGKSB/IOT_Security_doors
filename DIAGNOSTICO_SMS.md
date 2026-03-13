# Guía de Diagnóstico SMS - Sistema IoT Seguridad

## 📋 Checklist de Configuración

### 1. Variables de Entorno Twilio
Verificar que estén configuradas en Vercel:
- `TWILIO_ACCOUNT_SID` - Tu Account SID de Twilio
- `TWILIO_AUTH_TOKEN` - Tu Auth Token de Twilio  
- `TWILIO_PHONE_NUMBER` - Número de teléfono Twilio (formato: +56912345678)

**Cómo obtenerlas:**
1. Ir a https://console.twilio.com
2. En el Dashboard, encontrarás Account SID y Auth Token
3. Ir a Phone Numbers → Manage → Active numbers para obtener tu número

### 2. Contactos de Alerta Configurados
1. Ir a `/mantencion` en tu aplicación
2. En la sección "Contactos de Alerta SMS", agregar al menos un contacto
3. Asegurarse de que el teléfono esté en formato internacional: +56912345678
4. Verificar que el contacto esté marcado como "Activo"

### 3. Logs de Depuración
Los logs mostrarán información detallada:

```
[v0] === INICIO API ALERTAS SMS ===
[v0] Contactos activos encontrados: 2
[v0] Verificando credenciales Twilio:
[v0] - TWILIO_ACCOUNT_SID: ✓ Configurado
[v0] - TWILIO_AUTH_TOKEN: ✓ Configurado
[v0] - TWILIO_PHONE_NUMBER: +56912345678
[v0] Cliente Twilio creado correctamente
[v0] Enviando SMS a Juan Pérez (+56912345678)...
[v0] ✓ SMS enviado exitosamente - SID: SM1234567890
```

### 4. Eventos que Activan Notificaciones

**Eventos de Puertas (ESP32 o Manuales):**
- `forced` - Puerta forzada
- `unauthorized` - Acceso no autorizado (tarjeta desconocida)
- Cualquier evento donde el Payload marque `authorized: false`

**Eventos de Generadores (Web/Sensores):**
- `fuel_low` - Alerta periódica de estanque de combustible bajo (Enviada desde la interfaz o Cron vía `/api/generator/alert`)
- `test_fuel_alert` - Alerta de prueba manipulando simuladores visuales en el dashboard del generador.

### 5. Flujo de Envío SMS

```
Evento → API (/api/door/event o /api/door/manual-event)
          ↓
    ¿Requiere alerta?
          ↓ Sí
    API Alertas (/api/alerts/send)
          ↓
    Obtener contactos activos
          ↓
    Enviar SMS vía Twilio
          ↓
    Logs en consola
```

## 🔍 Problemas Comunes

### SMS no se envían - Checklist

1. **Verificar Variables de Entorno**
   ```bash
   # En Vercel, ir a Settings → Environment Variables
   # Verificar que las 3 variables de Twilio estén configuradas
   ```

2. **Verificar Contactos en Base de Datos**
   - Ir a `/mantencion`
   - Debe haber al menos un contacto activo
   - Formato de teléfono correcto (+código país)

3. **Verificar Logs en Vercel**
   ```bash
   # En Vercel, ir a tu deployment → Logs
   # Buscar mensajes que empiecen con [v0]
   ```

4. **Revisar Cuenta Twilio**
   - Verificar que la cuenta tenga saldo (si es cuenta de prueba)
   - Verificar que el número esté verificado
   - En cuentas Trial, solo puedes enviar a números verificados

5. **Verificar Políticas RLS**
   - Ejecutar todos los scripts SQL en orden:
     - `001_create_tables.sql`
     - `002_add_location_and_board_info.sql`
     - `003_setup_chile_locations.sql`
     - `004_add_authorization_management.sql`
     - `005_fix_rls_policies.sql`

## 🧪 Prueba Manual de SMS

1. Ir a `/mantencion`
2. Crear un evento manual con tipo "Forzada"
3. Revisar la consola del navegador (F12) para errores
4. Revisar logs en Vercel para ver el flujo completo

## 📱 Formato de Número de Teléfono

**Chile:** +56912345678
- +56 = código de país
- 9 = código de móvil
- 12345678 = número

**Otros países:**
- +1 para USA/Canadá
- +54 para Argentina
- +57 para Colombia

## 🆘 Contacto de Emergencia

Si después de seguir todos los pasos no funciona:
1. Verificar logs completos con [v0] en Vercel
2. Revisar la configuración de Twilio en console.twilio.com
3. Verificar que la base de datos tenga las tablas correctas
