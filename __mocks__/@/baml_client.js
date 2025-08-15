// Mock BAML client for Jest tests
module.exports = {
  b: {
    HandleTodoRequest: jest.fn(),
    stream: {
      HandleTodoRequest: jest.fn(() => ({
        toStreamable: jest.fn().mockReturnValue('mock-streamable')
      }))
    }
  }
}