# ESP32-S3 Door Sensor Setup Guide

## Hardware Requirements

1. **ESP32-S3 Development Board**
2. **Magnetic Reed Switch** (Door Sensor)
   - One part on door frame
   - One part on door
3. **RFID-RC522 Module** (13.56MHz)
4. **Buzzer** (5V active buzzer)
5. **Jumper Wires**
6. **Breadboard** (optional)

## Wiring Diagram

### Door Sensor (Reed Switch)
```
Reed Switch Pin 1 -> ESP32 GPIO 4
Reed Switch Pin 2 -> ESP32 GND
```

### RFID-RC522 Module
```
SDA  -> GPIO 5
SCK  -> GPIO 18
MOSI -> GPIO 23
MISO -> GPIO 19
RST  -> GPIO 22
GND  -> GND
3.3V -> 3.3V
```

### Buzzer
```
Buzzer + -> GPIO 2
Buzzer - -> GND
```

## Software Setup

### 1. Install Arduino IDE

Download from: https://www.arduino.cc/en/software

### 2. Install ESP32 Board Support

1. Open Arduino IDE
2. Go to **File > Preferences**
3. Add to "Additional Board Manager URLs":
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Go to **Tools > Board > Boards Manager**
5. Search for "esp32" and install "esp32 by Espressif Systems"

### 3. Install Required Libraries

Go to **Sketch > Include Library > Manage Libraries** and install:

- **MFRC522** by GithubCommunity (for RFID)
- **ArduinoJson** by Benoit Blanchon (for JSON)

### 4. Configure the Code

Open `esp32_door_sensor.ino` and update:

```cpp
// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// API endpoint (your deployed Vercel URL)
const char* serverUrl = "https://your-app.vercel.app/api/door/event";
```

### 5. Get Your RFID Card UID

1. Upload the code with any placeholder UIDs
2. Open **Serial Monitor** (115200 baud)
3. Scan your RFID card
4. Note the UID printed (e.g., "A1 B2 C3 D4")
5. Update the `authorizedUIDs` array:

```cpp
byte authorizedUIDs[][4] = {
  {0xA1, 0xB2, 0xC3, 0xD4},  // Your card UID in hex
  {0xCA, 0xFE, 0xBA, 0xBE}   // Add more cards
};
const int numAuthorizedCards = 2;  // Update count
```

### 6. Upload Code

1. Connect ESP32 via USB
2. Select **Tools > Board > ESP32S3 Dev Module**
3. Select correct **Port**
4. Click **Upload**

## Testing

### Test Sequence

1. **Power On**
   - Check Serial Monitor for "ESP32-S3 Door Sensor Starting..."
   - Wait for "WiFi connected!"

2. **Test RFID**
   - Scan authorized card
   - Should hear 2 short beeps
   - Serial shows "Access GRANTED"

3. **Test Door Sensor**
   - Open door WITHOUT scanning card
   - Should hear 3 beeps (forced entry alert)
   - Open door AFTER scanning card
   - Should open normally

4. **Check Dashboard**
   - Visit your web dashboard
   - Events should appear in real-time

## Troubleshooting

### WiFi Won't Connect
- Verify SSID and password
- Check 2.4GHz WiFi (ESP32 doesn't support 5GHz)
- Ensure router is in range

### RFID Not Working
- Check wiring (especially 3.3V, not 5V!)
- Verify SPI pins match your ESP32 variant
- Try different RFID cards (some aren't compatible)

### Events Not Sending
- Check Serial Monitor for HTTP response codes
- Verify API URL is correct (include https://)
- Check if Vercel app is deployed
- Test API manually with curl or Postman

### Door Sensor Always Open/Closed
- Check if reed switch is close enough when door closed
- Try swapping HIGH/LOW logic in code
- Test with multimeter in continuity mode

## Production Considerations

1. **Power Supply**: Use 5V power adapter, not USB
2. **Enclosure**: Use waterproof case for outdoor installation
3. **Security**: Implement API key authentication
4. **Reliability**: Add watchdog timer and auto-restart
5. **Battery Backup**: Add UPS for continuous operation
