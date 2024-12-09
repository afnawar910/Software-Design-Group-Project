function isValidDate(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date) && date.toISOString().slice(0, 10) === dateString;
}

function isValidTime(timeString) {
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return regex.test(timeString);
}

const validateEventInput = (req, res, next) => {
const { eventName, eventDescription, address1, city, state, zipCode, requiredSkills, urgency, eventDate, startTime, endTime } = req.body;
  const errors = {};

  if (!eventName || typeof eventName !== 'string' || eventName.trim().length === 0) {
    errors.eventName = 'Event Name is required';
  } else if (eventName.length > 100) {
    errors.eventName = 'Event Name must be 100 characters or less';
  }

  if (!eventDescription || typeof eventDescription !== 'string' || eventDescription.trim().length === 0) {
    errors.eventDescription = 'Event Description is required';
  }

if (!address1 || typeof address1 !== 'string' || address1.trim().length === 0) {
  errors.address1 = 'Address 1 is required';
} else if (address1.length > 100) {
  errors.address1 = 'Address 1 must be 100 characters or less';
}

if (!city || typeof city !== 'string' || city.trim().length === 0) {
  errors.city = 'City is required';
} else if (city.length > 100) {
  errors.city = 'City must be 100 characters or less';
}

const validStates = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];
if (!state || !validStates.includes(state)) {
  errors.state = 'Valid state is required';
}

if (!zipCode || typeof zipCode !== 'string' || zipCode.trim().length === 0) {
  errors.zipCode = 'Zip Code is required';
} else if (zipCode.length < 5 || zipCode.length > 9) {
  errors.zipCode = 'Zip Code must be between 5 and 9 characters';
}

  
  if (!Array.isArray(requiredSkills) || requiredSkills.length === 0) {
    errors.requiredSkills = 'At least one skill is required';
  }

  const validUrgencyLevels = ['Low', 'Medium', 'High', 'Critical'];
  if (!urgency || !validUrgencyLevels.includes(urgency)) {
    errors.urgency = 'Valid urgency level is required';
  }

  if (!eventDate || !isValidDate(eventDate)) {
    errors.eventDate = 'Valid event date is required';
  }

  if (!startTime || !isValidTime(startTime)) {
    errors.startTime = 'Valid start time is required';
  }
  if (!endTime || !isValidTime(endTime)) {
    errors.endTime = 'Valid end time is required';
  }
  if (startTime && endTime && startTime >= endTime) {
    errors.endTime = 'End time must be after start time';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};


module.exports = { validateEventInput };