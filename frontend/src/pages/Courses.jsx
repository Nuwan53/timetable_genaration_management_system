import CrudPage from './CrudPage';
import { courses } from '../api';

const fields = [
  {key:'code', label:'Code'},
  {key:'name', label:'Subject Name'},
  {key:'credits', label:'Credits'},
];

export default function Courses() {
  return (
    <CrudPage
      title="Courses"
      api={courses}
      fields={fields}
      formRenderer={(form, setForm) => (
        <>
          <div className="form-row">
            <div className="form-group">
              <label>Course Code</label>
              <input placeholder="e.g. MAT121β" value={form.code||''} onChange={e=>setForm({...form,code:e.target.value})}/>
            </div>
            <div className="form-group">
              <label>Credits</label>
              <input type="number" min="1" max="6" value={form.credits||3} onChange={e=>setForm({...form,credits:e.target.value})}/>
            </div>
          </div>
          <div className="form-group">
            <label>Subject Name</label>
            <input placeholder="e.g. Mathematics I" value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})}/>
          </div>
        </>
      )}
    />
  );
}
