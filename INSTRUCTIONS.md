# Planning Poker: Implementation of Session Creation & Joining

This guide walks through implementing the first core functionality of your Planning Poker app with Supabase.

## 1. Project Structure Setup

First, let's set up the project structure properly:

```bash
cd frontend
mkdir -p src/components src/pages src/hooks src/contexts src/utils
```

## 2. Create Basic Router Structure

Create a router configuration file:

```javascript
// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Session from './pages/Session'
import JoinSession from './pages/JoinSession'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/session/:sessionId" element={<Session />} />
        <Route path="/join/:sessionId" element={<JoinSession />} />
      </Routes>
    </Router>
  )
}

export default App
```

## 3. Create Landing Page (Home Component)

This is where users enter their name and create a session:

```javascript
// src/pages/Home.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { nanoid } from 'nanoid'

const avatars = [1, 2, 3, 4, 5, 6] // You can expand this array with more avatar options

function Home() {
  const [userName, setUserName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const createSession = async (e) => {
    e.preventDefault()
    
    if (!userName.trim()) {
      setError('Please enter your name')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Create a readable, short session ID
      const sessionId = `poker-${nanoid(8)}`
      
      // Create session in Supabase
      const { data: session, error: sessionError } = await supabase
        .from('poker_sessions')
        .insert({
          id: sessionId,
          name: `${userName}'s Planning Poker`,
          active: true,
        })
        .select()
      
      if (sessionError) throw sessionError
      
      // Add user as host participant
      const { error: participantError } = await supabase
        .from('participants')
        .insert({
          session_id: sessionId,
          user_name: userName,
          avatar_id: selectedAvatar,
          is_host: true,
        })
      
      if (participantError) throw participantError

      // Store user info in localStorage
      localStorage.setItem('planningPoker_userName', userName)
      localStorage.setItem('planningPoker_avatarId', selectedAvatar)
      localStorage.setItem('planningPoker_sessionId', sessionId)
      localStorage.setItem('planningPoker_isHost', 'true')
      
      // Navigate to session page
      navigate(`/session/${sessionId}`)
    } catch (err) {
      console.error('Error creating session:', err)
      setError('Failed to create session. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center text-indigo-700 mb-8">Planning Poker</h1>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={createSession} className="space-y-6">
          <div>
            <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">
              Your Name
            </label>
            <input
              id="userName"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose Avatar
            </label>
            <div className="grid grid-cols-6 gap-2">
              {avatars.map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  className={`flex items-center justify-center p-2 rounded-full ${
                    selectedAvatar === avatar ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setSelectedAvatar(avatar)}
                >
                  <img 
                    src={`/avatars/avatar-${avatar}.png`} 
                    alt={`Avatar ${avatar}`} 
                    className="w-10 h-10 rounded-full"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://api.dicebear.com/6.x/bottts/svg?seed=${avatar}`;
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-md flex items-center justify-center transition-colors"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </span>
            ) : (
              "Create Planning Session"
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Home
```

## 4. Create Session Page

This displays the active session and allows sharing the link:

```javascript
// src/pages/Session.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Session() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Check if user has session info in localStorage
    const storedSessionId = localStorage.getItem('planningPoker_sessionId')
    const userName = localStorage.getItem('planningPoker_userName')
    
    if (!userName || sessionId !== storedSessionId) {
      // Redirect to join page if not already a participant
      navigate(`/join/${sessionId}`)
      return
    }
    
    fetchSessionData()
    setupRealtimeSubscription()
    
    return () => {
      // Cleanup subscription on unmount
      supabase.removeAllChannels()
    }
  }, [sessionId])

  const fetchSessionData = async () => {
    try {
      setLoading(true)
      
      // Fetch session data
      const { data: sessionData, error: sessionError } = await supabase
        .from('poker_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()
      
      if (sessionError) throw sessionError
      if (!sessionData) {
        setError('Session not found')
        setLoading(false)
        return
      }
      
      setSession(sessionData)
      
      // Fetch participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('participants')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
      
      if (participantsError) throw participantsError
      setParticipants(participantsData)
    } catch (err) {
      console.error('Error fetching session data:', err)
      setError('Failed to load session data')
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    // Subscribe to changes on the participants table
    supabase
      .channel('participants-channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'participants',
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        setParticipants(prev => [...prev, payload.new])
      })
      .subscribe()
  }

  const copySessionLink = () => {
    const link = `${window.location.origin}/join/${sessionId}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">{session?.name || 'Planning Session'}</h1>
            <div className="flex space-x-2">
              <button
                onClick={copySessionLink}
                className={`px-4 py-2 rounded-lg ${
                  copied ? 'bg-green-500' : 'bg-indigo-600'
                } text-white font-medium flex items-center`}
              >
                {copied ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                    Share Link
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Participants</h2>
            {participants.length === 0 ? (
              <p className="text-gray-500 italic">No participants yet</p>
            ) : (
              <div className="flex flex-wrap gap-4">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center bg-gray-50 rounded-full px-4 py-2">
                    <img
                      src={`https://api.dicebear.com/6.x/bottts/svg?seed=${participant.avatar_id}`}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full mr-2"
                    />
                    <span className="font-medium text-gray-800">
                      {participant.user_name}
                      {participant.is_host && (
                        <span className="ml-1 text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                          Host
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Future planning functionality will go here */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <p className="text-center text-gray-600">
              Session is ready! Share the link with your team to start planning.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Session
```

## 5. Create Join Session Page

This handles the flow for users joining an existing session:

```javascript
// src/pages/JoinSession.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const avatars = [1, 2, 3, 4, 5, 6] // Same avatar options as Home page

function JoinSession() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [userName, setUserName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(1)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [session, setSession] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Check if user is already part of this session
    const storedSessionId = localStorage.getItem('planningPoker_sessionId')
    const storedUserName = localStorage.getItem('planningPoker_userName')
    
    if (storedSessionId === sessionId && storedUserName) {
      navigate(`/session/${sessionId}`)
      return
    }
    
    checkSessionExists()
  }, [sessionId])

  const checkSessionExists = async () => {
    try {
      const { data, error } = await supabase
        .from('poker_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()
      
      if (error) throw error
      
      if (!data) {
        setError('Session not found')
      } else if (!data.active) {
        setError('This session is no longer active')
      } else {
        setSession(data)
      }
    } catch (err) {
      console.error('Error checking session:', err)
      setError('Failed to find the session')
    } finally {
      setLoading(false)
    }
  }

  const joinSession = async (e) => {
    e.preventDefault()
    
    if (!userName.trim()) {
      setError('Please enter your name')
      return
    }
    
    setJoining(true)
    setError(null)
    
    try {
      // Add user as participant
      const { error: participantError } = await supabase
        .from('participants')
        .insert({
          session_id: sessionId,
          user_name: userName,
          avatar_id: selectedAvatar,
          is_host: false,
        })
      
      if (participantError) throw participantError
      
      // Store user info in localStorage
      localStorage.setItem('planningPoker_userName', userName)
      localStorage.setItem('planningPoker_avatarId', selectedAvatar)
      localStorage.setItem('planningPoker_sessionId', sessionId)
      localStorage.setItem('planningPoker_isHost', 'false')
      
      // Navigate to session page
      navigate(`/session/${sessionId}`)
    } catch (err) {
      console.error('Error joining session:', err)
      setError('Failed to join session. Please try again.')
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-center text-indigo-700 mb-2">
          Join Planning Session
        </h1>
        <p className="text-center text-gray-600 mb-6">
          {session?.name || 'Planning Poker Session'}
        </p>
        
        <form onSubmit={joinSession} className="space-y-6">
          <div>
            <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">
              Your Name
            </label>
            <input
              id="userName"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose Avatar
            </label>
            <div className="grid grid-cols-6 gap-2">
              {avatars.map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  className={`flex items-center justify-center p-2 rounded-full ${
                    selectedAvatar === avatar ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setSelectedAvatar(avatar)}
                >
                  <img 
                    src={`https://api.dicebear.com/6.x/bottts/svg?seed=${avatar}`} 
                    alt={`Avatar ${avatar}`} 
                    className="w-10 h-10 rounded-full"
                  />
                </button>
              ))}
            </div>
          </div>
          
          <button
            type="submit"
            disabled={joining}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-md flex items-center justify-center transition-colors"
          >
            {joining ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Joining...
              </span>
            ) : (
              "Join Session"
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default JoinSession
```

## 6. Set Up Avatar Images

For the avatars, you have two options:

1. **Use DiceBear API (simplest)**: Already implemented in the code above
2. **Create local avatars**: 
   - Create a folder `public/avatars/`
   - Add avatar images named `avatar-1.png`, `avatar-2.png`, etc.

## 7. Adding CSS Improvements

Create a new file for additional styles:

```css
/* src/index.css - Add these to your existing Tailwind imports */

@layer components {
  .btn {
    @apply px-4 py-2 rounded-lg font-medium transition-all duration-200;
  }
  
  .btn-primary {
    @apply bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm;
  }
  
  .card {
    @apply bg-white rounded-xl shadow-md overflow-hidden;
  }
}
```

## 8. Test Your Implementation

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open the app in your browser
3. Create a session by entering your name and selecting an avatar
4. Copy the session link and open it in another browser or incognito window
5. Enter a different name and join the session
6. Verify that both participants appear in the session

## 9. Commit Your Changes

```bash
git add .
git commit -m "Implement basic session creation and joining functionality"
git push
```

## Key Features Implemented

- ✅ User enters name and creates a planning session
- ✅ Session creator gets sharable link
- ✅ Participants can join via link by entering their name
- ✅ Real-time participant list display
- ✅ Simplified authentication via localStorage
- ✅ Avatar selection for visual identity
- ✅ Error handling and loading states

This implementation lays the groundwork for your Planning Poker app with a clean, user-friendly interface. From here, you can build on this foundation to add the actual poker planning functionality in subsequent steps.
