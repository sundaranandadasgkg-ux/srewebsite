import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { randomUUID } from 'node:crypto';
import Enquiry from './models/Enquiry.js';
import TempleContent from './models/TempleContent.js';
import TempleEvent from './models/TempleEvent.js';
const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());
const defaultSchedule = [{time:'04:30 AM',name:'Mangala Arati'},{time:'07:30 AM',name:'Darshan Arati and Guru Puja'},{time:'08:00 AM',name:'Srimad Bhagavatam Class'},{time:'12:30 PM',name:'Rajbhog Arati'},{time:'01:00 PM',name:'Temple Closed'},{time:'04:30 PM',name:'Temple Reopens / Utthapan Arati'},{time:'06:30 PM',name:'Gaura Arati'},{time:'08:00 PM',name:'Temple Closed'}];
const defaultSections = {
  hero:{ eyebrow:'Hare Krishna • Welcome home', title:'Find joy in', accent:'devotion.', body:'A sacred space in Saharanpur to chant, learn, serve and grow together in Krishna consciousness.' },
  about:{ eyebrow:'A place for every soul', title:'Come as you are. Leave with a lighter heart.', body:'ISKCON Saharanpur is a spiritual home inspired by the teachings of His Divine Grace A.C. Bhaktivedanta Swami Prabhupada. Everyone is welcome—whether you are curious, seeking peace, or already walking the path of bhakti.' },
  programs:{ eyebrow:'Ways to connect', title:'Devotion, shared.', body:'Simple, joyful practices that bring timeless wisdom into everyday life.' },
  worship:{ eyebrow:'Daily worship', title:'Pause the world. Meet the divine.', body:'Join us for darshan, arati and the uplifting sound of the maha-mantra. Festival timings may vary; please call before travelling.' },
  visit:{ eyebrow:'Visit ISKCON Saharanpur', title:'Your journey begins here.', address:'ISKCON Saharanpur, Janata Road, next to Janaki Dham Colony, near Dreams College, Sarkari Sheikh, Saharanpur', phone:'+91 88004 37973', email:'saharanpuriskcon@gmail.com', email2:'sundaranandadas.gkg@gmail.com' },
  connect:{ eyebrow:'Stay connected', title:'Begin your bhakti journey.', body:'Receive program updates, festival invitations and opportunities to serve with the Saharanpur community.' },
  footer:{ tagline:'Chant • Dance • Feast • Serve' },
};
let memorySchedule = defaultSchedule;
let memorySections = defaultSections;
let memoryEvents = [];
let dbReady = false;
const jwtSecret = process.env.JWT_SECRET;
const mailer = process.env.SMTP_USER && process.env.SMTP_APP_PASSWORD
  ? nodemailer.createTransport({ service:'gmail', auth:{ user:process.env.SMTP_USER, pass:process.env.SMTP_APP_PASSWORD } })
  : null;
async function sendEnquiryEmail(enquiry) {
  if (!mailer) return;
  const recipients = (process.env.ENQUIRY_RECIPIENTS || 'saharanpuriskcon@gmail.com,sundaranandadas.gkg@gmail.com').split(',').map(item=>item.trim()).filter(Boolean);
  await mailer.sendMail({
    from: `ISKCON Saharanpur Website <${process.env.SMTP_USER}>`,
    to: recipients,
    replyTo: String(enquiry.contact || '').includes('@') ? enquiry.contact : undefined,
    subject: `New website enquiry from ${enquiry.name}`,
    text: `Name: ${enquiry.name}\nContact: ${enquiry.contact}\n\nMessage:\n${enquiry.message || '(No message)'}\n\nThis enquiry is also saved in the admin panel.`,
  });
}
function requireAdmin(req, res, next) {
  if (!jwtSecret) return res.status(503).json({ message: 'Admin authentication is not configured.' });
  try { req.admin = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), jwtSecret); next(); }
  catch { res.status(401).json({ message: 'Your session is invalid or expired.' }); }
}
app.get('/api/health', (_req, res) => res.json({ ok:true, storage:dbReady?'mongodb':'temporary-memory' }));
app.get('/api/content', async (_req, res) => {
  if (!dbReady) return res.json({ schedule:memorySchedule, events:memoryEvents, sections:memorySections });
  const content = await TempleContent.findOne({ key:'main' }).lean();
  const events = await TempleEvent.find({ date:{ $gte:new Date(new Date().setHours(0,0,0,0)) } }).sort({ date:1 }).lean();
  res.json({ schedule:content?.schedule?.length ? content.schedule : defaultSchedule, events, sections:{...defaultSections,...(content?.sections||{})} });
});
app.post('/api/enquiries', async (req, res) => {
  try {
    const enquiry = await Enquiry.create({
      name:String(req.body.name || '').slice(0,120),
      contact:String(req.body.contact || '').slice(0,180),
      message:String(req.body.message || '').slice(0,3000),
    });
    sendEnquiryEmail(enquiry).catch(error=>console.warn('Enquiry email failed.', error?.message || 'Unknown email error'));
    res.status(201).json({ id: enquiry.id });
  }
  catch (error) { res.status(400).json({ message: error instanceof Error ? error.message : 'Unable to save enquiry' }); }
});
app.post('/api/admin/login', async (req, res) => {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD_HASH || !jwtSecret) return res.status(503).json({ message:'Admin login is not configured.' });
  const validEmail = String(req.body.email || '').toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();
  const validPassword = await bcrypt.compare(String(req.body.password || ''), process.env.ADMIN_PASSWORD_HASH);
  if (!validEmail || !validPassword) return res.status(401).json({ message:'Incorrect email or password.' });
  res.json({ token:jwt.sign({ role:'admin', email:process.env.ADMIN_EMAIL }, jwtSecret, { expiresIn:'8h' }) });
});
app.get('/api/admin/content', requireAdmin, async (_req, res) => {
  if (!dbReady) return res.json({ schedule:memorySchedule, events:memoryEvents, sections:memorySections, storage:'temporary-memory' });
  const content = await TempleContent.findOne({ key:'main' }).lean();
  const events = await TempleEvent.find().sort({ date:1 }).lean();
  const enquiries = await Enquiry.find().sort({ createdAt:-1 }).limit(250).lean();
  res.json({ schedule:content?.schedule?.length ? content.schedule : defaultSchedule, events, enquiries, sections:{...defaultSections,...(content?.sections||{})} });
});
app.put('/api/admin/sections', requireAdmin, async (req, res) => {
  const sections = req.body.sections && typeof req.body.sections === 'object' ? req.body.sections : {};
  if (!dbReady) { memorySections = sections; return res.json({ sections, storage:'temporary-memory' }); }
  const content = await TempleContent.findOneAndUpdate({ key:'main' }, { key:'main', sections }, { upsert:true, new:true, runValidators:true });
  res.json(content);
});
app.put('/api/admin/schedule', requireAdmin, async (req, res) => {
  const schedule = Array.isArray(req.body.schedule) ? req.body.schedule.filter(item=>item.time?.trim() && item.name?.trim()).slice(0,20) : [];
  if (!dbReady) { memorySchedule = schedule; return res.json({ schedule, storage:'temporary-memory' }); }
  const content = await TempleContent.findOneAndUpdate({ key:'main' }, { key:'main', schedule }, { upsert:true, new:true, runValidators:true });
  res.json(content);
});
app.post('/api/admin/events', requireAdmin, async (req, res) => { try { if(!dbReady){const event={...req.body,_id:randomUUID()};memoryEvents.push(event);return res.status(201).json(event);} res.status(201).json(await TempleEvent.create(req.body)); } catch(error) { res.status(400).json({message:error.message}); } });
app.put('/api/admin/events/:id', requireAdmin, async (req, res) => { try { if(!dbReady){const index=memoryEvents.findIndex(item=>item._id===req.params.id);if(index<0)return res.status(404).json({message:'Event not found.'});memoryEvents[index]={...memoryEvents[index],...req.body,_id:req.params.id};return res.json(memoryEvents[index]);} res.json(await TempleEvent.findByIdAndUpdate(req.params.id, req.body, {new:true,runValidators:true})); } catch(error) { res.status(400).json({message:error.message}); } });
app.delete('/api/admin/events/:id', requireAdmin, async (req, res) => { if(!dbReady){memoryEvents=memoryEvents.filter(item=>item._id!==req.params.id);return res.status(204).end();} await TempleEvent.findByIdAndDelete(req.params.id); res.status(204).end(); });
app.patch('/api/admin/enquiries/:id', requireAdmin, async (req, res) => {
  const status = ['new','read','replied'].includes(req.body.status) ? req.body.status : 'read';
  const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, { status }, { new:true, runValidators:true });
  if (!enquiry) return res.status(404).json({ message:'Enquiry not found.' });
  res.json(enquiry);
});
app.delete('/api/admin/enquiries/:id', requireAdmin, async (req, res) => {
  await Enquiry.findByIdAndDelete(req.params.id);
  res.status(204).end();
});
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`API running on port ${port}`));
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/iskcon-saharanpur')
  .then(() => { dbReady=true; console.log('MongoDB connected'); })
  .catch((error) => console.warn('MongoDB unavailable; using temporary in-memory storage.', error?.message || 'Unknown connection error'));
