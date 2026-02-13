import { useState } from 'react'
import { Button } from '@components/ui/Button'
import { useChat } from '@hooks/useChat'

export const ChatbotTest = () => {
  const [testMessage, setTestMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState('')
  const { sendMessage } = useChat()

  const testAI = async () => {
    if (!testMessage.trim()) return
    
    setIsLoading(true)
    setResponse('')
    
    try {
      await sendMessage(testMessage)
      setResponse('✅ AI response received! Check the chat interface.')
    } catch (error) {
      setResponse(`❌ Error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testQuestions = [
    "What are the best tours in Ethiopia?",
    "Tell me about Ethiopian coffee culture",
    "What should I visit in Lalibela?",
    "When is the best time to visit Ethiopia?"
  ]

  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        🤖 AI Chatbot Test
      </h3>
      
      <div className="space-y-4">
        {/* Manual Test */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Test Message:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Ask the AI something..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              onKeyPress={(e) => e.key === 'Enter' && testAI()}
            />
            <Button 
              onClick={testAI} 
              disabled={isLoading || !testMessage.trim()}
              className="px-4 py-2"
            >
              {isLoading ? '⏳' : '🚀'} Test
            </Button>
          </div>
        </div>

        {/* Quick Test Buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Quick Tests:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {testQuestions.map((question, index) => (
              <Button
                key={index}
                onClick={() => setTestMessage(question)}
                variant="outline"
                size="sm"
                className="text-left justify-start text-xs"
              >
                {question}
              </Button>
            ))}
          </div>
        </div>

        {/* Response */}
        {response && (
          <div className={`p-3 rounded-md text-sm ${
            response.startsWith('✅') 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}>
            {response}
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>• Click the floating chat button (🤖) to open the AI assistant</p>
          <p>• On mobile: Full-screen modal | On desktop: Draggable window</p>
          <p>• The AI is connected to Google Gemini 2.5 Flash (FREE model)</p>
          <p>• Backend server must be running on port 5000</p>
        </div>
      </div>
    </div>
  )
}