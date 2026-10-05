import { connectToDatabase } from './db.js';
import {
  Course,
  Centre,
  ResourcePerson,
  StudentAccount,
  Enrollment,
  ClassLog,
  Remittance,
  Payout
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

  try {
    const db = await connectToDatabase();
    if (!db) {
      return res.status(200).json({
        connected: false,
        message: 'No MONGODB_URI configured. Running in client storage mode.'
      });
    }

    if (req.method === 'GET') {
      const [courses, centres, rps, students, enrollments, classLogs, remittances, payouts] = await Promise.all([
        Course.find({}).lean(),
        Centre.find({}).lean(),
        ResourcePerson.find({}).lean(),
        StudentAccount.find({}).lean(),
        Enrollment.find({}).lean(),
        ClassLog.find({}).lean(),
        Remittance.find({}).lean(),
        Payout.find({}).lean()
      ]);

      return res.status(200).json({
        connected: true,
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
        return res.status(200).json({ success: true, message: 'All database records cleared.' });
      }


      if (type === 'SYNC_ENTITY') {
        const { entityName, item } = payload;
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
          return res.status(200).json({ success: true });
        }
      }

      return res.status(400).json({ error: 'Unknown operation type' });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}
