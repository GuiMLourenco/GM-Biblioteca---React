import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { tableConfig } from "../config/tableConfig";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaArrowLeft,
  FaExclamationTriangle,
  FaTable,
  FaSearch,
  FaChevronLeft,
  FaChevronRight
} from "react-icons/fa";
import { Modal, Button } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';

export default function GenericListPage() {
  const { tableName } = useParams();
  const nav = useNavigate();

  const cfg = tableConfig[tableName];
  const pk = cfg?.primaryKey ?? Object.keys(cfg?.fields || {}).find(f => f.toLowerCase().endsWith("_cod"));

  const pageSize = 20;
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);

  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [fkData, setFkData] = useState({});

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);

  const fields = Object.keys(cfg?.fields || {});

  useEffect(() => {
    loadData(page);
  }, [tableName, page]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRows(rows);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = rows.filter(row => {
        return fields.some(field => {
          const value = String(
            cfg.fields[field].type === "fk" ? fkData[field]?.[row[field]] ?? "" : row[field] ?? ""
          ).toLowerCase();
          return value.includes(term);
        });
      });
      setFilteredRows(filtered);
    }
  }, [searchTerm, rows, fkData]);

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
                  <FaArrowLeft className="me-2" /> Voltar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  async function loadData(currentPage) {
    setLoading(true);

    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;

    // 1️⃣ Pegar dados da tabela principal
    const { data, error, count } = await supabase
      .from(tableName)
      .select("*", { count: "exact" })
      .range(from, to);

    if (error) {
      console.error(error);
      setRows([]);
      setFilteredRows([]);
      setTotalRows(0);
      setLoading(false);
      return;
    }

    setRows(data || []);
    setFilteredRows(data || []);
    setTotalRows(count || 0);

    // 2️⃣ Pegar dados das FK
    const fkFields = fields.filter(f => cfg.fields[f].type === "fk");
    const fkValues = {};

    for (let f of fkFields) {
      const fkTable = cfg.fields[f].fkTable;
      const displayField = cfg.fields[f].display;
      const foreignKey = cfg.fields[f].foreignKey || tableConfig[fkTable]?.primaryKey;

      if (fkTable) {
        const { data: fkTableData } = await supabase.from(fkTable).select("*");
        fkValues[f] = {};
        fkTableData.forEach(row => {
          fkValues[f][row[foreignKey]] = row[displayField];
        });
      }
    }

    setFkData(fkValues);
    setLoading(false);
  }

  function handleEdit(id) {
    nav(`/form/${tableName}/${id}`);
  }

  function confirmDelete(row) {
    setRowToDelete(row);
    setShowDeleteModal(true);
  }

  async function handleDelete() {
    if (!rowToDelete) return;

    setDeleteLoading(rowToDelete[pk]);
    setShowDeleteModal(false);

    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq(pk, rowToDelete[pk]);

    if (error) {
      alert("Erro ao apagar: " + error.message);
    } else {
      // Recarrega a página atual após delete
      loadData(page);
    }

    setDeleteLoading(null);
    setRowToDelete(null);
  }

  const totalPages = Math.ceil(totalRows / pageSize);

  return (
    <div className="container py-4">
      {/* Cabeçalho */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-primary mb-1">
            <FaTable className="me-2" /> {cfg.label}
          </h2>
          <p className="text-muted mb-0">
            {filteredRows.length} {filteredRows.length === 1 ? "registo" : "registos"}
            {searchTerm && ` encontrado(s)`}
          </p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-secondary friendly-btn" onClick={() => nav(-1)}>
            <FaArrowLeft className="me-2" /> Voltar
          </button>
          <button className="btn btn-primary friendly-btn" onClick={() => nav(`/form/${tableName}`)}>
            <FaPlus className="me-2" /> Novo Registo
          </button>
        </div>
      </div>

      {/* Barra de pesquisa */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0"><FaSearch className="text-muted" /></span>
            <input
              type="text"
              className="form-control border-start-0 ps-0"
              placeholder="Pesquisar em todos os campos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="btn btn-outline-secondary" onClick={() => setSearchTerm("")}>Limpar</button>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      {loading ? (
        <div className="card shadow-sm">
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status"><span className="visually-hidden">A carregar...</span></div>
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
                    {fields.map(f => <th key={f} className="py-3 px-4">{cfg.fields[f].label || f}</th>)}
                    <th className="py-3 px-4 text-center" style={{ width: "120px" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={fields.length + 1} className="text-center py-5">
                        <div className="text-muted">
                          <FaExclamationTriangle className="mb-2" size={32} />
                          <p className="mb-0">{searchTerm ? `Nenhum registo encontrado para "${searchTerm}"` : "Sem registos para apresentar"}</p>
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
                              if (cfg.fields[f].type === "boolean") return value ? "✔️" : "❌";
                              if (cfg.fields[f].type === "fk") return fkData[f]?.[value] ?? value;
                              return String(value ?? "");
                            })()}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-center">
                          <div className="btn-group" role="group">
                            <button className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(row[pk])} title="Editar">
                              <FaEdit />
                            </button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => confirmDelete(row)} disabled={deleteLoading === row[pk]} title="Apagar">
                              {deleteLoading === row[pk] ? <span className="spinner-border spinner-border-sm" /> : <FaTrash />}
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

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="card-footer d-flex justify-content-between align-items-center">
              <div>
                <Button variant="outline-primary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <FaChevronLeft /> Anterior
                </Button>
                <Button variant="outline-primary" size="sm" className="ms-2" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                  Próximo <FaChevronRight />
                </Button>
              </div>
              <small className="text-muted">
                Página {page} de {totalPages} ({totalRows} registo(s))
              </small>
            </div>
          )}
        </div>
      )}

      {/* Modal de confirmação */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">Confirmar Apagamento</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Tem a certeza que deseja apagar este registo? Esta ação não pode ser revertida.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete}>Apagar</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
