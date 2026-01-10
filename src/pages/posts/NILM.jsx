import { FiZap } from 'react-icons/fi';
import './Post.css';

function NILM() {
  return (
    <article className="post">
      <div className="container">
        <header className="post-header">
          <span className="post-category orange">
            <FiZap /> Energy Monitoring
          </span>
          <h1>Non-Intrusive Load Monitoring (NILM): One Sensor, Many Insights</h1>
          <p className="post-meta">How to identify individual appliances from a single power measurement point</p>
        </header>

        <div className="post-content">
          <h2>What is NILM?</h2>
          <p>
            <strong>Non-Intrusive Load Monitoring (NILM)</strong>, also called energy
            disaggregation, is a technique to identify which appliances are running and
            how much power each consumes — using just ONE sensor at the main electrical panel.
          </p>

          <div className="highlight-box">
            <h4>The Big Idea</h4>
            <p>
              Instead of putting a sensor on every appliance (intrusive), you put ONE
              sensor at the main meter and use algorithms to figure out what's running.
              Like recognizing voices in a crowd — each appliance has a unique "electrical signature."
            </p>
          </div>

          <h2>Traditional vs NILM Approach</h2>

          <div className="diagram">
            <pre>
{`TRADITIONAL (Intrusive):
┌─────────┐   ┌─────────┐   ┌─────────┐
│ Sensor 1│   │ Sensor 2│   │ Sensor 3│   ... Many sensors!
└────┬────┘   └────┬────┘   └────┬────┘
     │             │             │
   Fridge        Washer        AC

NILM (Non-Intrusive):
                 ┌─────────┐
                 │ 1 Sensor│  ← Only at main panel
                 └────┬────┘
                      │
     ┌────────────────┼────────────────┐
     │                │                │
   Fridge          Washer            AC

   Algorithm disaggregates the total into individual loads`}
            </pre>
          </div>

          <h2>How NILM Works</h2>

          <h3>1. Every Appliance Has a Signature</h3>
          <p>
            Appliances have unique electrical "fingerprints" based on:
          </p>
          <ul>
            <li><strong>Real Power (P)</strong> - Watts consumed</li>
            <li><strong>Reactive Power (Q)</strong> - Power for magnetic fields</li>
            <li><strong>Harmonics</strong> - Distortions in the current waveform</li>
            <li><strong>Transients</strong> - Startup/shutdown patterns</li>
          </ul>

          <h3>2. Signature Examples</h3>
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Appliance</th>
                <th>Power (W)</th>
                <th>Signature Characteristics</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Refrigerator</td>
                <td>100-400</td>
                <td>Cycling on/off, motor startup spike</td>
              </tr>
              <tr>
                <td>Microwave</td>
                <td>1000-1500</td>
                <td>Constant power, high harmonics</td>
              </tr>
              <tr>
                <td>Washing Machine</td>
                <td>300-500</td>
                <td>Variable states (wash, spin, heat)</td>
              </tr>
              <tr>
                <td>LED Lights</td>
                <td>5-20</td>
                <td>Low power, high harmonics</td>
              </tr>
              <tr>
                <td>Hair Dryer</td>
                <td>1000-2000</td>
                <td>Resistive, clean waveform</td>
              </tr>
            </tbody>
          </table>

          <h3>3. Detection Methods</h3>

          <h4>Event-Based Detection</h4>
          <p>Looks for sudden changes (appliance turning on/off):</p>
          <pre className="code-block">
{`Power Reading Timeline:
────────┐
        │  ← Fridge turns ON (+150W)
        └──────────┐
                   │  ← Microwave ON (+1200W)
                   └────────┐
                            │  ← Microwave OFF (-1200W)
                            └───────`}
          </pre>

          <h4>State-Based Detection</h4>
          <p>Uses machine learning to recognize patterns over time:</p>
          <ul>
            <li>Hidden Markov Models (HMM)</li>
            <li>Neural Networks (Deep Learning)</li>
            <li>Combinatorial Optimization</li>
          </ul>

          <h2>Building a Simple NILM System</h2>

          <h3>Hardware Needed</h3>
          <ul>
            <li><strong>Current Transformer (CT)</strong> - SCT-013-030 (30A) or similar</li>
            <li><strong>Voltage Sensor</strong> - ZMPT101B or direct sampling</li>
            <li><strong>Microcontroller</strong> - ESP32 (for WiFi + processing power)</li>
            <li><strong>ADC</strong> - Built-in or external ADS1115 for better resolution</li>
          </ul>

          <h3>Basic Algorithm Pseudocode</h3>
          <pre className="code-block">
{`// Simple event-based NILM
const THRESHOLD = 30;  // Watts - ignore small changes

let previousPower = 0;
let applianceDB = {
  'fridge': { power: 150, tolerance: 20 },
  'microwave': { power: 1200, tolerance: 100 },
  'tv': { power: 80, tolerance: 15 }
};

function detectAppliance(currentPower) {
  let delta = currentPower - previousPower;

  if (Math.abs(delta) > THRESHOLD) {
    // Significant change detected
    let event = delta > 0 ? 'ON' : 'OFF';
    let powerChange = Math.abs(delta);

    // Match to known appliances
    for (let [name, signature] of Object.entries(applianceDB)) {
      if (Math.abs(powerChange - signature.power) < signature.tolerance) {
        console.log(\`\${name} turned \${event}\`);
        return { appliance: name, event: event };
      }
    }
    console.log(\`Unknown appliance: \${powerChange}W \${event}\`);
  }

  previousPower = currentPower;
}`}
          </pre>

          <h2>Challenges in NILM</h2>
          <div className="use-cases">
            <div className="use-case no">
              <h4>Difficulties</h4>
              <ul>
                <li><strong>Similar signatures</strong> - Two 100W devices look alike</li>
                <li><strong>Multi-state appliances</strong> - Washer has many modes</li>
                <li><strong>Simultaneous events</strong> - Multiple ON/OFF at same time</li>
                <li><strong>Always-on loads</strong> - Hard to detect standby devices</li>
              </ul>
            </div>
            <div className="use-case yes">
              <h4>Solutions</h4>
              <ul>
                <li>Use reactive power + harmonics, not just real power</li>
                <li>Higher sampling rate (kHz) captures transients</li>
                <li>Machine learning for pattern recognition</li>
                <li>Combine with smart plug data for training</li>
              </ul>
            </div>
          </div>

          <h2>Real-World Applications</h2>
          <ul>
            <li><strong>Home Energy Reports</strong> - Show users their breakdown by appliance</li>
            <li><strong>Fault Detection</strong> - Identify malfunctioning equipment</li>
            <li><strong>Demand Response</strong> - Know which loads can be shed</li>
            <li><strong>Energy Audits</strong> - Without installing sensors everywhere</li>
            <li><strong>Elderly Care</strong> - Detect activity patterns (kettle, TV usage)</li>
          </ul>

          <h2>Getting Started</h2>
          <div className="summary-box">
            <p><strong>Step 1:</strong> Build a power meter (CT + voltage sensor + ESP32)</p>
            <p><strong>Step 2:</strong> Log total power at 1 Hz (start simple)</p>
            <p><strong>Step 3:</strong> Label your data - turn on/off appliances and note times</p>
            <p><strong>Step 4:</strong> Implement basic edge detection algorithm</p>
            <p><strong>Step 5:</strong> Gradually add ML for better accuracy</p>
          </div>

          <h2>Resources & Datasets</h2>
          <p>Public datasets to train and test NILM algorithms:</p>
          <ul>
            <li><strong>REDD</strong> - Reference Energy Disaggregation Dataset</li>
            <li><strong>UK-DALE</strong> - UK Domestic Appliance-Level Electricity</li>
            <li><strong>NILMTK</strong> - Open source NILM toolkit (Python)</li>
          </ul>
        </div>
      </div>
    </article>
  );
}

export default NILM;
