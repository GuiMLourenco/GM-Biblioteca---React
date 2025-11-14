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

const fkModals = {
  autor: AuthorSearchModal,
  livro_exemplar: ExemplarSearchModal,
  livro: LivroSearchModal,
  utente: UtenteSearchModal,
};

export default function GenericFormPage() {
  const { tableName, id } = useParams();
  const nav = useNavigate();

  console.log("📌 Página aberta:", { tableName, id });

  const cfg = tableConfig[tableName];
  console.log("📄 Config carregada:", cfg);

  const pk =
    cfg?.primaryKey ??
    Object.keys(cfg?.fields || {}).find((f) =>
      f.toLowerCase().endsWith("_cod")
    );

  console.log("🔑 Chave primária detetada:", pk);

  const [values, setValues] = useState({});
  const [displayValues, setDisplayValues] = useState({});
  const [fkOptions, setFkOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalField, setModalField] = useState(null);

  const noConfig = !cfg;
  const fieldNames = cfg ? Object.keys(cfg.fields) : [];
  const visibleFields = cfg
    ? Object.entries(cfg.fields)
      .filter(([_, f]) => f.showInForm !== false)
      .map(([name]) => name)
    : [];

  useEffect(() => {
    if (!cfg) return;
    console.log("🔄 useEffect disparado → carregar dados");
    loadAll();
  }, [tableName, id]);

  async function loadAll() {
    console.log("🚀 Iniciando loadAll()");
    setLoading(true);

    let initial = {};
    let initialDisplay = {};
    fieldNames.forEach((name) => {
      initial[name] = "";
      initialDisplay[name] = "";
    });

    // ---------- Carregar listas FK normais ----------
    const fkMap = {};
    for (const field of fieldNames) {
      const def = cfg.fields[field];

      if (def.type === "fk" && !fkModals[def.fkTable]) {
        console.log(`📥 Carregando opções FK para campo '${field}'...`);

        const { data, error } = await supabase
          .from(def.fkTable)
          .select(`${def.display}, ${def.foreignKey || def.display}`);

        if (error) {
          console.error(`❌ Erro ao carregar FK '${field}':`, error);
        } else {
          console.log(`📦 FK '${field}' carregado:`, data);
          fkMap[field] = data;
        }
      }
    }
    setFkOptions(fkMap);

    // ---------- Carregar dados para editar ----------
    if (id) {
      console.log("📥 A carregar registo existente:", id);

      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .eq(pk, id)
        .single();

      if (error) {
        console.error("❌ Erro ao carregar registo:", error);
      } else {
        console.log("📌 Dados carregados do Supabase:", data);
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
    } else {
      console.log("📄 Novo registo → sem carregamento de dados");
    }

    setValues(initial);
    setDisplayValues(initialDisplay);
    console.log("📝 Estado 'values' inicial:", initial);
    console.log("📝 Estado 'displayValues' inicial:", initialDisplay);
    setLoading(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    console.log("💾 Guardar clicado. Dados atuais:", values);

    setSaving(true);

    const payload = { ...values };
    if (!id) delete payload[pk];

    console.log("📤 Payload antes de limpar campos vazios:", payload);

    const cleanedPayload = Object.fromEntries(
      Object.entries(payload).map(([key, val]) => [
        key,
        val === "" ? null : val
      ])
    );

    console.log("📤 Payload enviado para o Supabase:", cleanedPayload);

    let result;
    if (id) {
      result = await supabase.from(tableName).update(cleanedPayload).eq(pk, id);
    } else {
      result = await supabase.from(tableName).insert(cleanedPayload);
    }

    setSaving(false);

    if (result.error) {
      console.error("❌ Erro ao guardar:", result.error);
      alert("Erro: " + result.error.message);
    } else {
      console.log("✅ Guardado com sucesso");
      nav(`/list/${tableName}`);
    }
  }

  function openModal(fieldName) {
    console.log("🔍 Abrir modal para campo:", fieldName);
    setModalField(fieldName);
    setModalOpen(true);
  }

  function handleSelect(row) {
    const fieldDef = cfg.fields[modalField];
    const fkValueColumn = fieldDef.foreignKey;
    const displayColumn = fieldDef.display;

    // Guardar o código para enviar ao Supabase
    setValues({ ...values, [modalField]: row[fkValueColumn] });

    // Guardar o texto amigável para mostrar no input
    setDisplayValues({ ...displayValues, [modalField]: row[displayColumn] });

    setModalOpen(false);
    setModalField(null);
  }

  function renderInput(name) {
    const field = cfg.fields[name];
    const val = values[name] ?? "";
    const displayVal = displayValues[name] ?? "";

    console.log("🖊️ Render input:", { name, field, val, displayVal });

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
              value={displayVal} // mostra o nome
              placeholder={`Selecionar ${field.label}`}
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => openModal(name)}
            >
              <i className="fas fa-search" />
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
        >
          <option value="">-- selecione --</option>
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
        />
      );
    }

    if (field.type === "textarea") {
      return (
        <textarea
          className="form-control"
          rows={3}
          value={val}
          onChange={(e) => setValues({ ...values, [name]: e.target.value })}
        />
      );
    }

    return (
      <input
        type="text"
        className="form-control"
        value={val}
        onChange={(e) => setValues({ ...values, [name]: e.target.value })}
      />
    );
  }

  if (loading) return <p>A carregar...</p>;

  if (noConfig)
    return (
      <div className="container py-4">
        <h2 className="text-danger">
          Configuração não encontrada para {tableName}
        </h2>
        <button className="btn btn-secondary mt-3" onClick={() => nav(-1)}>
          Voltar
        </button>
      </div>
    );

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="text-primary">
          {id ? "Editar" : "Novo"} registo – <code>{cfg.label || tableName}</code>
        </h2>
        <button className="btn btn-secondary btn-sm" onClick={() => nav(-1)}>
          ← Voltar
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSave}>
            {visibleFields.map((name) => {
              const field = cfg.fields[name];
              return (
                <div className="mb-3" key={name}>
                  <label className="form-label">
                    {field.label}
                    {field.required && <span className="text-danger"> *</span>}
                  </label>

                  {renderInput(name)}

                  {field.help && (
                    <div className="form-text">{field.help}</div>
                  )}
                </div>
              );
            })}

            <div className="d-flex gap-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? "A guardar..." : "Guardar"}
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => nav(-1)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
