import { FiCpu } from 'react-icons/fi';
import './Post.css';

function BareMetal() {
  return (
    <article className="post">
      <div className="container">
        <header className="post-header">
          <span className="post-category green">
            <FiCpu /> Embedded Systems
          </span>
          <h1>Bare Metal Programming: What It Really Is (And What It's Not)</h1>
          <p className="post-meta">Understanding the fundamentals of programming without an OS</p>
        </header>

        <div className="post-content">
          <h2>What is Bare Metal Programming?</h2>
          <p>
            <strong>Bare metal programming</strong> means writing code that runs directly on the
            hardware without any operating system (OS) layer in between. Your code talks
            directly to the CPU, memory, and peripherals.
          </p>

          <div className="highlight-box">
            <h4>Simple Definition</h4>
            <p>
              Bare metal = Your code is the ONLY thing running on the processor.
              No OS, no scheduler, no abstraction layers between you and the hardware.
            </p>
          </div>

          <h2>What Bare Metal IS</h2>

          <h3>1. Direct Hardware Access</h3>
          <p>
            You write directly to hardware registers. For example, to turn on an LED on
            an STM32 microcontroller:
          </p>
          <pre className="code-block">
{`// Direct register manipulation - THIS is bare metal
GPIOD->MODER |= (1 << 24);    // Set PD12 as output
GPIOD->ODR   |= (1 << 12);    // Turn LED on`}
          </pre>

          <h3>2. Full Control</h3>
          <ul>
            <li>You decide exactly when each instruction executes</li>
            <li>You manage all memory allocation</li>
            <li>You handle all interrupts directly</li>
            <li>No hidden background tasks consuming CPU cycles</li>
          </ul>

          <h3>3. Predictable Timing</h3>
          <p>
            Since there's no OS scheduling other tasks, you can achieve precise,
            deterministic timing. Critical for applications like:
          </p>
          <ul>
            <li>Motor control</li>
            <li>Signal processing</li>
            <li>Communication protocols</li>
          </ul>

          <h2>What Bare Metal is NOT</h2>

          <h3>1. NOT the Same as "Using Arduino"</h3>
          <p>
            Many people think they're doing bare metal when using Arduino.
            <strong> They're usually not.</strong>
          </p>
          <pre className="code-block">
{`// Arduino code - NOT bare metal
void loop() {
  digitalWrite(13, HIGH);  // Uses Arduino abstraction
  delay(1000);             // Uses timer abstraction
}

// True bare metal equivalent
int main(void) {
  DDRB |= (1 << 5);        // Direct port manipulation
  while(1) {
    PORTB |= (1 << 5);
    for(volatile int i=0; i<100000; i++); // Manual delay
  }
}`}
          </pre>
          <p>
            Arduino uses a <strong>Hardware Abstraction Layer (HAL)</strong>. It's simpler
            but adds overhead and hides what's really happening.
          </p>

          <h3>2. NOT the Same as "No Operating System"</h3>
          <p>
            Just because there's no Linux doesn't mean it's bare metal. Using libraries
            like:
          </p>
          <ul>
            <li><strong>STM32 HAL</strong> - Hardware Abstraction Layer</li>
            <li><strong>ESP-IDF</strong> - Has FreeRTOS built in</li>
            <li><strong>Arduino Core</strong> - Abstraction layer</li>
          </ul>
          <p>
            These add layers between your code and the hardware. They're useful,
            but not "bare metal."
          </p>

          <h3>3. NOT Always Better</h3>
          <p>
            Bare metal gives you control, but it comes with costs:
          </p>
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Bare Metal</th>
                <th>With HAL/RTOS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Full control</td>
                <td>Easier development</td>
              </tr>
              <tr>
                <td>Harder to port to other chips</td>
                <td>More portable code</td>
              </tr>
              <tr>
                <td>More code to write</td>
                <td>Pre-built drivers available</td>
              </tr>
              <tr>
                <td>Steeper learning curve</td>
                <td>Faster prototyping</td>
              </tr>
            </tbody>
          </table>

          <h2>When to Use Bare Metal</h2>
          <div className="use-cases">
            <div className="use-case yes">
              <h4>Good for:</h4>
              <ul>
                <li>Learning how hardware really works</li>
                <li>Extremely timing-critical applications</li>
                <li>Minimal resource usage (tiny chips)</li>
                <li>Safety-critical systems (less code = fewer bugs)</li>
              </ul>
            </div>
            <div className="use-case no">
              <h4>Not needed for:</h4>
              <ul>
                <li>Quick prototypes</li>
                <li>Complex applications with networking</li>
                <li>When time-to-market matters most</li>
                <li>Projects requiring easy maintenance</li>
              </ul>
            </div>
          </div>

          <h2>Quick Summary</h2>
          <div className="summary-box">
            <p><strong>Bare Metal IS:</strong> Direct hardware register access, no OS, no HAL, full control</p>
            <p><strong>Bare Metal is NOT:</strong> Arduino, STM32 HAL, ESP-IDF, or any abstraction layer</p>
            <p><strong>Use it when:</strong> You need maximum control, minimal overhead, or want to truly understand the hardware</p>
          </div>
        </div>
      </div>
    </article>
  );
}

export default BareMetal;
