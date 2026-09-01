import mongoose from 'mongoose';
const templeContentSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'main' },
  schedule: [{ time: { type: String, required: true }, name: { type: String, required: true } }],
  sections: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });
export default mongoose.model('TempleContent', templeContentSchema);
