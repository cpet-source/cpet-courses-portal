import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Megaphone,
  Users,
  Search,
  Filter,
  Download,
  Share2,
  Phone,
  MessageCircle,
  Copy,
  ExternalLink,
  CheckCircle,
  Calendar,
  Layers,
  MapPin,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
  Send,
  Zap,
  HelpCircle
} from 'lucide-react';

export const MarketingBroadcastHub = () => {
  const { courses, students, enrollments, centres, showToast } = useApp();

  // 1. Course Selection
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || '');
  const activeCourse = courses.find(c => c.id === selectedCourseId) || courses[0];

  // 2. Audience Segmentation State
  const [targetGender, setTargetGender] = useState('ALL'); // 'ALL' | 'MALE' | 'FEMALE'
  const [ageFilterPreset, setAgeFilterPreset] = useState('ALL'); // 'ALL' | 'KIDS' | 'TEENS' | 'YOUTH' | 'ADULTS' | 'CUSTOM'
  const [customMinAge, setCustomMinAge] = useState(15);
  const [customMaxAge, setCustomMaxAge] = useState(35);
  const [targetDistrict, setTargetDistrict] = useState('ALL');
  const [targetPriorCategory, setTargetPriorCategory] = useState('ALL'); // 'ALL' | 'MAHALLU' | 'ONLINE' | 'OFFLINE_WORKSHOP' | 'LANGUAGE_ACADEMY'
  const [audienceSearch, setAudienceSearch] = useState('');

  // 3. Campaign Message Template Presets
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('DEFAULT');
  const [customMessageText, setCustomMessageText] = useState('');

  // Helper: Calculate age from DOB
  const calculateAge = (dob) => {
    if (!dob) return null;
    const birth = new Date(dob);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 && age < 120 ? age : null;
  };

  // Compile Unified Audience Database from students & enrollments
  const unifiedCandidates = useMemo(() => {
    const candidateMap = new Map();

    // 1. Process from registered Student Accounts & family members
    students.forEach(acc => {
      const phone = (acc.account_phone || '').trim().replace(/\D/g, '').slice(-10);
      if (!phone || phone.length < 10) return;

      const members = Array.isArray(acc.members) ? acc.members : [];
      members.forEach(m => {
        const key = `${phone}_${(m.full_name || 'Student').trim().toLowerCase()}`;
        const age = calculateAge(m.date_of_birth);

        candidateMap.set(key, {
          key,
          name: m.full_name || 'Student',
          phone,
          gender: m.gender || 'MALE',
          date_of_birth: m.date_of_birth || '',
          age,
          district: m.district || 'Kerala',
          place: m.place || '',
          enrolledCourseIds: [],
          enrolledCategories: new Set(),
          lastActive: acc.updatedAt || 'Recent'
        });
      });
    });

    // 2. Cross-reference with enrollments to link past courses
    enrollments.forEach(enr => {
      const phone = (enr.account_phone || '').trim().replace(/\D/g, '').slice(-10);
      if (!phone || phone.length < 10) return;

      const key = `${phone}_${(enr.student_name || 'Student').trim().toLowerCase()}`;
      const course = courses.find(c => c.id === enr.course_id);
      const centre = centres.find(c => c.id === enr.centre_id);

      if (!candidateMap.has(key)) {
        // Fallback candidate entry from enrollment
        candidateMap.set(key, {
          key,
          name: enr.student_name || 'Student',
          phone,
          gender: enr.gender || 'MALE',
          date_of_birth: enr.date_of_birth || '',
          age: calculateAge(enr.date_of_birth),
          district: centre ? centre.district : 'Kerala',
          place: centre ? centre.place : '',
          enrolledCourseIds: [enr.course_id],
          enrolledCategories: new Set(course ? [course.category] : []),
          lastActive: enr.enrollment_date || 'Recent'
        });
      } else {
        const item = candidateMap.get(key);
        if (enr.course_id && !item.enrolledCourseIds.includes(enr.course_id)) {
          item.enrolledCourseIds.push(enr.course_id);
        }
        if (course) {
          item.enrolledCategories.add(course.category);
        }
        if (!item.district && centre) {
          item.district = centre.district;
        }
      }
    });

    return Array.from(candidateMap.values());
  }, [students, enrollments, courses, centres]);

  // Unique Districts List
  const availableDistricts = useMemo(() => {
    const list = new Set();
    unifiedCandidates.forEach(c => {
      if (c.district && c.district !== 'Kerala') list.add(c.district);
    });
    centres.forEach(ctr => {
      if (ctr.district) list.add(ctr.district);
    });
    return Array.from(list).sort();
  }, [unifiedCandidates, centres]);

  // Filtered Audience based on Admin Segmentation criteria
  const filteredAudience = useMemo(() => {
    return unifiedCandidates.filter(cand => {
      // 1. Gender filter
      if (targetGender !== 'ALL' && cand.gender !== targetGender) {
        return false;
      }

      // 2. Age Filter
      if (ageFilterPreset === 'KIDS') {
        if (cand.age === null || cand.age < 6 || cand.age > 12) return false;
      } else if (ageFilterPreset === 'TEENS') {
        if (cand.age === null || cand.age < 13 || cand.age > 19) return false;
      } else if (ageFilterPreset === 'YOUTH') {
        if (cand.age === null || cand.age < 20 || cand.age > 30) return false;
      } else if (ageFilterPreset === 'ADULTS') {
        if (cand.age === null || cand.age < 30) return false;
      } else if (ageFilterPreset === 'CUSTOM') {
        if (cand.age === null || cand.age < customMinAge || cand.age > customMaxAge) return false;
      }

      // 3. District Filter
      if (targetDistrict !== 'ALL' && cand.district !== targetDistrict) {
        return false;
      }

      // 4. Prior Course Category Filter
      if (targetPriorCategory !== 'ALL') {
        if (!cand.enrolledCategories.has(targetPriorCategory)) {
          return false;
        }
      }

      // 5. Search query
      if (audienceSearch) {
        const q = audienceSearch.toLowerCase().trim();
        const matchName = cand.name.toLowerCase().includes(q);
        const matchPhone = cand.phone.includes(q);
        const matchDist = (cand.district || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchDist) return false;
      }

      return true;
    });
  }, [unifiedCandidates, targetGender, ageFilterPreset, customMinAge, customMaxAge, targetDistrict, targetPriorCategory, audienceSearch]);

  // Audience Stats
  const audienceStats = useMemo(() => {
    const total = filteredAudience.length;
    const maleCount = filteredAudience.filter(c => c.gender === 'MALE').length;
    const femaleCount = filteredAudience.filter(c => c.gender === 'FEMALE').length;
    const ages = filteredAudience.map(c => c.age).filter(a => a !== null);
    const avgAge = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : null;
    return { total, maleCount, femaleCount, avgAge };
  }, [filteredAudience]);

  // Campaign Templates Generation
  const registrationLink = activeCourse
    ? `${window.location.origin}/?course=${activeCourse.slug || activeCourse.course_code?.toLowerCase() || activeCourse.id}`
    : window.location.origin;

  const defaultMessage = useMemo(() => {
    if (!activeCourse) return '';
    const feeText = activeCourse.standard_fee > 0 ? `₹${activeCourse.standard_fee}` : 'FREE';
    const deadlineText = activeCourse.registration_deadline ? `\n⏳ Last Date to Apply: ${activeCourse.registration_deadline}` : '';

    return `Assalamu Alaikum {name},

CPET (Centre for Public Education & Training, Darul Huda Islamic University) is pleased to announce admissions for our upcoming program:

📚 *${activeCourse.title}*
🏷️ Category: ${activeCourse.category.replace(/_/g, ' ')}
💰 Course Fee: ${feeText}${deadlineText}

${activeCourse.description ? `${activeCourse.description}\n` : ''}
🔗 *Apply & Register Online Now:*
${registrationLink}

For queries, contact CPET Office: cpet@dhiu.in
_CPET — Darul Huda Islamic University_`;
  }, [activeCourse, registrationLink]);

  const malayalamMessage = useMemo(() => {
    if (!activeCourse) return '';
    const feeText = activeCourse.standard_fee > 0 ? `₹${activeCourse.standard_fee}` : 'സൗജന്യം (Free)';
    const deadlineText = activeCourse.registration_deadline ? `\n⏳ അവസാന തീയതി: ${activeCourse.registration_deadline}` : '';

    return `പ്രിയപ്പെട്ട {name},

ദാറുൽ ഹുദാ ഇസ്ലാമിക് യൂണിവേഴ്സിറ്റി CPET യുടെ പുതിയ കോഴ്സിലേക്ക് ഇപ്പോൾ അപേക്ഷിക്കാം:

📚 *${activeCourse.title}*
🏷️ വിഭാഗം: ${activeCourse.category.replace(/_/g, ' ')}
💰 ഫീസ്: ${feeText}${deadlineText}

പരിമിതമായ സീറ്റുകൾ മാത്രം! ഓൺലൈനായി രജിസ്റ്റർ ചെയ്യാൻ താഴെയുള്ള ലിങ്കിൽ ക്ലിക്ക് ചെയ്യുക:
👉 ${registrationLink}

_Centre for Public Education & Training (CPET)_
_Darul Huda Islamic University, Chemmad_`;
  }, [activeCourse, registrationLink]);

  const activeMessageTemplate = customMessageText || (selectedTemplateKey === 'MALAYALAM' ? malayalamMessage : defaultMessage);

  // Generate Personalized WhatsApp Message for Candidate
  const getPersonalizedMessage = (candidateName) => {
    return activeMessageTemplate.replace(/{name}/g, candidateName || 'Student');
  };

  // Tool 1: Export Targeted Contacts as WhatsApp Broadcast VCF (vCard 3.0)
  const handleExportVCF = () => {
    if (filteredAudience.length === 0) {
      showToast('No audience contacts to export', 'warning');
      return;
    }

    const campaignTag = activeCourse ? activeCourse.course_code || 'CPET' : 'CPET';
    let vcfContent = '';

    filteredAudience.forEach((cand, idx) => {
      vcfContent += `BEGIN:VCARD\r\n`;
      vcfContent += `VERSION:3.0\r\n`;
      vcfContent += `FN:CPET ${cand.name} (${campaignTag})\r\n`;
      vcfContent += `N:;CPET ${cand.name} (${campaignTag});;;\r\n`;
      vcfContent += `TEL;TYPE=CELL,VOICE:+91${cand.phone}\r\n`;
      vcfContent += `NOTE:CPET Target Audience | ${cand.gender} | ${cand.district}\r\n`;
      vcfContent += `END:VCARD\r\n`;
    });

    const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CPET_${campaignTag}_Audience_${filteredAudience.length}_Contacts.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Exported ${filteredAudience.length} WhatsApp Broadcast contacts (.VCF)!`);
  };

  // Tool 2: Export Clean CSV
  const handleExportCSV = () => {
    if (filteredAudience.length === 0) {
      showToast('No audience contacts to export', 'warning');
      return;
    }

    const headers = ['Full Name', 'WhatsApp Number', 'Phone (+91)', 'Gender', 'Age', 'Date of Birth', 'District', 'Prior Courses Count'];
    const rows = filteredAudience.map(c => [
      `"${c.name.replace(/"/g, '""')}"`,
      c.phone,
      `+91${c.phone}`,
      c.gender,
      c.age !== null ? c.age : 'N/A',
      c.date_of_birth || 'N/A',
      `"${(c.district || '').replace(/"/g, '""')}"`,
      c.enrolledCourseIds.length
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CPET_Audience_${activeCourse?.course_code || 'Camp'}_${filteredAudience.length}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Audience CSV (${filteredAudience.length} contacts) exported!`);
  };

  // Tool 3: Copy Formatted Message to Clipboard
  const handleCopyMessage = () => {
    const textToCopy = getPersonalizedMessage('Student');
    navigator.clipboard.writeText(textToCopy);
    showToast('Campaign WhatsApp message copied to clipboard!');
  };

  // Tool 4: Download Poster Banner
  const handleDownloadPoster = () => {
    if (!activeCourse?.poster_url) {
      showToast('No poster banner uploaded for this course yet', 'warning');
      return;
    }
    const a = document.createElement('a');
    a.href = activeCourse.poster_url;
    a.download = `${activeCourse.course_code || 'CPET'}_Poster.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Course poster downloaded!');
  };

  return (
    <div>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--cpet-primary) 0%, #1e1b4b 100%)',
        color: 'white',
        padding: '1.5rem',
        borderRadius: 'var(--radius-lg)',
        marginBottom: '1.5rem',
        boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge" style={{ background: '#22c55e', color: 'white', fontSize: '0.78rem', fontWeight: 700 }}>
                PHASE 1: DIRECT OUTREACH ENGINE
              </span>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '0.78rem' }}>
                100% Free • Zero Ban Risk
              </span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.2rem 0', color: 'white' }}>
              📢 CPET Marketing & WhatsApp Broadcast Suite
            </h2>
            <p style={{ fontSize: '0.88rem', opacity: 0.9, maxWidth: '720px', margin: 0, lineHeight: 1.45 }}>
              Filter your registered student base by age, gender, district, and past courses. Broadcast course posters and personalized admission notices with 1-click WhatsApp tools.
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <span style={{ fontSize: '0.72rem', opacity: 0.8, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Reachable Base</span>
            <strong style={{ fontSize: '1.5rem', color: '#6ee7b7' }}>{unifiedCandidates.length}</strong>
            <span style={{ fontSize: '0.75rem', opacity: 0.8, display: 'block' }}>Verified Student Profiles</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Campaign Config (Left) + Audience Segmentation (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Left Column: Course Selector & Message Composer */}
        <div className="cpet-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--cpet-border)', paddingBottom: '0.75rem' }}>
            <Sparkles size={18} color="var(--cpet-accent)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--cpet-primary)' }}>
              1. Select Course to Promote
            </h3>
          </div>

          <div>
            <label className="form-label">Active Promotion Course:</label>
            <select
              className="form-select"
              style={{ fontWeight: 700, color: 'var(--cpet-primary)', fontSize: '0.95rem' }}
              value={selectedCourseId}
              onChange={e => {
                setSelectedCourseId(e.target.value);
                setCustomMessageText('');
              }}
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.course_code} • {c.category.replace(/_/g, ' ')})
                </option>
              ))}
            </select>
          </div>

          {/* Course Snapshot Card with Poster Preview */}
          {activeCourse && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '0.85rem' }}>
              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                {activeCourse.poster_url ? (
                  <div style={{ width: '100px', height: '55px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--cpet-border)', background: '#0f172a', flexShrink: 0 }}>
                    <img src={activeCourse.poster_url} alt="Poster" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div style={{ width: '100px', height: '55px', borderRadius: '6px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.72rem', flexShrink: 0 }}>
                    No Poster
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ fontSize: '0.92rem', color: 'var(--cpet-primary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {activeCourse.title}
                  </strong>
                  <div style={{ display: 'flex', gap: '6px', fontSize: '0.75rem', marginTop: '2px', flexWrap: 'wrap' }}>
                    <span className="badge badge-neutral">{activeCourse.course_code}</span>
                    <span className="badge badge-accent">Fee: {activeCourse.standard_fee > 0 ? `₹${activeCourse.standard_fee}` : 'FREE'}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid #edf2f7', fontSize: '0.78rem' }}>
                <span style={{ color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }}>
                  🔗 {registrationLink}
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {activeCourse.poster_url && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                      onClick={handleDownloadPoster}
                      title="Download Poster Banner (1600x800)"
                    >
                      <Download size={12} /> Poster
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                    onClick={() => {
                      navigator.clipboard.writeText(registrationLink);
                      showToast('Course registration link copied!');
                    }}
                  >
                    <Copy size={12} /> Copy Link
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Campaign Message Templates */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ margin: 0 }}>Message Template:</label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${selectedTemplateKey === 'DEFAULT' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem' }}
                  onClick={() => {
                    setSelectedTemplateKey('DEFAULT');
                    setCustomMessageText('');
                  }}
                >
                  English
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${selectedTemplateKey === 'MALAYALAM' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem' }}
                  onClick={() => {
                    setSelectedTemplateKey('MALAYALAM');
                    setCustomMessageText('');
                  }}
                >
                  Malayalam
                </button>
              </div>
            </div>

            <textarea
              className="form-input"
              rows={8}
              style={{ fontSize: '0.85rem', fontFamily: 'inherit', lineHeight: 1.45, padding: '0.65rem' }}
              value={activeMessageTemplate}
              onChange={e => setCustomMessageText(e.target.value)}
              placeholder="Type your WhatsApp message template here..."
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
              <span className="form-helper" style={{ fontSize: '0.72rem' }}>
                Tag: <code>{'{name}'}</code> will be automatically replaced with the candidate's real name.
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem' }}
                onClick={handleCopyMessage}
              >
                <Copy size={12} /> Copy Text
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Audience Segmentation Engine */}
        <div className="cpet-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--cpet-border)', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={18} color="var(--cpet-primary)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--cpet-primary)' }}>
                2. Target Audience Segmentation
              </h3>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem' }}
              onClick={() => {
                setTargetGender('ALL');
                setAgeFilterPreset('ALL');
                setTargetDistrict('ALL');
                setTargetPriorCategory('ALL');
                setAudienceSearch('');
              }}
            >
              Reset Filters
            </button>
          </div>

          {/* Gender Filter */}
          <div>
            <label className="form-label">Target Gender:</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[
                { id: 'ALL', label: 'All Candidates' },
                { id: 'MALE', label: 'Male Only' },
                { id: 'FEMALE', label: 'Female Only' }
              ].map(g => (
                <button
                  key={g.id}
                  type="button"
                  className={`btn btn-sm ${targetGender === g.id ? 'btn-primary' : 'btn-outline'}`}
                  style={{ flex: 1, fontSize: '0.8rem', padding: '0.35rem' }}
                  onClick={() => setTargetGender(g.id)}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Age Bracket Filter */}
          <div>
            <label className="form-label">Target Age Bracket:</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
              {[
                { id: 'ALL', label: 'All Ages' },
                { id: 'KIDS', label: 'Kids (6–12 yrs)' },
                { id: 'TEENS', label: 'Teens (13–19 yrs)' },
                { id: 'YOUTH', label: 'Youth (20–30 yrs)' },
                { id: 'ADULTS', label: 'Adults (30+ yrs)' },
                { id: 'CUSTOM', label: 'Custom Range' }
              ].map(ageP => (
                <button
                  key={ageP.id}
                  type="button"
                  className={`btn btn-sm ${ageFilterPreset === ageP.id ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
                  onClick={() => setAgeFilterPreset(ageP.id)}
                >
                  {ageP.label}
                </button>
              ))}
            </div>

            {ageFilterPreset === 'CUSTOM' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.78rem' }}>From:</span>
                <input
                  type="number"
                  min="5"
                  max="90"
                  className="form-input"
                  style={{ width: '70px', padding: '0.25rem 0.5rem', fontSize: '0.82rem' }}
                  value={customMinAge}
                  onChange={e => setCustomMinAge(Number(e.target.value))}
                />
                <span style={{ fontSize: '0.78rem' }}>To:</span>
                <input
                  type="number"
                  min="5"
                  max="90"
                  className="form-input"
                  style={{ width: '70px', padding: '0.25rem 0.5rem', fontSize: '0.82rem' }}
                  value={customMaxAge}
                  onChange={e => setCustomMaxAge(Number(e.target.value))}
                />
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>years old</span>
              </div>
            )}
          </div>

          {/* District & Region Filter */}
          <div>
            <label className="form-label">Target District / Region:</label>
            <select
              className="form-select"
              value={targetDistrict}
              onChange={e => setTargetDistrict(e.target.value)}
              style={{ fontSize: '0.85rem' }}
            >
              <option value="ALL">All Districts / Across Kerala ({availableDistricts.length} regions)</option>
              {availableDistricts.map(dist => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>
          </div>

          {/* Prior Course Category Filter */}
          <div>
            <label className="form-label">Past Course Category History:</label>
            <select
              className="form-select"
              value={targetPriorCategory}
              onChange={e => setTargetPriorCategory(e.target.value)}
              style={{ fontSize: '0.85rem' }}
            >
              <option value="ALL">All Enrolled Candidates (Any past category)</option>
              <option value="MAHALLU">Previously enrolled in Mahallu Study Centres</option>
              <option value="ONLINE">Previously enrolled in Online Courses</option>
              <option value="OFFLINE_WORKSHOP">Previously enrolled in Workshops / Camps</option>
              <option value="LANGUAGE_ACADEMY">Previously enrolled in Language Academy</option>
            </select>
          </div>

          {/* Real-Time Audience Counter Card */}
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            border: '1.5px solid #86efac',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginTop: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  🎯 Matching Target Audience
                </span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#15803d' }}>
                  {audienceStats.total} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#166534' }}>candidates</span>
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.78rem', color: '#166534' }}>
                <div>Male: <strong>{audienceStats.maleCount}</strong> | Female: <strong>{audienceStats.femaleCount}</strong></div>
                {audienceStats.avgAge && <div>Avg Age: <strong>{audienceStats.avgAge} yrs</strong></div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Action Bar: Phase 1 Broadcast Delivery Tools */}
      <div className="cpet-card" style={{ marginBottom: '1.5rem', background: '#faf5ff', border: '1px solid #e9d5ff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="badge" style={{ background: '#9333ea', color: 'white', marginBottom: '4px' }}>
              PHASE 1 BROADCAST LAUNCHER
            </span>
            <h3 style={{ margin: '0 0 2px', fontSize: '1.15rem', color: '#581c87', fontWeight: 800 }}>
              Dispatch Campaign to {audienceStats.total} Target Candidates
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#6b21a8' }}>
              Choose your preferred dispatch method below. No Meta API cost or ban risk.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            {/* Tool 1: Export WhatsApp Broadcast Contacts (VCF) */}
            <button
              type="button"
              className="btn btn-primary"
              style={{ background: '#16a34a', borderColor: '#16a34a', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
              onClick={handleExportVCF}
              disabled={filteredAudience.length === 0}
              title="Exports targeted contacts into a .VCF file. Open it on your CPET mobile to instantly create a WhatsApp Broadcast list!"
            >
              <Download size={16} />
              <span>Export WhatsApp Broadcast (VCF)</span>
            </button>

            {/* Tool 2: Export Clean CSV */}
            <button
              type="button"
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={handleExportCSV}
              disabled={filteredAudience.length === 0}
            >
              <Download size={15} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Pro Tip on Broadcast Lists */}
        <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid #e9d5ff', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#6b21a8' }}>
          <Info size={16} style={{ flexShrink: 0 }} />
          <span>
            <strong>How WhatsApp Broadcast lists work:</strong> Tap the <em>Export WhatsApp Broadcast (VCF)</em> button and open the file on your office phone. All {audienceStats.total} candidates will be added as contacts tagged with <code>CPET {activeCourse?.course_code}</code>, allowing you to broadcast the poster and text message to all of them in 1 click!
          </span>
        </div>
      </div>

      {/* Target Audience Directory & Click-to-Chat Queue */}
      <div className="cpet-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 className="cpet-card-title" style={{ margin: 0 }}>
              <Users size={18} />
              Target Candidate Queue ({filteredAudience.length})
            </h3>
            <p className="cpet-card-desc" style={{ margin: '2px 0 0' }}>
              Review matching recipients or trigger direct 1-click WhatsApp conversations.
            </p>
          </div>

          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.2rem', fontSize: '0.82rem' }}
              placeholder="Search in this filtered list..."
              value={audienceSearch}
              onChange={e => setAudienceSearch(e.target.value)}
            />
          </div>
        </div>

        {filteredAudience.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', color: '#64748b' }}>
            <Users size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
            <h4 style={{ margin: '0 0 4px', color: 'var(--cpet-primary)' }}>No candidates match this audience criteria</h4>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              Try adjusting your gender, age bracket, or district filters above to expand your campaign reach.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="cpet-table" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Candidate Name</th>
                  <th>WhatsApp Phone</th>
                  <th>Gender / Age</th>
                  <th>District / Location</th>
                  <th>Past Enrollments</th>
                  <th style={{ textAlign: 'right' }}>1-Click Outreach</th>
                </tr>
              </thead>
              <tbody>
                {filteredAudience.slice(0, 100).map((cand, idx) => {
                  const personalMsg = getPersonalizedMessage(cand.name);
                  const waUrl = `https://wa.me/91${cand.phone}?text=${encodeURIComponent(personalMsg)}`;

                  return (
                    <tr key={cand.key}>
                      <td style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{idx + 1}</td>
                      <td>
                        <strong style={{ color: 'var(--cpet-primary)' }}>{cand.name}</strong>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>+91 {cand.phone}</span>
                      </td>
                      <td>
                        <span className={`badge ${cand.gender === 'FEMALE' ? 'badge-accent' : 'badge-neutral'}`} style={{ fontSize: '0.72rem', marginRight: '4px' }}>
                          {cand.gender}
                        </span>
                        <span style={{ color: '#64748b', fontSize: '0.78rem' }}>
                          {cand.age !== null ? `${cand.age} yrs` : 'Age N/A'}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: '#475569' }}>{cand.district || 'Kerala'}</span>
                      </td>
                      <td>
                        <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                          {cand.enrolledCourseIds.length} course(s)
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm btn-outline"
                          style={{ borderColor: '#22c55e', color: '#16a34a', padding: '0.2rem 0.6rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                          title="Open WhatsApp with personalized text and link"
                        >
                          <MessageCircle size={13} />
                          <span>WhatsApp</span>
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredAudience.length > 100 && (
              <div style={{ textAlign: 'center', padding: '0.75rem', background: '#f8fafc', color: '#64748b', fontSize: '0.8rem', borderTop: '1px solid var(--cpet-border)' }}>
                Showing first 100 of {filteredAudience.length} candidates. Use <strong>Export WhatsApp Broadcast (VCF)</strong> or <strong>Export CSV</strong> above to process all contacts together.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Phase 2: Meta Cloud API Integration Roadmap */}
      <div style={{ marginTop: '1.5rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <strong style={{ fontSize: '0.95rem', color: 'var(--cpet-primary)' }}>Phase 2: Meta WhatsApp Cloud API Ready</strong>
              <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Awaiting Marketing Budget</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', lineHeight: 1.45 }}>
              This engine is architected to seamlessly plug into Meta's Official WhatsApp Cloud API (or Indian BSPs like AiSensy / Wati). When CPET allocates budget (~₹0.78 / marketing message in India), we will activate direct server-side blasting so a single click broadcasts posters and messages simultaneously to all {audienceStats.total} candidates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
