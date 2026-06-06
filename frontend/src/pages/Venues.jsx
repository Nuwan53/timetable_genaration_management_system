import CrudPage from './CrudPage';
import { venues } from '../api';

const fields = [
  {key:'code', label:'Code'},
  {key:'name', label:'Name'},
  {key:'capacity', label:'Capacity'},
  {key:'venue_type', label:'Type'},
];

export default function Venues() {
  return (
    <CrudPage
      title="Venues"
      api={venues}
      fields={fields}
      formRenderer={(form, setForm) => (
        <>
          <div className="form-row">
            <div className="form-group"><label>Venue Code</label>
              <input placeholder="e.g. CS AUD" value={form.code||''} onChange={e=>setForm({...form,code:e.target.value})}/>
            </div>
            <div className="form-group"><label>Capacity</label>
              <input type="number" value={form.capacity||100} onChange={e=>setForm({...form,capacity:e.target.value})}/>
            </div>
          </div>
          <div className="form-group"><label>Name</label>
            <input placeholder="e.g. Computer Science Auditorium" value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})}/>
          </div>
          <div className="form-group"><label>Type</label>
            <select value={form.venue_type||'lecture'} onChange={e=>setForm({...form,venue_type:e.target.value})}>
              <option value="lecture">Lecture Hall</option>
              <option value="lab">Laboratory</option>
              <option value="auditorium">Auditorium</option>
            </select>
          </div>
        </>
      )}
    />
  );
}
