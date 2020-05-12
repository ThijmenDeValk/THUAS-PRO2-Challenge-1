const marsGravity = 0.38;

function convertGravity(weight, type) {
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

export default convertGravity;
