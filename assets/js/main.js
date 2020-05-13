/*
 *  SPACEX Interplanetary Transport System Interface
 *  MADE BY THIJMEN
 *
 *  TABLE OF CONTENTS:
 *  1. DATA
 *  2. HELPER FUNCTIONS
 *  3. INITIALIZE THE SPACECRAFT
 *  4. REFRESH THE UI AND DATA
 *  5. INTERACTION HANDLERS
 *  6. INITIALIZE EVERYTHING
 */

/*
 *  1. DATA
 *  This data is mostly generated randomly at the start and is getting updated by
 *  the interval timers waaaay further down in this file
 *
 *  Never update the data directly: use an updateWhatever() function for that
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
    // Calculate the new speed for this 'tick'

    // First, make sure wiggle always has a value, even if it's the one from the previous tick
    let wiggle = this.acceleration;

    // If the speed is < 7 or > 11, correct back to a nominal range
    // This is a manuver that requires fuel and turns some indicators red
    if (this.speed < 7) {
      wiggle = Math.random() * 0.05 + 0.2;
      this.boosting = true;
      systemStatus.sendMessage('speed');
    } else if (this.speed > 11) {
      wiggle = Math.random() * 0.05 - 0.2;
      this.boosting = true;
      systemStatus.sendMessage('speed');
    } else if (this.speed <= 10 && this.speed >= 8) {
      this.boosting = false;
      systemStatus.resolveMessage('speed');
    }

    // If we didn't calculate a boosting speed above, let's calculate a new wiggle
    if (!this.boosting) {
      wiggle = Math.random() * 0.2 - 0.1;
    }

    // Calculate our new speed and acceleration based on the wiggle and manual boosting
    const newAcceleration = wiggle + this.manualBoostAcceleration;
    this.speed += newAcceleration;
    this.acceleration = newAcceleration;

    // If we're boosting, we need to burn some fuel
    if (this.boosting || this.manualBoost) {
      this.fuel -= Math.abs(newAcceleration) * 0.001;
    }

    // Finally, return the new speed
    return this.speed;
  };
  this.boostManually = function boostManually(direction) {
    // Allow the user to boost or break the ship
    // Check 5. INTERACTION HANDLERS to see when this gets called

    // var direction can be 'boost' or 'break'

    // Don't boost if we're already boosting
    if (this.manualBoost) {
      return;
    }

    this.manualBoost = true;

    // Set the amount of maneuvering we're doing
    // This value gets picked up by this.updateSpeed whenever that's called
    if (direction === 'boost') {
      this.manualBoostAcceleration = 0.2;
    } else {
      this.manualBoostAcceleration = -0.2;
    }

    // Show in the UI we're maneuvering
    systemStatus.sendMessage(direction);

    setTimeout(() => {
      // Stop the maneuver automatically after 1.5s
      systemStatus.resolveMessage(direction);
      this.manualBoostAcceleration = 0;
      this.manualBoost = false;
    }, 1500);
  };
  this.updateDistance = function updateDistance() {
    // Bump the distance by how fast we're going
    // This math only works in it's called every 1000 milliseconds
    // (which it is, by the refresh function in 4. REFRESH THE UI AND DATA)
    this.distance += this.speed;
    return this.distance;
  };
  this.updateGravity = function updateGravity() {
    // Randomly twitch the gravity
    this.gravity = Math.random() * 0.05 + 1;
    return this.gravity;
  };
  this.updatePower = function updatePower() {
    // Randomly twitch the power output
    this.power = Math.round(Math.random() * (400 - 300 + 1) + 300);
    return this.power;
  };
}

// Dictionary for the system status messages, which are...
const systenStatusDict = {
  good: 'Systems operating nominally',
  speed: 'Correcting speed deviation',
  break: 'Slowing down...',
  boost: 'Speeding up...',
};

// ... managed right here!
function SystemStatus() {
  this.messages = [];
  this.sendMessage = function sendMessage(message) {
    // If the message is already in the list, there's no need to add it again
    if (this.messages.indexOf(message) > -1) {
      return;
    }

    // Add message to the list
    this.messages.push(message);
  };
  this.resolveMessage = function resolveMessage(message) {
    const messageIndex = this.messages.indexOf(message);
    // Return early if the message isn't in the list anymore
    if (messageIndex === -1) {
      return;
    }

    // Remove message from list if it's resolved
    this.messages.splice(messageIndex, 1);
  };
  this.getMessages = function getMessages() {
    // Translate the message to readable text, if there is one to begin with
    if (this.messages.length < 1) {
      // No message? Return a "all is well" message
      return systenStatusDict.good;
    }

    // We only show one message at a time, so return the first one
    return systenStatusDict[this.messages[0]];
  };
}

/*
 *  2. HELPER FUNCTIONS
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
function updateUI(name, value, hasError) {
  // Find the element we need to update
  const target = document.querySelector(`#${name} .result span`);
  target.innerHTML = value;

  // Also update the status icon
  const status = document.querySelector(`#${name} .status`);

  // If hasError is true, we'll show an error
  let statusValue = 'good';
  if (hasError) {
    statusValue = 'bad';
  }

  // And now push the status icon update to the UI
  status.className = `status status--${statusValue}`;
}

/**
 * Converts Earth gravity to Martian gravity and vice versa
 *
 * @param {*} weight Starting weight
 * @param {*} type What are we converting to? Options are `mars` or `earth`
 * @returns {float} Converted weight with 2 decimal points
 */
function convertGravity(weight, type) {
  // I didn't take into account gravity fluctuations on the surface... But that's okay, right?
  const marsGravity = 0.38;

  // Error out hard if someone is stupid enough to enter NaN here
  // NOTE: frontend validation should prevent this from ever even happening
  if (Number.isNaN(weight)) {
    throw Error('Gravity conversion value must be a number');
  }

  let result;

  // Calculate one way or the other, depending on the selected conversion
  if (type === 'mars') {
    result = weight * marsGravity;
  } else {
    result = weight / marsGravity;
  }

  // Finally, return the result
  return result.toFixed(2);
}

/*
 *  3. INITIALIZE THE SPACECRAFT
 *  (always wanted to say that)
 *
 */

const ship = new Ship();
const systemStatus = new SystemStatus();

/*
 *  4. REFRESH THE UI AND DATA WHEN REQUESTED BY THE INTERVAL TIMERS
 *  (which you can find at the bottom of this file)
 *
 */

function refreshSpeed() {
  // First, update the speed to a new value
  ship.updateSpeed();

  // Then, show the new fuel percentage
  updateUI('fuel', floatToPercentage(ship.fuel));

  // Always show a speed number with the same length
  // This prevents UI jumping
  let speed = ship.speed.toFixed(2);
  if (speed < 10) {
    speed = `0${speed}`;
  }
  updateUI('speed', speed, ship.boosting);

  // Always show an acceleration number with the same length
  // This prevents UI jumping
  let acceleration = ship.acceleration.toFixed(2);
  if (!acceleration.includes('-')) {
    // Add a + if the number doesn't include a -
    // NOTE: Math.sign was buggy here, so this is the dirty solution
    acceleration = `+${acceleration}`;
  }
  updateUI('acceleration', acceleration, ship.boosting);
}

function refreshInfo() {
  updateUI('oxygen', floatToPercentage(ship.oxygen));

  ship.updatePower();
  updateUI('power', ship.power);
}

function refreshStatus() {
  // System status is updated slightly differently
  const systemStatusTarget = document.querySelector('#system-status .system-status');
  systemStatusTarget.innerHTML = systemStatus.getMessages();
}

function refreshData() {
  ship.updateDistance();
  updateUI('distance', ship.distance.toFixed(0));

  ship.updateGravity();
  updateUI('gravity', ship.gravity.toFixed(2));
}

/*
 *  5. INTERACTION HANDLERS
 *
 */

/**
 * Catches the click for boosting and breaking
 *
 * @param {*} event The event of clicking the button
 */
function manualAccelerationHandler(event) {
  event.preventDefault();

  // Get the direction (boost or break) from the button's dataset
  const { direction } = event.target.dataset;

  // Execute the maneuverf
  ship.boostManually(direction);
}

/**
 * Catches the form submission for converting weight
 *
 * @param {*} event The event of submitting the form
 */
function gravityConversionHandler(event) {
  // Don't actually submit the form
  event.preventDefault();

  // Grab the form data
  const formData = new FormData(event.target);

  // Do the actual conversion
  const result = convertGravity(formData.get('input'), formData.get('type'));

  // And update the UI
  const target = event.target.querySelector('.result span');
  target.innerHTML = result;
}

/*
 *  INITIALIZE EVERYTHING
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
// Wait a little bit before updating for the first time (looks more dramatics)
setTimeout(() => {
  setInterval(() => {
    refreshStatus();
  }, 150);
}, 1000);

// Refresh the other variables for the rest of the ship
setInterval(() => {
  refreshInfo();
}, 700);

// Listen to the manual acceleration buttons
document.querySelector('#acceleration-boost').addEventListener('click', manualAccelerationHandler);
document.querySelector('#acceleration-break').addEventListener('click', manualAccelerationHandler);

// And finally, just for the gravity converter: a listener for when you submit the form
document.querySelector('#form-gravity-conversion').addEventListener('submit', gravityConversionHandler);
