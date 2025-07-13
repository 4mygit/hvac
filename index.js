const axios = require('axios'); // Optional - only needed if sending to an API
const { v4: uuidv4 } = require('uuid');

// Configuration
const NUM_HVAC_SYSTEMS = 100;
const REPORTING_INTERVAL_MS = 60000; // 60 seconds
const API_ENDPOINT = null; // Set to your API endpoint if you want to send data
const SIMULATION_DURATION_MINUTES = 60; // Set to null to run indefinitely

// HVAC system templates
const HVAC_TYPES = [
  'Central AC', 'Heat Pump', 'Ductless Mini-Split', 
  'Window Unit', 'Packaged Terminal', 'Chiller'
];
const HVAC_BRANDS = [
  'Trane', 'Carrier', 'Lennox', 'Rheem', 'Goodman', 
  'York', 'Daikin', 'Mitsubishi', 'Fujitsu'
];

// Generate initial HVAC systems
function generateHVACSystems(count) {
  const systems = [];
  for (let i = 0; i < count; i++) {
    systems.push({
      id: uuidv4(),
      name: `HVAC-${i+1}`,
      type: HVAC_TYPES[Math.floor(Math.random() * HVAC_TYPES.length)],
      brand: HVAC_BRANDS[Math.floor(Math.random() * HVAC_BRANDS.length)],
      installationDate: new Date(Date.now() - Math.floor(Math.random() * 5 * 365 * 24 * 60 * 60 * 1000)),
      lastMaintenance: new Date(Date.now() - Math.floor(Math.random() * 6 * 30 * 24 * 60 * 60 * 1000)),
      location: {
        building: `Building-${Math.floor(Math.random() * 10) + 1}`,
        floor: Math.floor(Math.random() * 10) + 1,
        room: Math.floor(Math.random() * 50) + 1
      },
      specs: {
        coolingCapacity: Math.floor(Math.random() * 10) + 1 + ' tons',
        efficiency: (Math.random() * 5 + 10).toFixed(1) + ' SEER'
      }
    });
  }
  return systems;
}

// Generate telemetry data for an HVAC system
function generateTelemetry(hvacSystem) {
  const now = new Date();
  const isCooling = Math.random() > 0.3; // 70% chance the system is cooling
  const isHeating = !isCooling && Math.random() > 0.7; // 30% of remaining time heating
  const isIdle = !isCooling && !isHeating;
  
  // Base values
  let returnTemp = 20 + Math.random() * 10; // 20-30°C
  let supplyTemp = returnTemp;
  
  if (isCooling) {
    supplyTemp = returnTemp - (5 + Math.random() * 3); // 5-8°C cooler
  } else if (isHeating) {
    supplyTemp = returnTemp + (5 + Math.random() * 3); // 5-8°C warmer
  }
  
  // Add some random fluctuation
  returnTemp += (Math.random() - 0.5) * 2;
  supplyTemp += (Math.random() - 0.5) * 2;
  
  return {
    timestamp: now.toISOString(),
    systemId: hvacSystem.id,
    systemName: hvacSystem.name,
    status: isCooling ? 'cooling' : isHeating ? 'heating' : 'idle',
    temperatures: {
      return: parseFloat(returnTemp.toFixed(1)),
      supply: parseFloat(supplyTemp.toFixed(1)),
      outdoor: 15 + Math.random() * 20 // 15-35°C
    },
    pressures: {
      suction: 60 + Math.random() * 20, // 60-80 psi
      discharge: 150 + Math.random() * 100 // 150-250 psi
    },
    power: {
      voltage: 208 + (Math.random() - 0.5) * 10, // ~208V with variation
      current: isIdle ? 2 + Math.random() * 3 : 10 + Math.random() * 15, // Higher when running
      powerConsumption: isIdle ? 0.5 + Math.random() : 3 + Math.random() * 7 // kW
    },
    airFlow: isIdle ? 0 : 1000 + Math.random() * 2000, // CFM
    filterStatus: Math.random() > 0.9 ? 'replace' : 'ok', // 10% chance filter needs replacing
    alarms: Math.random() > 0.95 ? ['high_pressure'] : [] // 5% chance of alarm
  };
}

// Report data for all systems
async function reportAllSystems(hvacSystems) {
  for (const system of hvacSystems) {
    const telemetry = generateTelemetry(system);
    
    // Output to console
    console.log(`[${new Date().toISOString()}] Reporting for ${system.name}:`);
    console.log(JSON.stringify(telemetry, null, 2));
    
    // Optionally send to API
    if (API_ENDPOINT) {
      try {
        await axios.post(API_ENDPOINT, telemetry);
        console.log(`Data for ${system.name} sent successfully`);
      } catch (error) {
        console.error(`Failed to send data for ${system.name}:`, error.message);
      }
    }
  }
}

// Main function
async function main() {
  console.log(`Generating ${NUM_HVAC_SYSTEMS} HVAC systems...`);
  const hvacSystems = generateHVACSystems(NUM_HVAC_SYSTEMS);
  
  let minutesRun = 0;
  const intervalId = setInterval(async () => {
    console.log(`\n=== Reporting cycle ${minutesRun + 1} ===`);
    await reportAllSystems(hvacSystems);
    
    minutesRun++;
    if (SIMULATION_DURATION_MINUTES && minutesRun >= SIMULATION_DURATION_MINUTES) {
      clearInterval(intervalId);
      console.log('Simulation completed');
      process.exit(0);
    }
  }, REPORTING_INTERVAL_MS);
  
  console.log(`Simulation started. Systems will report every ${REPORTING_INTERVAL_MS/1000} seconds.`);
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\nSimulation stopped by user');
  process.exit(0);
});

// Start the simulation
main().catch(console.error);