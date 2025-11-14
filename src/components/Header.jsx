import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <>
      {/* CSS inline apenas para as cores / gradientes */}
      <style>{`
        :root {
          --primary-color: #a02c2c;
          --secondary-color: #f8f9fa;
        }
        .gm-navbar {
          background: linear-gradient(135deg, var(--primary-color), #8b1e1e);
        }
        .gm-navbar .nav-link {
          color: rgba(255,255,255,.85);
          transition: color .2s;
        }
        .gm-navbar .nav-link:hover,
        .gm-navbar .nav-link.active {
          color: #fff;
        }
        .navbar-brand {
          font-weight: bold;
          font-size: 1.5rem;
        }
      `}</style>

      <nav className="navbar navbar-expand-lg navbar-dark gm-navbar">
        <div className="container">
          {/* Título (link para homepage) */}
          <Link className="navbar-brand" to="/">
            <i className="fas fa-book-open me-2" />
            GM Biblioteca
          </Link>

          {/* Botão mobile hamburger */}
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Alternar navegação"
          >
            <span className="navbar-toggler-icon" />
          </button>

          {/* Links */}
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <Link className="nav-link" to="/registar">
                  <i className="fas fa-book me-1" />
                  Registar Livro
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/emprestimo">
                  <i className="fas fa-hand-holding me-1" />
                  Registar Empréstimo
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/gerir">
                  <i className="fas fa-database me-1" />
                  Gerir Dados
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
}