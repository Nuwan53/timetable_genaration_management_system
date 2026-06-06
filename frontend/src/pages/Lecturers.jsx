import CrudPage from './CrudPage';
import { lecturers } from '../api';

const fields = [
  {key:'name', label:'Name'},
  {key:'email', label:'Email'},
  {key:'department', label:'Department'},
];

export default function Lecturers() {
  return (
    <CrudPage
      title="Lecturers"
      api={lecturers}
      fields={fields}
      formRenderer={(form, setForm) => (
        <>
          <div className="form-group"><label>Full Name</label>
            <input value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})}/>
          </div>
          <div className="form-group"><label>Email</label>
            <input type="email" value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})}/>
          </div>
          <div className="form-group"><label>Department</label>
            <input value={form.department||''} onChange={e=>setForm({...form,department:e.target.value})}/>
          </div>
        </>
      )}
    />
  );
}
