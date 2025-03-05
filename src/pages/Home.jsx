import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { v4 as uuidv4 } from 'uuid'

function Home() {
  const [userName, setUserName] = useState('')
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
      // Generate a UUID for the session
      const sessionId = uuidv4()
      console.log('Generated session ID:', sessionId)
      
      // Create session in Supabase
      console.log('Attempting to create session...')
      const { data: session, error: sessionError } = await supabase
        .from('poker_sessions')
        .insert({
          id: sessionId,
          name: `${userName}'s Planning Poker`,
          active: true,
        })
        .select()
        
      console.log('Session creation response:', { data: session, error: sessionError })
      
      if (sessionError) throw sessionError
      
      // Add user as host participant
      console.log('Adding host participant...')
      const { data: participant, error: participantError } = await supabase
        .from('participants')
        .insert({
          session_id: sessionId,
          user_name: userName,
          avatar_id: 1, // Dummy value to satisfy DB constraint
          is_host: true,
        })
        .select()
        
      console.log('Participant creation response:', { data: participant, error: participantError })
      
      if (participantError) throw participantError

      // Store user info in localStorage
      localStorage.setItem('planningPoker_userName', userName)
      localStorage.setItem('planningPoker_sessionId', sessionId)
      localStorage.setItem('planningPoker_isHost', 'true')
      
      // Navigate to session page
      navigate(`/session/${sessionId}`)
    } catch (err) {
      console.error('Error creating session:', err)
      setError(`Failed to create session: ${err.message || JSON.stringify(err)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="section">
      <div className="container">
        <div className="columns is-centered">
          <div className="column is-half">
            <div className="card">
              <div className="card-content">
                <h1 className="title is-2 has-text-centered page-title">Planning Poker</h1>
                
                {error && (
                  <div className="notification is-danger">
                    {error}
                  </div>
                )}
                
                <form onSubmit={createSession}>
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
                  
                  <div className="field">
                    <div className="control">
                      <button
                        type="submit"
                        className={`button is-primary is-fullwidth ${loading ? 'is-loading' : ''}`}
                        disabled={loading}
                      >
                        {loading ? 'Creating...' : 'Create Planning Session'}
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

export default Home