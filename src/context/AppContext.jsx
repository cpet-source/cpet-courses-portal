import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  initialCourses,
  initialCentres,
  initialResourcePersons,
  initialStudents,
  initialEnrollments,
  initialClassLogs,
  initialRemittances,
  initialPayouts
} from '../data/mockData';

const AppContext = createContext();

const STORAGE_KEYS = {
  COURSES: 'cpet_courses_prod',
  CENTRES: 'cpet_centres_prod',
  RPS: 'cpet_rps_prod',
  STUDENTS: 'cpet_students_prod',
  ENROLLMENTS: 'cpet_enrollments_prod',
  CLASS_LOGS: 'cpet_class_logs_prod',
  REMITTANCES: 'cpet_remittances_prod',
  PAYOUTS: 'cpet_payouts_prod',
  ACTIVE_ROLE: 'cpet_active_role_prod',
  CURRENT_RP_ID: 'cpet_current_rp_id_prod'
};

const getStored = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    return fallback;
  }
};

export const AppProvider = ({ children }) => {
  const [courses, setCourses] = useState(() => getStored(STORAGE_KEYS.COURSES, []));
  const [centres, setCentres] = useState(() => getStored(STORAGE_KEYS.CENTRES, []));
  const [resourcePersons, setResourcePersons] = useState(() => getStored(STORAGE_KEYS.RPS, []));
  const [students, setStudents] = useState(() => getStored(STORAGE_KEYS.STUDENTS, []));
  const [enrollments, setEnrollments] = useState(() => getStored(STORAGE_KEYS.ENROLLMENTS, []));
  const [classLogs, setClassLogs] = useState(() => getStored(STORAGE_KEYS.CLASS_LOGS, []));
  const [remittances, setRemittances] = useState(() => getStored(STORAGE_KEYS.REMITTANCES, []));
  const [payouts, setPayouts] = useState(() => getStored(STORAGE_KEYS.PAYOUTS, []));
  
  // Authentication state
  const [currentUser, setCurrentUser] = useState(() => getStored('cpet_current_user_prod', null));

  // Active view role: 'admin' | 'rp' | 'student'. Defaults to 'student' if not authenticated!
  const [activeRole, setActiveRole] = useState(() => {
    const user = getStored('cpet_current_user_prod', null);
    if (user?.role === 'admin') return 'admin';
    if (user?.role === 'rp') return 'rp';
    return 'student';
  });

  // Currently logged-in RP
  const [currentRpId, setCurrentRpId] = useState(() => {
    const user = getStored('cpet_current_user_prod', null);
    return user?.role === 'rp' ? user.id : '';
  });

  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [cloudError, setCloudError] = useState(null);

  // Notification Toast state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Login Methods
  const loginAdmin = (username, password) => {
    if (username.toLowerCase() === 'cpet@dhiu.in' && password === 'cpet@1986') {
      const user = { role: 'admin', email: 'cpet@dhiu.in', name: 'Super Admin' };
      setCurrentUser(user);
      setActiveRole('admin');
      localStorage.setItem('cpet_current_user_prod', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const loginRp = (phone, password) => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const rp = resourcePersons.find(r => r.phone && r.phone.replace(/\D/g, '').slice(-10) === cleanPhone && r.password === password);
    if (rp) {
      const user = { role: 'rp', id: rp.id, phone: rp.phone, name: rp.full_name };
      setCurrentUser(user);
      setCurrentRpId(rp.id);
      setActiveRole('rp');
      localStorage.setItem('cpet_current_user_prod', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    setActiveRole('student');
    localStorage.removeItem('cpet_current_user_prod');
    showToast('Logged out of authorized portal.');
  };

  // Helper to sync single item to MongoDB
  const syncToCloud = async (entityName, item) => {
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SYNC_ENTITY',
          payload: { entityName, item }
        })
      });
      const data = await res.json();
      if (data && data.success) {
        setIsCloudConnected(true);
        setCloudError(null);
        return true;
      } else {
        if (data?.error) {
          console.warn('MongoDB Cloud Sync notice:', data.error);
          setCloudError(data.error);
        }
        return false;
      }
    } catch (e) {
      console.warn('Network sync error:', e);
      return false;
    }
  };

  // Helper to delete an entity from MongoDB
  const deleteFromCloud = async (entityName, id) => {
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'DELETE_ENTITY',
          payload: { entityName, id }
        })
      });
      const data = await res.json();
      return !!data?.success;
    } catch (e) {
      console.warn('Network delete error:', e);
      return false;
    }
  };

  // Sync all local data to MongoDB cloud (e.g. after fixing credentials)
  const syncAllLocalDataToCloud = async () => {
    try {
      showToast('Syncing all courses and records to MongoDB Atlas...', 'info');
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SYNC_ALL',
          payload: {
            courses,
            centres,
            resourcePersons,
            students,
            enrollments,
            classLogs,
            remittances,
            payouts
          }
        })
      });
      const data = await res.json();
      if (data && data.success) {
        setIsCloudConnected(true);
        setCloudError(null);
        showToast('All records successfully synchronized to MongoDB Cloud!', 'success');
        return true;
      } else {
        const errMsg = data?.error || 'Database rejected connection';
        setCloudError(errMsg);
        showToast(`Cloud sync failed: ${errMsg}`, 'danger');
        return false;
      }
    } catch (e) {
      showToast(`Network error syncing to cloud: ${e.message}`, 'danger');
      return false;
    }
  };

  // Helper to purge all local storage cached collections
  const purgeAllLocalCollections = () => {
    setCourses([]);
    setCentres([]);
    setResourcePersons([]);
    setStudents([]);
    setEnrollments([]);
    setClassLogs([]);
    setRemittances([]);
    setPayouts([]);
    Object.values(STORAGE_KEYS).forEach(k => {
      try { localStorage.removeItem(k); } catch (e) {}
    });
  };

  // Centralized method to apply cloud data and handle global wipes
  const applyCloudData = (res) => {
    if (!res || !res.connected || !res.data) return false;
    setIsCloudConnected(true);
    setCloudError(null);

    const cloudWipedAt = Number(res.last_wiped_at || 0);
    const localWipedAt = Number(localStorage.getItem('cpet_local_wiped_at') || 0);

    // If cloud was wiped more recently than this client knew about, purge local storage
    if (cloudWipedAt > 0 && cloudWipedAt > localWipedAt) {
      localStorage.setItem('cpet_local_wiped_at', String(cloudWipedAt));
      purgeAllLocalCollections();
    }

    const d = res.data;
    // Cloud is the single source of truth - direct assignment (empty cloud = empty state)
    setCourses(d.courses || []);
    setCentres(d.centres || []);
    setResourcePersons(d.resourcePersons || []);
    setStudents(d.students || []);
    setEnrollments(d.enrollments || []);
    setClassLogs(d.classLogs || []);
    setRemittances(d.remittances || []);
    setPayouts(d.payouts || []);
    return true;
  };

  // Live sync from MongoDB Atlas
  const fetchLatestFromCloud = async () => {
    try {
      const r = await fetch('/api/data');
      const res = await r.json();
      if (res && res.connected && res.data) {
        return applyCloudData(res);
      } else {
        if (res?.error) setCloudError(res.error);
        return false;
      }
    } catch (e) {
      return false;
    }
  };

  // Check MongoDB connection on mount and poll
  useEffect(() => {
    const handleInitialSync = async () => {
      try {
        const r = await fetch('/api/data');
        const res = await r.json();
        if (res && res.connected && res.data) {
          applyCloudData(res);
        } else {
          setIsCloudConnected(false);
          if (res?.error) setCloudError(res.error);
        }
      } catch (err) {
        setIsCloudConnected(false);
        setCloudError(err.message);
      }
    };

    handleInitialSync();

    // Auto-refresh when user clicks into this browser tab
    const onFocus = () => fetchLatestFromCloud();
    window.addEventListener('focus', onFocus);

    // Auto-refresh every 12 seconds to pick up updates from other devices
    const interval = setInterval(fetchLatestFromCloud, 12000);

    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, []);




  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CENTRES, JSON.stringify(centres));
  }, [centres]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RPS, JSON.stringify(resourcePersons));
  }, [resourcePersons]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ENROLLMENTS, JSON.stringify(enrollments));
  }, [enrollments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLASS_LOGS, JSON.stringify(classLogs));
  }, [classLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REMITTANCES, JSON.stringify(remittances));
  }, [remittances]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAYOUTS, JSON.stringify(payouts));
  }, [payouts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, JSON.stringify(activeRole));
  }, [activeRole]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_RP_ID, JSON.stringify(currentRpId));
  }, [currentRpId]);

  // Current active RP object
  const currentRp = resourcePersons.find(rp => rp.id === currentRpId) || resourcePersons[0];

  // Reset / Clear all data
  const resetAllData = async () => {
    const now = Date.now();
    localStorage.setItem('cpet_local_wiped_at', String(now));
    purgeAllLocalCollections();

    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'CLEAR_ALL_DATA' })
      });
      const data = await res.json();
      if (data?.last_wiped_at) {
        localStorage.setItem('cpet_local_wiped_at', String(data.last_wiped_at));
      }
    } catch (e) {
      console.error('Failed to wipe database in cloud:', e);
    }
    showToast('Database completely wiped clean across all devices.', 'info');
  };

  // 1. Course Management
  const addCourse = (courseData) => {
    const rawSlug = courseData.slug || courseData.title || courseData.course_code;
    const slug = rawSlug
      ? rawSlug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : `course-${Date.now()}`;

    const newCourse = {
      ...courseData,
      slug,
      id: courseData.id || `crs-${Date.now()}`,
      status: 'ACTIVE',
      createdAt: courseData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setCourses(prev => [newCourse, ...prev]);
    syncToCloud('Course', newCourse).then(synced => {
      if (synced) {
        showToast(`Course "${newCourse.title}" published & synced to cloud!`);
      } else {
        showToast(`Course "${newCourse.title}" created locally. (Notice: MongoDB cloud sync pending)`, 'warning');
      }
    });
    return newCourse;
  };

  const updateCourse = (id, updatedFields) => {
    setCourses(prev => prev.map(c => {
      if (c.id === id) {
        const rawSlug = updatedFields.slug || updatedFields.title || c.slug || c.title;
        const slug = rawSlug ? rawSlug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : c.slug;
        const updated = { ...c, ...updatedFields, slug };
        syncToCloud('Course', updated);
        return updated;
      }
      return c;
    }));
    showToast('Course updated successfully!');
  };

  const deleteCourse = (courseId) => {
    const targetCourse = courses.find(c => c.id === courseId);
    setCourses(prev => prev.filter(c => c.id !== courseId));
    deleteFromCloud('Course', courseId);

    // Cleanly unlink deleted course from any study centres
    setCentres(prev => prev.map(c => {
      let changed = false;
      let updated = { ...c };
      if (c.active_course_id === courseId) {
        updated.active_course_id = null;
        changed = true;
      }
      if (Array.isArray(c.course_ids) && c.course_ids.includes(courseId)) {
        updated.course_ids = c.course_ids.filter(id => id !== courseId);
        changed = true;
      }
      if (Array.isArray(c.completed_course_ids) && c.completed_course_ids.includes(courseId)) {
        updated.completed_course_ids = c.completed_course_ids.filter(id => id !== courseId);
        changed = true;
      }
      if (changed) {
        syncToCloud('Centre', updated);
        return updated;
      }
      return c;
    }));

    showToast(`Course "${targetCourse?.title || 'Course'}" deleted successfully.`);
  };

  const toggleCourseStatus = (courseId) => {
    let nextStatus = 'COMPLETED';
    setCourses(prev => prev.map(c => {
      if (c.id === courseId) {
        nextStatus = c.status === 'COMPLETED' ? 'ACTIVE' : 'COMPLETED';
        const updated = { ...c, status: nextStatus };
        syncToCloud('Course', updated);
        return updated;
      }
      return c;
    }));

    const targetCourse = courses.find(c => c.id === courseId);
    showToast(
      nextStatus === 'COMPLETED'
        ? `Program "${targetCourse?.title || 'Course'}" marked as CONCLUDED & ARCHIVED!`
        : `Program "${targetCourse?.title || 'Course'}" re-activated as ONGOING!`,
      nextStatus === 'COMPLETED' ? 'warning' : 'success'
    );
  };

  const toggleCentreCourseCompletion = (centreId, courseId) => {
    let isNowCompleted = true;
    setCentres(prev => prev.map(c => {
      if (c.id === centreId) {
        const completed = Array.isArray(c.completed_course_ids) ? [...c.completed_course_ids] : [];
        let updatedCompleted;
        if (completed.includes(courseId)) {
          updatedCompleted = completed.filter(id => id !== courseId);
          isNowCompleted = false;
        } else {
          updatedCompleted = [...completed, courseId];
          isNowCompleted = true;
        }
        const updated = { ...c, completed_course_ids: updatedCompleted };
        syncToCloud('Centre', updated);
        return updated;
      }
      return c;
    }));

    const targetCourse = courses.find(crs => crs.id === courseId);
    const targetCentre = centres.find(ctr => ctr.id === centreId);
    showToast(
      isNowCompleted
        ? `Batch for "${targetCourse?.title || 'Course'}" at "${targetCentre?.centre_name || 'Centre'}" completed & archived!`
        : `Batch for "${targetCourse?.title || 'Course'}" at "${targetCentre?.centre_name || 'Centre'}" re-activated!`,
      isNowCompleted ? 'success' : 'info'
    );
  };

  // Batch Lifecycle for Online, Language Academy, and Workshop courses
  const addCourseBatch = (courseId, customBatchName = '') => {
    let createdBatch = null;
    setCourses(prev => prev.map(c => {
      if (c.id === courseId) {
        const existingBatches = Array.isArray(c.batches) ? [...c.batches] : [];
        const nextNum = existingBatches.length > 0
          ? Math.max(...existingBatches.map(b => Number(b.batch_number) || 0)) + 1
          : 1;

        createdBatch = {
          id: `batch-${Date.now()}`,
          batch_number: nextNum,
          batch_name: customBatchName || `Batch ${nextNum}`,
          status: 'ADMISSIONS_OPEN',
          assigned_rp_id: '',
          assigned_rp_name: '',
          start_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        };

        const updated = {
          ...c,
          registration_status: 'OPEN',
          batches: [...existingBatches, createdBatch]
        };
        syncToCloud('Course', updated);
        return updated;
      }
      return c;
    }));
    showToast(`New intake "${createdBatch?.batch_name || 'Batch'}" created & opened for admissions!`);
    return createdBatch;
  };

  const updateBatchStatus = (courseId, batchId, nextStatus) => {
    setCourses(prev => prev.map(c => {
      if (c.id === courseId) {
        const existingBatches = Array.isArray(c.batches) ? c.batches : [];
        const updatedBatches = existingBatches.map(b => {
          if (b.id === batchId) {
            return { ...b, status: nextStatus };
          }
          return b;
        });

        const hasOpenBatch = updatedBatches.some(b => b.status === 'ADMISSIONS_OPEN');
        const updated = {
          ...c,
          registration_status: hasOpenBatch ? 'OPEN' : 'CLOSED',
          batches: updatedBatches
        };
        syncToCloud('Course', updated);
        return updated;
      }
      return c;
    }));
    showToast(`Batch status updated to ${nextStatus.replace(/_/g, ' ')}!`);
  };

  const assignRpToBatch = (courseId, batchId, rpId, rpName) => {
    setCourses(prev => prev.map(c => {
      if (c.id === courseId) {
        const existingBatches = Array.isArray(c.batches) ? c.batches : [];
        const updatedBatches = existingBatches.map(b => {
          if (b.id === batchId) {
            return { ...b, assigned_rp_id: rpId, assigned_rp_name: rpName };
          }
          return b;
        });
        const updated = { ...c, batches: updatedBatches };
        syncToCloud('Course', updated);
        return updated;
      }
      return c;
    }));
    showToast('Teacher assigned to batch successfully!');
  };

  // 2. Study Centre Management
  const addCentre = (centreData) => {
    const newCode = `MHL-${(centreData.district || 'KRL').substring(0, 3).toUpperCase()}-${String(centres.length + 1).padStart(3, '0')}`;
    const initialCourseId = centreData.active_course_id || centreData.course_ids?.[0] || '';
    const initialCourseIds = centreData.course_ids || (initialCourseId ? [initialCourseId] : []);

    const newCentre = {
      ...centreData,
      id: `ctr-${Date.now()}`,
      centre_code: newCode,
      active_course_id: initialCourseId,
      course_ids: initialCourseIds,
      status: activeRole === 'admin' ? 'ACTIVE' : 'PENDING_APPROVAL'
    };
    setCentres(prev => [newCentre, ...prev]);
    syncToCloud('Centre', newCentre);
    showToast(
      activeRole === 'admin'
        ? `Study Centre "${newCentre.centre_name}" registered & activated!`
        : `New Study Centre registered! Sent to CPET Office for approval.`
    );
    return newCentre;
  };

  const addCourseToCentre = (centreId, courseId) => {
    setCentres(prev => prev.map(c => {
      if (c.id === centreId) {
        const existingIds = c.course_ids || (c.active_course_id ? [c.active_course_id] : []);
        const newCourseIds = Array.from(new Set([...existingIds, courseId]));
        const updated = {
          ...c,
          active_course_id: courseId,
          course_ids: newCourseIds
        };
        syncToCloud('Centre', updated);
        return updated;
      }
      return c;
    }));
    showToast('Course assigned to Study Centre successfully!');
  };


  const updateCentreStatus = (centreId, newStatus) => {
    setCentres(prev => prev.map(c => {
      if (c.id === centreId) {
        const updated = { ...c, status: newStatus };
        syncToCloud('Centre', updated);
        return updated;
      }
      return c;
    }));
    showToast(`Centre status updated to ${newStatus}.`);
  };

  const assignRpToCentre = (centreId, rpId, activeCourseId) => {
    setCentres(prev => prev.map(c => {
      if (c.id === centreId) {
        const updated = {
          ...c,
          assigned_rp_id: rpId,
          active_course_id: activeCourseId || c.active_course_id
        };
        syncToCloud('Centre', updated);
        return updated;
      }
      return c;
    }));
    showToast('Resource Person assigned to Centre.');
  };

  const updateCentre = (centreId, updatedFields) => {
    setCentres(prev => prev.map(c => {
      if (c.id === centreId) {
        const updated = { ...c, ...updatedFields };
        syncToCloud('Centre', updated);
        return updated;
      }
      return c;
    }));
    showToast('Study Centre details updated successfully!');
  };

  const deleteCentre = (centreId) => {
    setCentres(prev => prev.filter(c => c.id !== centreId));
    deleteFromCloud('Centre', centreId);
    showToast('Study Centre deleted successfully.');
  };

  // 3. Resource Person Management
  const addResourcePerson = (rpData) => {
    const newRp = {
      ...rpData,
      id: `rp-${Date.now()}`,
      status: 'ACTIVE'
    };
    setResourcePersons(prev => [...prev, newRp]);
    syncToCloud('ResourcePerson', newRp);
    showToast(`Resource Person "${newRp.full_name}" onboarded!`);
    return newRp;
  };

  // 4. Student Account & Enrollment Engine (Universal Phone)
  const lookupStudentByPhone = (rawPhone) => {
    const cleanPhone = (rawPhone || '').trim().replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length < 10) return null;

    // Check registered accounts first (with normalized digit matching)
    const found = students.find(s => {
      const p1 = (s.account_phone || '').trim().replace(/\D/g, '').slice(-10);
      const p2 = (s.whatsapp_number || '').trim().replace(/\D/g, '').slice(-10);
      return p1 === cleanPhone || p2 === cleanPhone;
    });
    if (found) return found;

    // Fallback: Check if any enrollments exist with this phone and synthesize account object
    const matchingEnrollments = enrollments.filter(e => {
      const p1 = (e.account_phone || '').trim().replace(/\D/g, '').slice(-10);
      const p2 = (e.phone || '').trim().replace(/\D/g, '').slice(-10);
      return p1 === cleanPhone || p2 === cleanPhone;
    });

    if (matchingEnrollments.length > 0) {
      const memberMap = new Map();
      matchingEnrollments.forEach((e, idx) => {
        const key = e.student_profile_id || e.student_name || `member-${idx}`;
        if (!memberMap.has(key)) {
          memberMap.set(key, {
            id: e.student_profile_id || `prof-${idx}`,
            full_name: e.student_name || 'Student',
            gender: e.gender || 'MALE',
            date_of_birth: e.date_of_birth || '',
            relationship: memberMap.size === 0 ? 'Self' : 'Family Member',
            place: e.centre_name || '',
            district: ''
          });
        }
      });

      return {
        account_phone: cleanPhone,
        whatsapp_number: matchingEnrollments[0].whatsapp_number || cleanPhone,
        members: Array.from(memberMap.values())
      };
    }

    return null;
  };

  const registerOrEnrollStudent = ({
    phone,
    whatsappNumber,
    existingMemberId,
    newMemberData,
    courseId,
    centreId,
    batchId,
    customResponses = {},
    feeStatus = 'PENDING',
    amountPaid = 0
  }) => {
    const cleanPhone = (phone || '').trim().replace(/\D/g, '').slice(-10);
    const targetCourse = courses.find(c => c.id === courseId);
    const targetCentre = centres.find(c => c.id === centreId);

    let activeProfileId = existingMemberId;
    let activeProfileName = '';
    let accountToSave = null;

    // Handle Student Account / Profiles
    setStudents(prev => {
      const existingAccount = prev.find(a => a.account_phone === cleanPhone);
      if (existingAccount) {
        if (existingMemberId) {
          const profile = existingAccount.members.find(m => m.id === existingMemberId);
          if (profile) activeProfileName = profile.full_name;
          accountToSave = existingAccount;
          return prev;
        } else {
          // Add new family member under this phone
          const newProfile = {
            id: `prof-${Date.now()}`,
            full_name: newMemberData?.full_name || 'Family Member',
            gender: newMemberData?.gender || 'MALE',
            date_of_birth: newMemberData?.date_of_birth || '',
            relationship: newMemberData?.relationship || 'Member',
            place: newMemberData?.place || (targetCentre ? targetCentre.place : ''),
            district: newMemberData?.district || (targetCentre ? targetCentre.district : '')
          };
          activeProfileId = newProfile.id;
          activeProfileName = newProfile.full_name;

          accountToSave = {
            ...existingAccount,
            members: [...existingAccount.members, newProfile]
          };
          return prev.map(a => a.account_phone === cleanPhone ? accountToSave : a);
        }
      } else {
        // Create brand new account with initial member
        const newProfile = {
          id: `prof-${Date.now()}`,
          full_name: newMemberData?.full_name || 'Primary Student',
          gender: newMemberData?.gender || 'MALE',
          date_of_birth: newMemberData?.date_of_birth || '',
          relationship: newMemberData?.relationship || 'Self',
          place: newMemberData?.place || (targetCentre ? targetCentre.place : ''),
          district: newMemberData?.district || (targetCentre ? targetCentre.district : '')
        };
        activeProfileId = newProfile.id;
        activeProfileName = newProfile.full_name;

        accountToSave = {
          account_phone: cleanPhone,
          whatsapp_number: whatsappNumber || cleanPhone,
          members: [newProfile]
        };
        return [...prev, accountToSave];
      }
    });

    // Generate Admission Number
    const seq = String(enrollments.filter(e => e.course_id === courseId).length + 1).padStart(4, '0');
    const pattern = targetCourse?.admission_no_pattern || 'CPET-{CODE}-26-{SEQ}';
    const admissionNumber = pattern
      .replace('{CODE}', targetCourse?.course_code || 'GEN')
      .replace('{SEQ}', seq);

    // Determine batch for non-Mahallu courses
    let assignedBatchId = null;
    let assignedBatchName = null;

    if (targetCourse?.category !== 'MAHALLU') {
      const courseBatches = Array.isArray(targetCourse?.batches) ? targetCourse.batches : [];
      if (batchId) {
        const found = courseBatches.find(b => b.id === batchId || b.batch_name === batchId);
        assignedBatchId = found ? found.id : batchId;
        assignedBatchName = found ? found.batch_name : (typeof batchId === 'string' ? batchId : 'Batch 1');
      } else {
        const openBatch = courseBatches.find(b => b.status === 'ADMISSIONS_OPEN') || courseBatches[courseBatches.length - 1];
        if (openBatch) {
          assignedBatchId = openBatch.id;
          assignedBatchName = openBatch.batch_name;
        } else {
          assignedBatchId = 'batch-1';
          assignedBatchName = 'Batch 1';
        }
      }
    }

    const newEnrollment = {
      id: `enr-${Date.now()}`,
      account_phone: cleanPhone,
      student_profile_id: activeProfileId,
      student_name: activeProfileName || newMemberData?.full_name || 'Student',
      course_id: courseId,
      course_title: targetCourse?.title || 'Course',
      centre_id: centreId || null,
      centre_name: targetCentre ? targetCentre.centre_name : (targetCourse?.category === 'ONLINE' ? 'Online Session' : 'CPET Main Campus'),
      batch_id: assignedBatchId,
      batch_name: assignedBatchName,
      admission_number: admissionNumber,
      enrollment_date: new Date().toISOString().split('T')[0],
      fee_status: feeStatus,
      amount_paid: amountPaid,
      completion_status: 'IN_PROGRESS',
      classes_attended: 0,
      marks: {},
      custom_responses: customResponses
    };

    setEnrollments(prev => [newEnrollment, ...prev]);

    // Push both StudentAccount and Enrollment to MongoDB Atlas Cloud!
    if (accountToSave) {
      syncToCloud('StudentAccount', accountToSave);
    }
    syncToCloud('Enrollment', newEnrollment);

    showToast(`Admission confirmed! Admission No: ${admissionNumber}`);
    return newEnrollment;
  };

  // 5. Class Log Engine (RP & Remuneration)
  const addClassLog = (logData) => {
    const targetCourse = courses.find(c => c.id === logData.course_id);
    const isMahallu = targetCourse?.category === 'MAHALLU';
    const targetCentre = centres.find(c => c.id === logData.centre_id);
    let batchName = logData.batch_name;
    if (!isMahallu && !batchName && logData.batch_id) {
      const b = targetCourse?.batches?.find(item => item.id === logData.batch_id);
      batchName = b ? b.batch_name : 'Batch 1';
    }

    const standardRate = logData.standard_rate || targetCourse?.default_rp_remuneration_per_class || 800;
    const travelAllowance = Number(logData.travel_allowance || 0);

    const newLog = {
      id: `log-${Date.now()}`,
      rp_id: currentRp.id,
      rp_name: currentRp.full_name,
      centre_id: isMahallu ? (logData.centre_id || null) : null,
      centre_name: isMahallu ? (targetCentre ? targetCentre.centre_name : 'Centre') : (batchName || 'Online / Workshop Session'),
      batch_id: !isMahallu ? (logData.batch_id || null) : null,
      batch_name: !isMahallu ? (batchName || 'Batch 1') : null,
      course_id: logData.course_id,
      course_title: targetCourse ? targetCourse.title : 'Course',
      class_date: logData.class_date,
      session_type: logData.session_type || 'REGULAR_CLASS',
      hours_spent: Number(logData.hours_spent || 2.0),
      syllabus_covered: logData.syllabus_covered,
      standard_rate: standardRate,
      travel_allowance: travelAllowance,
      total_claim: standardRate + travelAllowance,
      status: 'SUBMITTED',
      admin_notes: ''
    };

    setClassLogs(prev => [newLog, ...prev]);
    syncToCloud('ClassLog', newLog);
    showToast('Class log submitted successfully to CPET Office!');
    return newLog;
  };

  const updateClassLog = (logId, updatedFields) => {
    setClassLogs(prev => prev.map(log => {
      if (log.id === logId) {
        const targetCourse = courses.find(c => c.id === (updatedFields.course_id || log.course_id));
        const isMahallu = targetCourse?.category === 'MAHALLU';
        const targetCentre = centres.find(c => c.id === (updatedFields.centre_id || log.centre_id));

        let batchName = updatedFields.batch_name || log.batch_name;
        const batchId = updatedFields.batch_id !== undefined ? updatedFields.batch_id : log.batch_id;
        if (!isMahallu && !batchName && batchId) {
          const b = targetCourse?.batches?.find(item => item.id === batchId);
          batchName = b ? b.batch_name : 'Batch 1';
        }

        const standardRate = updatedFields.standard_rate || log.standard_rate || targetCourse?.default_rp_remuneration_per_class || 800;
        const travelAllowance = Number(updatedFields.travel_allowance !== undefined ? updatedFields.travel_allowance : (log.travel_allowance || 0));

        const updated = {
          ...log,
          ...updatedFields,
          centre_id: isMahallu ? (updatedFields.centre_id || log.centre_id || null) : null,
          centre_name: isMahallu ? (targetCentre ? targetCentre.centre_name : log.centre_name) : (batchName || 'Online / Workshop Session'),
          batch_id: !isMahallu ? batchId : null,
          batch_name: !isMahallu ? batchName : null,
          course_title: targetCourse ? targetCourse.title : log.course_title,
          standard_rate: standardRate,
          travel_allowance: travelAllowance,
          total_claim: standardRate + travelAllowance
        };
        syncToCloud('ClassLog', updated);
        return updated;
      }
      return log;
    }));
    showToast('Class log updated successfully!');
  };

  const deleteClassLog = (logId) => {
    setClassLogs(prev => prev.filter(l => l.id !== logId));
    deleteFromCloud('ClassLog', logId);
    showToast('Class log deleted successfully.');
  };

  const verifyClassLog = (logId, approvedAmount, adminNotes) => {
    setClassLogs(prev => prev.map(log => {
      if (log.id === logId) {
        const updated = {
          ...log,
          total_claim: approvedAmount !== undefined ? approvedAmount : log.total_claim,
          status: 'VERIFIED_BY_ADMIN',
          admin_notes: adminNotes || 'Approved by CPET Super Admin'
        };
        syncToCloud('ClassLog', updated);
        return updated;
      }
      return log;
    }));
    showToast('Class log verified and approved for remuneration payout.');
  };

  // 6. Fee Remittance to Office
  const addRemittance = (remData) => {
    const targetCentre = centres.find(c => c.id === remData.centre_id);
    const targetCourse = courses.find(c => c.id === remData.course_id);
    const resolvedCourseId = remData.course_id || targetCentre?.active_course_id || (targetCentre?.course_ids && targetCentre.course_ids[0]) || '';
    const resolvedCourseTitle = targetCourse ? targetCourse.title : (courses.find(c => c.id === resolvedCourseId)?.title || '');

    const newRem = {
      id: `rem-${Date.now()}`,
      rp_id: currentRp?.id || 'RP-01',
      rp_name: currentRp?.full_name || 'Faculty RP',
      centre_id: remData.centre_id,
      centre_name: targetCentre ? targetCentre.centre_name : 'Centre',
      course_id: resolvedCourseId,
      course_title: resolvedCourseTitle,
      amount: Number(remData.amount),
      payment_mode: remData.payment_mode || 'BANK_TRANSFER',
      transaction_ref: remData.transaction_ref,
      remittance_date: remData.remittance_date || new Date().toISOString().split('T')[0],
      status: 'PENDING_VERIFICATION',
      student_count: Number(remData.student_count || 0),
      notes: remData.notes || ''
    };

    setRemittances(prev => [newRem, ...prev]);
    syncToCloud('Remittance', newRem);
    showToast('Fee remittance submitted to CPET Office for confirmation!');
    return newRem;
  };

  const confirmRemittance = (remittanceId) => {
    setRemittances(prev => prev.map(r => {
      if (r.id === remittanceId) {
        const updated = { ...r, status: 'CONFIRMED_BY_OFFICE' };
        syncToCloud('Remittance', updated);
        return updated;
      }
      return r;
    }));
    showToast('Remittance confirmed! Ledger updated.');
  };

  const deleteRemittance = (remittanceId) => {
    setRemittances(prev => prev.filter(r => r.id !== remittanceId));
    deleteFromCloud('Remittance', remittanceId);
    showToast('Fee remittance record deleted', 'info');
  };

  // 7. Remuneration Disbursal
  const disbursePayout = (payoutData) => {
    const newPayout = {
      id: `pay-${Date.now()}`,
      ...payoutData,
      disbursed_at: new Date().toISOString().split('T')[0],
      status: 'DISBURSED'
    };

    setPayouts(prev => [newPayout, ...prev]);
    syncToCloud('Payout', newPayout);

    // Also mark associated logs as paid
    setClassLogs(prev => prev.map(l => {
      if (l.rp_id === payoutData.rp_id && l.status === 'VERIFIED_BY_ADMIN') {
        const updated = { ...l, status: 'PAYMENT_PROCESSED' };
        syncToCloud('ClassLog', updated);
        return updated;
      }
      return l;
    }));

    showToast(`Remuneration of ₹${payoutData.final_payout_amount} disbursed to ${payoutData.rp_name}!`);
  };

  // 8. Academic Mark Entry & Attendance
  const updateStudentMarks = (enrollmentId, subjectId, marks) => {
    setEnrollments(prev => prev.map(enr => {
      if (enr.id === enrollmentId) {
        const updated = {
          ...enr,
          marks: {
            ...enr.marks,
            [subjectId]: Number(marks)
          }
        };
        syncToCloud('Enrollment', updated);
        return updated;
      }
      return enr;
    }));
    showToast('Marks updated successfully.');
  };

  const updateStudentFee = (enrollmentId, feeStatus, amountPaid) => {
    setEnrollments(prev => prev.map(enr => {
      if (enr.id === enrollmentId) {
        const updated = {
          ...enr,
          fee_status: feeStatus,
          amount_paid: amountPaid !== undefined ? Number(amountPaid) : enr.amount_paid
        };
        syncToCloud('Enrollment', updated);
        return updated;
      }
      return enr;
    }));
    showToast('Student fee record updated.');
  };

  const markStudentAttendance = (enrollmentId) => {
    setEnrollments(prev => prev.map(enr => {
      if (enr.id === enrollmentId) {
        const updated = {
          ...enr,
          classes_attended: (enr.classes_attended || 0) + 1
        };
        syncToCloud('Enrollment', updated);
        return updated;
      }
      return enr;
    }));
    showToast('Attendance recorded.');
  };

  const toggleStudentSessionAttendance = (enrollmentId, sessionNumber) => {
    setEnrollments(prev => prev.map(enr => {
      if (enr.id === enrollmentId) {
        const currentSessions = Array.isArray(enr.attended_sessions) ? [...enr.attended_sessions] : [];
        const isAlreadyAttended = currentSessions.includes(sessionNumber);
        const newSessions = isAlreadyAttended
          ? currentSessions.filter(s => s !== sessionNumber)
          : [...currentSessions, sessionNumber].sort((a, b) => a - b);

        const updated = {
          ...enr,
          attended_sessions: newSessions,
          classes_attended: newSessions.length
        };
        syncToCloud('Enrollment', updated);
        return updated;
      }
      return enr;
    }));
  };

  const batchMarkSessionAttendance = (enrollmentIds, sessionNumber, markPresent = true) => {
    setEnrollments(prev => prev.map(enr => {
      if (enrollmentIds.includes(enr.id)) {
        const currentSessions = Array.isArray(enr.attended_sessions) ? [...enr.attended_sessions] : [];
        const alreadyHas = currentSessions.includes(sessionNumber);
        let newSessions = currentSessions;
        if (markPresent && !alreadyHas) {
          newSessions = [...currentSessions, sessionNumber].sort((a, b) => a - b);
        } else if (!markPresent && alreadyHas) {
          newSessions = currentSessions.filter(s => s !== sessionNumber);
        }

        const updated = {
          ...enr,
          attended_sessions: newSessions,
          classes_attended: newSessions.length
        };
        syncToCloud('Enrollment', updated);
        return updated;
      }
      return enr;
    }));
    showToast(markPresent ? `Class ${sessionNumber} attendance logged for batch!` : `Class ${sessionNumber} attendance reset.`);
  };

  return (
    <AppContext.Provider
      value={{
        courses,
        centres,
        resourcePersons,
        students,
        enrollments,
        classLogs,
        remittances,
        payouts,
        activeRole,
        setActiveRole,
        currentRp,
        currentRpId,
        setCurrentRpId,
        currentUser,
        loginAdmin,
        loginRp,
        logout,
        isCloudConnected,
        cloudError,
        syncAllLocalDataToCloud,
        fetchLatestFromCloud,
        toast,
        showToast,
        resetAllData,
        // Methods
        addCourse,
        updateCourse,
        deleteCourse,
        toggleCourseStatus,
        toggleCentreCourseCompletion,
        addCourseBatch,
        updateBatchStatus,
        assignRpToBatch,
        addCentre,
        updateCentre,
        deleteCentre,
        addCourseToCentre,
        updateCentreStatus,
        assignRpToCentre,
        addResourcePerson,
        lookupStudentByPhone,
        registerOrEnrollStudent,
        addClassLog,
        updateClassLog,
        deleteClassLog,
        verifyClassLog,
        addRemittance,
        confirmRemittance,
        deleteRemittance,
        disbursePayout,
        updateStudentMarks,
        updateStudentFee,
        markStudentAttendance,
        toggleStudentSessionAttendance,
        batchMarkSessionAttendance
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
