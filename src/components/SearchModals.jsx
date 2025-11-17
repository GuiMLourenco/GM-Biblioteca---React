import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { FaTimes, FaCheck, FaSearch, FaSpinner } from 'react-icons/fa';

/* ========== AUTOR ========== */
export function AuthorSearchModal({ open, onClose, onSelect }) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 20;
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    load();
  }, [open, query, page]);

  async function load() {
    setLoading(true);

    let countQ = supabase.from('autor').select('*', { count: 'exact', head: true });
    let dataQ = supabase.from('autor').select('au_cod, au_nome');

    if (query) {
      countQ = countQ.ilike('au_nome', `%${query}%`);
      dataQ = dataQ.ilike('au_nome', `%${query}%`);
    }

    const { count } = await countQ;
    const { data } = await dataQ
      .range((page - 1) * perPage, page * perPage - 1)
      .order('au_nome', { ascending: true });

    setTotal(count || 0);
    setRows(data || []);
    setLoading(false);
  }

  if (!open) return null;

  const numPages = Math.ceil(total / perPage);

  return (
    <ModalWrapper title="Pesquisar Autor" onClose={onClose}>
      <div className="modal-body">
        <SearchInput query={query} setQuery={setQuery} setPage={setPage} />
        {loading && <LoadingState />}
        {!loading && rows.length === 0 && <EmptyState />}
        {!loading && rows.map((row) => (
          <ResultRow
            key={row.au_cod}
            text={row.au_nome}
            onSelect={() => onSelect(row)}
          />
        ))}
      </div>
      <ModalFooter page={page} setPage={setPage} numPages={numPages} onClose={onClose} />
    </ModalWrapper>
  );
}

/* ========== EXEMPLAR (disponível) ========== */
export function ExemplarSearchModal({ open, onClose, onSelect }) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 20;
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    load();
  }, [open, query, page]);

  async function load() {
    setLoading(true);

    let countQ = supabase
      .from('livro_exemplar')
      .select('*, livro!inner(li_titulo)', { count: 'exact', head: true })
      .eq('lex_disponivel', true);

    let dataQ = supabase
      .from('livro_exemplar')
      .select('lex_cod, livro!inner(li_titulo)')
      .eq('lex_disponivel', true);

    if (query) {
      // Pesquisa por código do exemplar OU título do livro
      if (!isNaN(query)) {
        countQ = countQ.eq('lex_cod', Number(query));
        dataQ = dataQ.eq('lex_cod', Number(query));
      } else {
        countQ = countQ.ilike('livro.li_titulo', `%${query}%`);
        dataQ = dataQ.ilike('livro.li_titulo', `%${query}%`);
      }
    }

    const { count } = await countQ;
    const { data } = await dataQ
      .range((page - 1) * perPage, page * perPage - 1)
      .order('lex_cod', { ascending: true });

    setTotal(count || 0);
    setRows(data || []);
    setLoading(false);
  }

  if (!open) return null;

  const numPages = Math.ceil(total / perPage);

  return (
    <ModalWrapper title="Pesquisar Exemplar Disponível" onClose={onClose}>
      <div className="modal-body">
        <SearchInput
          query={query}
          setQuery={setQuery}
          setPage={setPage}
          placeholder="Pesquisar por título ou código do exemplar..."
        />
        {loading && <LoadingState />}
        {!loading && rows.length === 0 && <EmptyState />}
        {!loading && rows.map((row) => (
          <ResultRow
            key={row.lex_cod}
            text={`${row.livro.li_titulo} (Exemplar: ${row.lex_cod})`}
            onSelect={() => onSelect(row)}
          />
        ))}
      </div>
      <ModalFooter page={page} setPage={setPage} numPages={numPages} onClose={onClose} />
    </ModalWrapper>
  );
}

/* ========== LIVRO ========== */
export function LivroSearchModal({ open, onClose, onSelect }) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 20;
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    load();
  }, [open, query, page]);

  async function load() {
    setLoading(true);

    let countQ = supabase.from('livro').select('*', { count: 'exact', head: true });
    let dataQ = supabase.from('livro').select('li_cod, li_titulo');

    if (query) {
      // Pesquisa por título OU código
      if (!isNaN(query)) {
        countQ = countQ.eq('li_cod', Number(query));
        dataQ = dataQ.eq('li_cod', Number(query));
      } else {
        countQ = countQ.ilike('li_titulo', `%${query}%`);
        dataQ = dataQ.ilike('li_titulo', `%${query}%`);
      }
    }

    const { count } = await countQ;
    const { data } = await dataQ
      .range((page - 1) * perPage, page * perPage - 1)
      .order('li_titulo', { ascending: true });

    setTotal(count || 0);
    setRows(data || []);
    setLoading(false);
  }

  if (!open) return null;

  const numPages = Math.ceil(total / perPage);

  return (
    <ModalWrapper title="Pesquisar Livro" onClose={onClose}>
      <div className="modal-body">
        <SearchInput
          query={query}
          setQuery={setQuery}
          setPage={setPage}
          placeholder="Pesquisar por título ou código..."
        />
        {loading && <LoadingState />}
        {!loading && rows.length === 0 && <EmptyState />}
        {!loading && rows.map((row) => (
          <ResultRow
            key={row.li_cod}
            text={`${row.li_titulo} (ID: ${row.li_cod})`}
            onSelect={() => onSelect(row)}
          />
        ))}
      </div>
      <ModalFooter page={page} setPage={setPage} numPages={numPages} onClose={onClose} />
    </ModalWrapper>
  );
}

/* ========== UTENTE ========== */
export function UtenteSearchModal({ open, onClose, onSelect }) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 20;
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    load();
  }, [open, query, page]);

  async function load() {
    setLoading(true);

    let countQ = supabase.from('utente').select('*', { count: 'exact', head: true });
    let dataQ = supabase.from('utente').select('ut_cod, ut_nome');

    if (query) {
      // Pesquisa por nome OU código
      if (!isNaN(query)) {
        countQ = countQ.eq('ut_cod', Number(query));
        dataQ = dataQ.eq('ut_cod', Number(query));
      } else {
        countQ = countQ.ilike('ut_nome', `%${query}%`);
        dataQ = dataQ.ilike('ut_nome', `%${query}%`);
      }
    }

    const { count } = await countQ;
    const { data } = await dataQ
      .range((page - 1) * perPage, page * perPage - 1)
      .order('ut_nome', { ascending: true });

    setTotal(count || 0);
    setRows(data || []);
    setLoading(false);
  }

  if (!open) return null;

  const numPages = Math.ceil(total / perPage);

  return (
    <ModalWrapper title="Pesquisar Utente" onClose={onClose}>
      <div className="modal-body">
        <SearchInput
          query={query}
          setQuery={setQuery}
          setPage={setPage}
          placeholder="Pesquisar por nome ou código..."
        />
        {loading && <LoadingState />}
        {!loading && rows.length === 0 && <EmptyState />}
        {!loading && rows.map((row) => (
          <ResultRow
            key={row.ut_cod}
            text={`${row.ut_nome} (ID: ${row.ut_cod})`}
            onSelect={() => onSelect(row)}
          />
        ))}
      </div>
      <ModalFooter page={page} setPage={setPage} numPages={numPages} onClose={onClose} />
    </ModalWrapper>
  );
}

/* ========== COMPONENTES AUXILIARES ========== */
function ModalWrapper({ title, onClose, children }) {
  return (
    <>
      <style>{`
        .modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.modal-content {
  background: #fff;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}
@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* ----- HEADER (vermelho escuro) ----- */
.modal-header {
  background: linear-gradient(135deg, #a02c2c, #7a1d1d);
  color: #fff;
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-body {
  flex: 1;
  padding: 1.25rem;
  overflow-y: auto;
}

.modal-footer {
  padding: 1rem 1.25rem;
  border-top: 1px solid #e5e5e5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  background: #f8f9fa;
}

.search-input {
  border-radius: 8px;
  border: 1px solid #ced4da;
  padding: 0.65rem 1rem;
  width: 100%;
  margin-bottom: 1rem;
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #a02c2c;
  box-shadow: 0 0 0 0.2rem rgba(160, 44, 44, 0.25);
}

.result-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  margin-bottom: 0.5rem;
}

.result-row:hover {
  background: #f3d7d7;
  border-color: #a02c2c;
  transform: translateX(4px);
}

.result-text {
  flex: 1;
  font-weight: 500;
  color: #212529;
}

/* botão de fechar */
.btn-close-modal {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-close-modal:hover {
  background: rgba(255, 255, 255, 0.3);
}

      `}</style>

      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h5 className="mb-0 fw-bold">{title}</h5>
            <button type="button" className="btn-close-modal" onClick={onClose}>
              <FaTimes />
            </button>
          </div>
          {children}
        </div>
      </div>
    </>
  );
}

function SearchInput({ query, setQuery, setPage, placeholder = "Pesquisar..." }) {
  return (
    <div className="position-relative">
      
      <input
        className="search-input"
        style={{ paddingLeft: '1rem' }}
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setPage(1);
        }}
        autoFocus
      />
    </div>
  );
}

function ResultRow({ text, onSelect }) {
  return (
    <div className="result-row" onClick={onSelect}>
      <span className="result-text">{text}</span>
      <button className="btn btn-sm btn-success">
        <FaCheck className="me-1" />
        Selecionar
      </button>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="text-center py-4">
      <FaSpinner className="fa-spin text-primary mb-2" size={24} />
      <p className="text-muted mb-0">A carregar...</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-4">
      <p className="text-muted mb-0">Nenhum resultado encontrado.</p>
    </div>
  );
}

function ModalFooter({ page, setPage, numPages, onClose }) {
  return (
    <div className="modal-footer">
      <div className="flex-grow-1">
        {numPages > 1 && (
          <nav>
            <ul className="pagination pagination-sm mb-0">
              {[...Array(Math.min(numPages, 10))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <li key={pageNum} className={`page-item ${pageNum === page ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setPage(pageNum)}>
                      {pageNum}
                    </button>
                  </li>
                );
              })}
              {numPages > 10 && (
                <li className="page-item disabled">
                  <span className="page-link">...</span>
                </li>
              )}
            </ul>
          </nav>
        )}
      </div>
      <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
        Fechar
      </button>
    </div>
  );
}