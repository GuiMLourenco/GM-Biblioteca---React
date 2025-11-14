import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function AuthorSearchPopup({ open, onClose, onSelect, multiple = false }) {
  const [query, setQuery] = useState('');
  const [authors, setAuthors] = useState([]);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (!open) return;
    loadAuthors();
  }, [open, query]);

  async function loadAuthors() {
    const q = supabase
      .from('autor')
      .select('au_cod, au_nome')
      .order('au_nome', { ascending: true });

    if (query) q.ilike('au_nome', `%${query}%`);

    const { data } = await q;
    setAuthors(data || []);
  }

  function handleToggle(author) {
    if (multiple) {
      setSelected((prev) =>
        prev.some((s) => s.au_cod === author.au_cod)
          ? prev.filter((s) => s.au_cod !== author.au_cod)
          : [...prev, author]
      );
    } else {
      setSelected([author]);
    }
  }

  function handleConfirm() {
    onSelect(selected.map((s) => s.au_nome));
    onClose();
  }

  if (!open) return null;

  return (
    <>
      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1050;
        }
        .modal-content {
          background: #fff;
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,.25);
        }
        .modal-header {
          background: linear-gradient(135deg, #a02c2c, #8b1e1e);
          color: #fff;
          padding: 0.75rem 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .modal-body {
          flex: 1;
          padding: 1rem;
          overflow-y: auto;
        }
        .modal-footer {
          padding: 0.75rem 1rem;
          border-top: 1px solid #e5e5e5;
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
        }
        .search-input {
          border-radius: 8px;
          border: 1px solid #ced4da;
          padding: 0.5rem 0.75rem;
          width: 100%;
          margin-bottom: 0.75rem;
        }
        .author-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.4rem 0.6rem;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .author-row:hover {
          background: #fdeaea;
        }
        .author-row.selected {
          background: #f5d8d8;
          font-weight: 500;
        }
      `}</style>

      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <span>Pesquisar Autor{multiple && 'es'}</span>
            <button type="button" className="btn btn-sm btn-light" onClick={onClose}>
              <i className="fas fa-times" />
            </button>
          </div>

          <div className="modal-body">
            <input
              className="search-input"
              placeholder="Pesquisar por nome..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            {authors.map((aut) => (
              <div
                key={aut.au_cod}
                className={`author-row ${selected.some((s) => s.au_cod === aut.au_cod) ? 'selected' : ''}`}
                onClick={() => handleToggle(aut)}
              >
                <span>{aut.au_nome}</span>
                <i className={`fas fa-${selected.some((s) => s.au_cod === aut.au_cod) ? 'check-square' : 'square'}`} />
              </div>
            ))}

            {authors.length === 0 && <p className="text-muted small">Nenhum autor encontrado.</p>}
          </div>

          <div className="modal-footer">
            <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn btn-sm btn-primary" onClick={handleConfirm}>
              Ok
            </button>
          </div>
        </div>
      </div>
    </>
  );
}