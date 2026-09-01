import mongoose from 'mongoose';
const templeEventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  description: { type: String, trim: true, maxlength: 800 },
}, { timestamps: true });
export default mongoose.model('TempleEvent', templeEventSchema);
