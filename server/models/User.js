import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: true, select: false }, avatar: { type: String, default: '' },
  settings: { theme: { type: String, enum: ['light','dark'], default: 'light' }, timeFormat: { type: String, enum: ['12h','24h'], default: '12h' }, defaultSnooze: { type: Number, default: 5 }, defaultSound: { type: String, default: 'Sunrise' }, vibration: { type: Boolean, default: true }, alarmNotifications: { type: Boolean, default: true }, reminderNotifications: { type: Boolean, default: true }, bedtime: { type: String, default: '22:30' }, wakeTime: { type: String, default: '06:30' } }
}, { timestamps: true });
export default mongoose.model('User', userSchema);
