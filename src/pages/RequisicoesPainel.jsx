import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function RequisicoesPainel() {
  const [query, setQuery] = useState("");
  const [paraEntregar, setParaEntregar] = useState([]);
  const [paraDevolver, setParaDevolver] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("entregar");

  useEffect(() => {
    loadData();
  }, [query]);

  async function loadData() {
    setLoading(true);

    console.log("🔍 Iniciando carregamento...");
    console.log("📌 Query atual:", query);

    // ---------- 1. POR LEVANTAR ----------
    let qEntregar = supabase
      .from("requisicao")
      .select(`
        re_cod,
        livro_exemplar!inner(lex_cod, livro!inner(li_titulo)),
        utente(ut_nome)
      `)
      .eq("re_emprestado", !true)
      .is("re_data_devolucao", null);

    if (query) {
      if (!isNaN(query)) {
        qEntregar = qEntregar.eq("livro_exemplar.lex_cod", Number(query));
      } else {
        qEntregar = qEntregar.ilike("livro_exemplar.livro.li_titulo", `%${query}%`);
      }
    }

    let { data: dataEntregar, error: errorEntregar } = await qEntregar;
    console.log("📥 Dados entregas brutos:", dataEntregar);
    if (errorEntregar) console.error("❌ ERRO ENTREGAR:", errorEntregar);

    if (dataEntregar) {
      dataEntregar.sort((a, b) =>
        a.livro_exemplar.livro.li_titulo.localeCompare(
          b.livro_exemplar.livro.li_titulo
        )
      );
    }

    // ---------- 2. POR DEVOLVER ----------
    let qDevolver = supabase
      .from("requisicao")
      .select(`
        re_cod,
        livro_exemplar!inner(lex_cod, livro!inner(li_titulo)),
        utente(ut_nome)
      `)
      .eq("re_emprestado", true)
      .is("re_data_devolucao", null);

    if (query) {
      if (!isNaN(query)) {
        qDevolver = qDevolver.eq("livro_exemplar.lex_cod", Number(query));
      } else {
        qDevolver = qDevolver.ilike("livro_exemplar.livro.li_titulo", `%${query}%`);
      }
    }

    let { data: dataDevolver, error: errorDevolver } = await qDevolver;
    console.log("📥 Dados devoluções brutos:", dataDevolver);
    if (errorDevolver) console.error("❌ ERRO DEVOLVER:", errorDevolver);

    if (dataDevolver) {
      dataDevolver.sort((a, b) =>
        a.livro_exemplar.livro.li_titulo.localeCompare(
          b.livro_exemplar.livro.li_titulo
        )
      );
    }

    setParaEntregar(dataEntregar || []);
    setParaDevolver(dataDevolver || []);
    setLoading(false);
  }

  // ---------- AÇÕES: LEVANTAR / DEVOLVER ----------
  async function handleAction(id, action) {
    console.log(`⚙️ Ação disparada: ${action} para ID ${id}`);

    if (action === "entregar") {
      await supabase
        .from("requisicao")
        .update({
          re_emprestado: true,
          re_data_requisicao: new Date().toISOString(),
        })
        .eq("re_cod", id);
    }

    if (action === "devolver") {
      await supabase
        .from("requisicao")
        .update({
          re_data_devolucao: new Date().toISOString(),
        })
        .eq("re_cod", id);
    }

    console.log("♻️ Atualizando vista...");
    loadData();
  }

  return (
    <div className="container py-4">

      {/* Título + botão voltar */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-primary mb-0">
          <i className="fas fa-hand-holding me-2"></i>
          Painel de Requisições
        </h2>

        <button className="btn btn-secondary friendly-btn" onClick={() => window.history.back()}>
          <i className="fas fa-arrow-left me-2"></i>Voltar
        </button>
      </div>

      {/* Pesquisa */}
      <div className="card shadow-sm mb-4">
        <div className="card-body p-2">
          <form
            onSubmit={e => { e.preventDefault(); loadData(); }}
            className="d-flex flex-nowrap"
          >
            <div className="input-group">
              <span className="input-group-text rounded-start-pill">
                <i className="fas fa-search"></i>
              </span>

              <input
                type="text"
                className="form-control"
                placeholder="Título ou código"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />

              <button type="submit" className="btn btn-primary friendly-btn">
                <i className="fas fa-search me-1"></i>Pesquisar
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Tabs melhoradas */}
      <div className="mb-3 d-flex gap-2">
        <button
          className={`btn flex-fill ${activeTab === "entregar" ? "btn-primary shadow" : "btn-outline-primary"}`}
          onClick={() => setActiveTab("entregar")}
        >
          Por levantar <span className="badge bg-light text-primary ms-1">{paraEntregar.length}</span>
        </button>
        <button
          className={`btn flex-fill ${activeTab === "devolver" ? "btn-success shadow" : "btn-outline-success"}`}
          onClick={() => setActiveTab("devolver")}
        >
          Por devolver <span className="badge bg-light text-success ms-1">{paraDevolver.length}</span>
        </button>
      </div>

      {/* Conteúdo */}
      {loading ? (
        <p>A carregar...</p>
      ) : (
        <>
          {/* TAB: ENTREGAR */}
          {activeTab === "entregar" && (
            <div className="row g-3">
              {paraEntregar.length === 0 ? (
                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  Nenhuma requisição pendente de entrega.
                </div>
              ) : paraEntregar.map(r => (
                <div className="col-md-6 col-lg-4" key={r.re_cod}>
                  <div className="card h-100 shadow-sm">
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title text-primary mb-1">{r.livro_exemplar.livro.li_titulo}</h5>
                      <p className="card-text text-muted mb-2">Utente: {r.utente.ut_nome}</p>
                      <div className="mt-auto d-flex justify-content-between">
                        <span className="badge bg-light text-dark">Exemplar: {r.livro_exemplar.lex_cod}</span>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleAction(r.re_cod, "entregar")}
                        >
                          <i className="fas fa-check me-1"></i>Levantado
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB: DEVOLVER */}
          {activeTab === "devolver" && (
            <div className="row g-3">
              {paraDevolver.length === 0 ? (
                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  Nenhum exemplar para devolver.
                </div>
              ) : paraDevolver.map(r => (
                <div className="col-md-6 col-lg-4" key={r.re_cod}>
                  <div className="card h-100 shadow-sm">
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title text-primary mb-1">{r.livro_exemplar.livro.li_titulo}</h5>
                      <p className="card-text text-muted mb-2">Utente: {r.utente.ut_nome}</p>
                      <div className="mt-auto d-flex justify-content-between">
                        <span className="badge bg-light text-dark">Exemplar: {r.livro_exemplar.lex_cod}</span>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleAction(r.re_cod, "devolver")}
                        >
                          <i className="fas fa-undo me-1"></i>Devolvido
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
