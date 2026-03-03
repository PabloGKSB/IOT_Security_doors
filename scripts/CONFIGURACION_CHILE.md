# Configuración de Dispositivos ESP32 para Sucursales en Chile

## Ubicaciones Configuradas

El sistema está configurado para monitorear las siguientes sucursales en Chile:

1. **SANTIAGO CASA MATRIZ** - Región Metropolitana
2. **ANTOFAGASTA** - Región de Antofagasta
3. **COQUIMBO** - Región de Coquimbo
4. **CONCEPCIÓN** - Región del Biobío
5. **PUERTO MONTT** - Región de Los Lagos

## Configuración por Sucursal

### 1. SANTIAGO CASA MATRIZ (Casa Matriz)

```cpp
const char* boardName = "ESP32-SANTIAGO-01";
const char* location = "SANTIAGO CASA MATRIZ";
```

**Zona horaria:** America/Santiago (UTC-3/UTC-4)

---

### 2. ANTOFAGASTA (Norte)

```cpp
const char* boardName = "ESP32-ANTOFAGASTA-01";
const char* location = "ANTOFAGASTA";
```

**Zona horaria:** America/Santiago (UTC-3/UTC-4)

---

### 3. COQUIMBO (Norte Chico)

```cpp
const char* boardName = "ESP32-COQUIMBO-01";
const char* location = "COQUIMBO";
```

**Zona horaria:** America/Santiago (UTC-3/UTC-4)

---

### 4. CONCEPCIÓN (Sur)

```cpp
const char* boardName = "ESP32-CONCEPCION-01";
const char* location = "CONCEPCIÓN";
```

**Zona horaria:** America/Santiago (UTC-3/UTC-4)

---

### 5. PUERTO MONTT (Sur Austral)

```cpp
const char* boardName = "ESP32-PUERTOMONTT-01";
const char* location = "PUERTO MONTT";
```

**Zona horaria:** America/Santiago (UTC-3/UTC-4)

---

## Pasos de Configuración para Cada Tablero

### 1. Preparar el Hardware

- ESP32-S3 Dev Board
- Sensor magnético Reed Switch
- Módulo RFID-RC522
- Buzzer (opcional)
- Cable USB para programación
- Fuente de alimentación 5V

### 2. Configurar el Firmware

1. Abrir `esp32_door_sensor.ino` en Arduino IDE
2. Modificar las credenciales WiFi:
   ```cpp
   const char* ssid = "WIFI_SUCURSAL";
   const char* password = "PASSWORD_WIFI";
   ```

3. Actualizar la URL del servidor:
   ```cpp
   const char* serverUrl = "https://tu-app.vercel.app/api/door/event";
   ```

4. **IMPORTANTE:** Configurar el nombre del tablero y ubicación según la sucursal:
   - Usar los valores exactos mostrados arriba para cada ubicación
   - El nombre de ubicación debe coincidir exactamente con la base de datos

5. Configurar las tarjetas RFID autorizadas:
   ```cpp
   byte authorizedUIDs[][4] = {
     {0xDE, 0xAD, 0xBE, 0xEF},  // Tarjeta 1
     {0xCA, 0xFE, 0xBA, 0xBE}   // Tarjeta 2
   };
   ```

### 3. Cargar el Firmware

1. Conectar el ESP32 al computador vía USB
2. Seleccionar placa: **ESP32-S3 Dev Module**
3. Seleccionar puerto COM correcto
4. Hacer clic en "Upload"
5. Esperar confirmación "Done uploading"

### 4. Verificar Conexión

1. Abrir Serial Monitor (115200 baud)
2. Verificar:
   - ✅ WiFi conectado
   - ✅ IP asignada
   - ✅ RFID inicializado
   - ✅ Estado inicial de puerta

### 5. Instalar en la Puerta

1. Montar el sensor Reed Switch en el marco de la puerta
2. Montar el imán en la puerta (alineado con el sensor)
3. Instalar el lector RFID cerca de la entrada
4. Conectar alimentación permanente
5. Etiquetar el tablero con nombre y ubicación

## Tarjetas RFID por Sucursal

### Obtener UID de Tarjetas RFID

Para agregar nuevas tarjetas autorizadas:

1. Ejecutar el sketch de ejemplo RFID → DumpInfo
2. Acercar la tarjeta al lector
3. Copiar el UID mostrado (4 bytes en hexadecimal)
4. Agregar al array `authorizedUIDs` en el formato correcto

**Ejemplo:**
```
UID de tarjeta: DE AD BE EF
Agregar como: {0xDE, 0xAD, 0xBE, 0xEF}
```

### Recomendación de Organización

Mantener un registro de tarjetas por sucursal:

```
SANTIAGO CASA MATRIZ:
- Gerente General: {0x12, 0x34, 0x56, 0x78}
- Supervisor: {0xAB, 0xCD, 0xEF, 0x01}

ANTOFAGASTA:
- Gerente Regional: {0x23, 0x45, 0x67, 0x89}
- Supervisor: {0xBC, 0xDE, 0xF0, 0x12}
```

## Dashboard Web

Una vez configurados los tableros, el dashboard web mostrará:

- **Eventos en tiempo real** de todas las sucursales
- **Filtro por ubicación** para ver eventos específicos de cada sucursal
- **Estadísticas** de eventos totales, autorizados y alertas
- **Duración** de eventos (cuánto tiempo estuvo abierta la puerta)
- **Nombre del tablero** que generó el evento

### Acceder al Dashboard

1. Ir a tu app desplegada en Vercel
2. El dashboard se actualiza automáticamente cada 3 segundos
3. Usar el filtro de ubicación para ver sucursales específicas

## Solución de Problemas

### El tablero no se conecta al WiFi
- Verificar SSID y contraseña
- Verificar señal WiFi en la ubicación
- Revisar Serial Monitor para mensajes de error

### Los eventos no aparecen en el dashboard
- Verificar URL del servidor en el firmware
- Verificar que la base de datos esté corriente (ejecutar scripts SQL)
- Revisar logs de la API en Vercel

### Tarjeta RFID no reconocida
- Verificar que el UID esté correctamente ingresado
- Verificar conexiones del módulo RFID
- Usar sketch DumpInfo para confirmar UID

### Ubicación no aparece correctamente
- Verificar que el nombre de ubicación coincida EXACTAMENTE con la base de datos
- Ejecutar script `003_setup_chile_locations.sql`
- Revisar mayúsculas y acentos

## Mantenimiento

### Recomendaciones Mensuales
- Verificar conexión WiFi de cada tablero
- Revisar logs de eventos para patrones anormales
- Actualizar tarjetas RFID autorizadas según necesidad
- Verificar estado de baterías (si aplica)

### Actualizaciones de Firmware
- Mantener copia de seguridad de configuraciones
- Actualizar un tablero a la vez
- Verificar funcionamiento antes de continuar con otros

## Soporte

Para problemas técnicos:
1. Revisar Serial Monitor para diagnóstico
2. Verificar configuración de red
3. Consultar logs del servidor en Vercel
4. Revisar documentación de componentes hardware
