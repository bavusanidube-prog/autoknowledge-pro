<<<<<<< HEAD
function scrollToTool() {
  document.getElementById('tool').scrollIntoView({ behavior: 'smooth' });
}

function diagnose() {
  const symptom = document.getElementById('symptom').value;
  const result = document.getElementById('result');
  const steps = document.getElementById('steps');

  if (symptom === 'no_start') {
    result.innerText = 'Likely Fault: Starting System Issue';
    steps.innerText =
      '1. Check battery voltage (12.6V)\n' +
      '2. Inspect terminals\n' +
      '3. Test starter motor\n' +
      '4. Check fuel system';
  } 
  else if (symptom === 'overheating') {
    result.innerText = 'Likely Fault: Cooling System';
    steps.innerText =
      '1. Check coolant level\n' +
      '2. Inspect radiator\n' +
      '3. Test thermostat\n' +
      '4. Check water pump';
  } 
  else {
    result.innerText = 'Please select a symptom';
    steps.innerText = '';
  }
=======
function scrollToTool() {
  document.getElementById('tool').scrollIntoView({ behavior: 'smooth' });
}

function diagnose() {
  const symptom = document.getElementById('symptom').value;
  const result = document.getElementById('result');
  const steps = document.getElementById('steps');

  if (symptom === 'no_start') {
    result.innerText = 'Likely Fault: Starting System Issue';
    steps.innerText =
      '1. Check battery voltage (12.6V)\n' +
      '2. Inspect terminals\n' +
      '3. Test starter motor\n' +
      '4. Check fuel system';
  } 
  else if (symptom === 'overheating') {
    result.innerText = 'Likely Fault: Cooling System';
    steps.innerText =
      '1. Check coolant level\n' +
      '2. Inspect radiator\n' +
      '3. Test thermostat\n' +
      '4. Check water pump';
  } 
  else {
    result.innerText = 'Please select a symptom';
    steps.innerText = '';
  }
>>>>>>> 8f4ed907b5def87a3a29229cd1e268df6001015a
}