import { tryParseChunk, processStreamChunks } from '../stream-utils'

describe('Stream Utilities', () => {
  describe('tryParseChunk', () => {
    it('should parse valid JSON and return parsed object', () => {
      const validJson = '{"partial": {"responseToUser": "test"}}'
      expect(() => {
        const result = tryParseChunk(validJson)
        expect(result).toEqual({ partial: { responseToUser: "test" } })
      }).not.toThrow()
    })

    it('should return null and log error for invalid JSON', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const invalidJson = '{"invalid": json}'
      
      const result = tryParseChunk(invalidJson)
      
      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error parsing stream chunk:',
        expect.any(SyntaxError)
      )
      
      consoleSpy.mockRestore()
    })

    it('should handle empty string', () => {
      const result = tryParseChunk('')
      expect(result).toBeNull()
    })
  })

  describe('processStreamChunks', () => {
    const createTestStream = (responses: string[]) => {
      const readMock = jest.fn()
      
      responses.forEach((response) => {
        readMock.mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode(response)
        })
      })
      
      readMock.mockResolvedValueOnce({ done: true })
      
      return {
        getReader: () => ({ 
          read: readMock,
          releaseLock: jest.fn()
        })
      }
    }

    it('should yield parsed valid JSON chunks', async () => {
      const responses = [
        '{"partial": {"responseToUser": "first"}}',
        '{"final": {"responseToUser": "second"}}'
      ]
      
      const mockStream = createTestStream(responses)
      
      const results = []
      for await (const chunk of processStreamChunks(mockStream as unknown as ReadableStream)) {
        results.push(chunk)
      }
      
      expect(results).toHaveLength(2)
      expect(results[0]).toEqual({ partial: { responseToUser: "first" } })
      expect(results[1]).toEqual({ final: { responseToUser: "second" } })
    })

    it('should skip empty chunks', async () => {
      const responses = ['', '   ', '{"valid": "chunk"}', '\n']
      const mockStream = createTestStream(responses)
      
      const results = []
      for await (const chunk of processStreamChunks(mockStream as unknown as ReadableStream)) {
        results.push(chunk)
      }
      
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({ valid: "chunk" })
    })

    it('should skip invalid JSON chunks and continue processing', async () => {
      const responses = [
        'invalid json',
        '{"valid": "chunk1"}',
        '{broken: json}',
        '{"valid": "chunk2"}'
      ]
      const mockStream = createTestStream(responses)
      
      const results = []
      for await (const chunk of processStreamChunks(mockStream as unknown as ReadableStream)) {
        results.push(chunk)
      }
      
      expect(results).toHaveLength(2)
      expect(results[0]).toEqual({ valid: "chunk1" })
      expect(results[1]).toEqual({ valid: "chunk2" })
    })

    it('should properly release reader lock', async () => {
      const mockStream = createTestStream(['{"test": "data"}'])
      const releaseLockSpy = jest.fn()
      mockStream.getReader = () => ({
        read: jest.fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('{"test": "data"}')
          })
          .mockResolvedValueOnce({ done: true }),
        releaseLock: releaseLockSpy
      })
      
      const results = []
      for await (const chunk of processStreamChunks(mockStream as unknown as ReadableStream)) {
        results.push(chunk)
      }
      
      expect(releaseLockSpy).toHaveBeenCalled()
    })
  })
})