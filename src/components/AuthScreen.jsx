import { useState } from 'react';

export default function AuthScreen({ onSuccess }) {
    const [input, setInput] = useState('');
    const [error, setError] = useState('');
    

    const secretKey = process.env.REACT_APP_SECRET_KEY;
    const handleSubmit = (e) => {
        e.preventDefault();
        if (input === secretKey) {
            onSuccess();
        } else {
            setError('Chave inválida. Tente novamente.');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <form onSubmit={handleSubmit} style={{ textAlign: 'center' }}>
                <h2>Digite a chave para acessar</h2>
                <input
                    type="password"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Chave secreta"
                    style={{ padding: '0.5rem', margin: '1rem 0', width: '250px' }}
                />
                <br />
                <button type="submit" style={{ padding: '0.5rem 1rem' }}>Entrar</button>
                {error && <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>}
            </form>
        </div>
    );
}
