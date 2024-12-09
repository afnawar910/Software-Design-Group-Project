const { validateEventInput } = require('../../middleware/eventMiddleware');


describe('Event Middleware', () => {
  let mockRequest;
  let mockResponse;
  let nextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    nextFunction = jest.fn();
  });

  test('validateEventInput should call next() for valid input', () => {
    mockRequest.body = {
      eventName: 'Valid Event',
      eventDescription: 'Valid Description',
      address1: '123 Test St',
      city: 'Test City',
      state: 'TX',
      zipCode: '12345',
      requiredSkills: ['Cleaning'],
      urgency: 'Medium',
      eventDate: '2024-12-01',
      startTime: '09:00',
      endTime: '12:00'
    };

    validateEventInput(mockRequest, mockResponse, nextFunction);
    expect(nextFunction).toHaveBeenCalled();
  });

  test('validateEventInput should handle missing required fields', () => {
    mockRequest.body = {};
    validateEventInput(mockRequest, mockResponse, nextFunction);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      errors: expect.objectContaining({
        eventName: expect.any(String),
        eventDescription: expect.any(String),
        address1: expect.any(String),
        city: expect.any(String),
        state: expect.any(String),
        zipCode: expect.any(String),
        requiredSkills: expect.any(String),
        urgency: expect.any(String),
        eventDate: expect.any(String),
        startTime: expect.any(String),
        endTime: expect.any(String)
      })
    }));
  });

  test('validateEventInput should handle invalid eventName', () => {
    mockRequest.body = {
      ...mockRequest.body,
      eventName: 'a'.repeat(101) // Exceeds 100 character limit
    };
    validateEventInput(mockRequest, mockResponse, nextFunction);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      errors: expect.objectContaining({
        eventName: 'Event Name must be 100 characters or less'
      })
    }));
  });

  test('validateEventInput should handle invalid state', () => {
    mockRequest.body = {
      ...mockRequest.body,
      state: 'Invalid'
    };
    validateEventInput(mockRequest, mockResponse, nextFunction);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      errors: expect.objectContaining({
        state: 'Valid state is required'
      })
    }));
  });

  test('validateEventInput should handle invalid zipCode', () => {
    mockRequest.body = {
      ...mockRequest.body,
      zipCode: '1234' // Less than 5 characters
    };
    validateEventInput(mockRequest, mockResponse, nextFunction);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      errors: expect.objectContaining({
        zipCode: 'Zip Code must be between 5 and 9 characters'
      })
    }));
  });

  test('validateEventInput should handle invalid requiredSkills', () => {
    mockRequest.body = {
      ...mockRequest.body,
      requiredSkills: [] // Empty array
    };
    validateEventInput(mockRequest, mockResponse, nextFunction);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      errors: expect.objectContaining({
        requiredSkills: 'At least one skill is required'
      })
    }));
  });

  test('validateEventInput should handle invalid urgency', () => {
    mockRequest.body = {
      ...mockRequest.body,
      urgency: 'Invalid'
    };
    validateEventInput(mockRequest, mockResponse, nextFunction);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      errors: expect.objectContaining({
        urgency: 'Valid urgency level is required'
      })
    }));
  });

  test('validateEventInput should handle invalid date format', () => {
    mockRequest.body = {
      ...mockRequest.body,
      eventDate: '2024/12/01' // Invalid format
    };
    validateEventInput(mockRequest, mockResponse, nextFunction);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      errors: expect.objectContaining({
        eventDate: 'Valid event date is required'
      })
    }));
  });

  test('validateEventInput should handle invalid time format', () => {
    mockRequest.body = {
      ...mockRequest.body,
      startTime: '9:00', // Invalid format
      endTime: '12:00'
    };
    validateEventInput(mockRequest, mockResponse, nextFunction);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      errors: expect.objectContaining({
        startTime: 'Valid start time is required'
      })
    }));
  });

  test('validateEventInput should handle end time before start time', () => {
    mockRequest.body = {
      ...mockRequest.body,
      startTime: '12:00',
      endTime: '09:00'
    };
    validateEventInput(mockRequest, mockResponse, nextFunction);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      errors: expect.objectContaining({
        endTime: 'End time must be after start time'
      })
    }));
  });
});