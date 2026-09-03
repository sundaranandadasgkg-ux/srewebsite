'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Clock3, Heart, MapPin, Menu, Music2, Phone, X } from 'lucide-react';

const defaultSchedule = [{time:'04:30 AM',name:'Mangala Arati'},{time:'07:30 AM',name:'Darshan Arati and Guru Puja'},{time:'08:00 AM',name:'Srimad Bhagavatam Class'},{time:'12:30 PM',name:'Rajbhog Arati'},{time:'01:00 PM',name:'Temple Closed'},{time:'04:30 PM',name:'Temple Reopens / Utthapan Arati'},{time:'06:30 PM',name:'Gaura Arati'},{time:'08:00 PM',name:'Temple Closed'}];
const defaultSections = {
  hero:{eyebrow:'Hare Krishna • Welcome home',title:'Find joy in',accent:'devotion.',body:'A sacred space in Saharanpur to chant, learn, serve and grow together in Krishna consciousness.'},
  about:{eyebrow:'A place for every soul',title:'Come as you are. Leave with a lighter heart.',body:'ISKCON Saharanpur is a spiritual home inspired by the teachings of His Divine Grace A.C. Bhaktivedanta Swami Prabhupada. Everyone is welcome—whether you are curious, seeking peace, or already walking the path of bhakti.'},
  programs:{eyebrow:'Ways to connect',title:'Devotion, shared.',body:'Simple, joyful practices that bring timeless wisdom into everyday life.'},
  worship:{eyebrow:'Daily worship',title:'Pause the world. Meet the divine.',body:'Join us for darshan, arati and the uplifting sound of the maha-mantra. Festival timings may vary; please call before travelling.'},
  visit:{eyebrow:'Visit ISKCON Saharanpur',title:'Your journey begins here.',address:'ISKCON Saharanpur, Janata Road, next to Janaki Dham Colony, near Dreams College, Sarkari Sheikh, Saharanpur',phone:'+91 88004 37973',email:'saharanpuriskcon@gmail.com',email2:'sundaranandadas.gkg@gmail.com'},
  connect:{eyebrow:'Stay connected',title:'Begin your bhakti journey.',body:'Receive program updates, festival invitations and opportunities to serve with the Saharanpur community.'},
  footer:{tagline:'Chant • Dance • Feast • Serve'},
};
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://iskcon-saharanpur-api.onrender.com';
const programs = [
  { icon: Music2, title: 'Sunday Love Feast', text: 'An uplifting evening of kirtan, wisdom and sanctified vegetarian prasadam for everyone.' },
  { icon: BookOpen, title: 'Bhagavad-gita Study', text: 'Explore Krishna’s timeless teachings through practical, welcoming weekly discussions.' },
  { icon: Heart, title: 'Seva & Community', text: 'Offer your time and talents in deity service, festivals, prasadam and outreach.' },
];

export default function Home() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [schedule, setSchedule] = useState(defaultSchedule);
  const [content, setContent] = useState(defaultSections);
  const [events, setEvents] = useState<Array<{_id:string;title:string;date:string;description:string;image?:string}>>([]);
  const [selectedEvent, setSelectedEvent] = useState<{title:string;image:string}|null>(null);
  const [gallery, setGallery] = useState<Array<{id:string;image:string;alt:string}>>([]);
  const [slide, setSlide] = useState(0);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<{image:string;alt:string}|null>(null);
  useEffect(() => { fetch(`${apiUrl}/api/content`).then(r=>r.json()).then(data=>{ if(data.schedule?.length) setSchedule(data.schedule); if(data.events) setEvents(data.events); if(data.sections) setContent(current=>({...current,...data.sections})); if(data.gallery) setGallery(data.gallery); }).catch(()=>{}); }, []);
  useEffect(() => { if(gallery.length<2) return; const timer=window.setInterval(()=>setSlide(current=>(current+1)%gallery.length),5000); return()=>window.clearInterval(timer); }, [gallery.length]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form));
    try { await fetch(`${apiUrl}/api/enquiries`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) }); } catch {}
    setSent(true); form.reset();
  }
  return <main>
    <header className="site-header">
      <a className="brand" href="#home"><img className="brand-logo" src="/Logo%20(1)/iskcon_logo.svg" alt="ISKCON logo"/><span><b>ISKCON</b><small>SAHARANPUR</small></span></a>
      <nav className={open ? 'nav open' : 'nav'}><a href="#about">About</a><a href="#programs">Programs</a><a href="#schedule">Darshan</a><a href="#visit">Visit us</a><a className="nav-cta" href="#connect">Join the community</a></nav>
      <button className="menu" onClick={()=>setOpen(!open)} aria-label="Toggle navigation">{open?<X/>:<Menu/>}</button>
    </header>
    <section className="hero" id="home"><div className="hero-wash"/><div className="hero-content"><p className="eyebrow">{content.hero.eyebrow}</p><h1>{content.hero.title}<br/><em>{content.hero.accent}</em></h1><p className="hero-copy">{content.hero.body}</p><div className="hero-actions"><a className="button gold" href="#schedule">Plan your visit <ArrowRight size={18}/></a><a className="button ghost" href="#programs">Explore programs</a></div></div><div className="mantra">हरे कृष्ण हरे कृष्ण · कृष्ण कृष्ण हरे हरे</div></section>
    {events.length>0&&<section className="events-section events-featured"><div className="section-heading"><div><p className="eyebrow dark">Temple calendar</p><h2>Upcoming events.</h2></div><p>Come celebrate, chant and serve with the ISKCON Saharanpur community.</p></div><div className="event-grid">{events.map(event=><article className="event-card" key={event._id}>{event.image&&<button className="event-image-button" onClick={()=>setSelectedEvent({title:event.title,image:event.image!})} aria-label={`Enlarge image for ${event.title}`}><img src={event.image} alt={event.title}/><span>Click to enlarge</span></button>}<div className="event-card-copy"><time>{new Date(event.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</time><h3>{event.title}</h3><p>{event.description}</p></div></article>)}</div></section>}
    <section className="welcome" id="about"><div><p className="eyebrow dark">{content.about.eyebrow}</p><h2>{content.about.title}</h2></div><div className="welcome-copy"><p>{content.about.body}</p><a href="#discover">Discover our temple <ArrowRight size={17}/></a></div></section>
    {gallery.length>0&&<section className="temple-gallery" id="discover"><div className="gallery-heading"><p className="eyebrow">Discover our temple</p><h2>A glimpse of devotion.</h2><p>Explore moments of darshan, worship and community at ISKCON Saharanpur.</p></div><div className="gallery-stage"><button className="gallery-photo" onClick={()=>setSelectedGalleryImage(gallery[slide])} aria-label="Enlarge temple photograph"><img key={gallery[slide].id} src={gallery[slide].image} alt={gallery[slide].alt}/><span>Click to enlarge</span></button>{gallery.length>1&&<><button className="gallery-arrow previous" onClick={()=>setSlide((slide-1+gallery.length)%gallery.length)} aria-label="Previous photo"><ArrowLeft/></button><button className="gallery-arrow next" onClick={()=>setSlide((slide+1)%gallery.length)} aria-label="Next photo"><ArrowRight/></button><div className="gallery-dots">{gallery.map((item,index)=><button key={item.id} className={index===slide?'active':''} onClick={()=>setSlide(index)} aria-label={`Show photo ${index+1}`}/>)}</div></>}</div></section>}
    <section className="program-section" id="programs"><div className="section-heading"><div><p className="eyebrow dark">{content.programs.eyebrow}</p><h2>{content.programs.title}</h2></div><p>{content.programs.body}</p></div><div className="program-grid">{programs.map(({icon:Icon,title,text},i)=><article className="program-card" key={title}><span>0{i+1}</span><Icon/><h3>{title}</h3><p>{text}</p><a href="#connect">Learn more <ArrowRight size={16}/></a></article>)}</div></section>
    <section className="schedule-section" id="schedule"><div className="schedule-intro"><p className="eyebrow">{content.worship.eyebrow}</p><h2>{content.worship.title}</h2><p>{content.worship.body}</p></div><div className="schedule-card"><div className="schedule-title"><Clock3/><span>Daily Darshan Schedule</span></div>{schedule.map(({time,name})=><div className="schedule-row" key={`${time}-${name}`}><b>{time}</b><span>{name}</span></div>)}<a href={`tel:${content.visit.phone.replace(/\s/g,'')}`}>Confirm today’s timings <Phone size={16}/></a></div></section>
    <section className="visit" id="visit"><div className="visit-card"><MapPin/><p className="eyebrow dark">{content.visit.eyebrow}</p><h2>{content.visit.title}</h2><p className="preline">{content.visit.address}</p><div className="contact-links"><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(content.visit.address)}`} target="_blank">Get directions <ArrowRight size={16}/></a><a href={`tel:${content.visit.phone.replace(/\s/g,'')}`}>{content.visit.phone}</a><a href={`mailto:${content.visit.email}`}>{content.visit.email}</a><a href={`mailto:${content.visit.email2}`}>{content.visit.email2}</a></div></div><div className="visit-image" role="img" aria-label="Joyful ISKCON kirtan gathering"/></section>
    <section className="connect" id="connect"><div><p className="eyebrow dark">{content.connect.eyebrow}</p><h2>{content.connect.title}</h2><p>{content.connect.body}</p></div>{sent?<div className="success"><Heart/><h3>Hare Krishna!</h3><p>Thank you. We’ll be in touch soon.</p></div>:<form onSubmit={submit}><label>Name<input name="name" required placeholder="Your name"/></label><label>Phone or email<input name="contact" required placeholder="How can we reach you?"/></label><label>Message<textarea name="message" placeholder="I would like to know about…" rows={3}/></label><button className="button gold">Send enquiry <ArrowRight size={18}/></button></form>}</section>
    <footer><a className="brand light" href="#home"><img className="brand-logo" src="/Logo%20(1)/iskcon_logo.svg" alt="ISKCON logo"/><span><b>ISKCON</b><small>SAHARANPUR</small></span></a><p>International Society for Krishna Consciousness<br/>Founder-Acharya: His Divine Grace A.C. Bhaktivedanta Swami Prabhupada</p><p className="footer-mantra">{content.footer.tagline}</p></footer>
    {selectedEvent&&<div className="image-modal" role="dialog" aria-modal="true" aria-label={selectedEvent.title} onClick={()=>setSelectedEvent(null)}><button onClick={()=>setSelectedEvent(null)} aria-label="Close enlarged image"><X/></button><img src={selectedEvent.image} alt={selectedEvent.title} onClick={event=>event.stopPropagation()}/></div>}
    {selectedGalleryImage&&<div className="image-modal" role="dialog" aria-modal="true" aria-label={selectedGalleryImage.alt} onClick={()=>setSelectedGalleryImage(null)}><button onClick={()=>setSelectedGalleryImage(null)} aria-label="Close enlarged image"><X/></button><img src={selectedGalleryImage.image} alt={selectedGalleryImage.alt} onClick={event=>event.stopPropagation()}/></div>}
  </main>;
}
