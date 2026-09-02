'use client';

import { FormEvent, useEffect, useState } from 'react';
import { CalendarDays, Clock3, LogOut, Plus, Save, ShieldCheck, Trash2 } from 'lucide-react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://iskcon-saharanpur-api.onrender.com';
type ScheduleItem = { time: string; name: string };
type TempleEvent = { _id?: string; title: string; date: string; description: string };
type Sections = Record<string, Record<string, string>>;
const defaultSections: Sections = {
  hero:{eyebrow:'Hare Krishna • Welcome home',title:'Find joy in',accent:'devotion.',body:'A sacred space in Saharanpur to chant, learn, serve and grow together in Krishna consciousness.'},
  about:{eyebrow:'A place for every soul',title:'Come as you are. Leave with a lighter heart.',body:''},
  programs:{eyebrow:'Ways to connect',title:'Devotion, shared.',body:''},
  worship:{eyebrow:'Daily worship',title:'Pause the world. Meet the divine.',body:''},
  visit:{eyebrow:'Visit ISKCON Saharanpur',title:'Your journey begins here.',address:'ISKCON Saharanpur, Janata Road, next to Janaki Dham Colony, near Dreams College, Sarkari Sheikh, Saharanpur',phone:'+91 88004 37973',email:'saharanpuriskcon@gmail.com',email2:'sundaranandadas.gkg@gmail.com'},
  connect:{eyebrow:'Stay connected',title:'Begin your bhakti journey.',body:''},
  footer:{tagline:'Chant • Dance • Feast • Serve'},
};

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [events, setEvents] = useState<TempleEvent[]>([]);
  const [sections, setSections] = useState<Sections>(defaultSections);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('iskcon-admin-token');
    if (saved) { setToken(saved); load(saved); }
  }, []);

  async function load(authToken: string) {
    try {
      const response = await fetch(`${apiUrl}/api/admin/content`, { headers: { Authorization: `Bearer ${authToken}` } });
      if (!response.ok) return logout();
      const data = await response.json();
      setSchedule(data.schedule || []);
      setEvents(data.events || []);
      if (data.sections) setSections(current=>({...current,...data.sections}));
      if (data.storage === 'temporary-memory') setMessage('Local preview mode: changes reset when the API restarts. Connect MongoDB for permanent storage.');
    } catch { logout(); setMessage('The content API is offline. Start the Express server and try again.'); }
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setMessage('');
    const body = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch(`${apiUrl}/api/admin/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
      const data = await response.json();
      setLoading(false);
      if (!response.ok) return setMessage(data.message || 'Login failed');
      sessionStorage.setItem('iskcon-admin-token', data.token);
      setToken(data.token); await load(data.token);
    } catch { setLoading(false); setMessage('The content API is offline. Please start the Express server and try again.'); }
  }

  function logout() { sessionStorage.removeItem('iskcon-admin-token'); setToken(''); }
  const auth = { 'Content-Type':'application/json', Authorization:`Bearer ${token}` };
  function updateSection(section:string, field:string, value:string) { setSections(current=>({...current,[section]:{...current[section],[field]:value}})); }
  async function saveSections() {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/admin/sections`, { method:'PUT', headers:auth, body:JSON.stringify({ sections }) });
      setMessage(response.ok ? 'Website headings and content saved.' : 'Could not save website content.');
    } catch { setMessage('The content API is offline.'); }
    setLoading(false);
  }

  async function saveSchedule() {
    setLoading(true);
    const response = await fetch(`${apiUrl}/api/admin/schedule`, { method:'PUT', headers:auth, body:JSON.stringify({ schedule }) });
    setLoading(false); setMessage(response.ok ? 'Darshan schedule saved.' : 'Could not save schedule.');
  }

  async function saveEvent(index: number) {
    const item = events[index];
    const endpoint = item._id ? `${apiUrl}/api/admin/events/${item._id}` : `${apiUrl}/api/admin/events`;
    const response = await fetch(endpoint, { method:item._id?'PUT':'POST', headers:auth, body:JSON.stringify(item) });
    if (response.ok) { setMessage('Event saved.'); await load(token); } else setMessage('Could not save event.');
  }

  async function removeEvent(index: number) {
    const item = events[index];
    if (item._id) await fetch(`${apiUrl}/api/admin/events/${item._id}`, { method:'DELETE', headers:auth });
    setEvents(current=>current.filter((_,i)=>i!==index)); setMessage('Event removed.');
  }

  if (!token) return <main className="admin-shell login-shell"><section className="login-card"><div className="admin-logo"><ShieldCheck/><span>Temple Developer Area</span></div><p className="eyebrow dark">ISKCON Saharanpur</p><h1>Content sign in</h1><p>Authorized temple staff can update public darshan timings and events here.</p><form onSubmit={login}><label>Email<input name="email" type="email" required autoComplete="username"/></label><label>Password<input name="password" type="password" required autoComplete="current-password"/></label>{message&&<p className="form-message error">{message}</p>}<button className="button gold" disabled={loading}>{loading?'Signing in…':'Sign in securely'}</button></form><a href="/">← Return to website</a></section></main>;

  return <main className="admin-shell"><aside className="admin-sidebar"><a className="brand light" href="/"><img className="brand-logo" src="/Logo%20(1)/iskcon_logo.svg" alt="ISKCON logo"/><span><b>ISKCON</b><small>SAHARANPUR</small></span></a><nav><a href="#page-content"><Save/> Page content</a><a href="#darshan"><Clock3/> Darshan timings</a><a href="#events"><CalendarDays/> Upcoming events</a></nav><button onClick={logout}><LogOut/> Sign out</button></aside><section className="admin-main"><header><div><p className="eyebrow dark">Temple developer area</p><h1>Content dashboard</h1></div><span className="status-dot">Connected</span></header>{message&&<div className="admin-notice">{message}</div>}
    <section className="admin-panel" id="page-content"><div className="panel-heading"><div><Save/><span><h2>Website headings & content</h2><p>Edit the main text displayed across the public website.</p></span></div><button className="button gold" onClick={saveSections} disabled={loading}><Save size={17}/> Save all content</button></div><div className="content-editor">
      {Object.entries(sections).map(([section,fields])=><fieldset className="content-group" key={section}><legend>{section}</legend>{Object.entries(fields).map(([field,value])=><label key={field}>{field}{['body','address'].includes(field)?<textarea rows={field==='body'?4:3} value={value} onChange={e=>updateSection(section,field,e.target.value)}/>:<input value={value} onChange={e=>updateSection(section,field,e.target.value)}/>}</label>)}</fieldset>)}
    </div></section>
    <section className="admin-panel" id="darshan"><div className="panel-heading"><div><Clock3/><span><h2>Darshan schedule</h2><p>Displayed publicly in the Daily Worship section.</p></span></div><button className="button gold" onClick={saveSchedule} disabled={loading}><Save size={17}/> Save changes</button></div><div className="schedule-editor">{schedule.map((item,index)=><div className="edit-row" key={index}><input aria-label="Time" value={item.time} onChange={e=>setSchedule(s=>s.map((x,i)=>i===index?{...x,time:e.target.value}:x))}/><input aria-label="Arati name" value={item.name} onChange={e=>setSchedule(s=>s.map((x,i)=>i===index?{...x,name:e.target.value}:x))}/><button aria-label="Remove timing" onClick={()=>setSchedule(s=>s.filter((_,i)=>i!==index))}><Trash2/></button></div>)}</div><button className="add-button" onClick={()=>setSchedule([...schedule,{time:'',name:''}])}><Plus/> Add timing</button></section>
    <section className="admin-panel" id="events"><div className="panel-heading"><div><CalendarDays/><span><h2>Upcoming events</h2><p>Create, edit or remove public temple events.</p></span></div><button className="add-button" onClick={()=>setEvents([...events,{title:'',date:'',description:''}])}><Plus/> New event</button></div><div className="event-editor">{events.length===0&&<div className="empty-state">No upcoming events yet. Add the first one when ready.</div>}{events.map((item,index)=><article className="event-edit-card" key={item._id||index}><label>Event title<input value={item.title} onChange={e=>setEvents(s=>s.map((x,i)=>i===index?{...x,title:e.target.value}:x))}/></label><label>Date<input type="date" value={item.date?.slice(0,10)} onChange={e=>setEvents(s=>s.map((x,i)=>i===index?{...x,date:e.target.value}:x))}/></label><label className="full">Description<textarea rows={3} value={item.description} onChange={e=>setEvents(s=>s.map((x,i)=>i===index?{...x,description:e.target.value}:x))}/></label><div className="event-actions"><button className="button gold" onClick={()=>saveEvent(index)}><Save size={16}/> Save event</button><button className="delete-button" onClick={()=>removeEvent(index)}><Trash2 size={16}/> Remove</button></div></article>)}</div></section>
  </section></main>;
}
