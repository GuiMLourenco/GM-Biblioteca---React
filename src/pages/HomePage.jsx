import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import { tableConfig } from "../config/tableConfig";


export default function HomePage() {
    const [stats, setStats] = useState({ active: 0, overdue: 0 });
    const [recent, setRecent] = useState([]);

    useEffect(() => {
        loadStats();
        loadRecent();
    }, []);

    async function loadStats() {
        const { count: active } = await supabase
            .from('requisicao')
            .select('*', { count: 'exact', head: true })
            .is('re_data_devolucao', null);

        const { count: overdue } = await supabase
            .from('requisicao')
            .select('*', { count: 'exact', head: true })
            .is('re_data_devolucao', null)
            .lt('re_data_devolucao', new Date().toISOString());

        setStats({ active: active || 0, overdue: overdue || 0 });
    }

    async function loadRecent() {
        const { data } = await supabase
            .from('requisicao')
            .select(
                `re_cod, re_data_requisicao, re_data_devolucao,
         utente(ut_nome),
         livro_exemplar!inner(lex_cod, livro!inner(li_titulo))`
            )
            .order('re_data_requisicao', { ascending: false })
            .limit(10);
        setRecent(data || []);
    }

    /* Ícones por tabela (igual ao PHP) */
    const tableIcon = {
        autor: 'user-edit',
        editora: 'building',
        genero: 'tags',
        livro: 'book',
        livro_exemplar: 'copy',
        requisicao: 'hand-holding',
        utente: 'users',
        pais: 'globe',
        codigo_postal: 'map-marker-alt',
        edicao: 'layer-group',
    };
    function tblIcon(tbl) {
        const icons = {
            autor: "user-edit",
            editora: "building",
            genero: "tags",
            livro: "book",
            livro_exemplar: "copy",
            requisicao: "hand-holding",
            utente: "users",
            pais: "globe",
            codigo_postal: "map-marker-alt",
            edicao: "layer-group",
        };
        return icons[tbl] || "database"; // ícone default
    }


    return (
        <>
            <div className="container-fluid py-4">
                <div className="row">
                    {/* Sidebar - dropdowns */}
                    <div className="col-md-3">
                        <div className="card">
                            <div className="card-header">
                                <h5 className="mb-0">
                                    <i className="fas fa-list me-2" />
                                    Menu Principal
                                </h5>
                            </div>
                            <div className="card-body p-0">
                                <div className="card-body p-0">
                                    {Object.entries(tableConfig).map(([tbl, cfg]) => (
                                        <Dropdown
                                            key={tbl}
                                            label={cfg.label || tbl}   // usa a label do tableConfig
                                            icon={tblIcon(tbl)}        // função para definir ícone opcional
                                            table={tbl}
                                        />
                                    ))}
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* Main content */}
                    <div className="col-md-9">
                        <div className="text-center mb-4">
                            <h1 className="display-4 text-primary">
                                <i className="fas fa-book-open me-3" />
                                Gestão da Biblioteca
                            </h1>
                            <p className="lead text-muted">Sistema de gestão simples e intuitivo</p>
                        </div>

                        <div className="row g-4 mb-4">
                            <QuickAction
                                color="primary"
                                icon="book"
                                title="Registar Novo Livro"
                                text="Adicione um novo livro à biblioteca"
                                btnText="Começar"
                                onClick={() => console.log('ir para registar livro')}
                            />
                            <QuickAction
                                color="success"
                                icon="hand-holding"
                                title="Nova Requisição"
                                text="Registe quando alguém requisita um livro"
                                btnText="Começar"
                                onClick={() => console.log('ir para registar empréstimo')}
                            />
                            <QuickAction
                                color="danger"
                                icon="list"
                                title="Gerir Requisições"
                                text="Veja, edite e acompanhe todas as requisições"
                                btnText="Ver Requisições"
                                onClick={() => console.log('ir para gerir requisições')}
                            />
                        </div>

                        <div className="row g-4 mb-4">
                            <QuickAction
                                color="info"
                                icon="users"
                                title="Gerir Utentes"
                                text="Veja e edite informações dos utentes"
                                btnText="Ver Utentes"
                                onClick={() => console.log('ir para gerir utentes')}
                            />
                            <QuickAction
                                color="warning"
                                icon="database"
                                title="Gerir Todos os Dados"
                                text="Aceda a todas as opções de gestão"
                                btnText="Gerir Dados"
                                onClick={() => console.log('ir para gerir dados')}
                            />
                        </div>

                        {/* Como usar */}
                        <div className="card mt-4">
                            <div className="card-header">
                                <h5 className="mb-0">
                                    <i className="fas fa-info-circle me-2" />
                                    Como usar este sistema
                                </h5>
                            </div>
                            <div className="card-body">
                                <div className="row text-center">
                                    <Step
                                        num={1}
                                        icon="mouse-pointer"
                                        color="primary"
                                        title="Clique"
                                        text="Clique no botão da ação que quer fazer"
                                    />
                                    <Step
                                        num={2}
                                        icon="keyboard"
                                        color="success"
                                        title="Preencha"
                                        text="Preencha os campos obrigatórios (marcados com *)"
                                    />
                                    <Step
                                        num={3}
                                        icon="save"
                                        color="info"
                                        title="Guarde"
                                        text="Clique em 'Guardar' para confirmar"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CSS puro (mesmas cores / espaçamentos do PHP) */}
            <style>{`
        :root {
          --primary-color: #a02c2c;
          --secondary-color: #f8f9fa;
          --accent-color: #28a745;
          --warning-color: #ffc107;
          --danger-color: #dc3545;
          --info-color: #17a2b8;
        }
        .text-primary   { color: var(--primary-color) !important; }
        .text-success   { color: var(--accent-color) !important; }
        .text-danger    { color: var(--danger-color) !important; }
        .text-info      { color: var(--info-color) !important; }
        .text-warning   { color: var(--warning-color) !important; }

        .container-fluid { padding: 1.5rem; }
        .row { display: flex; flex-wrap: wrap; margin: -0.75rem; }
        .col-md-3 { flex: 0 0 25%; max-width: 25%; padding: 0.75rem; }
        .col-md-9 { flex: 0 0 75%; max-width: 75%; padding: 0.75rem; }
        .card {
          border: none;
          box-shadow: 0 2px 10px rgba(0,0,0,.1);
          border-radius: 15px;
          overflow: hidden;
          background: #fff;
        }
        .card-header {
          background: linear-gradient(135deg, var(--primary-color), #8b1e1e);
          color: #fff;
          border-radius: 15px 15px 0 0 !important;
          font-weight: bold;
          padding: 0.75rem 1.25rem;
        }
        .list-group { list-style: none; padding: 0; margin: 0; }
        .list-group-flush > .list-group-item { border: 0; }
        .sidebar-item { background: #fdeaea; transition: background 0.2s; }
        .sidebar-item:hover { background: #f5d8d8; }

        .display-4 { font-size: 2.5rem; font-weight: 300; }
        .lead { font-size: 1.25rem; font-weight: 300; color: #6c757d; }

        .quick-action {
          background: linear-gradient(135deg, #f8f9fa, #e9ecef);
          border-radius: 15px;
          padding: 2rem 1rem;
          text-align: center;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .quick-action:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 20px rgba(0,0,0,.15);
        }
        .icon-large { font-size: 2.5rem; margin-bottom: 1rem; }
        .friendly-btn {
          border-radius: 25px;
          padding: 0.5rem 1.25rem;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        .friendly-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0,0,0,.2);
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 0.5rem;
        }
        .table th,
        .table td {
          padding: 0.5rem;
          border-bottom: 1px solid #e5e5e5;
          text-align: left;
        }
        @media (max-width: 768px) {
          .col-md-3,
          .col-md-9 {
            flex: 0 0 100%;
            max-width: 100%;
          }
        }
      `}</style>
        </>
    );
}

/* ---------- componentes auxiliares ---------- */
function Dropdown({ label, icon, table }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="list-group-item sidebar-item">
            <button
                className="btn btn-link text-start w-100 p-2 d-flex justify-content-between align-items-center"
                onClick={() => setOpen(!open)}
                style={{ textDecoration: 'none', color: 'var(--primary-color)', fontWeight: 600 }}
            >
                <span>
                    <i className={`fas fa-${icon} me-2`} />
                    {label}
                </span>
                <i className={`fas fa-xs fa-chevron-down ${open ? 'fa-rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="mt-1 px-2 pb-2 d-grid gap-2">
                    <Link className="btn btn-sm btn-outline-primary" to={`/list/${table}`}>
                        <i className="fas fa-list me-1" /> Ver Todos
                    </Link>
                    <Link className="btn btn-sm btn-outline-success" to={`/form/${table}`}>
                        <i className="fas fa-plus me-1" /> Adicionar
                    </Link>
                </div>
            )}
        </div>
    );
}

function QuickAction({ color, icon, title, text, btnText, onClick }) {
    return (
        <div className="col-md-4 mb-4">
            <div className="quick-action">
                <div className={`icon-large text-${color}`}>
                    <i className={`fas fa-${icon}`} />
                </div>
                <h4>{title}</h4>
                <p className="text-muted">{text}</p>
                <button className={`btn btn-${color} friendly-btn`} onClick={onClick}>
                    <i className="fas fa-plus me-2" />
                    {btnText}
                </button>
            </div>
        </div>
    );
}

function Step({ num, icon, color, title, text }) {
    return (
        <div className="col-md-4 text-center">
            <i className={`fas fa-${icon} text-${color} mb-2`} style={{ fontSize: '2rem' }} />
            <h6>
                {num}. {title}
            </h6>
            <p className="text-muted small">{text}</p>
        </div>
    );
}