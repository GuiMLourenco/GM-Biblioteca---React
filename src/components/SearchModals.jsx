import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';


/* ========== AUTOR ========== */
export function AuthorSearchModal({ open, onClose, onSelect }) {
  return <BaseSearchModal
    open={open}
    onClose={onClose}
    onSelect={onSelect}
    title="Pesquisar Autor"
    table="autor"
    columns={['au_cod', 'au_nome']}
    searchCols={['au_nome']}
    display={(row) => row.au_nome}
  />;
}

/* ========== EXEMPLAR (disponível) ========== */
export function ExemplarSearchModal({ open, onClose, onSelect }) {
  return <BaseSearchModal
    open={open}
    onClose={onClose}
    onSelect={onSelect}
    title="Pesquisar Exemplar Disponível"
    table="livro_exemplar"
    columns={['lex_cod', 'livro(li_titulo)']}
    filters={[{ column: 'lex_disponivel', operator: 'eq', value: true }]}
    searchCols={['livro.li_titulo', 'lex_cod']}
    display={(row) => `${row.livro.li_titulo} (Exemplar: ${row.lex_cod})`}
  />;
}

/* ========== LIVRO ========== */
export function LivroSearchModal({ open, onClose, onSelect }) {
  return <BaseSearchModal
    open={open}
    onClose={onSelect}
    onSelect={onSelect}
    title="Pesquisar Livro"
    table="livro"
    columns={['li_cod', 'li_titulo']}
    searchCols={['li_titulo', 'li_cod']}
    display={(row) => `${row.li_titulo} (ID: ${row.li_cod})`}
  />;
}

/* ========== UTENTE ========== */
export function UtenteSearchModal({ open, onClose, onSelect }) {
  return <BaseSearchModal
    open={open}
    onClose={onClose}
    onSelect={onSelect}
    title="Pesquisar Utente"
    table="utente"
    columns={['ut_cod', 'ut_nome']}
    searchCols={['ut_nome', 'ut_cod']}
    display={(row) => `${row.ut_nome} (ID: ${row.ut_cod})`}
  />;
}

/* ========== BASE REUTILIZÁVEL ========== */
function BaseSearchModal({ open, onClose, onSelect, title, table, columns, filters = [], searchCols = [], display }) {
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

    // contagem
    let countQ = supabase.from(table).select('*', { count: 'exact', head: true });
    filters.forEach((f) => (countQ = countQ.filter(f.column, f.operator, f.value)));
    if (query) {
      countQ = countQ.or(searchCols.map((c) => `${c}.ilike.%${query}%`).join(','));
    }
    const { count } = await countQ;

    // dados
    let dataQ = supabase.from(table).select(columns.join(','));
    filters.forEach((f) => (dataQ = dataQ.filter(f.column, f.operator, f.value)));
    if (query) dataQ = dataQ.or(searchCols.map((c) => `${c}.ilike.%${query}%`).join(','));
    dataQ = dataQ.range((page - 1) * perPage, page * perPage - 1).order(columns[1], { ascending: true });

    const { data } = await dataQ;

    setTotal(count || 0);
    setRows(data || []);
    setLoading(false);
  }

  if (!open) return null;

  const numPages = Math.ceil(total / perPage);

  return (
    <>
      <style>{`
        .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.45); display:flex; align-items:center; justify-content:center; z-index:1050; }
        .modal-content { background:#fff; border-radius:12px; width:90%; max-width:600px; max-height:80vh; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,.25); }
        .modal-header { background:linear-gradient(135deg,#a02c2c,#8b1e1e); color:#fff; padding:.75rem 1rem; display:flex; align-items:center; justify-content:space-between; }
        .modal-body { flex:1; padding:1rem; overflow-y:auto; }
        .modal-footer { padding:.75rem 1rem; border-top:1px solid #e5e5e5; display:flex; justify-content:flex-end; gap:.5rem; }
        .search-input { border-radius:8px; border:1px solid #ced4da; padding:.5rem .75rem; width:100%; margin-bottom:.75rem; }
        .result-row { display:flex; align-items:center; justify-content:space-between; padding:.4rem .6rem; border-radius:6px; cursor:pointer; transition:background .2s; }
        .result-row:hover { background:#fdeaea; }
      `}</style>

      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <span>{title}</span>
            <button type="button" className="btn btn-sm btn-light" onClick={onClose}><i className="fas fa-times" /></button>
          </div>

          <div className="modal-body">
            <input className="search-input" placeholder="Pesquisar..." value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
            {loading && <p className="text-muted">A carregar...</p>}
            {!loading && rows.length === 0 && <p className="text-muted">Nenhum resultado.</p>}
            {!loading && rows.map((row) => (
              <div key={row[columns[0]]} className="result-row" onClick={() => onSelect(row)}>
                <span>{display(row)}</span>
                <button className="btn btn-sm btn-success"><i className="fas fa-check" /> Selecionar</button>
              </div>
            ))}
          </div>

          <div className="modal-footer">
            {numPages > 1 && (
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  {[...Array(numPages)].map((_, i) => (
                    <li key={i + 1} className={`page-item ${i + 1 === page ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => setPage(i + 1)}>{i + 1}</button>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
            <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>Cancelar</button>
          </div>
        </div>
      </div>
    </>
  );
}