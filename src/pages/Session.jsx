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
    
    // Setup realtime subscription and store the channel for cleanup
    const channel = setupRealtimeSubscription()
    
    return () => {
      // Cleanup subscription on unmount
      if (channel) {
        console.log('Unsubscribing from realtime updates')
        channel.unsubscribe()
      }
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
    // Create a channel for real-time updates
    const channel = supabase.channel('public:participants')
    
    // Handle new participants joining
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'participants',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        console.log('New participant joined:', payload.new)
        setParticipants(prev => [...prev, payload.new])
      }
    )
    
    // Handle participant updates
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'participants',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        console.log('Participant updated:', payload.new)
        setParticipants(prev => 
          prev.map(p => p.id === payload.new.id ? payload.new : p)
        )
      }
    )
    
    // Handle participant leaving
    channel.on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'participants',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        console.log('Participant left:', payload.old)
        setParticipants(prev => 
          prev.filter(p => p.id !== payload.old.id)
        )
      }
    )
    
    // Subscribe to the channel
    channel.subscribe(status => {
      console.log('Realtime subscription status:', status)
      
      if (status === 'SUBSCRIBED') {
        console.log('Successfully subscribed to real-time updates')
      }
    })
    
    // Return the channel for cleanup
    return channel
  }

  const copySessionLink = () => {
    const link = `${window.location.origin}/join/${sessionId}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
          <div className="column is-three-quarters">
            <div className="card">
              <div className="card-content">
                <div className="level mb-5">
                  <div className="level-left">
                    <div className="level-item">
                      <h1 className="title is-3">{session?.name || 'Planning Session'}</h1>
                    </div>
                  </div>
                  <div className="level-right">
                    <div className="level-item">
                      <button
                        className={`button ${copied ? 'is-success' : 'is-info'}`}
                        onClick={copySessionLink}
                      >
                        <span className="icon">
                          <i className={`fas ${copied ? 'fa-check' : 'fa-link'}`}></i>
                        </span>
                        <span>{copied ? "Copied!" : "Share Link"}</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="box">
                  <h2 className="title is-4">Participants</h2>
                  
                  {participants.length === 0 ? (
                    <p className="has-text-centered is-italic">No participants yet</p>
                  ) : (
                    <div className="content">
                      {participants.map((participant) => (
                        <div key={participant.id} className="participant-item">
                          <span>
                            {participant.user_name}
                            {participant.is_host && (
                              <span className="host-badge">
                                Host
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="notification is-primary is-light mt-5">
                  <p className="has-text-centered">
                    Session is ready! Share the link with your team to start planning.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Session