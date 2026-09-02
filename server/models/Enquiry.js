import mongoose from 'mongoose';
const enquirySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  contact: { type: String, required: true, trim: true },
  message: { type: String, trim: true },
  status: { type: String, enum: ['new', 'read', 'replied'], default: 'new' },
}, { timestamps: true });
export default mongoose.model('Enquiry', enquirySchema);
