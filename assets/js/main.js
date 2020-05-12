/*
 *  SPACEX Interplanetary Transport System Interface
 *  MADE BY THIJMEN
 */

/*
 *  DATA
 *  This data is most generated randomly at the start and is getting updated by
 *  the interval timers waaaay further down in this file
 *
 *  Never update the data directly: use a updateWhatever() function for that
 */

// This houses all the ship data
function Ship() {
  this.oxygen = Math.random() * 0.05 + 0.9;
  this.fuel = Math.random() * 0.05 + 0.95;
  this.acceleration = 0;
  this.speed = Math.random() * (10 - 7 + 1) + 7;
  this.boosting = false;
  this.manualBoost = false;
  this.manualBoostAcceleration = 0;
  this.gravity = Math.random() * 0.05 + 1;
  this.gravityFailing = true;
  this.distance = Math.random() * (10000 - 2000 + 1) + 2000;
  this.power = Math.round(Math.random() * (400 - 300 + 1) + 300);

  this.updateSpeed = function updateSpeed() {
    let wiggle = this.acceleration;

    // If the speed is < 7 or > 11, correct back to the normal range
    // This is a manuver that requires fuel and turns some indicators red
    if (this.speed < 7) {
      wiggle = Math.random() * 0.05 + 0.2;
      this.boosting = true;
      systemStatus.throwError('speed');
    } else if (this.speed > 11) {
      wiggle = Math.random() * 0.05 - 0.2;
      this.boosting = true;
      systemStatus.throwError('speed');
    } else if (this.speed <= 10 && this.speed >= 8) {
      this.boosting = false;
      systemStatus.resolveError('speed');
    }

    if (!this.boosting) {
      wiggle = Math.random() * 0.2 - 0.1;
    }

    this.speed = this.speed + wiggle + this.manualBoostAcceleration;
    this.acceleration = wiggle + this.manualBoostAcceleration;

    if (this.boosting) {
      this.fuel -= Math.abs(wiggle) * 0.001;
    }

    return this.speed;
  };
  this.updateDistance = function updateDistance() {
    this.distance += this.speed;
    return this.distance;
  };
  this.updateGravity = function updateGravity() {
    this.gravity = Math.random() * 0.05 + 1;
    return this.gravity;
  };
  this.updatePower = function updatePower() {
    this.power = Math.round(Math.random() * (400 - 300 + 1) + 300);
    return this.power;
  };
  this.boostManually = function boostManually(direction) {
    // Don't boost if we're already boosting
    if (this.manualBoost) {
      return;
    }

    if (direction === 'boost') {
      this.manualBoostAcceleration = 0.2;
    } else {
      this.manualBoostAcceleration = -0.2;
    }

    systemStatus.throwError(direction);

    setTimeout(() => {
      systemStatus.resolveError(direction);
      this.manualBoostAcceleration = 0;
      this.manualBoost = false;
    }, 1500);
  };
}

// Dictionary for the error messages, which are...
const errorDict = {
  good: 'Systems operating nominally',
  speed: 'Correcting speed deviation',
  break: 'Slowing down...',
  boost: 'Speeding up...',
};

// ... managed right here!
function SystemStatus() {
  this.status = true;
  this.errors = [];
  this.throwError = function throwError(error) {
    if (this.errors.indexOf(error) > -1) {
      return;
    }

    this.errors.push(error);
  };
  this.resolveError = function resolveError(error) {
    const errorIndex = this.errors.indexOf(error);
    if (errorIndex === -1) {
      return;
    }

    this.errors.splice(errorIndex, 1);
  };
  this.getErrors = function getErrors() {
    // Translate the error to readable text, if there is one to begin with
    if (this.errors.length < 1) {
      // No error? Return a "all is well" message
      return errorDict.good;
    }

    // We only show one error at a time, so return the first one
    return errorDict[this.errors[0]];
  };
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
  const target = document.querySelector(`#${name} .result span`);
  target.innerHTML = value;

  const status = document.querySelector(`#${name} .status`);

  let statusValue = 'good';
  if (hasError) {
    statusValue = 'bad';
  }

  status.className = `status status--${statusValue}`;
}

/**
 * Converts Earth gravity to Martian gravity and vice versa
 *
 * @param {*} weight Starting weight
 * @param {*} type What are we converting to? Options are `mars` or `earth`
 */
function convertGravity(weight, type) {
  const marsGravity = 0.38;

  if (Number.isNaN(weight)) {
    throw Error('Gravity conversion value must be a number');
  }

  let result;

  if (type === 'mars') {
    result = weight * marsGravity;
  } else {
    result = weight / marsGravity;
  }

  return result.toFixed(2);
}

/*
 *  INITIALIZE THE SPACECRAFT
 *  (always wanted to say that)
 */

const ship = new Ship();
const systemStatus = new SystemStatus();

/*
 *  REFRESH THE UI AND DATA WHEN REQUESTED BY THE INTERVAL TIMERS
 *  (which you can find at the bottom of this file)
 *
 */

function refreshSpeed() {
  ship.updateSpeed();

  updateValue('fuel', floatToPercentage(ship.fuel));

  let speed = ship.speed.toFixed(2);
  if (speed < 10) {
    speed = `0${speed}`;
  }
  updateValue('speed', speed, ship.boosting);

  let acceleration = ship.acceleration.toFixed(2);
  if (!acceleration.includes('-')) {
    acceleration = `+${acceleration}`;
  }
  updateValue('acceleration', acceleration, ship.boosting);
}

function refreshInfo() {
  updateValue('oxygen', floatToPercentage(ship.oxygen));

  ship.updatePower();
  updateValue('power', ship.power);
}

function refreshStatus() {
  // System status is updated slightly differently
  const systemStatusTarget = document.querySelector('#system-status .system-status');
  systemStatusTarget.innerHTML = systemStatus.getErrors();
}

function refreshData() {
  ship.updateDistance();
  updateValue('distance', ship.distance.toFixed(0));

  ship.updateGravity();
  updateValue('gravity', ship.gravity.toFixed(2));
}

/*
 *  INTERACTION HANDLERS
 *
 */

/**
 * Catches the click for boosting and breaking
 *
 * @param {*} event The event of clicking the button
 */
function manualAccelerationHandler(event) {
  event.preventDefault();

  const { direction } = event.target.dataset;

  ship.boostManually(direction);
}

/**
 * Catches the form submission for converting weight
 *
 * @param {*} event The event of submitting the form
 */
function gravityConversionHandler(event) {
  event.preventDefault();
  const formData = new FormData(event.target);

  const result = convertGravity(formData.get('input'), formData.get('type'));

  const target = event.target.querySelector('.result span');
  target.innerHTML = result;
}

/*
 *  SET THE WHOLE THING IN MOTION
 *
 */

// REFRESH THE VARIOUS TYPES OF DATA EVERY SO OFTEN
// These are different intervals, so the data updates at seemingly random intervals

// Refresh the 'time sensitive' data every 1 second.
// Otherwise readings like distance wouldn't make any sense (as those are measured in km/s)
setInterval(() => {
  refreshData();
}, 1000);

// Refresh the speed of the vehicle (and also fuel and acceleration, as those three are linked)
setInterval(() => {
  refreshSpeed();
}, 500);

// Refresh the systems status
setInterval(() => {
  refreshStatus();
}, 150);

// Refresh the other variables for the rest of the ship
setInterval(() => {
  refreshInfo();
}, 700);

// Listen to the manual acceleration buttons
document.querySelector('#acceleration-boost').addEventListener('click', manualAccelerationHandler);
document.querySelector('#acceleration-break').addEventListener('click', manualAccelerationHandler);

// And finally, just for the gravity converter: a listener for when you submit the form
document.querySelector('#form-gravity-conversion').addEventListener('submit', gravityConversionHandler);
