import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { tableConfig } from "../config/tableConfig";
import {
    FaBookOpen,
    FaHandHolding,
    FaUsers,
    FaList,
    FaPlus,
    FaInfoCircle,
    FaMousePointer,
    FaKeyboard,
    FaSave,
    FaChevronDown,
    FaBook,
    FaExclamationTriangle,
    FaClock,
    FaCheckCircle
} from 'react-icons/fa';

export default function HomePage() {
    const [stats, setStats] = useState({ active: 0, total: 0 });
    const [recent, setRecent] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        await Promise.all([loadStats(), loadRecent()]);
        setLoading(false);
    }

    async function loadStats() {
        const { count: active } = await supabase
            .from('requisicao')
            .select('*', { count: 'exact', head: true })
            .is('re_data_devolucao', null);

        const { count: total } = await supabase
            .from('livro')
            .select('*', { count: 'exact', head: true });

        setStats({ active: active || 0, total: total || 0 });
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
            .limit(5);
        setRecent(data || []);
    }

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
        return icons[tbl] || "database";
    }

    return (
        <div className="container-fluid py-4">
            <div className="row g-4">
                {/* Sidebar - Menu */}
                <div className="col-lg-3">
                    <div className="card shadow-sm sticky-top" style={{ top: '1rem' }}>
                        <div className="card-header bg-primary text-white">
                            <h5 className="mb-0">
                                <FaList className="me-2" />
                                Menu Principal
                            </h5>
                        </div>
                        <div className="list-group list-group-flush">
                            {Object.entries(tableConfig).map(([tbl, cfg]) => (
                                <Dropdown
                                    key={tbl}
                                    label={cfg.label || tbl}
                                    icon={tblIcon(tbl)}
                                    table={tbl}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main content */}
                <div className="col-lg-9">
                    {/* Header */}
                    <div className="text-center mb-5">
                        <h1 className="display-4 text-primary mb-2">
                            <FaBookOpen className="me-3" />
                            Gestão da Biblioteca
                        </h1>
                        <p className="lead text-muted">Sistema de gestão simples e intuitivo</p>
                    </div>

                    {/* Estatísticas */}
                    <div className="row g-3 mb-4">
                        <div className="col-md-6">
                            <div className="card shadow-sm h-100 border-0 stat-card">
                                <div className="card-body text-center">
                                    <div className="stat-icon bg-primary bg-opacity-10 text-primary mb-3 mx-auto">
                                        <FaBook size={28} />
                                    </div>
                                    <h3 className="mb-1 fw-bold">{stats.total}</h3>
                                    <p className="text-muted mb-0">Livros Registados</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="card shadow-sm h-100 border-0 stat-card">
                                <div className="card-body text-center">
                                    <div className="stat-icon bg-success bg-opacity-10 text-success mb-3 mx-auto">
                                        <FaCheckCircle size={28} />
                                    </div>
                                    <h3 className="mb-1 fw-bold">{stats.active}</h3>
                                    <p className="text-muted mb-0">Requisições Ativas</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ações Rápidas */}
                    <h4 className="mb-3 text-primary">
                        <i className="fas fa-bolt me-2" />
                        Ações Rápidas
                    </h4>
                    <div className="row g-3 mb-4">
                        <QuickAction
                            color="primary"
                            icon={<FaBook size={32} />}
                            title="Registar Novo Livro"
                            text="Adicione um novo livro à biblioteca"
                            btnText="Começar"
                            onClick={() => navigate('/form/livro')}
                        />
                        <QuickAction
                            color="success"
                            icon={<FaHandHolding size={32} />}
                            title="Nova Requisição"
                            text="Registe quando alguém requisita um livro"
                            btnText="Começar"
                            onClick={() => navigate('/form/requisicao')}
                        />
                        <QuickAction
                            color="danger"
                            icon={<FaList size={32} />}
                            title="Gerir Requisições"
                            text="Veja, edite e acompanhe todas as requisições"
                            btnText="Ver Requisições"
                            onClick={() => navigate('/req')}
                        />
                        <QuickAction
                            color="info"
                            icon={<FaUsers size={32} />}
                            title="Gerir Utentes"
                            text="Veja e edite informações dos utentes"
                            btnText="Ver Utentes"
                            onClick={() => navigate('/list/utente')}
                        />
                    </div>

                    {/* Requisições Recentes */}
                    {recent.length > 0 && (
                        <div className="card shadow-sm mb-4">
                            <div className="card-header bg-primary text-white border-bottom">
                                <h5 className="mb-0">
                                    <FaClock className="me-2" />
                                    Requisições Recentes
                                </h5>
                            </div>
                            <div className="card-body p-0">
                                <div className="table-responsive">
                                    <table className="table table-hover mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Livro</th>
                                                <th>Utente</th>
                                                <th>Data</th>
                                                <th>Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recent.map((r) => (
                                                <tr key={r.re_cod}>
                                                    <td className="fw-semibold">
                                                        {r.livro_exemplar.livro.li_titulo}
                                                    </td>
                                                    <td>{r.utente.ut_nome}</td>
                                                    <td>
                                                        <small className="text-muted">
                                                            {new Date(r.re_data_requisicao).toLocaleDateString('pt-PT')}
                                                        </small>
                                                    </td>
                                                    <td>
                                                        {r.re_data_devolucao ? (
                                                            <span className="badge bg-success">
                                                                <FaCheckCircle className="me-1" />
                                                                Devolvido
                                                            </span>
                                                        ) : (
                                                            <span className="badge bg-warning">
                                                                <FaClock className="me-1" />
                                                                Ativo
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="card-footer bg-light text-center">
                                <Link to="/list/requisicao" className="btn btn-sm btn-outline-primary">
                                    Ver Todas as Requisições
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Como usar */}
                    <div className="card shadow-sm">
                        <div className="card-header bg-white border-bottom">
                            <h5 className="mb-0">
                                <FaInfoCircle className="me-2 text-primary" />
                                Como usar este sistema
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="row text-center g-4">
                                <Step
                                    num={1}
                                    icon={<FaMousePointer size={40} />}
                                    color="primary"
                                    title="Clique"
                                    text="Clique no botão da ação que quer fazer"
                                />
                                <Step
                                    num={2}
                                    icon={<FaKeyboard size={40} />}
                                    color="success"
                                    title="Preencha"
                                    text="Preencha os campos obrigatórios (marcados com *)"
                                />
                                <Step
                                    num={3}
                                    icon={<FaSave size={40} />}
                                    color="info"
                                    title="Guarde"
                                    text="Clique em 'Guardar' para confirmar"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .stat-card {
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .stat-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
                }
                .stat-icon {
                    width: 60px;
                    height: 60px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .quick-action-card {
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    cursor: pointer;
                    height: 100%;
                }
                .quick-action-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 0.75rem 1.5rem rgba(0, 0, 0, 0.15) !important;
                }
                .action-icon {
                    width: 70px;
                    height: 70px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1rem;
                }
                .friendly-btn {
                    border-radius: 25px;
                    padding: 0.5rem 1.5rem;
                    font-weight: 500;
                    transition: all 0.3s ease;
                }
                .friendly-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                }
                .step-circle {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1rem;
                }
            `}</style>
        </div>
    );
}

/* ---------- Componentes Auxiliares ---------- */
function Dropdown({ label, icon, table }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="list-group-item p-0 border-0">
            <button
                className="btn btn-link text-start w-100 p-3 d-flex justify-content-between align-items-center text-decoration-none"
                onClick={() => setOpen(!open)}
                style={{ color: 'inherit' }}
            >
                <span className="fw-semibold">
                    <i className={`fas fa-${icon} me-2 text-primary`} />
                    {label}
                </span>
                <FaChevronDown 
                    className={`text-muted transition ${open ? 'rotate-180' : ''}`}
                    size={12}
                    style={{ 
                        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease'
                    }}
                />
            </button>
            {open && (
                <div className="px-3 pb-3">
                    <div className="d-grid gap-2">
                        <Link 
                            className="btn btn-sm btn-outline-primary d-flex align-items-center justify-content-center" 
                            to={`/list/${table}`}
                        >
                            <FaList className="me-2" size={12} />
                            Ver Todos
                        </Link>
                        <Link 
                            className="btn btn-sm btn-outline-success d-flex align-items-center justify-content-center" 
                            to={`/form/${table}`}
                        >
                            <FaPlus className="me-2" size={12} />
                            Adicionar
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

function QuickAction({ color, icon, title, text, btnText, onClick }) {
    return (
        <div className="col-md-6 col-lg-3">
            <div className="card shadow-sm h-100 border-0 quick-action-card" onClick={onClick}>
                <div className="card-body text-center d-flex flex-column">
                    <div className={`action-icon bg-${color} bg-opacity-10 text-${color}`}>
                        {icon}
                    </div>
                    <h5 className="mb-2 fw-bold">{title}</h5>
                    <p className="text-muted small mb-3 flex-grow-1">{text}</p>
                    <button className={`btn btn-${color} friendly-btn w-100`}>
                        <FaPlus className="me-2" size={14} />
                        {btnText}
                    </button>
                </div>
            </div>
        </div>
    );
}

function Step({ num, icon, color, title, text }) {
    return (
        <div className="col-md-4">
            <div className={`step-circle bg-${color} bg-opacity-10 text-${color}`}>
                {icon}
            </div>
            <h6 className="fw-bold mb-2">
                <span className={`badge bg-${color} rounded-circle me-2`}>{num}</span>
                {title}
            </h6>
            <p className="text-muted small mb-0">{text}</p>
        </div>
    );
}