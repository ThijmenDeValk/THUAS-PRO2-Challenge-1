/*
 *  DATA
 *
 *  Never update the data directly: use a updateWhatever() function for that
 */

// This houses all the ship data
function Ship() {
  this.oxygen = Math.random() * .05 + .9;
  this.fuel = Math.random() * .05 + .95;
  this.acceleration = 0;
  this.speed = Math.random() * (10 - 7 + 1) + 7;
  this.boosting = false;

  this.updateSpeed = function() {
    let wiggle = this.acceleration;

    // If the speed is < 7 or > 11, correct back to the normal range
    // This is a manuver that requires fuel and turns some indicators red
    if(this.speed < 7) {
      wiggle = Math.random() * .05 + .2;
      this.boosting = true;
    } else if (this.speed > 11) {
      wiggle = Math.random() * .05 - .2;
      this.boosting = true;
    } else if (this.speed <= 10.5 && this.speed >= 7.5) {
      this.boosting = false;
    }

    if (!this.boosting) {
      wiggle = Math.random() * .4 - .2;
    }

    this.speed = this.speed + wiggle;
    this.acceleration = wiggle;

    if (this.boosting) {
      this.fuel = this.fuel - Math.abs(wiggle) * .001;
    }

    return this.speed;
  }
}

// This houses all the ship environment data
function Environment() {
  this.gravity = Math.random() * .05 + 1;
  this.gravityFailing = true;
  this.distance = Math.random() * (10000 - 2000 + 1) + 2000;
  this.power = Math.round(Math.random() * (400 - 300 + 1) + 300);

  this.updateDistance = function() {
    this.distance = this.distance + ship.speed;
    return this.distance;
  }
  this.updateGravity = function() {
    this.gravity = Math.random() * .05 + 1;
    return this.gravity;
  }
  this.updatePower = function() {
    this.power = Math.round(Math.random() * (400 - 300 + 1) + 300);
    return this.power;
  }
}

// Dictionary for the error messages, which are...
const errorDict = {
  'good': 'Systems operating nominally',
  'speed': 'Correcting speed deviation',
  'power': 'Power outage',
}

// ... managed right here!
function SystemStatus() {
  this.status = true;
  this.errors = [];
  this.throwError = function(error, status) {
    if (this.errors.indexOf(error) > -1) {
      return;
    }

    this.errors.push(error);

    const statusCheck = setInterval(() => {
      if (!status) {
        clearInterval(statusCheck);
      }
    }, 250);
  }
  this.resolveError = function(error) {
    const errorIndex = this.errors.indexOf(error);
    if (errorIndex === -1) {
      return;
    }

    delete this.errors[errorIndex];
  }
  this.getErrors = function() {
    if (this.errors.length < 1) {
      return [ 'good' ];
    }
    
    return this.errors;
  }
}

/*
 *  HELPER FUNCTIONS
 *
 */

/**
 * Convert a floating point number to a percentage with 1 decimal
 * 
 * @param {float} float 
 * @returns {string} A percentage
 */
function floatToPercentage(float) {
  return (float * 100).toFixed(1);
}

/**
 * Updates a value in the UI
 * 
 * @param {string} name ID of the element that needs to be updated in the UI
 * @param {string} value Value that needs to be displayed in the UI
 * @param {boolean} hasError Will show a red warning dot in the UI if `true`
 */
function updateValue(name, value, hasError) {
  const target = document.querySelector(`#${ name } .result span`);
  target.innerHTML = value;

  const status = document.querySelector(`#${ name } .status`);

  let statusValue = 'good';
  if (hasError) {
    statusValue = 'bad';
  }

  status.className = `status status--${ statusValue }`;
}

/**
 * Converts the gravities of Earth and Mars
 * 
 * @param {*} event The event of submitting the form
 */
async function gravityConversion(event) {
  event.preventDefault();
  const formData = new FormData(event.target);

  const { default:convertGravity } = await import('./helpers/gravityConvert.js');
  const result = convertGravity(formData.get('input'), formData.get('type'));

  const target = event.target.querySelector('.result span');
  target.innerHTML = result;
}

/*
 *
 *
 */

function refreshSpeed() {
  ship.updateSpeed();

  updateValue('fuel', floatToPercentage(ship.fuel));

  let speed = ship.speed.toFixed(2);
  if (speed < 10) {
    speed = `0${ speed }`;
  }
  updateValue('speed', speed, ship.boosting);

  let acceleration = ship.acceleration.toFixed(2);
  if (Math.sign(acceleration) >= 0) {
    acceleration = `+${ acceleration }`;
  }
  updateValue('acceleration', acceleration, ship.boosting);
}

function refreshEnvironmentInfo() {
  environment.updatePower();

  updateValue('oxygen', floatToPercentage(ship.oxygen));
  updateValue('gravity', environment.gravity.toFixed(2));
  updateValue('distance', environment.distance.toFixed(0));
  updateValue('power', environment.power);
}

function refreshData() {
  environment.updateDistance();
  environment.updateGravity();
}

/*
 *  INITIALIZE EVERYTHING
 *
 */

const environment = new Environment();
const ship = new Ship();

// REFRESH THE VARIOUS TYPES OF DATA
// These are different intervals, so the data doesn't update in one flash, but seemingly slightly random

// Refresh the 'time sensitive' data every 1 second. Otherwise readings like distance wouldn't make any sense
// (as those are measured in km/s)
setInterval(() => {
  refreshData()
}, 1000);

// Refresh the speed of the vehicle (and also fuel and acceleration, as those three are linked)
setInterval(() => {
  refreshSpeed()
}, 500);

// Refresh the other variables for both the environment and the ship
setInterval(() => {
  refreshEnvironmentInfo()
}, 700);

// And finally, just for the gravity converter: a listener for when you submit the form
document.querySelector('#form-gravity-conversion').addEventListener('submit', gravityConversion);
