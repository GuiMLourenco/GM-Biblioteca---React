import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { tableConfig } from "../config/tableConfig";
import { FaEdit, FaTrash, FaPlus, FaArrowLeft, FaExclamationTriangle, FaTable, FaSearch } from "react-icons/fa";

export default function GenericListPage() {
  const { tableName } = useParams();
  const nav = useNavigate();

  const cfg = tableConfig[tableName];
  const pk = cfg?.primaryKey ?? Object.keys(cfg?.fields || {}).find(f => f.toLowerCase().endsWith("_cod"));

  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    loadData();
  }, [tableName]);

  useEffect(() => {
    // Filtro de pesquisa em tempo real
    if (!searchTerm.trim()) {
      setFilteredRows(rows);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = rows.filter(row => {
        return fields.some(field => {
          const value = String(row[field] ?? "").toLowerCase();
          return value.includes(term);
        });
      });
      setFilteredRows(filtered);
    }
  }, [searchTerm, rows]);

  // Se não houver config ou pk
  if (!cfg || !pk) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card border-danger shadow-sm">
              <div className="card-body text-center py-5">
                <FaExclamationTriangle className="text-danger mb-3" size={48} />
                <h2 className="text-danger mb-3">Tabela não encontrada</h2>
                <p className="text-muted mb-4">
                  A tabela <code className="bg-light px-2 py-1 rounded">{tableName}</code> não existe na configuração ou não tem chave primária definida.
                </p>
                <button className="btn btn-secondary friendly-btn" onClick={() => nav(-1)}>
                  <FaArrowLeft className="me-2" />
                  Voltar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const fields = Object.keys(cfg.fields);

  async function loadData() {
    setLoading(true);
    const { data, error } = await supabase.from(tableName).select("*").limit(200);

    if (error) {
      console.error(error);
      setRows([]);
      setFilteredRows([]);
    } else {
      setRows(data || []);
      setFilteredRows(data || []);
    }

    setLoading(false);
  }

  function handleEdit(id) {
    nav(`/form/${tableName}/${id}`);
  }

  async function handleDelete(id) {
    if (window.confirm("Tem a certeza que deseja apagar este registo? Esta ação não pode ser revertida.")) {
      setDeleteLoading(id);

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq(pk, id);

      if (error) {
        alert("Erro ao apagar: " + error.message);
      } else {
        await loadData();
      }

      setDeleteLoading(null);
    }
  }

  return (
    <div className="container py-4">
      {/* Cabeçalho */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-primary mb-1">
            <FaTable className="me-2" />
            {cfg.label}
          </h2>
          <p className="text-muted mb-0">
            {filteredRows.length} {filteredRows.length === 1 ? 'registo' : 'registos'}
            {searchTerm && ` encontrado(s)`}
          </p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-secondary friendly-btn" onClick={() => nav(-1)}>
            <FaArrowLeft className="me-2" />
            Voltar
          </button>
          <button className="btn btn-primary friendly-btn" onClick={() => nav(`/form/${tableName}`)}>
            <FaPlus className="me-2" />
            Novo Registo
          </button>
        </div>
      </div>

      {/* Barra de pesquisa */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <FaSearch className="text-muted" />
            </span>
            <input
              type="text"
              className="form-control border-start-0 ps-0"
              placeholder="Pesquisar em todos os campos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="btn btn-outline-secondary"
                onClick={() => setSearchTerm("")}
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      {loading ? (
        <div className="card shadow-sm">
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">A carregar...</span>
            </div>
            <p className="text-muted mb-0">A carregar dados...</p>
          </div>
        </div>
      ) : (
        <div className="card shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    {fields.map(f => (
                      <th key={f} className="py-3 px-4">
                        {cfg.fields[f].label || f}
                      </th>
                    ))}
                    <th className="py-3 px-4 text-center" style={{ width: "120px" }}>
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={fields.length + 1} className="text-center py-5">
                        <div className="text-muted">
                          <FaExclamationTriangle className="mb-2" size={32} />
                          <p className="mb-0">
                            {searchTerm
                              ? `Nenhum registo encontrado para "${searchTerm}"`
                              : "Sem registos para apresentar"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row, idx) => (
                      <tr key={row[pk]} className={idx % 2 === 0 ? "bg-white" : "bg-light bg-opacity-25"}>
                        {fields.map(f => (
                          <td key={f} className="px-4 py-3">
                            {(() => {
                              const value = row[f];

                              // Detectar campo booleano
                              if (cfg.fields[f].type === "boolean") {
                                return value ? "✔️" : "❌";
                              }

                              return String(value ?? "");
                            })()}

                          </td>
                        ))}
                        <td className="px-4 py-3 text-center">
                          <div className="btn-group" role="group">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleEdit(row[pk])}
                              title="Editar"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(row[pk])}
                              disabled={deleteLoading === row[pk]}
                              title="Apagar"
                            >
                              {deleteLoading === row[pk] ? (
                                <span className="spinner-border spinner-border-sm" />
                              ) : (
                                <FaTrash />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rodapé da tabela */}
          {filteredRows.length > 0 && (
            <div className="card-footer bg-light">
              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  A mostrar {filteredRows.length} de {rows.length} registo(s)
                </small>
                {rows.length >= 200 && (
                  <small className="text-warning">
                    <FaExclamationTriangle className="me-1" />
                    Limite de 200 registos atingido
                  </small>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}