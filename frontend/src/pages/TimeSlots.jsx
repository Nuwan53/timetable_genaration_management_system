import CrudPage from './CrudPage';
import { timeslots } from '../api';

const fields = [
  {key:'day', label:'Day'},
  {key:'start_time', label:'Start'},
  {key:'end_time', label:'End'},
];

export default function TimeSlots() {
  return (
    <CrudPage
      title="Time Slots"
      api={timeslots}
      fields={fields}
      rowRenderer={item => (
        <>
          <td><span className="badge badge-amber">{item.day}</span></td>
          <td>{item.start_time}</td>
          <td>{item.end_time}</td>
        </>
      )}
      formRenderer={(form, setForm) => (
        <>
          <div className="form-group"><label>Day</label>
            <select value={form.day||'Monday'} onChange={e=>setForm({...form,day:e.target.value})}>
              {['Monday','Tuesday','Wednesday','Thursday','Friday'].map(d=><option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Start Time</label>
              <input type="time" value={form.start_time||'08:00'} onChange={e=>setForm({...form,start_time:e.target.value})}/>
            </div>
            <div className="form-group"><label>End Time</label>
              <input type="time" value={form.end_time||'08:55'} onChange={e=>setForm({...form,end_time:e.target.value})}/>
            </div>
          </div>
        </>
      )}
    />
  );
}
