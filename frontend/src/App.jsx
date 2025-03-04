import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'

function App() {
  const [message, setMessage] = useState('')

  useEffect(() => {
    const testConnection = async () => {
      try {
        const { data, error } = await supabase
          .from('poker_sessions')
          .select('*')
          .limit(1)

        if (error) throw error

        setMessage('Successfully connected to Supabase!')
      } catch (error) {
        console.error('Error connecting to Supabase:', error)
        setMessage('Failed to connect to Supabase.')
      }
    }

    testConnection()
  }, [])

  return (
    <div className="flex min-h-screen justify-center items-center bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-4">Planning Poker Setup</h1>
        <p className="text-center">{message}</p>
      </div>
    </div>
  )
}

export default App
