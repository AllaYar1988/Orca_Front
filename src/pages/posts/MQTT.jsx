import { FiWifi } from 'react-icons/fi';
import './Post.css';

function MQTT() {
  return (
    <article className="post">
      <div className="container">
        <header className="post-header">
          <span className="post-category blue">
            <FiWifi /> IoT
          </span>
          <h1>MQTT: The Language IoT Devices Speak</h1>
          <p className="post-meta">A practical introduction to the most popular IoT protocol</p>
        </header>

        <div className="post-content">
          <h2>What is MQTT?</h2>
          <p>
            <strong>MQTT (Message Queuing Telemetry Transport)</strong> is a lightweight
            messaging protocol designed for IoT devices. Think of it as a simple postal
            system for your devices.
          </p>

          <div className="highlight-box">
            <h4>Why MQTT for IoT?</h4>
            <ul>
              <li><strong>Lightweight</strong> - Minimal code footprint, runs on tiny devices</li>
              <li><strong>Low bandwidth</strong> - Small message overhead (~2 bytes header)</li>
              <li><strong>Reliable</strong> - Built-in quality of service levels</li>
              <li><strong>Simple</strong> - Easy to implement and understand</li>
            </ul>
          </div>

          <h2>How MQTT Works: The Basics</h2>

          <h3>The Publish/Subscribe Model</h3>
          <p>
            Unlike HTTP (request/response), MQTT uses <strong>publish/subscribe</strong>:
          </p>

          <div className="diagram">
            <pre>
{`┌─────────────┐         ┌──────────┐         ┌─────────────┐
│   Sensor    │ ──────► │  BROKER  │ ──────► │   Phone     │
│  (Publisher)│ publish │ (Server) │ deliver │(Subscriber) │
└─────────────┘         └──────────┘         └─────────────┘
                              │
       Topic: "home/temperature"
       Message: "25.5"`}
            </pre>
          </div>

          <h3>Key Concepts</h3>
          <ul>
            <li><strong>Broker</strong> - The central server that routes messages (like Mosquitto)</li>
            <li><strong>Publisher</strong> - Device that sends messages</li>
            <li><strong>Subscriber</strong> - Device that receives messages</li>
            <li><strong>Topic</strong> - The "address" for messages (like "home/living-room/temperature")</li>
          </ul>

          <h2>Topics: The Address System</h2>
          <p>
            Topics are hierarchical, using "/" as separator:
          </p>
          <pre className="code-block">
{`home/bedroom/temperature     → Bedroom temperature sensor
home/bedroom/humidity        → Bedroom humidity sensor
home/kitchen/temperature     → Kitchen temperature sensor
factory/machine1/status      → Machine 1 status
factory/machine1/power       → Machine 1 power consumption`}
          </pre>

          <h3>Wildcards</h3>
          <p>Subscribe to multiple topics at once:</p>
          <pre className="code-block">
{`home/+/temperature     → All temperature sensors in home
                          (matches bedroom, kitchen, etc.)

home/#                  → Everything under home
                          (all sensors, all rooms)

+ = single level wildcard
# = multi-level wildcard (must be last)`}
          </pre>

          <h2>Quality of Service (QoS)</h2>
          <p>MQTT offers three delivery guarantees:</p>

          <table className="comparison-table">
            <thead>
              <tr>
                <th>QoS</th>
                <th>Name</th>
                <th>Guarantee</th>
                <th>Use Case</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>0</td>
                <td>At most once</td>
                <td>Fire and forget</td>
                <td>Sensor data (OK to miss some)</td>
              </tr>
              <tr>
                <td>1</td>
                <td>At least once</td>
                <td>Guaranteed, may duplicate</td>
                <td>Important alerts</td>
              </tr>
              <tr>
                <td>2</td>
                <td>Exactly once</td>
                <td>Guaranteed, no duplicates</td>
                <td>Billing, commands</td>
              </tr>
            </tbody>
          </table>

          <h2>Practical Example: ESP32 with MQTT</h2>
          <pre className="code-block">
{`#include <WiFi.h>
#include <PubSubClient.h>

// WiFi & MQTT settings
const char* ssid = "YourWiFi";
const char* password = "YourPassword";
const char* mqtt_server = "broker.hivemq.com";  // Free public broker

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);

  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }

  // Connect to MQTT broker
  client.setServer(mqtt_server, 1883);
  client.setCallback(messageReceived);

  while (!client.connected()) {
    client.connect("ESP32_Client");
  }

  // Subscribe to commands
  client.subscribe("home/esp32/command");
}

void loop() {
  client.loop();

  // Publish temperature every 5 seconds
  static unsigned long lastMsg = 0;
  if (millis() - lastMsg > 5000) {
    lastMsg = millis();

    float temp = 25.5;  // Read from sensor
    char msg[10];
    sprintf(msg, "%.1f", temp);

    client.publish("home/esp32/temperature", msg);
  }
}

// Handle incoming messages
void messageReceived(char* topic, byte* payload, unsigned int length) {
  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  if (message == "LED_ON") {
    digitalWrite(LED_BUILTIN, HIGH);
  }
}`}
          </pre>

          <h2>Popular MQTT Brokers</h2>
          <div className="use-cases">
            <div className="use-case yes">
              <h4>Self-Hosted (Free)</h4>
              <ul>
                <li><strong>Mosquitto</strong> - Most popular, lightweight</li>
                <li><strong>EMQX</strong> - High performance, clustering</li>
              </ul>
            </div>
            <div className="use-case no">
              <h4>Cloud Services</h4>
              <ul>
                <li><strong>HiveMQ Cloud</strong> - Free tier available</li>
                <li><strong>AWS IoT Core</strong> - Scalable, enterprise</li>
                <li><strong>Azure IoT Hub</strong> - Microsoft ecosystem</li>
              </ul>
            </div>
          </div>

          <h2>MQTT vs HTTP for IoT</h2>
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>MQTT</th>
                <th>HTTP</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Connection</td>
                <td>Persistent (always on)</td>
                <td>Per request</td>
              </tr>
              <tr>
                <td>Message Size</td>
                <td>2 byte header</td>
                <td>Large headers</td>
              </tr>
              <tr>
                <td>Power Usage</td>
                <td>Lower</td>
                <td>Higher</td>
              </tr>
              <tr>
                <td>Real-time</td>
                <td>Yes (push)</td>
                <td>No (polling)</td>
              </tr>
              <tr>
                <td>Best For</td>
                <td>Sensors, real-time</td>
                <td>APIs, web apps</td>
              </tr>
            </tbody>
          </table>

          <h2>Quick Summary</h2>
          <div className="summary-box">
            <p><strong>MQTT is:</strong> A lightweight publish/subscribe protocol perfect for IoT</p>
            <p><strong>Key parts:</strong> Broker (server), Topics (addresses), Publishers & Subscribers</p>
            <p><strong>Use it for:</strong> Sensor data, device commands, real-time updates</p>
            <p><strong>Start with:</strong> Mosquitto broker + PubSubClient library on ESP32</p>
          </div>
        </div>
      </div>
    </article>
  );
}

export default MQTT;
