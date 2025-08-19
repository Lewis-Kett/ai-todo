// Mock BAML client for Jest tests
module.exports = {
  b: {
    HandleTodoRequest: jest.fn(),
    stream: {
      HandleTodoRequest: jest.fn(() => {
        // Return an async generator by default
        return (async function* () {
          yield { action: 'chat', responseToUser: 'Default mock response' }
        })()
      })
    }
  }
}