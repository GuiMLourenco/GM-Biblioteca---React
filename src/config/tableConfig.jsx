import { type } from "@testing-library/user-event/dist/type";

export const tableConfig = {
  autor: {
    label: "Autor",
    primaryKey: "au_cod",
    fields: {
      au_cod: { label: "Código", type: "pk", showInForm: false },
      au_nome: { label: "Nome", type: "text", required: true },
      au_pais: {
        label: "País",
        type: "fk",
        fkTable: "pais",
        display: "pa_pais"
      }
    }
  },

  codigo_postal: {
    label: "Código Postal",
    primaryKey: "cod_postal",
    fields: {
      cod_postal: { label: "Código Postal", required: true },
      cod_localidade: { label: "Localidade", required: true }
    }
  },

  edicao: {
    label: "Edição",
    primaryKey: "edc_edicao",
    fields: {
      edc_edicao: { label: "Edição", required: true }
    }
  },

  editora: {
    label: "Editora",
    primaryKey: "ed_cod",
    fields: {
      ed_cod: { label: "Código", showInForm: false },
      ed_nome: { label: "Nome", required: true },
      ed_pais: {
        label: "País",
        type: "fk",
        fkTable: "pais",
        display: "pa_pais"
      },
      ed_morada: { label: "Morada" },
      ed_cod_postal: {
        label: "Código Postal",
        type: "fk",
        fkTable: "codigo_postal",
        display: "cod_postal"
      },
      ed_email: { label: "Email" },
      ed_tlm: { label: "Telemóvel" }
    }
  },

  genero: {
    label: "Género",
    primaryKey: "ge_genero",
    fields: {
      ge_genero: { label: "Género", required: true }
    }
  },

  livro: {
    label: "Livro",
    primaryKey: "li_cod",
    fields: {
      li_cod: { label: "Código", showInForm: false },
      li_titulo: { label: "Título", required: true },
      li_ano: { label: "Ano", type: "number" },
      li_edicao: {
        label: "Edição", 
        type: "fk", 
        fkTable: "edicao", 
        display: "edc_edicao"
      },
      li_isbn: { label: "ISBN" },
      li_editora: {
        label: "Editora",
        type: "fk",
        fkTable: "editora",
        foreignKey: "ed_cod",
        display: "ed_nome"
      },
      li_genero: {
        label: "Género",
        type: "fk",
        fkTable: "genero",
        display: "ge_genero"
      }
    }
  },

  livro_autor: {
    primaryKey: ["li_au_livro", "li_au_autor"],
    label: "Autores do Livro",
    fields: {
      li_au_livro: {
        label: "Livro",
        type: "fk",
        fkTable: "livro",
        foreignKey: "li_cod",
        display: "li_titulo"
      },
      li_au_autor: {
        label: "Autor",
        type: "fk",
        fkTable: "autor",
        foreignKey: "au_cod",
        display: "au_nome"
      }
    }
  },

  livro_exemplar: {
    label: "Exemplar",
    primaryKey: "lex_cod",
    fields: {
      lex_cod: { label: "Código", showInForm: false },
      lex_li_cod: {
        label: "Livro",
        type: "fk",
        fkTable: "livro",
        foreignKey: "li_cod",
        display: "li_titulo"
      },
      lex_estado: {
        label: "Estado",
        type: "text"
      },
      lex_disponivel: { label: "Disponível", type: "boolean" },
      lex_requisitavel: { label: "Requisitável", type: "boolean" }
    }
  },

  pais: {
    label: "País",
    primaryKey: "pa_pais",
    fields: {
      pa_pais: { label: "País", required: true }
    }
  },

  requisicao: {
    label: "Requisição",
    primaryKey: "re_cod",
    fields: {
      re_cod: { label: "Código", showInForm: false },
      re_ut_cod: {
        label: "Utente",
        type: "fk",
        fkTable: "utente",
        foreignKey: "ut_cod",
        display: "ut_nome"
      },
      re_lex_cod: {
        label: "Exemplar",
        type: "fk",
        fkTable: "livro_exemplar",
        foreignKey: "lex_cod",
        display: "lex_cod"
      },
      re_data_requisicao: { label: "Data de Requisição", type: "date", required: true },
      re_data_devolucao: { label: "Data de Devolução", type: "date", showInForm: false },
      re_emprestado: { label: "Emprestado", type: "boolean" }
    }
  },

  utente: {
    label: "Utente",
    primaryKey: "ut_cod",
    fields: {
      ut_cod: { label: "Código", showInForm: false },
      ut_nome: { label: "Nome", required: true },
      ut_nif: { label: "NIF" },
      ut_email: { label: "Email" },
      ut_tlm: { label: "Telemóvel" },
      ut_morada: { label: "Morada" },
      ut_cod_postal: {
        label: "Código Postal",
        type: "fk",
        fkTable: "codigo_postal",
        display: "cod_postal"
      },
      ut_password: { label: "Password", type: "password" }
    }
  }
};
