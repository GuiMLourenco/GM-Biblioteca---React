import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function TestGeneros() {
  const [generos, setGeneros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('genero')          // nome exacto da tabela
        .select('ge_genero')     // nome exacto da coluna
        .order('ge_genero', { ascending: true });

      if (error) setError(error.message);
      else setGeneros(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p>A carregar...</p>;
  if (error)   return <p>Erro: {error}</p>;

  return (

    <div className="container py-4">
      <h2>Teste de conexão – tabela <code>genero</code></h2>
      <ul className="list-group mt-3">
        {generos.map((g) => (
          <li key={g.ge_genero} className="list-group-item">
            {g.ge_genero}
          </li>
        ))}
      </ul>
    </div>
  );
}