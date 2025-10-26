// User roles
const USER_ROLES = {
  USER: 'user',
  OWNER: 'owner',
  ADMIN: 'admin'
};

// Authentication providers
const AUTH_PROVIDERS = {
  EMAIL: 'email',
  GOOGLE: 'google'
};

// Turf status
const TURF_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended'
};

// Booking status
const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  NO_SHOW: 'no_show'
};

// Payment status
const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

// Sports types
const SPORTS = {
  CRICKET: 'cricket',
  FOOTBALL: 'football',
  BADMINTON: 'badminton',
  TENNIS: 'tennis',
  BASKETBALL: 'basketball',
  VOLLEYBALL: 'volleyball',
  HOCKEY: 'hockey'
};

// Amenities
const AMENITIES = {
  PARKING: 'parking',
  WASHROOM: 'washroom',
  CHANGING_ROOM: 'changing_room',
  FIRST_AID: 'first_aid',
  DRINKING_WATER: 'drinking_water',
  CAFETERIA: 'cafeteria',
  SEATING_AREA: 'seating_area',
  FLOODLIGHTS: 'floodlights',
  EQUIPMENT_RENTAL: 'equipment_rental',
  SCOREBOARD: 'scoreboard'
};

// Slot durations (in minutes)
const SLOT_DURATIONS = [30, 60, 90, 120];

// Days of week
const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
];

// Cancellation policy
const CANCELLATION_POLICY = {
  MIN_HOURS_BEFORE: 2, // Minimum hours before booking to cancel
  REFUND_PERCENTAGE: 90 // Percentage of refund on cancellation
};

// Platform settings
const PLATFORM_SETTINGS = {
  DEFAULT_COMMISSION: 12, // Percentage
  DEFAULT_PAGE_LIMIT: 10,
  MAX_PAGE_LIMIT: 100,
  DEFAULT_SEARCH_RADIUS: 10000, // meters (10km)
  MAX_IMAGES_PER_TURF: 10,
  MIN_PASSWORD_LENGTH: 6
};

// HTTP Status codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500
};

// Error messages
const ERROR_MESSAGES = {
  // Auth errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  USER_EXISTS: 'User already exists with this email',
  UNAUTHORIZED: 'Not authorized to access this route',
  FORBIDDEN: 'You do not have permission to perform this action',
  TOKEN_INVALID: 'Invalid or expired token',
  ACCOUNT_INACTIVE: 'Account is deactivated. Please contact support.',
  
  // Turf errors
  TURF_NOT_FOUND: 'Turf not found',
  TURF_NOT_APPROVED: 'Turf is not approved yet',
  TURF_INACTIVE: 'Turf is not active',
  
  // Booking errors
  BOOKING_NOT_FOUND: 'Booking not found',
  SLOT_UNAVAILABLE: 'This slot is already booked',
  PAST_DATE_BOOKING: 'Cannot book for past dates',
  CANCELLATION_NOT_ALLOWED: 'Bookings can only be cancelled at least 2 hours in advance',
  BOOKING_ALREADY_CANCELLED: 'Booking is already cancelled',
  
  // Payment errors
  PAYMENT_FAILED: 'Payment verification failed',
  PAYMENT_REQUIRED: 'Payment is required to confirm booking',
  
  // Validation errors
  VALIDATION_FAILED: 'Validation failed',
  INVALID_INPUT: 'Invalid input provided',
  REQUIRED_FIELD: 'is required'
};

// Success messages
const SUCCESS_MESSAGES = {
  // Auth
  REGISTER_SUCCESS: 'User registered successfully',
  LOGIN_SUCCESS: 'Login successful',
  PROFILE_UPDATED: 'Profile updated successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
  
  // Turf
  TURF_CREATED: 'Turf created successfully. Pending admin approval.',
  TURF_UPDATED: 'Turf updated successfully',
  TURF_DELETED: 'Turf deleted successfully',
  TURF_APPROVED: 'Turf approved successfully',
  TURF_REJECTED: 'Turf rejected',
  
  // Booking
  BOOKING_CREATED: 'Booking created. Please complete payment.',
  BOOKING_CONFIRMED: 'Payment verified and booking confirmed',
  BOOKING_CANCELLED: 'Booking cancelled successfully',
  
  // General
  SUCCESS: 'Operation successful',
  UPDATED: 'Updated successfully',
  DELETED: 'Deleted successfully'
};

module.exports = {
  USER_ROLES,
  AUTH_PROVIDERS,
  TURF_STATUS,
  BOOKING_STATUS,
  PAYMENT_STATUS,
  SPORTS,
  AMENITIES,
  SLOT_DURATIONS,
  DAYS_OF_WEEK,
  CANCELLATION_POLICY,
  PLATFORM_SETTINGS,
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
};
