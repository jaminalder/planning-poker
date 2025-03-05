import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <nav className="navbar is-primary" role="navigation" aria-label="main navigation">
      <div className="container">
        <div className="navbar-brand">
          <Link to="/" className="navbar-item">
            <strong>Planning Poker</strong>
          </Link>

          <a
            role="button"
            className="navbar-burger"
            aria-label="menu"
            aria-expanded="false"
            data-target="navbarMenu"
            onClick={() => {
              const burger = document.querySelector('.navbar-burger');
              const menu = document.querySelector('.navbar-menu');
              burger.classList.toggle('is-active');
              menu.classList.toggle('is-active');
            }}
          >
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </a>
        </div>

        <div id="navbarMenu" className="navbar-menu">
          <div className="navbar-end">
            <Link to="/" className="navbar-item">
              Home
            </Link>
            <a href="https://github.com/yourusername/planning-poker" className="navbar-item" target="_blank" rel="noopener noreferrer">
              <span className="icon">
                <i className="fab fa-github"></i>
              </span>
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar