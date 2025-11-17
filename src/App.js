import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import RegisterBookPage from './pages/RegisterBookPage';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'font-awesome/css/font-awesome.min.css';
import TestGeneros from './pages/testebd';
import GenericListPage from './pages/GenericListPage';
import GenericFormPage from './pages/GenericFormPage';
import RequisicoesPainel from './pages/RequisicoesPainel';
import { useState } from 'react';

import AuthScreen from './components/AuthScreen';

function App() {
  const [authorized, setAuthorized] = useState(
    localStorage.getItem("authorized") === "true"
  );

  if (!authorized) {
    return (
      <AuthScreen
        onSuccess={() => {
          localStorage.setItem("authorized", "true");
          setAuthorized(true);
        }}
      />
    );
  }
  return (
    <BrowserRouter>
      <Header />   {/* aparece em todas as rotas */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/list/:tableName" element={<GenericListPage />} />
        <Route path="/form/:tableName" element={<GenericFormPage />} />
        <Route path="/form/:tableName/:id" element={<GenericFormPage />} />
        <Route path="/form/livro/:id" element={<RegisterBookPage />} />
        <Route path="/form/livro" element={<RegisterBookPage />} />
        <Route path="/teste" element={<TestGeneros />} />
        <Route path="/req" element={<RequisicoesPainel />} />
        {/* mais rotas aqui quando quiseres */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;