import { Link, useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();

  function handleLogout() {
    // 1️⃣ Primeiro redireciona
    navigate("/");

    // 2️⃣ Depois remove o auth
    setTimeout(() => {
      localStorage.removeItem("authorized");
    }, 50);
  }

  return (
    <>
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
        .logout-btn {
          border: none;
          background: rgba(255,255,255,0.2);
          color: white;
          padding: 0.45rem 0.75rem;
          border-radius: 8px;
          cursor: pointer;
          transition: background .2s;
        }
        .logout-btn:hover {
          background: rgba(255,255,255,0.35);
        }
      `}</style>

      <nav className="navbar navbar-expand-lg navbar-dark gm-navbar">
        <div className="container">
          <Link className="navbar-brand" to="/">
            <i className="fas fa-book-open me-2" />
            GM Biblioteca
          </Link>

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

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto align-items-center">
              <li className="nav-item me-2">
                <Link className="nav-link" to="/form/livro">
                  <i className="fas fa-book me-1" />
                  Registar Livro
                </Link>
              </li>

              <li className="nav-item me-3">
                <Link className="nav-link" to="/form/requisicao">
                  <i className="fas fa-hand-holding me-1" />
                  Registar Empréstimo
                </Link>
              </li>

              {/* 🔴 Logout Button */}
              <li className="nav-item">
                <button className="logout-btn" onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt me-1" />
                  Sair
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
}
