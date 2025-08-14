// utils/snowflake.ts
export class Snowflake {
    private machineId: number;
    private lastTimestamp: number;
    private sequence: number;
  
    constructor(machineId: number | null = null) {
      // Assign a unique machine ID (0-1023)
      this.machineId = machineId !== null ? machineId : Math.floor(Math.random() * 1024);
      this.lastTimestamp = -1;
      this.sequence = Math.floor(Math.random() * 65536) & 0xffff; // 16-bit sequence (0-65535)
    }
  
    generate(): string {
      const timestampMs = Date.now(); // Milliseconds
      const microseconds = Math.floor((performance.now() % 1000) * 1000); // Microseconds (0-999999)
      const timestamp = timestampMs * 1000 + Math.floor(microseconds / 1000); // Convert to microseconds
  
      if (timestamp === this.lastTimestamp) {
        this.sequence = (this.sequence + 1) & 0xffff; // 16-bit sequence (0-65535)
  
        if (this.sequence === 0) {
          // Wait for next available timestamp
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1);
          return this.generate();
        }
      } else {
        this.sequence = Math.floor(Math.random() * 65536) & 0xffff; // New random sequence
      }
  
      this.lastTimestamp = timestamp;
  
      return `${timestamp}${this.machineId.toString().padStart(4, "0")}${this.sequence.toString().padStart(5, "0")}`;
    }
  }
  
  // Singleton instance for the application
  let snowflakeInstance: Snowflake | null = null;
  
  export function getSnowflakeId(machineId?: number): string {
    if (!snowflakeInstance) {
      snowflakeInstance = new Snowflake(machineId ?? null);
    }
    return snowflakeInstance.generate();
  }