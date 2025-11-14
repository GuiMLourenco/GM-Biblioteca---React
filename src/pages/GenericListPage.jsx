import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { tableConfig } from "../config/tableConfig";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa"; // ícones

export default function GenericListPage() {
  const { tableName } = useParams();
  const nav = useNavigate();

  const cfg = tableConfig[tableName];

  // pk: usa primaryKey da config ou qualquer campo que termine em "_cod"
  const pk = cfg?.primaryKey ?? Object.keys(cfg?.fields || {}).find(f => f.toLowerCase().endsWith("_cod"));

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [tableName]);

  // Se não houver config ou pk
  if (!cfg || !pk) {
    return (
      <div className="container py-4">
        <h2 className="text-danger">Tabela não encontrada</h2>
        <p>
          A tabela <code>{tableName}</code> não existe na configuração ou não tem PK definida.
        </p>
        <button className="btn btn-secondary mt-3" onClick={() => nav(-1)}>
          ← Voltar
        </button>
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
    } else {
      setRows(data);
    }

    setLoading(false);
  }

  function handleEdit(id) {
    nav(`/form/${tableName}/${id}`);
  }

  function handleDelete(id) {
    if (window.confirm("Tem a certeza que quer apagar este registo?")) {
      supabase
        .from(tableName)
        .delete()
        .eq(pk, id)
        .then(({ error }) => {
          if (error) {
            alert("Erro ao apagar: " + error.message);
          } else {
            loadData();
          }
        });
    }
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between mb-3 align-items-center">
        <h2>{cfg.label}</h2>
        <button className="btn btn-primary" onClick={() => nav(`/form/${tableName}`)}>
          <FaPlus className="me-1" /> Novo
        </button>
      </div>

      {loading ? (
        <p>A carregar...</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover align-middle">
            <thead>
              <tr>
                {fields.map(f => (
                  <th key={f}>{cfg.fields[f].label || f}</th>
                ))}
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={fields.length + 1} className="text-center">
                    Sem registos.
                  </td>
                </tr>
              ) : (
                rows.map(row => (
                  <tr key={row[pk]}>
                    {fields.map(f => (
                      <td key={f}>{String(row[f] ?? "")}</td>
                    ))}
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => handleEdit(row[pk])}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(row[pk])}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
