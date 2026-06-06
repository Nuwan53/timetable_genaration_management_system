import CrudPage from './CrudPage';
import { groups } from '../api';

const fields = [
  {key:'level', label:'Level'},
  {key:'stream', label:'Stream'},
  {key:'subgroup', label:'Subgroup'},
  {key:'year', label:'Year'},
];

export default function Groups() {
  return (
    <CrudPage
      title="Student Groups"
      api={groups}
      fields={fields}
      rowRenderer={item => (
        <>
          <td><span className="badge badge-blue">Level {item.level}</span></td>
          <td>{item.stream==='physical'?'Physical Science':'Bio Science'}</td>
          <td>{item.subgroup||'—'}</td>
          <td>{item.year}</td>
        </>
      )}
      formRenderer={(form, setForm) => (
        <>
          <div className="form-row">
            <div className="form-group"><label>Level</label>
              <select value={form.level||'I'} onChange={e=>setForm({...form,level:e.target.value})}>
                <option value="I">Level I</option>
                <option value="II">Level II</option>
                <option value="III">Level III</option>
              </select>
            </div>
            <div className="form-group"><label>Stream</label>
              <select value={form.stream||'physical'} onChange={e=>setForm({...form,stream:e.target.value})}>
                <option value="physical">Physical Science</option>
                <option value="bio">Bio Science</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Subgroup (optional)</label>
              <input placeholder="e.g. W01, W02" value={form.subgroup||''} onChange={e=>setForm({...form,subgroup:e.target.value})}/>
            </div>
            <div className="form-group"><label>Year</label>
              <input value={form.year||'2024'} onChange={e=>setForm({...form,year:e.target.value})}/>
            </div>
          </div>
        </>
      )}
    />
  );
}
