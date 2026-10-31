import { connectToDatabase } from './db.js';
import {
  Course,
  Centre,
  ResourcePerson,
  StudentAccount,
  Enrollment,
  ClassLog,
  Remittance,
  Payout,
  SystemMeta
} from './models.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  let db = null;
  let dbError = null;

  try {
    db = await connectToDatabase();
  } catch (err) {
    dbError = err.message;
    console.error('API MongoDB connection error:', err.message);
  }

  try {
    if (!db) {
      if (req.method === 'GET') {
        return res.status(200).json({
          connected: false,
          error: dbError || 'MONGODB_URI not configured',
          message: 'Running in fallback client storage mode.',
          data: {
            courses: [],
            centres: [],
            resourcePersons: [],
            students: [],
            enrollments: [],
            classLogs: [],
            remittances: [],
            payouts: []
          }
        });
      }

      if (req.method === 'POST') {
        return res.status(200).json({
          success: false,
          connected: false,
          error: dbError || 'Database connection unavailable',
          message: 'Could not sync to MongoDB cloud. Changes saved locally only.'
        });
      }
    }

    if (req.method === 'GET') {
      const metaUpdate = await SystemMeta.findOne({ key: 'last_updated_at' }).lean();
      const lastUpdatedAt = metaUpdate?.value ? Number(metaUpdate.value) : 0;
      const since = Number(req.query?.since || 0);

      // Lightweight polling check: If client checks if data changed and nothing did, return tiny response!
      if (req.query?.check === '1') {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        if (since > 0 && lastUpdatedAt <= since) {
          return res.status(200).json({
            connected: true,
            changed: false,
            last_updated_at: lastUpdatedAt
          });
        }
      }

      const [courses, centres, rps, students, enrollments, classLogs, remittances, payouts, metaWipe] = await Promise.all([
        Course.find({}).lean(),
        Centre.find({}).lean(),
        ResourcePerson.find({}).lean(),
        StudentAccount.find({}).lean(),
        Enrollment.find({}).lean(),
        ClassLog.find({}).lean(),
        Remittance.find({}).lean(),
        Payout.find({}).lean(),
        SystemMeta.findOne({ key: 'last_wiped_at' }).lean()
      ]);

      res.setHeader('Cache-Control', 'public, s-maxage=5, stale-while-revalidate=15');

      return res.status(200).json({
        connected: true,
        changed: true,
        last_updated_at: lastUpdatedAt,
        last_wiped_at: metaWipe?.value ? Number(metaWipe.value) : 0,
        data: {
          courses,
          centres,
          resourcePersons: rps,
          students,
          enrollments,
          classLogs,
          remittances,
          payouts
        }
      });
    }

    if (req.method === 'POST') {
      const { type, payload } = req.body || {};
      const now = Date.now();

      // Helper to bump the database update timestamp
      const touchUpdatedAt = async () => {
        try {
          await SystemMeta.findOneAndUpdate(
            { key: 'last_updated_at' },
            { key: 'last_updated_at', value: now },
            { upsert: true, new: true }
          );
        } catch (e) {
          console.warn('Could not update last_updated_at:', e.message);
        }
      };

      if (type === 'CLEAR_ALL_DATA') {
        await Promise.all([
          Course.deleteMany({}),
          Centre.deleteMany({}),
          ResourcePerson.deleteMany({}),
          StudentAccount.deleteMany({}),
          Enrollment.deleteMany({}),
          ClassLog.deleteMany({}),
          Remittance.deleteMany({}),
          Payout.deleteMany({})
        ]);
        await SystemMeta.findOneAndUpdate(
          { key: 'last_wiped_at' },
          { key: 'last_wiped_at', value: now },
          { upsert: true, new: true }
        );
        await touchUpdatedAt();
        return res.status(200).json({ success: true, last_wiped_at: now, last_updated_at: now, message: 'All database records cleared.' });
      }

      if (type === 'SYNC_ALL') {
        const {
          courses = [],
          centres = [],
          resourcePersons = [],
          students = [],
          enrollments = [],
          classLogs = [],
          remittances = [],
          payouts = []
        } = payload || {};

        for (const c of courses) {
          if (c.id) await Course.findOneAndUpdate({ id: c.id }, c, { upsert: true, new: true });
        }
        for (const c of centres) {
          if (c.id) await Centre.findOneAndUpdate({ id: c.id }, c, { upsert: true, new: true });
        }
        for (const r of resourcePersons) {
          if (r.id) await ResourcePerson.findOneAndUpdate({ id: r.id }, r, { upsert: true, new: true });
        }
        for (const s of students) {
          if (s.account_phone) await StudentAccount.findOneAndUpdate({ account_phone: s.account_phone }, s, { upsert: true, new: true });
        }
        for (const e of enrollments) {
          if (e.id) await Enrollment.findOneAndUpdate({ id: e.id }, e, { upsert: true, new: true });
        }
        for (const l of classLogs) {
          if (l.id) await ClassLog.findOneAndUpdate({ id: l.id }, l, { upsert: true, new: true });
        }
        for (const rem of remittances) {
          if (rem.id) await Remittance.findOneAndUpdate({ id: rem.id }, rem, { upsert: true, new: true });
        }
        for (const p of payouts) {
          if (p.id) await Payout.findOneAndUpdate({ id: p.id }, p, { upsert: true, new: true });
        }

        await touchUpdatedAt();
        return res.status(200).json({ success: true, message: 'All local records successfully synced to MongoDB Atlas.' });
      }

      if (type === 'SYNC_ENTITY') {
        const { entityName, item } = payload || {};
        let Model;
        if (entityName === 'Course') Model = Course;
        if (entityName === 'Centre') Model = Centre;
        if (entityName === 'ResourcePerson') Model = ResourcePerson;
        if (entityName === 'StudentAccount') Model = StudentAccount;
        if (entityName === 'Enrollment') Model = Enrollment;
        if (entityName === 'ClassLog') Model = ClassLog;
        if (entityName === 'Remittance') Model = Remittance;
        if (entityName === 'Payout') Model = Payout;

        if (Model && item) {
          const filter = item.id ? { id: item.id } : { account_phone: item.account_phone };
          await Model.findOneAndUpdate(filter, item, { upsert: true, new: true });
          await touchUpdatedAt();
          return res.status(200).json({ success: true });
        }
      }

      if (type === 'SYNC_BATCH') {
        const { studentAccounts = [], enrollments = [] } = payload || {};
        const ops = [];
        for (const s of studentAccounts) {
          if (s.account_phone) {
            ops.push(StudentAccount.findOneAndUpdate({ account_phone: s.account_phone }, s, { upsert: true, new: true }));
          }
        }
        for (const e of enrollments) {
          if (e.id) {
            ops.push(Enrollment.findOneAndUpdate({ id: e.id }, e, { upsert: true, new: true }));
          }
        }
        await Promise.all(ops);
        await touchUpdatedAt();
        return res.status(200).json({ success: true, count: enrollments.length });
      }

      if (type === 'DELETE_ENTITY') {
        const { entityName, id, account_phone } = payload || {};
        let Model;
        if (entityName === 'Course') Model = Course;
        if (entityName === 'Centre') Model = Centre;
        if (entityName === 'ResourcePerson') Model = ResourcePerson;
        if (entityName === 'StudentAccount') Model = StudentAccount;
        if (entityName === 'Enrollment') Model = Enrollment;
        if (entityName === 'ClassLog') Model = ClassLog;
        if (entityName === 'Remittance') Model = Remittance;
        if (entityName === 'Payout') Model = Payout;

        if (Model) {
          if (entityName === 'Enrollment' && account_phone && !id) {
            await Model.deleteMany({ account_phone });
            await touchUpdatedAt();
            return res.status(200).json({ success: true, message: `All enrollments for ${account_phone} deleted.` });
          }
          const filter = id ? { id } : { account_phone };
          await Model.deleteOne(filter);
          await touchUpdatedAt();
          return res.status(200).json({ success: true, message: `${entityName} deleted.` });
        }
      }

      if (type === 'DELETE_STUDENT_CASCADE') {
        const { account_phone, student_profile_id, enrollment_id } = payload || {};
        if (enrollment_id) {
          await Enrollment.deleteOne({ id: enrollment_id });
        } else if (account_phone) {
          await Enrollment.deleteMany({ account_phone });
        }

        if (account_phone) {
          const remainingEnrollments = await Enrollment.countDocuments({ account_phone });
          if (remainingEnrollments === 0) {
            await StudentAccount.deleteOne({ account_phone });
          } else if (student_profile_id) {
            await StudentAccount.updateOne(
              { account_phone },
              { $pull: { members: { id: student_profile_id } } }
            );
          }
        }
        await touchUpdatedAt();
        return res.status(200).json({ success: true, message: 'Student records cascaded and erased.' });
      }

      return res.status(400).json({ error: 'Unknown operation type' });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}
