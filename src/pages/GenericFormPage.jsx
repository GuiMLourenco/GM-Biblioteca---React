import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { tableConfig } from "../config/tableConfig";
import {
  AuthorSearchModal,
  ExemplarSearchModal,
  LivroSearchModal,
  UtenteSearchModal
} from "../components/SearchModals";
import { 
  FaArrowLeft, 
  FaSave, 
  FaTimes, 
  FaEdit, 
  FaPlus, 
  FaExclamationTriangle,
  FaSearch,
  FaInfoCircle,
  FaCheck
} from "react-icons/fa";

const fkModals = {
  autor: AuthorSearchModal,
  livro_exemplar: ExemplarSearchModal,
  livro: LivroSearchModal,
  utente: UtenteSearchModal,
};

export default function GenericFormPage() {
  const { tableName, id } = useParams();
  const nav = useNavigate();

  const cfg = tableConfig[tableName];
  const pk =
    cfg?.primaryKey ??
    Object.keys(cfg?.fields || {}).find((f) =>
      f.toLowerCase().endsWith("_cod")
    );

  const [values, setValues] = useState({});
  const [displayValues, setDisplayValues] = useState({});
  const [fkOptions, setFkOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalField, setModalField] = useState(null);

  const noConfig = !cfg;
  const fieldNames = cfg ? Object.keys(cfg.fields) : [];
  const visibleFields = cfg
    ? Object.entries(cfg.fields)
      .filter(([_, f]) => f.showInForm !== false)
      .map(([name]) => name)
    : [];

  const isEditMode = Boolean(id);

  useEffect(() => {
    if (!cfg) return;
    loadAll();
  }, [tableName, id]);

  async function loadAll() {
    setLoading(true);

    let initial = {};
    let initialDisplay = {};
    fieldNames.forEach((name) => {
      initial[name] = "";
      initialDisplay[name] = "";
    });

    // Carregar listas FK normais
    const fkMap = {};
    for (const field of fieldNames) {
      const def = cfg.fields[field];

      if (def.type === "fk" && !fkModals[def.fkTable]) {
        const { data, error } = await supabase
          .from(def.fkTable)
          .select(`${def.display}, ${def.foreignKey || def.display}`);

        if (!error) {
          fkMap[field] = data;
        }
      }
    }
    setFkOptions(fkMap);

    // Carregar dados para editar
    if (id) {
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .eq(pk, id)
        .single();

      if (!error && data) {
        initial = { ...initial, ...data };

        // Preencher displayValues com nomes das FKs
        for (const field of fieldNames) {
          const def = cfg.fields[field];
          if (def.type === "fk") {
            const fkList = fkMap[field] || [];
            const fkRow = fkList.find(r => r[def.foreignKey] === data[field]);
            if (fkRow) {
              initialDisplay[field] = fkRow[def.display];
            }
          }
        }
      }
    }

    setValues(initial);
    setDisplayValues(initialDisplay);
    setLoading(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    const payload = { ...values };
    if (!id) delete payload[pk];

    const cleanedPayload = Object.fromEntries(
      Object.entries(payload).map(([key, val]) => [
        key,
        val === "" ? null : val
      ])
    );

    let result;
    if (id) {
      result = await supabase.from(tableName).update(cleanedPayload).eq(pk, id);
    } else {
      result = await supabase.from(tableName).insert(cleanedPayload);
    }

    setSaving(false);

    if (result.error) {
      alert("Erro: " + result.error.message);
    } else {
      setSuccess(true);
      setTimeout(() => nav(`/list/${tableName}`), 1000);
    }
  }

  function openModal(fieldName) {
    setModalField(fieldName);
    setModalOpen(true);
  }

  function handleSelect(row) {
    const fieldDef = cfg.fields[modalField];
    const fkValueColumn = fieldDef.foreignKey;
    const displayColumn = fieldDef.display;

    setValues({ ...values, [modalField]: row[fkValueColumn] });
    setDisplayValues({ ...displayValues, [modalField]: row[displayColumn] });

    setModalOpen(false);
    setModalField(null);
  }

  function renderInput(name) {
    const field = cfg.fields[name];
    const val = values[name] ?? "";
    const displayVal = displayValues[name] ?? "";

    // FK com modal
    if (field.type === "fk" && fkModals[field.fkTable]) {
      const ModalComponent = fkModals[field.fkTable];
      return (
        <>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              readOnly
              value={displayVal}
              placeholder={`Selecionar ${field.label}`}
            />
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => openModal(name)}
            >
              <FaSearch />
            </button>
          </div>

          {ModalComponent && modalOpen && modalField === name && (
            <ModalComponent
              open={modalOpen}
              onClose={() => setModalOpen(false)}
              onSelect={handleSelect}
            />
          )}
        </>
      );
    }

    // FK normal (select)
    if (field.type === "fk") {
      const list = fkOptions[name] || [];
      const fkValueColumn = field.foreignKey || field.display;
      return (
        <select
          className="form-select"
          value={val}
          onChange={(e) =>
            setValues({ ...values, [name]: e.target.value })
          }
          required={field.required}
        >
          <option value="">-- Selecione --</option>
          {list.map((row) => (
            <option key={row[fkValueColumn]} value={row[fkValueColumn]}>
              {row[field.display]}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === "boolean") {
      return (
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            checked={val === true || val === "true"}
            onChange={(e) =>
              setValues({ ...values, [name]: e.target.checked })
            }
          />
          <label className="form-check-label text-muted">
            {val === true || val === "true" ? "Sim" : "Não"}
          </label>
        </div>
      );
    }

    if (field.type === "number") {
      return (
        <input
          type="number"
          className="form-control"
          value={val}
          onChange={(e) => setValues({ ...values, [name]: e.target.value })}
          required={field.required}
          placeholder={field.placeholder || `Digite ${field.label.toLowerCase()}`}
        />
      );
    }

    if (field.type === "date") {
      return (
        <input
          type="date"
          className="form-control"
          value={val?.substring(0, 10) || ""}
          onChange={(e) => setValues({ ...values, [name]: e.target.value })}
          required={field.required}
        />
      );
    }

    if (field.type === "textarea") {
      return (
        <textarea
          className="form-control"
          rows={4}
          value={val}
          onChange={(e) => setValues({ ...values, [name]: e.target.value })}
          required={field.required}
          placeholder={field.placeholder || `Digite ${field.label.toLowerCase()}`}
        />
      );
    }

    return (
      <input
        type="text"
        className="form-control"
        value={val}
        onChange={(e) => setValues({ ...values, [name]: e.target.value })}
        required={field.required}
        placeholder={field.placeholder || `Digite ${field.label.toLowerCase()}`}
      />
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card shadow-sm">
              <div className="card-body text-center py-5">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">A carregar...</span>
                </div>
                <p className="text-muted mb-0">A carregar dados do formulário...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No config state
  if (noConfig) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card border-danger shadow-sm">
              <div className="card-body text-center py-5">
                <FaExclamationTriangle className="text-danger mb-3" size={48} />
                <h2 className="text-danger mb-3">Configuração não encontrada</h2>
                <p className="text-muted mb-4">
                  A tabela <code className="bg-light px-2 py-1 rounded">{tableName}</code> não está configurada no sistema.
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

  return (
    <div className="container py-4">
      {/* Cabeçalho */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-primary mb-1">
            {isEditMode ? <FaEdit className="me-2" /> : <FaPlus className="me-2" />}
            {isEditMode ? "Editar" : "Novo"} {cfg.label || tableName}
          </h2>
          <p className="text-muted mb-0">
            {isEditMode 
              ? "Atualize as informações do registo" 
              : "Preencha os campos para criar um novo registo"}
          </p>
        </div>
        <button className="btn btn-secondary friendly-btn" onClick={() => nav(-1)}>
          <FaArrowLeft className="me-2" />
          Voltar
        </button>
      </div>

      {/* Alert de Sucesso */}
      {success && (
        <div className="alert alert-success alert-dismissible fade show shadow-sm" role="alert">
          <FaCheck className="me-2" />
          <strong>Sucesso!</strong> O registo foi {isEditMode ? 'atualizado' : 'criado'} com sucesso.
          <button type="button" className="btn-close" onClick={() => setSuccess(false)} />
        </div>
      )}

      {/* Formulário */}
      <div className="card shadow-sm">
        <div className="card-header bg-white border-bottom">
          <h5 className="mb-0">
            <FaInfoCircle className="me-2 text-primary" />
            Informações do Registo
          </h5>
        </div>
        <div className="card-body p-4">
          <form onSubmit={handleSave}>
            <div className="row g-3">
              {visibleFields.map((name) => {
                const field = cfg.fields[name];
                const colSize = field.type === "textarea" ? "col-12" : "col-md-6";
                
                return (
                  <div className={colSize} key={name}>
                    <label className="form-label fw-semibold">
                      {field.label}
                      {field.required && <span className="text-danger ms-1">*</span>}
                    </label>

                    {renderInput(name)}

                    {field.help && (
                      <div className="form-text">
                        <small><FaInfoCircle className="me-1" />{field.help}</small>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Botões de Ação */}
            <div className="d-flex gap-2 mt-4 pt-3 border-top">
              <button
                type="submit"
                className="btn btn-primary friendly-btn"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    A guardar...
                  </>
                ) : (
                  <>
                    <FaSave className="me-2" />
                    {isEditMode ? "Atualizar" : "Guardar"}
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary friendly-btn"
                onClick={() => nav(-1)}
                disabled={saving}
              >
                <FaTimes className="me-2" />
                Cancelar
              </button>

              {!isEditMode && (
                <button
                  type="button"
                  className="btn btn-outline-warning friendly-btn ms-auto"
                  onClick={() => {
                    const initial = {};
                    fieldNames.forEach((name) => {
                      initial[name] = "";
                    });
                    setValues(initial);
                    setDisplayValues(initial);
                  }}
                  disabled={saving}
                >
                  Limpar Campos
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Informação adicional */}
      <div className="mt-3">
        <small className="text-muted">
          <FaInfoCircle className="me-1" />
          Os campos marcados com <span className="text-danger">*</span> são obrigatórios
        </small>
      </div>
    </div>
  );
}