'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, CalendarDays, CheckCircle2, Clock3, Images, Inbox, LogOut, Mail, Plus, Save, ShieldCheck, Trash2 } from 'lucide-react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://iskcon-saharanpur-api.onrender.com';
type ScheduleItem = { time: string; name: string };
type TempleEvent = { _id?: string; title: string; date: string; description: string; image?: string };
type Enquiry = { _id:string; name:string; contact:string; message?:string; status:'new'|'read'|'replied'; createdAt:string };
type GalleryItem = { id:string; image:string; alt:string };
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
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [sections, setSections] = useState<Sections>(defaultSections);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingEvent, setSavingEvent] = useState<number|null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('iskcon-admin-token');
    if (saved) { setToken(saved); load(saved); }
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(''), 4500);
    return () => window.clearTimeout(timer);
  }, [message]);

  async function load(authToken: string) {
    try {
      const response = await fetch(`${apiUrl}/api/admin/content`, { headers: { Authorization: `Bearer ${authToken}` } });
      if (!response.ok) return logout();
      const data = await response.json();
      setSchedule(data.schedule || []);
      setEvents(data.events || []);
      setEnquiries(data.enquiries || []);
      setGallery(data.gallery || []);
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

  async function saveGallery() {
    setLoading(true); setMessage('');
    try {
      const response = await fetch(`${apiUrl}/api/admin/gallery`, { method:'PUT', headers:auth, body:JSON.stringify({ gallery }) });
      const data = await response.json().catch(()=>({}));
      setMessage(response.ok ? '✓ Temple slideshow saved successfully.' : `Could not save slideshow: ${data.message || 'Please try again.'}`);
      if(response.ok && data.gallery) setGallery(data.gallery);
    } catch { setMessage('Could not save slideshow. The server may be waking up—please try again.'); }
    setLoading(false);
  }

  function uploadGalleryImage(file?:File) {
    if (!file) return;
    if (gallery.length>=10) return setMessage('You can add up to 10 slideshow photos.');
    if (!file.type.startsWith('image/') || file.size > 8000000) return setMessage('Please choose a JPG, PNG or WebP image smaller than 8 MB.');
    const reader = new FileReader();
    reader.onload = () => { const image=new Image(); image.onload=()=>{ const scale=Math.min(1,1200/Math.max(image.width,image.height)); const canvas=document.createElement('canvas'); canvas.width=Math.round(image.width*scale); canvas.height=Math.round(image.height*scale); canvas.getContext('2d')?.drawImage(image,0,0,canvas.width,canvas.height); setGallery(items=>[...items,{id:crypto.randomUUID(),image:canvas.toDataURL('image/jpeg',.72),alt:'ISKCON Saharanpur temple'}]); setMessage('✓ Photo ready. Add more photos or click “Save slideshow”.'); }; image.src=String(reader.result); }; reader.readAsDataURL(file);
  }

  function moveGallery(index:number,direction:-1|1) { setGallery(items=>{ const next=[...items]; const target=index+direction; if(target<0||target>=next.length)return items; [next[index],next[target]]=[next[target],next[index]]; return next; }); }

  async function saveEvent(index: number) {
    const item = events[index];
    const endpoint = item._id ? `${apiUrl}/api/admin/events/${item._id}` : `${apiUrl}/api/admin/events`;
    setSavingEvent(index); setMessage('');
    try {
      const response = await fetch(endpoint, { method:item._id?'PUT':'POST', headers:auth, body:JSON.stringify(item) });
      const data = await response.json().catch(()=>({}));
      if (response.ok) { setMessage('✓ Event saved successfully.'); await load(token); } else setMessage(`Could not save event: ${data.message || 'Please check all fields.'}`);
    } catch { setMessage('Could not save event. The server may be waking up—please try again.'); }
    setSavingEvent(null);
  }

  async function removeEvent(index: number) {
    const item = events[index];
    if (item._id) await fetch(`${apiUrl}/api/admin/events/${item._id}`, { method:'DELETE', headers:auth });
    setEvents(current=>current.filter((_,i)=>i!==index)); setMessage('Event removed.');
  }

  function uploadEventImage(index:number, file?:File) {
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 8000000) return setMessage('Please choose a JPG, PNG or WebP image smaller than 8 MB.');
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, 900 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
        canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', .65);
        setEvents(items=>items.map((item,i)=>i===index?{...item,image:compressed}:item));
        setMessage('✓ Image ready. Now click “Save event” to publish it.');
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  async function setEnquiryStatus(id:string, status:Enquiry['status']) {
    const response = await fetch(`${apiUrl}/api/admin/enquiries/${id}`, { method:'PATCH', headers:auth, body:JSON.stringify({status}) });
    if (response.ok) setEnquiries(items=>items.map(item=>item._id===id?{...item,status}:item));
  }

  async function removeEnquiry(id:string) {
    const response = await fetch(`${apiUrl}/api/admin/enquiries/${id}`, { method:'DELETE', headers:auth });
    if (response.ok) setEnquiries(items=>items.filter(item=>item._id!==id));
  }

  if (!token) return <main className="admin-shell login-shell"><section className="login-card"><div className="admin-logo"><ShieldCheck/><span>Temple Developer Area</span></div><p className="eyebrow dark">ISKCON Saharanpur</p><h1>Content sign in</h1><p>Authorized temple staff can update public darshan timings and events here.</p><form onSubmit={login}><label>Email<input name="email" type="email" required autoComplete="username"/></label><label>Password<input name="password" type="password" required autoComplete="current-password"/></label>{message&&<p className="form-message error">{message}</p>}<button className="button gold" disabled={loading}>{loading?'Signing in…':'Sign in securely'}</button></form><a href="/">← Return to website</a></section></main>;

  return <main className="admin-shell"><aside className="admin-sidebar"><a className="brand light" href="/"><img className="brand-logo" src="/Logo%20(1)/iskcon_logo.svg" alt="ISKCON logo"/><span><b>ISKCON</b><small>SAHARANPUR</small></span></a><nav><a href="#enquiries"><Inbox/> Enquiries</a><a href="#page-content"><Save/> Page content</a><a href="#gallery"><Images/> Temple slideshow</a><a href="#darshan"><Clock3/> Darshan timings</a><a href="#events"><CalendarDays/> Upcoming events</a></nav><button onClick={logout}><LogOut/> Sign out</button></aside><section className="admin-main"><header><div><p className="eyebrow dark">Temple developer area</p><h1>Content dashboard</h1></div><span className="status-dot">Connected</span></header>{message&&<div role="status" aria-live="polite" className={`admin-notice ${/could not|offline|please choose|invalid/i.test(message)?'notice-error':'notice-success'}`}>{message}<button onClick={()=>setMessage('')} aria-label="Dismiss notification">×</button></div>}
    <section className="admin-panel" id="enquiries"><div className="panel-heading"><div><Inbox/><span><h2>Enquiry inbox</h2><p>Messages submitted through the public website.</p></span></div><span className="inquiry-count">{enquiries.filter(item=>item.status==='new').length} new</span></div><div className="inquiry-list">{enquiries.length===0&&<div className="empty-state">No enquiries received yet.</div>}{enquiries.map(item=><article className={`inquiry-card ${item.status==='new'?'is-new':''}`} key={item._id}><div className="inquiry-meta"><span className={`inquiry-status ${item.status}`}>{item.status}</span><time>{new Date(item.createdAt).toLocaleString('en-IN')}</time></div><h3>{item.name}</h3><a className="inquiry-contact" href={item.contact.includes('@')?`mailto:${item.contact}`:`tel:${item.contact.replace(/\s/g,'')}`}><Mail size={15}/>{item.contact}</a><p>{item.message||'No message provided.'}</p><div className="inquiry-actions"><button className="add-button" onClick={()=>setEnquiryStatus(item._id,'read')}>Mark read</button><button className="add-button" onClick={()=>setEnquiryStatus(item._id,'replied')}><CheckCircle2 size={16}/> Replied</button><button className="delete-button" onClick={()=>removeEnquiry(item._id)}><Trash2 size={16}/> Delete</button></div></article>)}</div></section>
    <section className="admin-panel" id="page-content"><div className="panel-heading"><div><Save/><span><h2>Website headings & content</h2><p>Edit the main text displayed across the public website.</p></span></div><button className="button gold" onClick={saveSections} disabled={loading}><Save size={17}/> Save all content</button></div><div className="content-editor">
      {Object.entries(sections).map(([section,fields])=><fieldset className="content-group" key={section}><legend>{section}</legend>{Object.entries(fields).map(([field,value])=><label key={field}>{field}{['body','address'].includes(field)?<textarea rows={field==='body'?4:3} value={value} onChange={e=>updateSection(section,field,e.target.value)}/>:<input value={value} onChange={e=>updateSection(section,field,e.target.value)}/>}</label>)}</fieldset>)}
    </div></section>
    <section className="admin-panel" id="gallery"><div className="panel-heading"><div><Images/><span><h2>Discover Our Temple slideshow</h2><p>Add up to 10 photos. The first photo appears first on the public website.</p></span></div><button className="button gold" onClick={saveGallery} disabled={loading}><Save size={17}/> {loading?'Saving…':'Save slideshow'}</button></div><label className="gallery-upload">Add temple photo (JPG, PNG or WebP)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{uploadGalleryImage(e.target.files?.[0]);e.currentTarget.value='';}}/></label><div className="gallery-editor">{gallery.length===0&&<div className="empty-state">No slideshow photos yet. Add your first temple photograph.</div>}{gallery.map((item,index)=><article className="gallery-edit-card" key={item.id}><img src={item.image} alt={item.alt}/><label>Photo description<input value={item.alt} placeholder="Example: Evening darshan at ISKCON Saharanpur" onChange={e=>setGallery(items=>items.map((photo,i)=>i===index?{...photo,alt:e.target.value}:photo))}/></label><div className="gallery-edit-actions"><button className="add-button" disabled={index===0} onClick={()=>moveGallery(index,-1)} aria-label="Move photo up"><ArrowUp/></button><button className="add-button" disabled={index===gallery.length-1} onClick={()=>moveGallery(index,1)} aria-label="Move photo down"><ArrowDown/></button><button className="delete-button" onClick={()=>setGallery(items=>items.filter((_,i)=>i!==index))}><Trash2 size={16}/> Remove</button></div></article>)}</div></section>
    <section className="admin-panel" id="darshan"><div className="panel-heading"><div><Clock3/><span><h2>Darshan schedule</h2><p>Displayed publicly in the Daily Worship section.</p></span></div><button className="button gold" onClick={saveSchedule} disabled={loading}><Save size={17}/> Save changes</button></div><div className="schedule-editor">{schedule.map((item,index)=><div className="edit-row" key={index}><input aria-label="Time" value={item.time} onChange={e=>setSchedule(s=>s.map((x,i)=>i===index?{...x,time:e.target.value}:x))}/><input aria-label="Arati name" value={item.name} onChange={e=>setSchedule(s=>s.map((x,i)=>i===index?{...x,name:e.target.value}:x))}/><button aria-label="Remove timing" onClick={()=>setSchedule(s=>s.filter((_,i)=>i!==index))}><Trash2/></button></div>)}</div><button className="add-button" onClick={()=>setSchedule([...schedule,{time:'',name:''}])}><Plus/> Add timing</button></section>
    <section className="admin-panel" id="events"><div className="panel-heading"><div><CalendarDays/><span><h2>Upcoming events</h2><p>Create, edit or remove public temple events.</p></span></div><button className="add-button" onClick={()=>setEvents([...events,{title:'',date:'',description:'',image:''}])}><Plus/> New event</button></div><div className="event-editor">{events.length===0&&<div className="empty-state">No upcoming events yet. Add the first one when ready.</div>}{events.map((item,index)=><article className="event-edit-card" key={item._id||index}><label>Event title<input value={item.title} onChange={e=>setEvents(s=>s.map((x,i)=>i===index?{...x,title:e.target.value}:x))}/></label><label>Date<input type="date" value={item.date?.slice(0,10)} onChange={e=>setEvents(s=>s.map((x,i)=>i===index?{...x,date:e.target.value}:x))}/></label><label className="full">Description<textarea rows={3} value={item.description} onChange={e=>setEvents(s=>s.map((x,i)=>i===index?{...x,description:e.target.value}:x))}/></label><label className="full event-upload">Event image (JPG, PNG or WebP — max 1.5 MB)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>uploadEventImage(index,e.target.files?.[0])}/></label>{item.image&&<div className="event-image-preview"><img src={item.image} alt="Event preview"/><button className="delete-button" onClick={()=>setEvents(s=>s.map((x,i)=>i===index?{...x,image:''}:x))}><Trash2 size={15}/> Remove image</button></div>}<div className="event-actions"><button className="button gold" disabled={savingEvent===index} onClick={()=>saveEvent(index)}><Save size={16}/> {savingEvent===index?'Saving…':'Save event'}</button><button className="delete-button" onClick={()=>removeEvent(index)}><Trash2 size={16}/> Remove</button></div></article>)}</div></section>
  </section></main>;
}
