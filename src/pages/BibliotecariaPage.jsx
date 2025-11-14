import StudentSearch    from '../components/StudentSearch';
import QuickRequestForm from '../components/QuickRequestForm';
import RequestsTable    from '../components/RequestsTable';

export default function BibliotecariaPage() {
  return (
    <div>
      <h1>Gestão de Requisições</h1>
      <StudentSearch />
      <QuickRequestForm />
      <RequestsTable />
    </div>
  );
}