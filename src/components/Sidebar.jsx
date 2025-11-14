import { useState } from 'react';

const tables = [
  { key: 'autor',      label: 'Autores' },
  { key: 'editora',    label: 'Editoras' },
  { key: 'genero',     label: 'Géneros' },
  { key: 'livro',      label: 'Livros' },
  { key: 'utente',     label: 'Utentes' },
  { key: 'requisicao', label: 'Requisições' },
];

export default function Sidebar() {
  const [openMap, setOpenMap] = useState({});

  const toggle = (key) =>
    setOpenMap((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div
      className="card"
      style={{ width: 260, borderRadius: 12, overflow: 'hidden' }}
    >
      <div className="card-header">Tabelas</div>
      <div className="list-group list-group-flush">
        {tables.map((t) => (
          <div key={t.key}>
            <button
              className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
              onClick={() => toggle(t.key)}
              style={{ backgroundColor: '#fdeaea', fontWeight: 600 }}
            >
              {t.label}
              <i
                className={`fa-xs fas fa-chevron-down ${
                  openMap[t.key] ? 'fa-rotate-180' : ''
                }`}
              />
            </button>

            {openMap[t.key] && (
              <div className="px-3 py-2 d-grid gap-2">
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => console.log(`Abrir formulário adicionar ${t.key}`)}
                >
                  <i className="fas fa-plus me-1" /> Adicionar
                </button>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => console.log(`Abrir lista ${t.key}`)}
                >
                  <i className="fas fa-list me-1" /> Ver todos
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}