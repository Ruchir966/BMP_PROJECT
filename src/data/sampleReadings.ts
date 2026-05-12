export type SensorReading = {
  id: number;
  timestamp: string;
  current: number; // Amps
  voltage: number; // Volts
};

// Realistic-ish smart-ag sensor sample (e.g. solar-powered soil moisture nodes)
export const sampleReadings: SensorReading[] = [
  { id: 1,  timestamp: "06:00", current: 0.42, voltage: 11.8 },
  { id: 2,  timestamp: "07:00", current: 0.61, voltage: 12.1 },
  { id: 3,  timestamp: "08:00", current: 0.95, voltage: 12.4 },
  { id: 4,  timestamp: "09:00", current: 1.32, voltage: 12.7 },
  { id: 5,  timestamp: "10:00", current: 1.78, voltage: 13.0 },
  { id: 6,  timestamp: "11:00", current: 2.10, voltage: 13.2 },
  { id: 7,  timestamp: "12:00", current: 2.34, voltage: 13.4 },
  { id: 8,  timestamp: "13:00", current: 2.21, voltage: 13.3 },
  { id: 9,  timestamp: "14:00", current: 1.95, voltage: 13.1 },
  { id: 10, timestamp: "15:00", current: 1.54, voltage: 12.9 },
  { id: 11, timestamp: "16:00", current: 1.12, voltage: 12.6 },
  { id: 12, timestamp: "17:00", current: 0.78, voltage: 12.2 },
  { id: 13, timestamp: "18:00", current: 0.51, voltage: 11.9 },
  { id: 14, timestamp: "19:00", current: 0.34, voltage: 11.6 },
];
