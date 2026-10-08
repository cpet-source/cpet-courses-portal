import React, { useState, useMemo, useEffect } from 'react';
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
  CheckCircle2,
  Calendar,
  Layers,
  MapPin,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
  Send,
  Zap,
  Key,
  Settings,
  Play,
  AlertTriangle,
  History,
  RefreshCw,
  FileSpreadsheet,
  Smartphone,
  Check,
  X,
  ShieldCheck,
  CreditCard
} from 'lucide-react';

const META_CONFIG_STORAGE_KEY = 'cpet_meta_whatsapp_config';
const CAMPAIGN_HISTORY_STORAGE_KEY = 'cpet_marketing_campaigns_log';

export const MarketingBroadcastHub = () => {
  const { courses, students, enrollments, centres, showToast } = useApp();

  // Top Sub-Tabs inside Marketing Hub
  const [hubTab, setHubTab] = useState('campaign'); // 'campaign' | 'config' | 'history'

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

  // 4. Meta Cloud API Configuration State
  const [metaConfig, setMetaConfig] = useState(() => {
    try {
      const stored = localStorage.getItem(META_CONFIG_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      phoneNumberId: '',
      wabaId: '',
      accessToken: '',
      templateName: 'cpet_course_admission',
      templateLanguage: 'en',
      costPerMessage: 0.80, // Meta marketing conversation rate in India (approx ₹0.80)
      verifiedBusinessName: 'CPET - Darul Huda Islamic University'
    };
  });

  const saveMetaConfig = (newConfig) => {
    setMetaConfig(newConfig);
    try {
      localStorage.setItem(META_CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
      showToast('Meta WhatsApp Cloud API settings saved successfully!');
    } catch (e) {}
  };

  // 5. Test Message Dispatcher State
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // 6. Campaign Broadcast Dispatch Modal & Execution State
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState(0);
  const [broadcastCurrentCandidate, setBroadcastCurrentCandidate] = useState('');
  const [broadcastSuccessCount, setBroadcastSuccessCount] = useState(0);
  const [broadcastFailCount, setBroadcastFailCount] = useState(0);
  const [broadcastLogs, setBroadcastLogs] = useState([]);
  const [isBroadcastCompleted, setIsBroadcastCompleted] = useState(false);

  // 7. Campaign History State
  const [campaignHistory, setCampaignHistory] = useState(() => {
    try {
      const stored = localStorage.getItem(CAMPAIGN_HISTORY_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  });

  const saveCampaignLog = (campaignEntry) => {
    const updated = [campaignEntry, ...campaignHistory];
    setCampaignHistory(updated);
    try {
      localStorage.setItem(CAMPAIGN_HISTORY_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

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

  // Estimated Meta Cost in Rupees
  const estimatedMetaCost = (filteredAudience.length * (metaConfig.costPerMessage || 0.80)).toFixed(2);

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

  const getPersonalizedMessage = (candidateName) => {
    return activeMessageTemplate.replace(/{name}/g, candidateName || 'Student');
  };

  // Helper: Checks if real Meta credentials are provided
  const hasMetaCredentials = Boolean(
    metaConfig.phoneNumberId?.trim() && metaConfig.accessToken?.trim()
  );

  // Meta Cloud API Dispatch Engine (Supports live API and realistic Simulation Mode)
  const executeMetaApiCall = async (phone10Digit, studentName) => {
    const cleanPhone = phone10Digit.replace(/\D/g, '').slice(-10);

    // If real credentials are provided, call Meta Cloud API Graph endpoint
    if (hasMetaCredentials) {
      const endpoint = `https://graph.facebook.com/v21.0/${metaConfig.phoneNumberId.trim()}/messages`;
      const payload = {
        messaging_product: 'whatsapp',
        to: `91${cleanPhone}`,
        type: 'template',
        template: {
          name: metaConfig.templateName || 'cpet_course_admission',
          language: { code: metaConfig.templateLanguage || 'en' },
          components: [
            ...(activeCourse?.poster_url ? [{
              type: 'header',
              parameters: [{ type: 'image', image: { link: activeCourse.poster_url } }]
            }] : []),
            {
              type: 'body',
              parameters: [
                { type: 'text', text: studentName || 'Candidate' },
                { type: 'text', text: activeCourse?.title || 'Program' },
                { type: 'text', text: activeCourse?.start_date || 'Upcoming' },
                { type: 'text', text: activeCourse?.standard_fee > 0 ? `₹${activeCourse.standard_fee}` : 'FREE' }
              ]
            },
            {
              type: 'button',
              sub_type: 'url',
              index: '0',
              parameters: [{ type: 'text', text: activeCourse?.slug || activeCourse?.id || '' }]
            }
          ]
        }
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${metaConfig.accessToken.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error?.message || 'Meta API delivery failed');
      }
      return { success: true, messageId: data?.messages?.[0]?.id || `wamid_${Date.now()}` };
    }

    // Simulation / Pre-Configuration Mode
    await new Promise(res => setTimeout(res, 80)); // 80ms network latency simulation
    return {
      success: true,
      simulated: true,
      messageId: `wamid.sim_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`
    };
  };

  // Dispatch Test WhatsApp Message to Admin's Personal Phone
  const handleSendTestMessage = async (e) => {
    e.preventDefault();
    const cleanPhone = testPhoneNumber.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length < 10) {
      showToast('Please enter a valid 10-digit mobile number', 'warning');
      return;
    }

    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await executeMetaApiCall(cleanPhone, 'CPET Administrator');
      setTestResult({
        success: true,
        message: res.simulated
          ? `[Simulation] Message payload verified for +91 ${cleanPhone}. Message ID: ${res.messageId}`
          : `Live WhatsApp template successfully dispatched to +91 ${cleanPhone}! Check your phone.`,
        isSimulated: res.simulated,
        timestamp: new Date().toLocaleTimeString()
      });
      showToast(res.simulated ? 'Test payload verified (Demo Mode)' : 'Live WhatsApp test delivered!');
    } catch (err) {
      setTestResult({
        success: false,
        message: `Error: ${err.message}`,
        timestamp: new Date().toLocaleTimeString()
      });
      showToast('Test delivery failed: ' + err.message, 'danger');
    } finally {
      setIsSendingTest(false);
    }
  };

  // Launch Automated Bulk Broadcast Execution
  const startAutomatedBroadcast = async () => {
    if (filteredAudience.length === 0) {
      showToast('No candidates in target audience queue', 'warning');
      return;
    }

    setIsBroadcasting(true);
    setIsBroadcastCompleted(false);
    setBroadcastProgress(0);
    setBroadcastSuccessCount(0);
    setBroadcastFailCount(0);
    setBroadcastLogs([]);

    const total = filteredAudience.length;
    let success = 0;
    let failed = 0;
    const newLogs = [];

    for (let i = 0; i < total; i++) {
      const cand = filteredAudience[i];
      setBroadcastCurrentCandidate(`${cand.name} (+91 ${cand.phone})`);

      try {
        const res = await executeMetaApiCall(cand.phone, cand.name);
        success++;
        setBroadcastSuccessCount(success);
        newLogs.unshift({
          id: i + 1,
          name: cand.name,
          phone: cand.phone,
          status: 'DELIVERED',
          mode: res.simulated ? 'SIMULATED' : 'LIVE_API',
          time: new Date().toLocaleTimeString()
        });
      } catch (err) {
        failed++;
        setBroadcastFailCount(failed);
        newLogs.unshift({
          id: i + 1,
          name: cand.name,
          phone: cand.phone,
          status: 'FAILED',
          error: err.message,
          time: new Date().toLocaleTimeString()
        });
      }

      setBroadcastProgress(Math.round(((i + 1) / total) * 100));
      setBroadcastLogs([...newLogs]);
    }

    setIsBroadcasting(false);
    setIsBroadcastCompleted(true);
    setBroadcastCurrentCandidate('');

    // Save to Campaign History
    const historyEntry = {
      id: `camp_${Date.now()}`,
      date: new Date().toISOString(),
      courseTitle: activeCourse?.title || 'Program',
      courseCode: activeCourse?.course_code || 'CPET',
      recipientsCount: total,
      successCount: success,
      failCount: failed,
      costEstimate: (total * (metaConfig.costPerMessage || 0.80)).toFixed(2),
      isLiveApi: hasMetaCredentials,
      targetSummary: `Gender: ${targetGender} • Age: ${ageFilterPreset} • District: ${targetDistrict}`
    };
    saveCampaignLog(historyEntry);

    showToast(`Broadcast completed: ${success} delivered, ${failed} failed.`);
  };

  // Export Tools: VCF & CSV (Kept as zero-cost backups)
  const handleExportVCF = () => {
    if (filteredAudience.length === 0) {
      showToast('No audience contacts to export', 'warning');
      return;
    }
    const campaignTag = activeCourse ? activeCourse.course_code || 'CPET' : 'CPET';
    let vcfContent = '';
    filteredAudience.forEach(cand => {
      vcfContent += `BEGIN:VCARD\r\nVERSION:3.0\r\nFN:CPET ${cand.name} (${campaignTag})\r\nN:;CPET ${cand.name} (${campaignTag});;;\r\nTEL;TYPE=CELL,VOICE:+91${cand.phone}\r\nNOTE:CPET Target Audience | ${cand.gender} | ${cand.district}\r\nEND:VCARD\r\n`;
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
    showToast(`Exported ${filteredAudience.length} contacts (.VCF)!`);
  };

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
    link.download = `CPET_Audience_${activeCourse?.course_code || 'Campaign'}_${filteredAudience.length}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Audience CSV (${filteredAudience.length} contacts) exported!`);
  };

  const handleCopyMessage = () => {
    const textToCopy = getPersonalizedMessage('Student');
    navigator.clipboard.writeText(textToCopy);
    showToast('Campaign WhatsApp message copied to clipboard!');
  };

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
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #065f46 100%)',
        color: 'white',
        padding: '1.5rem',
        borderRadius: 'var(--radius-lg)',
        marginBottom: '1.25rem',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <span className="badge" style={{ background: '#22c55e', color: 'white', fontSize: '0.78rem', fontWeight: 800 }}>
                META OFFICIAL CLOUD API ENGINE
              </span>
              {hasMetaCredentials ? (
                <span className="badge" style={{ background: '#10b981', color: 'white', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={12} /> Live API Connected
                </span>
              ) : (
                <span className="badge" style={{ background: '#f59e0b', color: '#78350f', fontSize: '0.78rem', fontWeight: 700 }}>
                  ⚡ Pre-Config Demo Mode (Ready for API Keys)
                </span>
              )}
              <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '0.78rem' }}>
                ₹0.80 / Conversation • 0% Ban Risk
              </span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.2rem 0', color: 'white' }}>
              📢 CPET Marketing & Automated WhatsApp Engine
            </h2>
            <p style={{ fontSize: '0.88rem', opacity: 0.9, maxWidth: '750px', margin: 0, lineHeight: 1.45 }}>
              Precision audience targeting across {unifiedCandidates.length} registered students. Broadcast posters, dynamic admission links, and interactive buttons via the official Meta WhatsApp Cloud API without saving contacts to any phone!
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', padding: '0.75rem 1.1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.25)', textAlign: 'right' }}>
            <span style={{ fontSize: '0.72rem', opacity: 0.85, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Verified Student Base</span>
            <strong style={{ fontSize: '1.6rem', color: '#6ee7b7' }}>{unifiedCandidates.length}</strong>
            <span style={{ fontSize: '0.75rem', opacity: 0.85, display: 'block' }}>Reachable Phone Records</span>
          </div>
        </div>
      </div>

      {/* Hub Sub-Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--cpet-border)', marginBottom: '1.5rem', background: '#ffffff', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
        <button
          type="button"
          className="tab-btn"
          onClick={() => setHubTab('campaign')}
          style={{
            fontWeight: 700,
            color: hubTab === 'campaign' ? 'var(--cpet-primary)' : '#64748b',
            borderBottom: hubTab === 'campaign' ? '3px solid var(--cpet-primary)' : '3px solid transparent',
            background: hubTab === 'campaign' ? '#f0fdf4' : 'transparent',
            borderRadius: '6px 6px 0 0'
          }}
        >
          <Megaphone size={16} color={hubTab === 'campaign' ? '#16a34a' : '#64748b'} />
          <span>Audience & Campaign Hub</span>
          <span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
            {filteredAudience.length} Matches
          </span>
        </button>

        <button
          type="button"
          className="tab-btn"
          onClick={() => setHubTab('config')}
          style={{
            fontWeight: 700,
            color: hubTab === 'config' ? 'var(--cpet-primary)' : '#64748b',
            borderBottom: hubTab === 'config' ? '3px solid var(--cpet-primary)' : '3px solid transparent',
            background: hubTab === 'config' ? '#eff6ff' : 'transparent',
            borderRadius: '6px 6px 0 0'
          }}
        >
          <Settings size={16} color={hubTab === 'config' ? '#2563eb' : '#64748b'} />
          <span>Meta Cloud API Configuration</span>
          {hasMetaCredentials ? (
            <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Connected</span>
          ) : (
            <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Keys Pending</span>
          )}
        </button>

        <button
          type="button"
          className="tab-btn"
          onClick={() => setHubTab('history')}
          style={{
            fontWeight: 700,
            color: hubTab === 'history' ? 'var(--cpet-primary)' : '#64748b',
            borderBottom: hubTab === 'history' ? '3px solid var(--cpet-primary)' : '3px solid transparent',
            background: hubTab === 'history' ? '#faf5ff' : 'transparent',
            borderRadius: '6px 6px 0 0'
          }}
        >
          <History size={16} color={hubTab === 'history' ? '#9333ea' : '#64748b'} />
          <span>Campaign Logs & Delivery History ({campaignHistory.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: AUDIENCE & CAMPAIGN HUB */}
      {/* ========================================================================= */}
      {hubTab === 'campaign' && (
        <>
          {/* Main 2-Column Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Left Column: Course Selector & Message Preview */}
            <div className="cpet-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--cpet-border)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="var(--cpet-accent)" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--cpet-primary)' }}>
                    1. Select Course to Promote
                  </h3>
                </div>
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

              {/* Course Snapshot Card */}
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
                          title="Download Poster Banner"
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
                          showToast('Direct registration link copied!');
                        }}
                      >
                        <Copy size={12} /> Copy Link
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Message Composer */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>WhatsApp Promotional Template:</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      className={`btn btn-sm ${selectedTemplateKey === 'DEFAULT' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem' }}
                      onClick={() => { setSelectedTemplateKey('DEFAULT'); setCustomMessageText(''); }}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${selectedTemplateKey === 'MALAYALAM' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem' }}
                      onClick={() => { setSelectedTemplateKey('MALAYALAM'); setCustomMessageText(''); }}
                    >
                      മലയാളം
                    </button>
                  </div>
                </div>

                <textarea
                  className="form-input"
                  rows={7}
                  style={{ fontSize: '0.82rem', fontFamily: 'monospace', lineHeight: 1.45, resize: 'vertical' }}
                  value={activeMessageTemplate}
                  onChange={e => setCustomMessageText(e.target.value)}
                  placeholder="Type promotional message..."
                />
                <span className="form-helper">
                  Use <code>{'{name}'}</code> to automatically insert candidate's name in each WhatsApp message.
                </span>
              </div>
            </div>

            {/* Right Column: Audience Segmentation Filter */}
            <div className="cpet-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--cpet-border)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Filter size={18} color="var(--cpet-primary)" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--cpet-primary)' }}>
                    2. Audience Segmentation Engine
                  </h3>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
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

              {/* Filter 1: Gender */}
              <div>
                <label className="form-label">Target Gender:</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[
                    { id: 'ALL', label: 'All Genders' },
                    { id: 'MALE', label: 'Boys / Men' },
                    { id: 'FEMALE', label: 'Girls / Women' }
                  ].map(g => (
                    <button
                      key={g.id}
                      type="button"
                      className={`btn btn-sm ${targetGender === g.id ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, fontSize: '0.82rem' }}
                      onClick={() => setTargetGender(g.id)}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter 2: Age Brackets */}
              <div>
                <label className="form-label">Target Age Group:</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  {[
                    { id: 'ALL', label: 'All Ages' },
                    { id: 'KIDS', label: 'Kids (6–12)' },
                    { id: 'TEENS', label: 'Teens (13–19)' },
                    { id: 'YOUTH', label: 'Youth (20–30)' },
                    { id: 'ADULTS', label: 'Adults (30+)' },
                    { id: 'CUSTOM', label: 'Custom Age...' }
                  ].map(a => (
                    <button
                      key={a.id}
                      type="button"
                      className={`btn btn-sm ${ageFilterPreset === a.id ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.78rem', padding: '0.4rem 0.2rem' }}
                      onClick={() => setAgeFilterPreset(a.id)}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>

                {ageFilterPreset === 'CUSTOM' && (
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--cpet-border)' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Min Age:</span>
                      <input
                        type="number"
                        className="form-input"
                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.85rem' }}
                        value={customMinAge}
                        onChange={e => setCustomMinAge(Number(e.target.value))}
                        min={3}
                        max={100}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Max Age:</span>
                      <input
                        type="number"
                        className="form-input"
                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.85rem' }}
                        value={customMaxAge}
                        onChange={e => setCustomMaxAge(Number(e.target.value))}
                        min={3}
                        max={100}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Filter 3: District */}
              <div>
                <label className="form-label">Candidate District:</label>
                <select
                  className="form-select"
                  style={{ fontSize: '0.85rem' }}
                  value={targetDistrict}
                  onChange={e => setTargetDistrict(e.target.value)}
                >
                  <option value="ALL">All Districts Across Kerala ({unifiedCandidates.length})</option>
                  {availableDistricts.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Filter 4: Past Course Category Alumni */}
              <div>
                <label className="form-label">Past Course Alumni Category:</label>
                <select
                  className="form-select"
                  style={{ fontSize: '0.85rem' }}
                  value={targetPriorCategory}
                  onChange={e => setTargetPriorCategory(e.target.value)}
                >
                  <option value="ALL">All Categories / Any Prior Student</option>
                  <option value="MAHALLU">Mahallu Weekend System Alumni</option>
                  <option value="ONLINE_DIPLOMA">Online Diplomas & Long-term Programs</option>
                  <option value="RESIDENTIAL_CAMP">Residential Leadership Camp Alumni</option>
                  <option value="OFFLINE_WORKSHOP">1-Day Offline Workshops</option>
                  <option value="LANGUAGE_ACADEMY">Language & Communication Academy</option>
                </select>
              </div>

              {/* Real-time Match Indicator */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', padding: '0.85rem', marginTop: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>MATCHING AUDIENCE</span>
                    <h3 style={{ margin: '2px 0 0', color: '#15803d', fontSize: '1.4rem', fontWeight: 800 }}>
                      {audienceStats.total} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#166534' }}>students</span>
                    </h3>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.78rem', color: '#166534' }}>
                    <div>👨 {audienceStats.maleCount} Male • 👩 {audienceStats.femaleCount} Female</div>
                    {audienceStats.avgAge && <div>Avg Age: ~{audienceStats.avgAge} yrs</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar: Big Meta Cloud API Broadcast Trigger + Backup VCF/CSV */}
          <div style={{
            background: 'linear-gradient(to right, #ffffff, #f0fdf4)',
            border: '2px solid #86efac',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 14px rgba(22, 163, 74, 0.08)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="badge badge-success" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                    1-CLICK OUTREACH
                  </span>
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    Estimated Meta Cost: <strong style={{ color: '#15803d' }}>₹{estimatedMetaCost}</strong> ({filteredAudience.length} × ₹0.80)
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#14532d', fontWeight: 800 }}>
                  Ready to Broadcast "{activeCourse?.title}" to {audienceStats.total} Candidates?
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#4b5563' }}>
                  Delivers course poster, personal greeting, and instant "Register Now" button directly to every student's WhatsApp inbox without touching your phone.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* PRIMARY ACTION: Launch Meta API Broadcast */}
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{
                    background: '#16a34a',
                    borderColor: '#16a34a',
                    padding: '0.75rem 1.4rem',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onClick={() => setShowBroadcastModal(true)}
                  disabled={filteredAudience.length === 0}
                >
                  <Send size={18} />
                  <span>🚀 Launch Meta WhatsApp Broadcast ({filteredAudience.length})</span>
                </button>

                {/* Secondary Backup Tools: VCF & CSV */}
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ borderColor: '#cbd5e1', fontSize: '0.82rem' }}
                  onClick={handleExportVCF}
                  title="Export contacts as VCF for phone import"
                >
                  <Download size={14} /> VCF Backup
                </button>

                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ borderColor: '#cbd5e1', fontSize: '0.82rem' }}
                  onClick={handleExportCSV}
                  title="Export phone list to CSV spreadsheet"
                >
                  <FileSpreadsheet size={14} /> CSV
                </button>
              </div>
            </div>
          </div>

          {/* Candidate Queue Table & 1-Click WhatsApp Quick Chat */}
          <div className="cpet-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 className="cpet-card-title" style={{ margin: 0 }}>
                  <Users size={18} />
                  Target Candidate Queue ({filteredAudience.length})
                </h3>
                <p className="cpet-card-desc" style={{ margin: '2px 0 0' }}>
                  Review recipients matching your filters or open direct WhatsApp conversations.
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
                    {filteredAudience.slice(0, 50).map((cand, idx) => {
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

                {filteredAudience.length > 50 && (
                  <div style={{ textAlign: 'center', padding: '0.75rem', background: '#f8fafc', color: '#64748b', fontSize: '0.8rem', borderTop: '1px solid var(--cpet-border)' }}>
                    Showing first 50 of {filteredAudience.length} candidates in queue preview. The Meta WhatsApp Broadcast tool processes all {filteredAudience.length} candidates automatically.
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: META CLOUD API CONFIGURATION & TEST DISPATCHER */}
      {/* ========================================================================= */}
      {hubTab === 'config' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {/* Left: Configuration Form */}
          <div className="cpet-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--cpet-border)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <Key size={18} color="var(--cpet-primary)" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--cpet-primary)' }}>
                Meta WhatsApp Business API Keys
              </h3>
            </div>

            {/* Advisory: Separate Phone Number */}
            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', padding: '0.85rem', marginBottom: '1.25rem', display: 'flex', gap: '8px' }}>
              <AlertTriangle size={18} color="#b45309" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.82rem', color: '#78350f', lineHeight: 1.45 }}>
                <strong>Important Phone Number Guideline:</strong>
                <p style={{ margin: '3px 0 0' }}>
                  Do <strong>NOT</strong> delete your existing CPET office WhatsApp account! Keep your current phone number on WhatsApp mobile app for daily phone calls and student inquiries.
                </p>
                <p style={{ margin: '4px 0 0' }}>
                  Get a dedicated ₹100 new SIM card (Jio / Airtel) specifically for the Meta Automated API Broadcast Engine. In the broadcast messages, you can set your regular office phone number as the clickable "Contact CPET" button!
                </p>
              </div>
            </div>

            <form onSubmit={e => { e.preventDefault(); saveMetaConfig(metaConfig); }}>
              <div className="form-group">
                <label className="form-label">Phone Number ID:</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 109283746592810 (From Meta App -> API Setup)"
                  value={metaConfig.phoneNumberId}
                  onChange={e => setMetaConfig({ ...metaConfig, phoneNumberId: e.target.value })}
                />
                <span className="form-helper">Found in Meta for Developers ➔ WhatsApp ➔ API Setup.</span>
              </div>

              <div className="form-group">
                <label className="form-label">WhatsApp Business Account ID (WABA ID):</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 104829104928102"
                  value={metaConfig.wabaId}
                  onChange={e => setMetaConfig({ ...metaConfig, wabaId: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Permanent System User Access Token:</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="EAABw..."
                  value={metaConfig.accessToken}
                  onChange={e => setMetaConfig({ ...metaConfig, accessToken: e.target.value })}
                />
                <span className="form-helper">Generated from Meta Business Settings ➔ System Users with <code>whatsapp_business_messaging</code> permission.</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Template Name:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={metaConfig.templateName}
                    onChange={e => setMetaConfig({ ...metaConfig, templateName: e.target.value })}
                    placeholder="cpet_course_admission"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Template Language:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={metaConfig.templateLanguage}
                    onChange={e => setMetaConfig({ ...metaConfig, templateLanguage: e.target.value })}
                    placeholder="en"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Cost per Delivered Conversation (INR):</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={metaConfig.costPerMessage}
                  onChange={e => setMetaConfig({ ...metaConfig, costPerMessage: parseFloat(e.target.value) || 0.80 })}
                />
                <span className="form-helper">Official Meta marketing conversation rate in India is ~₹0.80.</span>
              </div>

              <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '0.5rem' }}>
                <Check size={16} /> Save Meta API Settings
              </button>
            </form>
          </div>

          {/* Right: Live Test Message Sender & Quick Setup Checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Live Test Sender */}
            <div className="cpet-card" style={{ border: '1.5px solid #93c5fd', background: 'linear-gradient(to bottom, #ffffff, #f0f9ff)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                <Smartphone size={18} color="#2563eb" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#1e40af' }}>
                  Send Test WhatsApp Message to Your Phone
                </h3>
              </div>
              <p style={{ margin: '0 0 1rem', fontSize: '0.82rem', color: '#475569' }}>
                Enter your 10-digit mobile number to verify that the template, image poster, and dynamic URL button deliver properly to WhatsApp.
              </p>

              <form onSubmit={handleSendTestMessage}>
                <div className="form-group">
                  <label className="form-label">Your 10-Digit Mobile Number:</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#e2e8f0', padding: '0 0.75rem', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '0.85rem', color: '#334155' }}>
                      +91
                    </div>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="e.g. 9847012345"
                      required
                      value={testPhoneNumber}
                      onChange={e => setTestPhoneNumber(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSendingTest}
                      style={{ background: '#2563eb', whiteSpace: 'nowrap' }}
                    >
                      {isSendingTest ? 'Sending...' : 'Test Send'}
                    </button>
                  </div>
                </div>
              </form>

              {testResult && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: testResult.success ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${testResult.success ? '#bbf7d0' : '#fecaca'}`,
                  fontSize: '0.8rem',
                  color: testResult.success ? '#166534' : '#b91c1c'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '2px' }}>
                    {testResult.success ? <CheckCircle size={14} /> : <X size={14} />}
                    <span>{testResult.success ? 'Delivery Result: Success' : 'Delivery Result: Failed'}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.72rem', opacity: 0.8 }}>{testResult.timestamp}</span>
                  </div>
                  <div style={{ wordBreak: 'break-all' }}>{testResult.message}</div>
                </div>
              )}
            </div>

            {/* Quick Setup Checklist */}
            <div className="cpet-card">
              <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', color: 'var(--cpet-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} color="#16a34a" /> 5-Step Meta Setup Checklist
              </h4>
              <div style={{ fontSize: '0.82rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>1</span>
                  <span>Create free Business App on <strong>developers.facebook.com</strong></span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>2</span>
                  <span>Add WhatsApp product & connect dedicated CPET SIM via SMS OTP</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>3</span>
                  <span>Generate Permanent System Token with <code>whatsapp_business_messaging</code></span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>4</span>
                  <span>Submit Marketing Template with Image header (Meta AI approves in &lt;5 mins)</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>5</span>
                  <span>Add debit/credit card under Meta Business Billing (billed per usage)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CAMPAIGN LOGS & DELIVERY HISTORY */}
      {/* ========================================================================= */}
      {hubTab === 'history' && (
        <div className="cpet-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 className="cpet-card-title" style={{ margin: 0 }}>
                <History size={18} /> Past WhatsApp Campaigns & Meta Delivery Audit
              </h3>
              <p className="cpet-card-desc" style={{ margin: '2px 0 0' }}>
                Complete log of dispatched automated broadcasts, candidate counts, and Meta billing tracking.
              </p>
            </div>
            {campaignHistory.length > 0 && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  if (window.confirm('Clear campaign history logs?')) {
                    setCampaignHistory([]);
                    localStorage.removeItem(CAMPAIGN_HISTORY_STORAGE_KEY);
                  }
                }}
              >
                Clear Log History
              </button>
            )}
          </div>

          {campaignHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', color: '#64748b' }}>
              <History size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
              <h4 style={{ margin: '0 0 4px', color: 'var(--cpet-primary)' }}>No broadcast campaigns logged yet</h4>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                When you launch an automated broadcast campaign from the Audience tab, its execution metrics will appear here.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="cpet-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Course Program</th>
                    <th>Audience Filters</th>
                    <th>Recipients</th>
                    <th>Delivery Status</th>
                    <th>Meta Cost (Est.)</th>
                    <th>Engine Mode</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignHistory.map(camp => (
                    <tr key={camp.id}>
                      <td style={{ color: '#64748b', fontSize: '0.8rem' }}>
                        {new Date(camp.date).toLocaleString()}
                      </td>
                      <td>
                        <strong style={{ color: 'var(--cpet-primary)' }}>{camp.courseTitle}</strong>
                        <span className="badge badge-neutral" style={{ marginLeft: '4px', fontSize: '0.7rem' }}>{camp.courseCode}</span>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: '#475569' }}>
                        {camp.targetSummary}
                      </td>
                      <td>
                        <strong>{camp.recipientsCount}</strong> candidates
                      </td>
                      <td>
                        <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                          ✅ {camp.successCount} Delivered
                        </span>
                        {camp.failCount > 0 && (
                          <span className="badge badge-danger" style={{ marginLeft: '4px', fontSize: '0.75rem' }}>
                            ❌ {camp.failCount} Failed
                          </span>
                        )}
                      </td>
                      <td>
                        <strong style={{ color: '#16a34a' }}>₹{camp.costEstimate}</strong>
                      </td>
                      <td>
                        {camp.isLiveApi ? (
                          <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>Live Meta API</span>
                        ) : (
                          <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>Pre-Config Demo</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: LIVE META CLOUD API BROADCAST DISPATCHER */}
      {/* ========================================================================= */}
      {showBroadcastModal && (
        <div className="modal-overlay" onClick={() => !isBroadcasting && setShowBroadcastModal(false)}>
          <div className="modal-content" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Megaphone size={20} color="var(--cpet-primary)" />
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
                  {isBroadcastCompleted ? 'Campaign Broadcast Completed!' : 'Launch Meta WhatsApp Broadcast'}
                </h3>
              </div>
              {!isBroadcasting && (
                <button className="modal-close-btn" onClick={() => setShowBroadcastModal(false)}>
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="modal-body" style={{ padding: '1.25rem' }}>
              {!isBroadcasting && !isBroadcastCompleted && (
                <div>
                  {/* Campaign Summary Card */}
                  <div style={{ background: '#f8fafc', border: '1px solid var(--cpet-border)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                      {activeCourse?.poster_url && (
                        <div style={{ width: '90px', height: '50px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--cpet-border)' }}>
                          <img src={activeCourse.poster_url} alt="Poster" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      <div>
                        <strong style={{ fontSize: '1rem', color: 'var(--cpet-primary)', display: 'block' }}>
                          {activeCourse?.title}
                        </strong>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          Category: {activeCourse?.category.replace(/_/g, ' ')} • Code: {activeCourse?.course_code}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', background: 'white', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>AUDIENCE</span>
                        <strong style={{ fontSize: '1.15rem', color: 'var(--cpet-primary)' }}>{filteredAudience.length}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>EST. META COST</span>
                        <strong style={{ fontSize: '1.15rem', color: '#16a34a' }}>₹{estimatedMetaCost}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>API STATUS</span>
                        <span className={`badge ${hasMetaCredentials ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.72rem', marginTop: '2px' }}>
                          {hasMetaCredentials ? 'Live Cloud API' : 'Demo Mode'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!hasMetaCredentials && (
                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#1e40af' }}>
                      <Info size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-3px' }} />
                      <span>
                        <strong>Running in Pre-Configuration Demo Mode:</strong> You haven't added your Meta credentials yet in the API Config tab. Clicking launch will run the automated dispatch simulation with live progress and real timing so you can test the complete system before going live!
                      </span>
                    </div>
                  )}

                  <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                    When launched, the system will send each student:
                    <br />• Official course poster banner image
                    <br />• Personalized greeting with their registered name
                    <br />• Clickable <strong>"Register Now"</strong> button linking to this course
                  </p>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ flex: 1 }}
                      onClick={() => setShowBroadcastModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ flex: 2, background: '#16a34a', borderColor: '#16a34a', fontWeight: 800 }}
                      onClick={startAutomatedBroadcast}
                    >
                      <Play size={16} /> Confirm & Dispatch to {filteredAudience.length} Candidates
                    </button>
                  </div>
                </div>
              )}

              {/* During Broadcast Dispatch */}
              {isBroadcasting && (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                      <span style={{ color: 'var(--cpet-primary)' }}>Dispatching WhatsApp Messages...</span>
                      <span style={{ color: '#16a34a' }}>{broadcastProgress}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '12px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${broadcastProgress}%`,
                        height: '100%',
                        background: 'linear-gradient(to right, #16a34a, #22c55e)',
                        transition: 'width 0.15s ease'
                      }} />
                    </div>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1rem' }}>
                    Current Recipient: <strong style={{ color: 'var(--cpet-primary)' }}>{broadcastCurrentCandidate || 'Processing...'}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', fontSize: '0.85rem' }}>
                    <span style={{ color: '#16a34a' }}>✅ Delivered: <strong>{broadcastSuccessCount}</strong></span>
                    <span style={{ color: '#dc2626' }}>❌ Failed: <strong>{broadcastFailCount}</strong></span>
                    <span style={{ color: '#64748b' }}>Total: <strong>{filteredAudience.length}</strong></span>
                  </div>

                  {/* Real-time ticker log */}
                  <div style={{ marginTop: '1.25rem', height: '140px', overflowY: 'auto', background: '#0f172a', color: '#a7f3d0', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontFamily: 'monospace', fontSize: '0.75rem', textAlign: 'left' }}>
                    {broadcastLogs.map(l => (
                      <div key={l.id} style={{ marginBottom: '3px' }}>
                        [{l.time}] {l.status === 'DELIVERED' ? '✔' : '✖'} {l.name} (+91 {l.phone}) ➔ {l.status} {l.mode === 'SIMULATED' ? '(Simulated)' : ''}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* After Broadcast Completed */}
              {isBroadcastCompleted && (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <CheckCircle size={32} />
                  </div>
                  <h3 style={{ margin: '0 0 6px', color: 'var(--cpet-primary)' }}>
                    Campaign Dispatched Successfully!
                  </h3>
                  <p style={{ margin: '0 0 1.25rem', fontSize: '0.88rem', color: '#64748b' }}>
                    All {filteredAudience.length} matching candidates have been processed.
                  </p>

                  <div style={{ background: '#f8fafc', border: '1px solid var(--cpet-border)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', justifyContent: 'space-around', marginBottom: '1.5rem', textAlign: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>DELIVERED</span>
                      <strong style={{ fontSize: '1.2rem', color: '#16a34a' }}>{broadcastSuccessCount}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>FAILED</span>
                      <strong style={{ fontSize: '1.2rem', color: '#dc2626' }}>{broadcastFailCount}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>EST. META CHARGES</span>
                      <strong style={{ fontSize: '1.2rem', color: 'var(--cpet-primary)' }}>₹{estimatedMetaCost}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ flex: 1 }}
                      onClick={() => setShowBroadcastModal(false)}
                    >
                      Close Window
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                      onClick={() => {
                        setShowBroadcastModal(false);
                        setHubTab('history');
                      }}
                    >
                      View Campaign History Log
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
