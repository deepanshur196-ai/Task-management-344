import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  deadline: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['Active', 'Completed', 'Archived'], default: 'Active' },
  progress: { type: Number, default: 0 },
  feedback: [
    {
      author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      authorName: { type: String, required: true },
      authorDesignation: { type: String, required: true },
      comment: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    }
  ]
}, { timestamps: true });

export default mongoose.model('Project', projectSchema);
