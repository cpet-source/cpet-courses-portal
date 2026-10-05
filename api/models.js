import mongoose from 'mongoose';

const CourseSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  slug: String,
  title: { type: String, required: true },
  course_code: { type: String, required: true },
  category: { type: String, enum: ['MAHALLU', 'GENERAL_ONLINE', 'GENERAL_OFFLINE'], default: 'MAHALLU' },
  description: String,
  evaluation_type: { type: String, default: 'EXAM_ONLY' },
  payment_policy: { type: String, default: 'PAY_AT_REGISTRATION' },
  min_attendance_percentage: { type: Number, default: 75 },
  total_planned_classes: { type: Number, default: 24 },
  standard_fee: { type: Number, default: 0 },
  default_rp_remuneration_per_class: { type: Number, default: 800 },
  admission_no_pattern: { type: String, default: 'CPET-{CODE}-26-{SEQ}' },
  status: { type: String, default: 'ACTIVE' },
  registration_status: { type: String, default: 'OPEN' }, // 'OPEN' | 'CLOSED' | 'UPCOMING'
  registration_deadline: String, // 'YYYY-MM-DD'
  subjects: [mongoose.Schema.Types.Mixed],
  custom_questions: [mongoose.Schema.Types.Mixed]
}, { timestamps: true });

const CentreSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  centre_code: { type: String, required: true },
  centre_name: { type: String, required: true },
  place: { type: String, required: true },
  mahallu_name: String,
  panchayath_municipality: String,
  district: { type: String, required: true },
  pincode: String,
  committee_president_name: String,
  committee_president_phone: String,
  committee_secretary_name: String,
  committee_secretary_phone: String,
  founded_by_rp_id: String,
  founded_by_rp_name: String,
  assigned_rp_id: String,
  active_course_id: String,
  course_ids: [String],
  status: { type: String, default: 'ACTIVE' }
}, { timestamps: true });

const ResourcePersonSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  full_name: { type: String, required: true },
  phone: { type: String, unique: true, required: true },
  password: { type: String, default: 'password123' },
  email: String,
  qualification: String,
  bank_account_details: String,
  status: { type: String, default: 'ACTIVE' }
}, { timestamps: true });

const StudentAccountSchema = new mongoose.Schema({
  account_phone: { type: String, unique: true, required: true },
  whatsapp_number: String,
  members: [mongoose.Schema.Types.Mixed]
}, { timestamps: true });

const EnrollmentSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  account_phone: { type: String, required: true },
  student_profile_id: String,
  student_name: { type: String, required: true },
  course_id: { type: String, required: true },
  course_title: String,
  centre_id: String,
  centre_name: String,
  admission_number: { type: String, required: true },
  enrollment_date: String,
  fee_status: { type: String, default: 'PENDING' },
  amount_paid: { type: Number, default: 0 },
  completion_status: { type: String, default: 'IN_PROGRESS' },
  classes_attended: { type: Number, default: 0 },
  attended_sessions: [Number],
  marks: mongoose.Schema.Types.Mixed,
  custom_responses: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const ClassLogSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  rp_id: { type: String, required: true },
  rp_name: String,
  centre_id: { type: String, required: true },
  centre_name: String,
  course_id: { type: String, required: true },
  course_title: String,
  class_date: { type: String, required: true },
  session_type: { type: String, default: 'REGULAR_CLASS' },
  hours_spent: { type: Number, default: 2.0 },
  syllabus_covered: String,
  standard_rate: Number,
  travel_allowance: { type: Number, default: 0 },
  total_claim: Number,
  status: { type: String, default: 'SUBMITTED' },
  admin_notes: String
}, { timestamps: true });

const RemittanceSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  rp_id: { type: String, required: true },
  rp_name: String,
  centre_id: { type: String, required: true },
  centre_name: String,
  amount: { type: Number, required: true },
  payment_mode: String,
  transaction_ref: String,
  remittance_date: String,
  status: { type: String, default: 'PENDING_VERIFICATION' },
  student_count: Number,
  notes: String
}, { timestamps: true });

const PayoutSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  rp_id: { type: String, required: true },
  rp_name: String,
  billing_month: String,
  classes_count: Number,
  total_wages: Number,
  total_travel_allowance: Number,
  final_payout_amount: Number,
  payment_mode: String,
  transaction_ref: String,
  disbursed_at: String,
  status: { type: String, default: 'DISBURSED' }
}, { timestamps: true });

export const Course = mongoose.models.Course || mongoose.model('Course', CourseSchema);
export const Centre = mongoose.models.Centre || mongoose.model('Centre', CentreSchema);
export const ResourcePerson = mongoose.models.ResourcePerson || mongoose.model('ResourcePerson', ResourcePersonSchema);
export const StudentAccount = mongoose.models.StudentAccount || mongoose.model('StudentAccount', StudentAccountSchema);
export const Enrollment = mongoose.models.Enrollment || mongoose.model('Enrollment', EnrollmentSchema);
export const ClassLog = mongoose.models.ClassLog || mongoose.model('ClassLog', ClassLogSchema);
export const Remittance = mongoose.models.Remittance || mongoose.model('Remittance', RemittanceSchema);
export const Payout = mongoose.models.Payout || mongoose.model('Payout', PayoutSchema);

const SystemMetaSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  value: mongoose.Schema.Types.Mixed
}, { timestamps: true });

export const SystemMeta = mongoose.models.SystemMeta || mongoose.model('SystemMeta', SystemMetaSchema);

