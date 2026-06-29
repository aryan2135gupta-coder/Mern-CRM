import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Lead name is required'],
      trim: true,
      maxlength: [100, 'Lead name cannot be more than 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Lead email is required'],
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [30, 'Phone cannot be more than 30 characters']
    },
    source: {
      type: String,
      trim: true,
      default: 'website'
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'converted', 'lost'],
      default: 'new'
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned agent is required']
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Notes cannot be more than 2000 characters']
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    tasks: [
      {
        title: { type: String, required: true },
        dueDate: { type: Date },
        isCompleted: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true
  }
);

leadSchema.index({ status: 1 });
leadSchema.index({ assignedAgent: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ name: 'text', email: 'text', phone: 'text', source: 'text' });

const Lead = mongoose.model('Lead', leadSchema);

export default Lead;
