import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Home from './pages/Home'
import Session from './pages/Session'
import JoinSession from './pages/JoinSession'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

// Diagnostic component to check Supabase connection
function DiagnosticPage() {
  const [status, setStatus] = useState('Checking connection...')
  const [tablesInfo, setTablesInfo] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Check connection by listing tables
        const { data, error } = await supabase
          .from('postgres_tables')
          .select('*')
          .eq('table_schema', 'public')
        
        if (error) {
          setStatus('Connection error')
          setError(error.message)
          return
        }

        setStatus('Connected successfully')
        setTablesInfo(data || [])

        // Try to list tables another way
        const { data: tableList, error: tableError } = await supabase
          .rpc('get_tables')
        
        if (tableError) {
          console.error('RPC error:', tableError)
        } else {
          console.log('Tables from RPC:', tableList)
        }
      } catch (err) {
        setStatus('Error checking connection')
        setError(err.message)
        console.error(err)
      }
    }

    checkConnection()
  }, [])

  return (
    <section className="section">
      <div className="container">
        <div className="card">
          <div className="card-content">
            <h1 className="title is-3">Supabase Diagnostic</h1>
            
            <div className="box mb-5">
              <h2 className="title is-4">Connection Status</h2>
              <p className={`has-text-${status === 'Connected successfully' ? 'success' : (error ? 'danger' : 'info')}`}>
                {status}
              </p>
              {error && (
                <p className="has-text-danger">{error}</p>
              )}
            </div>

            <div className="box mb-5">
              <h2 className="title is-4">Tables Information</h2>
              {tablesInfo.length === 0 ? (
                <p className="has-text-centered is-italic">No tables found or unable to access table information</p>
              ) : (
                <ul>
                  {tablesInfo.map((table, index) => (
                    <li key={index} className="mb-2">
                      <span className="icon-text">
                        <span className="icon has-text-info">
                          <i className="fas fa-table"></i>
                        </span>
                        <span>{table.table_name}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="box">
              <h2 className="title is-4">Create Tables</h2>
              <button 
                className="button is-success"
                onClick={async () => {
                  try {
                    // Create poker_sessions table
                    await supabase.rpc('create_poker_sessions_table')
                    
                    // Create participants table
                    await supabase.rpc('create_participants_table')
                    
                    alert('Tables created successfully!')
                    window.location.reload()
                  } catch (err) {
                    alert('Error creating tables: ' + err.message)
                    console.error(err)
                  }
                }}
              >
                <span className="icon">
                  <i className="fas fa-plus"></i>
                </span>
                <span>Create Required Tables</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function App() {
  return (
    <Router>
      <div className="has-background-light" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/session/:sessionId" element={<Session />} />
            <Route path="/join/:sessionId" element={<JoinSession />} />
            <Route path="/diagnostic" element={<DiagnosticPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App