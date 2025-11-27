// Script to generate a simple Perfetto trace file for testing
const fs = require('fs');
const path = require('path');

// Import the generated protobuf module
const {perfetto} = require('../src/import/perfetto.proto.js');

function generateSampleTrace() {
  // Create a minimal trace with just timestamps and no complex data
  // to avoid protobuf field number conflicts
  const trace = perfetto.protos.Trace.create({
    packet: [
      // Minimal packet with timestamp
      {
        timestamp: 1000000
      },
      {
        timestamp: 2000000  
      },
      {
        timestamp: 3000000
      }
    ]
  });

  return perfetto.protos.Trace.encode(trace).finish();
}

try {
  const buffer = generateSampleTrace();
  const outputPath = path.join(__dirname, '..', 'sample', 'profiles', 'perfetto', 'simple.perfetto-trace');
  
  fs.writeFileSync(outputPath, buffer);
  console.log('Generated sample Perfetto trace:', outputPath);
  console.log('File size:', buffer.length, 'bytes');
} catch (error) {
  console.error('Failed to generate sample trace:', error);
}