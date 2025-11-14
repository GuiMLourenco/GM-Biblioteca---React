import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { AuthorSearchModal } from '../components/SearchModals';
import {
    FaBook,
    FaEdit,
    FaArrowLeft,
    FaSave,
    FaUndo,
    FaBarcode,
    FaHeading,
    FaUserEdit,
    FaTags,
    FaCalendar,
    FaLayerGroup,
    FaBuilding,
    FaCopy,
    FaHandHolding,
    FaSearch,
    FaTimes,
    FaInfoCircle,
    FaCheckCircle,
    FaExclamationTriangle,
    FaSpinner
} from 'react-icons/fa';

export default function RegisterBookPage() {
    const nav = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);

    /* ---------- campos do formulário ---------- */
    const [isbn, setIsbn] = useState('');
    const [titulo, setTitulo] = useState('');
    const [genero, setGenero] = useState('');
    const [ano, setAno] = useState(new Date().getFullYear());
    const [edicao, setEdicao] = useState('');
    const [editora, setEditora] = useState('');
    const [autoresSel, setAutoresSel] = useState([]);
    const [numEx, setNumEx] = useState(0);
    const [permReq, setPermReq] = useState(true);

    /* ---------- listas para comboboxes ---------- */
    const [listaGeneros, setListaGeneros] = useState([]);
    const [listaEditoras, setListaEditoras] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    /* ---------- última página válida para voltar ---------- */
    const [prevPage, setPrevPage] = useState('/');

    /* ---------- modal de autores ---------- */
    const [showAutorModal, setShowAutorModal] = useState(false);

    useEffect(() => {
        // Carrega comboboxes
        Promise.all([
            supabase.from('genero').select('ge_genero').order('ge_genero'),
            supabase.from('editora').select('ed_cod, ed_nome').order('ed_nome'),
        ]).then(([g, e]) => {
            setListaGeneros(g.data || []);
            setListaEditoras(e.data || []);
        });

        // Determina última página válida
        const ref = document.referrer;
        if (ref && !ref.includes('/form/livro')) {
            setPrevPage(ref);
            sessionStorage.setItem('prevPage', ref);
        } else {
            const stored = sessionStorage.getItem('prevPage');
            if (stored) setPrevPage(stored);
        }

        // Se estiver em modo edição, carrega os dados do livro
        if (isEditMode) {
            loadBookData();
        }
    }, [id]);

    /* ---------- carrega dados do livro para edição ---------- */
    async function loadBookData() {
        setLoading(true);
        try {
            // 1. Buscar dados do livro
            const { data: livro, error: livroError } = await supabase
                .from('livro')
                .select('*')
                .eq('li_cod', id)
                .single();

            if (livroError) throw livroError;

            if (!livro) {
                setError('Livro não encontrado.');
                setTimeout(() => nav(prevPage), 2000);
                return;
            }

            // Preenche os campos
            setIsbn(livro.li_isbn || '');
            setTitulo(livro.li_titulo || '');
            setGenero(livro.li_genero || '');
            setAno(livro.li_ano || new Date().getFullYear());
            setEdicao(livro.li_edicao || '');
            setEditora(livro.li_editora || '');

            // 2. Buscar autores do livro
            const { data: autoresData } = await supabase
                .from('livro_autor')
                .select('li_au_autor, autor(au_nome)')
                .eq('li_au_livro', id);

            if (autoresData) {
                const nomesAutores = autoresData.map((la) => la.autor.au_nome);
                setAutoresSel(nomesAutores);
            }

            // 3. Contar exemplares existentes
            const { count } = await supabase
                .from('livro_exemplar')
                .select('*', { count: 'exact', head: true })
                .eq('lex_li_cod', id);

            setNumEx(count || 0);

        } catch (err) {
            setError('Erro ao carregar dados do livro: ' + err.message);
        } finally {
            setLoading(false);
        }
    }

    /* ---------- gravação / atualização ---------- */
    async function handleSave(e) {
        e.preventDefault();
        if (!isbn || !titulo || autoresSel.length === 0) {
            setError('Preencha ISBN, Título e pelo menos um Autor.');
            return;
        }
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            if (isEditMode) {
                // ===== MODO EDIÇÃO =====

                // 1. Atualizar dados do livro
                const { error: updateError } = await supabase
                    .from('livro')
                    .update({
                        li_isbn: isbn,
                        li_titulo: titulo,
                        li_genero: genero,
                        li_ano: ano,
                        li_edicao: edicao,
                        li_editora: Number(editora) || null,
                    })
                    .eq('li_cod', id);

                if (updateError) throw new Error('Erro ao atualizar livro: ' + updateError.message);

                // 2. Atualizar autores (remove todos e adiciona novamente)
                await supabase.from('livro_autor').delete().eq('li_au_livro', id);

                for (const nomeAut of autoresSel) {
                    const { data: autor } = await supabase
                        .from('autor')
                        .select('au_cod')
                        .eq('au_nome', nomeAut)
                        .maybeSingle();
                    if (autor) {
                        await supabase.from('livro_autor').insert({
                            li_au_livro: id,
                            li_au_autor: autor.au_cod,
                        });
                    }
                }

                setSuccess('✅ Livro atualizado com sucesso!');

            } else {
                // ===== MODO REGISTO =====

                // 1. Inserir livro
                const { data: livro, error: livroErro } = await supabase
                    .from('livro')
                    .insert({
                        li_isbn: isbn,
                        li_titulo: titulo,
                        li_genero: genero,
                        li_ano: ano,
                        li_edicao: edicao,
                        li_editora: Number(editora) || null,
                    })
                    .select('li_cod')
                    .single();

                if (livroErro) throw new Error('Erro ao inserir livro: ' + livroErro.message);

                // 2. Inserir autores
                for (const nomeAut of autoresSel) {
                    const { data: autor } = await supabase
                        .from('autor')
                        .select('au_cod')
                        .eq('au_nome', nomeAut)
                        .maybeSingle();
                    if (autor) {
                        await supabase.from('livro_autor').insert({
                            li_au_livro: livro.li_cod,
                            li_au_autor: autor.au_cod,
                        });
                    }
                }

                // 3. Criar exemplares
                if (numEx > 0) {
                    for (let i = 0; i < numEx; i++) {
                        await supabase.from('livro_exemplar').insert({
                            lex_li_cod: livro.li_cod,
                            lex_estado: 'Disponível',
                            lex_disponivel: true,
                            lex_requisitavel: permReq,
                        });
                    }
                }

                setSuccess(`✅ Livro registado com sucesso! (${numEx} exemplar(es) criado(s))`);
            }

            setTimeout(() => nav(prevPage), 1500);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    /* ---------- UI ---------- */
    if (loading && isEditMode) {
        return (
            <div className="container py-5">
                <div className="row justify-content-center">
                    <div className="col-md-8">
                        <div className="card shadow-sm">
                            <div className="card-body text-center py-5">
                                <FaSpinner className="fa-spin text-primary mb-3" size={40} />
                                <p className="text-muted mb-0">A carregar dados do livro...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="container py-4">
                {/* Cabeçalho */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="text-primary mb-1">
                            {isEditMode ? <FaEdit className="me-2" /> : <FaBook className="me-2" />}
                            {isEditMode ? 'Editar Livro' : 'Registar Novo Livro'}
                        </h2>
                        <p className="text-muted mb-0">
                            {isEditMode
                                ? 'Atualize as informações do livro'
                                : 'Preencha as informações do livro para adicionar à biblioteca'}
                        </p>
                    </div>
                    <button className="btn btn-secondary friendly-btn" onClick={() => nav(-1)}>
                        <FaArrowLeft className="me-2" />
                        Voltar
                    </button>
                </div>

                {/* Alerts */}
                {success && (
                    <div className="alert alert-success alert-dismissible fade show shadow-sm" role="alert">
                        <FaCheckCircle className="me-2" />
                        {success}
                        <button type="button" className="btn-close" onClick={() => setSuccess('')} />
                    </div>
                )}
                {error && (
                    <div className="alert alert-danger alert-dismissible fade show shadow-sm" role="alert">
                        <FaExclamationTriangle className="me-2" />
                        {error}
                        <button type="button" className="btn-close" onClick={() => setError('')} />
                    </div>
                )}

                {/* Formulário */}
                <div className="card shadow-sm">
                    <div className="card-header bg-primary text-white">
                        <h5 className="mb-0">
                            <FaInfoCircle className="me-2" />
                            Informações do Livro
                        </h5>
                    </div>
                    <div className="card-body p-4">
                        <form onSubmit={handleSave}>
                            <div className="row g-4">
                                {/* ISBN */}
                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">
                                        <FaBarcode className="me-2 text-primary" />
                                        ISBN
                                        <span className="text-danger ms-1">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={isbn}
                                        onChange={(e) => setIsbn(e.target.value)}
                                        required
                                        placeholder="Ex: 978-1234567890"
                                    />
                                    <div className="form-text">
                                        <small><FaInfoCircle className="me-1" />Código único do livro</small>
                                    </div>
                                </div>

                                {/* Título */}
                                <div className="col-md-8">
                                    <label className="form-label fw-semibold">
                                        <FaHeading className="me-2 text-primary" />
                                        Título
                                        <span className="text-danger ms-1">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={titulo}
                                        onChange={(e) => setTitulo(e.target.value)}
                                        required
                                        placeholder="Ex: O Pequeno Príncipe"
                                    />
                                    <div className="form-text">
                                        <small><FaInfoCircle className="me-1" />Nome completo do livro</small>
                                    </div>
                                </div>

                                {/* Autores */}
                                <div className="col-12">
                                    <label className="form-label fw-semibold">
                                        <FaUserEdit className="me-2 text-primary" />
                                        Autor(es)
                                        <span className="text-danger ms-1">*</span>
                                    </label>
                                    <div className="input-group mb-2">
                                        <button
                                            type="button"
                                            className="btn btn-outline-primary"
                                            onClick={() => setShowAutorModal(true)}
                                        >
                                            <FaSearch className="me-2" />
                                            Pesquisar Autor
                                        </button>
                                    </div>
                                    
                                    {autoresSel.length === 0 ? (
                                        <div className="alert alert-warning mb-0">
                                            <FaExclamationTriangle className="me-2" />
                                            Nenhum autor selecionado. Clique em "Pesquisar Autor" para adicionar.
                                        </div>
                                    ) : (
                                        <div className="p-3 bg-light rounded">
                                            <div className="d-flex flex-wrap gap-2">
                                                {autoresSel.map((nome) => (
                                                    <span key={nome} className="badge bg-primary fs-6 d-inline-flex align-items-center">
                                                        {nome}
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-link text-white p-0 ms-2"
                                                            onClick={() => setAutoresSel(autoresSel.filter((a) => a !== nome))}
                                                            style={{ textDecoration: 'none' }}
                                                        >
                                                            <FaTimes />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Género */}
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">
                                        <FaTags className="me-2 text-primary" />
                                        Género
                                    </label>
                                    <select
                                        className="form-select"
                                        value={genero}
                                        onChange={(e) => setGenero(e.target.value)}
                                    >
                                        <option value="">-- Escolha o género --</option>
                                        {listaGeneros.map((g) => (
                                            <option key={g.ge_genero} value={g.ge_genero}>
                                                {g.ge_genero}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="form-text">
                                        <small><FaInfoCircle className="me-1" />Categoria do livro (opcional)</small>
                                    </div>
                                </div>

                                {/* Ano */}
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">
                                        <FaCalendar className="me-2 text-primary" />
                                        Ano de Publicação
                                    </label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={ano}
                                        onChange={(e) => setAno(e.target.value)}
                                        min="1000"
                                        max="2100"
                                        placeholder="Ex: 2023"
                                    />
                                    <div className="form-text">
                                        <small><FaInfoCircle className="me-1" />Ano de publicação (opcional)</small>
                                    </div>
                                </div>

                                {/* Edição */}
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">
                                        <FaLayerGroup className="me-2 text-primary" />
                                        Edição
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={edicao}
                                        onChange={(e) => setEdicao(e.target.value)}
                                        placeholder="Ex: 1.ª"
                                    />
                                    <div className="form-text">
                                        <small><FaInfoCircle className="me-1" />Número da edição (opcional)</small>
                                    </div>
                                </div>

                                {/* Editora */}
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">
                                        <FaBuilding className="me-2 text-primary" />
                                        Editora
                                    </label>
                                    <select
                                        className="form-select"
                                        value={editora}
                                        onChange={(e) => setEditora(e.target.value)}
                                    >
                                        <option value="">-- Escolha a editora --</option>
                                        {listaEditoras.map((ed) => (
                                            <option key={ed.ed_cod} value={ed.ed_cod}>
                                                {ed.ed_nome}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="form-text">
                                        <small><FaInfoCircle className="me-1" />Casa publicadora (opcional)</small>
                                    </div>
                                </div>

                                {/* Exemplares - Apenas em modo registo */}
                                {!isEditMode && (
                                    <>
                                        <div className="col-12">
                                            <hr className="my-2" />
                                            <h6 className="text-primary mb-3">
                                                <FaCopy className="me-2" />
                                                Exemplares Físicos
                                            </h6>
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">
                                                <FaCopy className="me-2 text-primary" />
                                                Quantidade de Exemplares
                                            </label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={numEx}
                                                onChange={(e) => setNumEx(Math.max(0, Number(e.target.value)))}
                                                min="0"
                                                placeholder="Ex: 3"
                                            />
                                            <div className="form-text">
                                                <small><FaInfoCircle className="me-1" />Número de cópias físicas a criar</small>
                                            </div>
                                        </div>

                                        <div className="col-md-6 d-flex align-items-end">
                                            <div className="form-check form-switch">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={permReq}
                                                    onChange={(e) => setPermReq(e.target.checked)}
                                                    id="permReqSwitch"
                                                />
                                                <label className="form-check-label" htmlFor="permReqSwitch">
                                                    <FaHandHolding className="me-2 text-primary" />
                                                    Permitir requisição dos exemplares
                                                </label>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Info exemplares em modo edição */}
                                {isEditMode && (
                                    <div className="col-12">
                                        <div className="alert alert-info shadow-sm">
                                            <FaInfoCircle className="me-2" />
                                            Este livro tem <strong>{numEx} exemplar(es)</strong> registado(s).
                                            Para gerir exemplares, aceda à lista de exemplares deste livro.
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Botões */}
                            <div className="d-flex gap-2 mt-4 pt-3 border-top">
                                <button type="submit" className="btn btn-primary friendly-btn" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <FaSpinner className="fa-spin me-2" />
                                            A guardar...
                                        </>
                                    ) : (
                                        <>
                                            <FaSave className="me-2" />
                                            {isEditMode ? 'Atualizar Livro' : 'Guardar Livro'}
                                        </>
                                    )}
                                </button>
                                
                                {!isEditMode && (
                                    <button
                                        type="button"
                                        className="btn btn-outline-warning friendly-btn"
                                        onClick={() => {
                                            setIsbn('');
                                            setTitulo('');
                                            setGenero('');
                                            setAno(new Date().getFullYear());
                                            setEdicao('');
                                            setEditora('');
                                            setAutoresSel([]);
                                            setNumEx(0);
                                            setPermReq(true);
                                        }}
                                        disabled={loading}
                                    >
                                        <FaUndo className="me-2" />
                                        Limpar Campos
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                {/* Informação adicional */}
                <div className="mt-3 text-center">
                    <small className="text-muted">
                        <FaInfoCircle className="me-1" />
                        Os campos marcados com <span className="text-danger">*</span> são obrigatórios
                    </small>
                </div>
            </div>

            {/* Modal de pesquisa de autores */}
            {showAutorModal && (
                <AuthorSearchModal
                    open={showAutorModal}
                    onClose={() => setShowAutorModal(false)}
                    onSelect={(autor) => {
                        if (!autoresSel.includes(autor.au_nome)) {
                            setAutoresSel((prev) => [...prev, autor.au_nome]);
                        }
                    }}
                />
            )}

            <style jsx>{`
                .friendly-btn {
                    border-radius: 25px;
                    padding: 0.5rem 1.5rem;
                    font-weight: 500;
                    transition: all 0.3s ease;
                }
                .friendly-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                }
                .fa-spin {
                    animation: fa-spin 1s infinite linear;
                }
                @keyframes fa-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
}