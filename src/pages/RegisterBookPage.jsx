import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { AuthorSearchModal } from '../components/SearchModals';

export default function RegisterBookPage() {
    const nav = useNavigate();
    const { id } = useParams(); // Captura o ID da URL
    const isEditMode = Boolean(id); // Determina se está em modo edição

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

            // Em modo edição, mostra apenas contagem (não permite criar mais aqui)
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
            <div className="container py-4 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">A carregar...</span>
                </div>
                <p className="mt-3 text-muted">A carregar dados do livro...</p>
            </div>
        );
    }

    return (
        <>
            <div className="container py-4">
                {/* Cabeçalho */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="text-primary">
                            <i className={`fas fa-${isEditMode ? 'edit' : 'book'} me-2`} />
                            {isEditMode ? 'Editar Livro' : 'Registar Novo Livro'}
                        </h2>
                        <p className="text-muted">
                            {isEditMode
                                ? 'Atualize as informações do livro'
                                : 'Preencha as informações do livro para adicionar à biblioteca'}
                        </p>
                    </div>
                    <button className="btn btn-secondary" onClick={() => nav(-1)}>
                        Voltar
                    </button>
                </div>

                {/* Alerts */}
                {success && (
                    <div className="alert alert-success alert-dismissible fade show" role="alert">
                        <i className="fas fa-check-circle me-2" />
                        {success}
                        <button type="button" className="btn-close" onClick={() => setSuccess('')} />
                    </div>
                )}
                {error && (
                    <div className="alert alert-danger alert-dismissible fade show" role="alert">
                        <i className="fas fa-exclamation-triangle me-2" />
                        {error}
                        <button type="button" className="btn-close" onClick={() => setError('')} />
                    </div>
                )}

                {/* Formulário */}
                <div className="card">
                    <div className="card-header">
                        <h5 className="mb-0">
                            <i className="fas fa-info-circle me-2" />
                            Informações do Livro
                        </h5>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSave} className="row g-3">
                            {/* ISBN */}
                            <div className="col-md-4">
                                <label className="form-label">
                                    <i className="fas fa-barcode me-1" />
                                    ISBN *
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={isbn}
                                    onChange={(e) => setIsbn(e.target.value)}
                                    required
                                    placeholder="Ex: 978-1234567890"
                                />
                                <div className="form-text">Código único do livro (obrigatório)</div>
                            </div>

                            {/* Título */}
                            <div className="col-md-8">
                                <label className="form-label">
                                    <i className="fas fa-heading me-1" />
                                    Título *
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={titulo}
                                    onChange={(e) => setTitulo(e.target.value)}
                                    required
                                    placeholder="Ex: O Pequeno Príncipe"
                                />
                                <div className="form-text">Nome do livro (obrigatório)</div>
                            </div>

                            {/* Autores */}
                            <div className="col-md-6">
                                <label className="form-label">
                                    <i className="fas fa-user-edit me-1" />
                                    Autor(es) *
                                </label>
                                <div className="input-group">
                                    <button
                                        type="button"
                                        className="btn btn-outline-primary"
                                        onClick={() => setShowAutorModal(true)}
                                    >
                                        <i className="fas fa-search me-1" />
                                        Pesquisar Autor
                                    </button>
                                </div>
                                <div className="form-text">
                                    Clique em pesquisar para adicionar autores à lista abaixo
                                </div>
                                <div className="mt-2">
                                    {autoresSel.map((nome) => (
                                        <span key={nome} className="badge rounded-pill text-bg-light border me-2 mb-2 d-inline-flex align-items-center">
                                            {nome}
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-link text-danger p-0 ms-1"
                                                onClick={() => setAutoresSel(autoresSel.filter((a) => a !== nome))}
                                            >
                                                <i className="fas fa-times" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Género */}
                            <div className="col-md-6">
                                <label className="form-label">
                                    <i className="fas fa-tags me-1" />
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
                                <div className="form-text">Tipo de livro (opcional)</div>
                            </div>

                            {/* Ano */}
                            <div className="col-md-4">
                                <label className="form-label">
                                    <i className="fas fa-calendar me-1" />
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
                                <div className="form-text">Ano em que foi publicado (opcional)</div>
                            </div>

                            {/* Edição */}
                            <div className="col-md-4">
                                <label className="form-label">
                                    <i className="fas fa-layer-group me-1" />
                                    Edição
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={edicao}
                                    onChange={(e) => setEdicao(e.target.value)}
                                    placeholder="Ex: 1.ª"
                                />
                                <div className="form-text">Número da edição (opcional)</div>
                            </div>

                            {/* Editora */}
                            <div className="col-md-4">
                                <label className="form-label">
                                    <i className="fas fa-building me-1" />
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
                                <div className="form-text">Casa editora (opcional)</div>
                            </div>

                            {/* Exemplares - Apenas em modo registo */}
                            {!isEditMode && (
                                <>
                                    <div className="col-md-4">
                                        <label className="form-label">
                                            <i className="fas fa-copy me-1" />
                                            Exemplares a criar
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
                                            Quantos exemplares físicos deseja criar automaticamente
                                        </div>
                                    </div>

                                    <div className="col-md-4 d-flex align-items-end">
                                        <div className="form-check form-switch mt-2">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={permReq}
                                                onChange={(e) => setPermReq(e.target.checked)}
                                            />
                                            <label className="form-check-label">
                                                <i className="fas fa-hand-holding me-1" />
                                                Permitir requisição dos exemplares
                                            </label>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Info exemplares em modo edição */}
                            {isEditMode && (
                                <div className="col-12">
                                    <div className="alert alert-info">
                                        <i className="fas fa-info-circle me-2" />
                                        Este livro tem <strong>{numEx} exemplar(es)</strong> registado(s).
                                        Para gerir exemplares, aceda à página de detalhes do livro.
                                    </div>
                                </div>
                            )}

                            {/* Botões */}
                            <div className="col-12">
                                <button type="submit" className="btn btn-primary friendly-btn" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" />
                                            A guardar...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-save me-2" />
                                            {isEditMode ? 'Atualizar Livro' : 'Guardar Livro'}
                                        </>
                                    )}
                                </button>
                                {!isEditMode && (
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary friendly-btn ms-2"
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
                                    >
                                        <i className="fas fa-undo me-2" />
                                        Limpar Campos
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Modal de pesquisa de autores */}
            {showAutorModal && (
                <AuthorSearchModal
                    open={showAutorModal}
                    onClose={() => setShowAutorModal(false)}
                    onSelect={(autor) => setAutoresSel((prev) => [...prev, autor.au_nome])}
                />
            )}
        </>
    );
}