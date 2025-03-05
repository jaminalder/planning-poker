import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function JoinSession() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [userName, setUserName] = useState('')
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
          avatar_id: 1, // Dummy value to satisfy DB constraint
          is_host: false,
        })
      
      if (participantError) throw participantError
      
      // Store user info in localStorage
      localStorage.setItem('planningPoker_userName', userName)
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
      <section className="section">
        <div className="container has-text-centered">
          <div className="is-flex is-justify-content-center">
            <span className="icon is-large">
              <i className="fas fa-spinner fa-pulse"></i>
            </span>
            <span className="ml-3">Loading...</span>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="section">
        <div className="container">
          <div className="columns is-centered">
            <div className="column is-half">
              <div className="card">
                <div className="card-content has-text-centered">
                  <h2 className="title is-4 has-text-danger">Error</h2>
                  <p className="mb-4">{error}</p>
                  <button
                    className="button is-primary"
                    onClick={() => navigate('/')}
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="section">
      <div className="container">
        <div className="columns is-centered">
          <div className="column is-half">
            <div className="card">
              <div className="card-content">
                <h1 className="title is-3 has-text-centered">
                  Join Planning Session
                </h1>
                <p className="subtitle is-5 has-text-centered mb-5">
                  {session?.name || 'Planning Poker Session'}
                </p>
                
                <form onSubmit={joinSession}>
                  <div className="field">
                    <label htmlFor="userName" className="label">
                      Your Name
                    </label>
                    <div className="control">
                      <input
                        id="userName"
                        className="input"
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Enter your name"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="field mt-5">
                    <div className="control">
                      <button
                        type="submit"
                        className={`button is-primary is-fullwidth ${joining ? 'is-loading' : ''}`}
                        disabled={joining}
                      >
                        {joining ? 'Joining...' : 'Join Session'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default JoinSession