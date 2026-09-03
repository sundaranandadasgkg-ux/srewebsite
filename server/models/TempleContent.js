import mongoose from 'mongoose';
const templeContentSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'main' },
  schedule: [{ time: { type: String, required: true }, name: { type: String, required: true } }],
  sections: { type: mongoose.Schema.Types.Mixed, default: {} },
  gallery: [{
    id: { type: String, required: true },
    image: { type: String, required: true, maxlength: 2500000 },
    alt: { type: String, default: 'ISKCON Saharanpur temple', maxlength: 180 },
  }],
}, { timestamps: true });
export default mongoose.model('TempleContent', templeContentSchema);
