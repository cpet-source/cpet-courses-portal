import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  X,
  ArrowRight,
  ArrowLeft,
  Users,
  Check,
  RefreshCw,
  Sparkles,
  HelpCircle,
  FileText,
  UserCheck
} from 'lucide-react';
import { KERALA_DISTRICTS } from '../../data/districts';

export const StudentBulkImporterModal = ({
  isOpen,
  onClose,
  initialCourseId = '',
  onSuccessNavigate = null
}) => {
  const {
    courses,
    centres,
    enrollments,
    batchEnrollStudents,
    setActiveRole,
    setVolunteerCourseTarget,
    showToast
  } = useApp();

  // Active step: 'SELECT_INPUT' | 'MAP_COLUMNS' | 'SUCCESS'
  const [currentStep, setCurrentStep] = useState('SELECT_INPUT');

  // Input Mode: 'FILE' | 'PASTE'
  const [inputMode, setInputMode] = useState('FILE');

  // 1. Course & Policy Setup
  const [targetCourseId, setTargetCourseId] = useState(initialCourseId || courses[0]?.id || '');
  const [targetBatchId, setTargetBatchId] = useState('');
  const [targetCentreId, setTargetCentreId] = useState('');
  const [defaultFeeStatus, setDefaultFeeStatus] = useState('OFFICE_CONFIRMED');

  // 2. Raw Parsed Data from File or Paste
  const [fileName, setFileName] = useState('');
  const [rawHeaders, setRawHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [pastedText, setPastedText] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // 3. Column Mapping State
  const [fieldMapping, setFieldMapping] = useState({
    nameColumn: '',
    phoneColumn: '',
    genderColumn: '',
    placeColumn: '',
    districtColumn: '',
    dobColumn: '',
    amountPaidColumn: ''
  });

  // 4. Execution State
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // Ensure course is updated when initialCourseId changes or modal opens
  useEffect(() => {
    if (initialCourseId) {
      setTargetCourseId(initialCourseId);
    } else if (courses.length > 0 && !targetCourseId) {
      setTargetCourseId(courses[0].id);
    }
  }, [initialCourseId, isOpen, courses]);

  const activeCourse = useMemo(() => {
    return courses.find(c => c.id === targetCourseId) || courses[0];
  }, [courses, targetCourseId]);

  // Set default batch when course changes
  useEffect(() => {
    if (activeCourse?.batches && activeCourse.batches.length > 0) {
      setTargetBatchId(activeCourse.batches[0].id);
    } else {
      setTargetBatchId('batch-1');
    }
  }, [activeCourse]);

  // Handle Drag & Drop / File Input
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });

        if (!json || json.length === 0) {
          showToast('The selected file has no data rows.', 'warning');
          setIsProcessingFile(false);
          return;
        }

        const headers = Object.keys(json[0] || {});
        setRawHeaders(headers);
        setRawRows(json);
        autoDetectColumns(headers);
        setCurrentStep('MAP_COLUMNS');
      } catch (err) {
        console.error('Error reading Excel file:', err);
        showToast('Failed to read file. Please ensure it is a valid Excel or CSV file.', 'danger');
      } finally {
        setIsProcessingFile(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Handle Text Paste Parsing (TSV from Google Sheets / Excel or CSV)
  const handleParsePastedText = () => {
    const trimmed = pastedText.trim();
    if (!trimmed) {
      showToast('Please paste your Google Sheet or Excel table rows first.', 'warning');
      return;
    }

    try {
      const lines = trimmed.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) {
        showToast('Please paste at least one header row and one student data row.', 'warning');
        return;
      }

      // Detect separator: Tab (\t) is standard for Excel/Sheets copy-paste, otherwise comma
      const firstLine = lines[0];
      const delimiter = firstLine.includes('\t') ? '\t' : (firstLine.includes(',') ? ',' : '\t');

      const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
      const parsedRows = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(delimiter).map(p => p.trim().replace(/^["']|["']$/g, ''));
        const rowObj = {};
        headers.forEach((h, idx) => {
          rowObj[h] = parts[idx] || '';
        });
        parsedRows.push(rowObj);
      }

      if (parsedRows.length === 0) {
        showToast('No student data rows could be parsed.', 'warning');
        return;
      }

      setFileName(`Pasted Table (${parsedRows.length} rows)`);
      setRawHeaders(headers);
      setRawRows(parsedRows);
      autoDetectColumns(headers);
      setCurrentStep('MAP_COLUMNS');
    } catch (err) {
      console.error('Paste parse error:', err);
      showToast('Failed to parse pasted data.', 'danger');
    }
  };

  // Smart Column Header Auto-Detection
  const autoDetectColumns = (headers) => {
    const findMatch = (regex) => headers.find(h => regex.test(h.toLowerCase().trim())) || '';

    const nameCol = findMatch(/^(full[_\s]?name|student[_\s]?name|candidate[_\s]?name|name|participant|പേര്)$/i)
      || findMatch(/name|പേര്/i);

    const phoneCol = findMatch(/^(whatsapp[_\s]?(no|number)?|mobile[_\s]?(no|number)?|phone[_\s]?(no|number)?|contact[_\s]?(no|number)?|നമ്പർ|ഫോൺ)$/i)
      || findMatch(/phone|mobile|whatsapp|contact|ഫോൺ|നമ്പർ/i);

    const genderCol = findMatch(/^(gender|sex|ലിംഗം)$/i) || findMatch(/gender|sex/i);
    const placeCol = findMatch(/^(place|city|location|address|സ്ഥലം)$/i) || findMatch(/place|city|സ്ഥലം/i);
    const districtCol = findMatch(/^(district|ജില്ല)$/i) || findMatch(/district|ജില്ല/i);
    const dobCol = findMatch(/^(dob|date[_\s]?of[_\s]?birth|birth[_\s]?date|age|പ്രായം)$/i) || findMatch(/birth|dob|age/i);
    const feeCol = findMatch(/^(amount|fee|fees|paid|transaction|utr)$/i) || findMatch(/amount|fee/i);

    setFieldMapping({
      nameColumn: nameCol || headers[0] || '',
      phoneColumn: phoneCol || headers[1] || '',
      genderColumn: genderCol || '',
      placeColumn: placeCol || '',
      districtColumn: districtCol || '',
      dobColumn: dobCol || '',
      amountPaidColumn: feeCol || ''
    });
  };

  // Verified Students Validation & Live Preview
  const processedStudents = useMemo(() => {
    if (!rawRows || rawRows.length === 0) return [];

    const existingEnrolledPhones = new Set(
      enrollments
        .filter(e => e.course_id === targetCourseId)
        .map(e => (e.account_phone || '').trim().replace(/\D/g, '').slice(-10))
    );

    const seenInBatch = new Set();

    return rawRows.map((row, index) => {
      const rawName = row[fieldMapping.nameColumn];
      const rawPhone = row[fieldMapping.phoneColumn];
      const rawGender = fieldMapping.genderColumn ? row[fieldMapping.genderColumn] : '';
      const rawPlace = fieldMapping.placeColumn ? row[fieldMapping.placeColumn] : '';
      const rawDistrict = fieldMapping.districtColumn ? row[fieldMapping.districtColumn] : '';
      const rawDob = fieldMapping.dobColumn ? row[fieldMapping.dobColumn] : '';
      const rawAmount = fieldMapping.amountPaidColumn ? row[fieldMapping.amountPaidColumn] : '';

      const name = String(rawName || '').trim();
      const cleanPhone = String(rawPhone || '').replace(/\D/g, '').slice(-10);

      const isValidPhone = cleanPhone.length === 10;
      const isValidName = name.length > 1;

      const isDuplicateInCourse = existingEnrolledPhones.has(cleanPhone);
      const isDuplicateInFile = seenInBatch.has(cleanPhone);
      if (cleanPhone) seenInBatch.add(cleanPhone);

      let status = 'VALID';
      let issueMessage = '';

      if (!isValidName) {
        status = 'INVALID';
        issueMessage = 'Missing or invalid student name';
      } else if (!isValidPhone) {
        status = 'INVALID';
        issueMessage = 'Invalid mobile number (must be 10 digits)';
      } else if (isDuplicateInCourse) {
        status = 'ALREADY_ENROLLED';
        issueMessage = 'Already enrolled in this course';
      } else if (isDuplicateInFile) {
        status = 'DUPLICATE_IN_FILE';
        issueMessage = 'Duplicate phone number in this file';
      }

      return {
        originalIndex: index + 1,
        full_name: name || `Student #${index + 1}`,
        phone: cleanPhone,
        gender: rawGender || 'MALE',
        place: rawPlace || '',
        district: rawDistrict || 'Malappuram',
        date_of_birth: rawDob || '',
        amount_paid: Number(rawAmount) || (defaultFeeStatus === 'OFFICE_CONFIRMED' ? (activeCourse?.standard_fee || 0) : 0),
        status,
        issueMessage,
        raw: row
      };
    });
  }, [rawRows, fieldMapping, enrollments, targetCourseId, defaultFeeStatus, activeCourse]);

  const validStudentsToImport = useMemo(() => {
    return processedStudents.filter(s => s.status === 'VALID');
  }, [processedStudents]);

  const invalidCount = processedStudents.length - validStudentsToImport.length;

  // Execute Enrollment
  const handleExecuteImport = async () => {
    if (validStudentsToImport.length === 0) {
      showToast('No valid students to enroll. Please check your column mappings and mobile numbers.', 'warning');
      return;
    }

    setIsEnrolling(true);
    try {
      const res = await batchEnrollStudents({
        courseId: targetCourseId,
        batchId: targetBatchId,
        centreId: targetCentreId,
        defaultFeeStatus,
        studentsList: validStudentsToImport
      });

      if (res.success) {
        setImportResult({
          courseTitle: activeCourse?.title || 'Selected Course',
          courseCode: activeCourse?.course_code || 'GEN',
          enrolledCount: res.count,
          targetCourseId
        });
        setCurrentStep('SUCCESS');
      }
    } catch (err) {
      console.error('Import error:', err);
      showToast('Error occurred while enrolling students.', 'danger');
    } finally {
      setIsEnrolling(false);
    }
  };

  // Reset modal state
  const handleReset = () => {
    setCurrentStep('SELECT_INPUT');
    setRawHeaders([]);
    setRawRows([]);
    setPastedText('');
    setFileName('');
    setImportResult(null);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        style={{ maxWidth: '850px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid var(--cpet-border)', padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#dbeafe', color: '#1d4ed8', padding: '8px', borderRadius: '8px' }}>
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--cpet-primary)' }}>
                Import Students from Google Form / Excel
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Bulk enroll students into a course for classes, attendance & gate check-in
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
          {/* ========================================================================= */}
          {/* STEP 1: SELECT COURSE & PROVIDE FILE / PASTE */}
          {/* ========================================================================= */}
          {currentStep === 'SELECT_INPUT' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Course Selection Card */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.92rem', color: 'var(--cpet-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={16} color="var(--cpet-accent)" /> 1. Select Target Course & Enrollment Settings
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Enroll into Course *</label>
                    <select
                      className="form-select"
                      style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--cpet-primary)' }}
                      value={targetCourseId}
                      onChange={e => setTargetCourseId(e.target.value)}
                    >
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.title} ({c.course_code} • {c.category.replace(/_/g, ' ')})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Admission Fee Status *</label>
                    <select
                      className="form-select"
                      style={{ fontSize: '0.88rem' }}
                      value={defaultFeeStatus}
                      onChange={e => setDefaultFeeStatus(e.target.value)}
                    >
                      <option value="OFFICE_CONFIRMED">Confirmed / Paid (Standard)</option>
                      <option value="FREE">Free Admission / Scholarship</option>
                      <option value="PAID_ON_SPOT">Paid On-Spot at Counter</option>
                      <option value="PENDING">Fee Due / Pay Later</option>
                    </select>
                  </div>
                </div>

                {activeCourse && (
                  <div style={{ marginTop: '0.65rem', display: 'flex', gap: '8px', fontSize: '0.75rem', color: '#64748b' }}>
                    <span className="badge badge-neutral">{activeCourse.course_code}</span>
                    <span className="badge badge-accent">Category: {activeCourse.category.replace(/_/g, ' ')}</span>
                    <span className="badge badge-primary">Standard Fee: ₹{activeCourse.standard_fee || 0}</span>
                  </div>
                )}
              </div>

              {/* Data Ingestion Method Tabs */}
              <div>
                <label className="form-label" style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--cpet-primary)', marginBottom: '0.5rem' }}>
                  2. Choose How to Provide Your Student Data:
                </label>

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${inputMode === 'FILE' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '0.55rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    onClick={() => setInputMode('FILE')}
                  >
                    <Upload size={16} /> Upload Excel / CSV File (.xlsx, .csv)
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${inputMode === 'PASTE' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '0.55rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    onClick={() => setInputMode('PASTE')}
                  >
                    <FileText size={16} /> Copy & Paste Directly from Google Sheets
                  </button>
                </div>

                {inputMode === 'FILE' ? (
                  <div style={{
                    border: '2px dashed #93c5fd',
                    background: '#f0f9ff',
                    padding: '2rem 1.5rem',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="file"
                      id="bulk-student-file-input"
                      accept=".xlsx, .xls, .csv"
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                      disabled={isProcessingFile}
                    />
                    <label htmlFor="bulk-student-file-input" style={{ cursor: 'pointer', display: 'block' }}>
                      <FileSpreadsheet size={42} color="#2563eb" style={{ margin: '0 auto 0.75rem' }} />
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e40af', marginBottom: '4px' }}>
                        {isProcessingFile ? 'Reading spreadsheet...' : 'Click to Browse or Drag & Drop File Here'}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                        Supports <strong>.xlsx, .xls, or .csv</strong> directly downloaded from Google Forms or Excel
                      </p>
                    </label>
                  </div>
                ) : (
                  <div>
                    <textarea
                      className="form-textarea"
                      rows={6}
                      placeholder={`Paste rows directly from Google Sheets or Excel here (including header row)...\n\nExample:\nTimestamp\tFull Name\tWhatsApp Number\tDistrict\n2026-10-21\tMohammed Rashad\t9876543210\tMalappuram\n2026-10-21\tAisha Fathima\t9123456780\tKozhikode`}
                      style={{ fontFamily: 'monospace', fontSize: '0.82rem', whiteSpace: 'pre' }}
                      value={pastedText}
                      onChange={e => setPastedText(e.target.value)}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        💡 Tip: Open Google Sheets, select your columns and rows, press <strong>Ctrl+C</strong>, and paste here!
                      </span>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ padding: '0.4rem 1rem' }}
                        onClick={handleParsePastedText}
                      >
                        Parse Data <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: COLUMN MAPPING & LIVE VERIFICATION PREVIEW */}
          {/* ========================================================================= */}
          {currentStep === 'MAP_COLUMNS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Back to change file */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#eff6ff', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid #bfdbfe' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: '#1e40af' }}>
                  <FileSpreadsheet size={16} />
                  <span>File: <strong>{fileName}</strong> ({rawRows.length} total rows parsed)</span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                  onClick={() => setCurrentStep('SELECT_INPUT')}
                >
                  <ArrowLeft size={12} /> Choose Another File
                </button>
              </div>

              {/* Column Mapping Selectors */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #cbd5e1' }}>
                <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.92rem', color: 'var(--cpet-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} color="var(--cpet-accent)" /> Verify & Match Column Headers
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                      Student Full Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      className="form-select"
                      style={{ fontSize: '0.82rem', borderColor: fieldMapping.nameColumn ? '#22c55e' : '#f87171' }}
                      value={fieldMapping.nameColumn}
                      onChange={e => setFieldMapping({ ...fieldMapping, nameColumn: e.target.value })}
                    >
                      <option value="">-- Select Name Column --</option>
                      {rawHeaders.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                      Mobile / WhatsApp Number <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      className="form-select"
                      style={{ fontSize: '0.82rem', borderColor: fieldMapping.phoneColumn ? '#22c55e' : '#f87171' }}
                      value={fieldMapping.phoneColumn}
                      onChange={e => setFieldMapping({ ...fieldMapping, phoneColumn: e.target.value })}
                    >
                      <option value="">-- Select Phone Column --</option>
                      {rawHeaders.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>
                      District
                    </label>
                    <select
                      className="form-select"
                      style={{ fontSize: '0.82rem' }}
                      value={fieldMapping.districtColumn}
                      onChange={e => setFieldMapping({ ...fieldMapping, districtColumn: e.target.value })}
                    >
                      <option value="">-- None (Default: Malappuram) --</option>
                      {rawHeaders.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>
                      Place / City / Mahallu
                    </label>
                    <select
                      className="form-select"
                      style={{ fontSize: '0.82rem' }}
                      value={fieldMapping.placeColumn}
                      onChange={e => setFieldMapping({ ...fieldMapping, placeColumn: e.target.value })}
                    >
                      <option value="">-- None --</option>
                      {rawHeaders.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>
                      Gender
                    </label>
                    <select
                      className="form-select"
                      style={{ fontSize: '0.82rem' }}
                      value={fieldMapping.genderColumn}
                      onChange={e => setFieldMapping({ ...fieldMapping, genderColumn: e.target.value })}
                    >
                      <option value="">-- None (Default: MALE) --</option>
                      {rawHeaders.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>
                      Amount Paid (Optional)
                    </label>
                    <select
                      className="form-select"
                      style={{ fontSize: '0.82rem' }}
                      value={fieldMapping.amountPaidColumn}
                      onChange={e => setFieldMapping({ ...fieldMapping, amountPaidColumn: e.target.value })}
                    >
                      <option value="">-- Standard Course Fee --</option>
                      {rawHeaders.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Data Verification Metrics */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="badge" style={{ background: '#22c55e', color: 'white', padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 700 }}>
                    <CheckCircle size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }} />
                    {validStudentsToImport.length} Valid Students to Enroll
                  </span>
                  {invalidCount > 0 && (
                    <span className="badge" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                      <AlertTriangle size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }} />
                      {invalidCount} Skipped (Duplicates / Invalid Phones)
                    </span>
                  )}
                </div>

                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Course: <strong>{activeCourse?.title}</strong>
                </span>
              </div>

              {/* Live Preview Table */}
              <div style={{ border: '1px solid var(--cpet-border)', borderRadius: 'var(--radius-sm)', maxHeight: '280px', overflowY: 'auto' }}>
                <table className="cpet-table" style={{ fontSize: '0.82rem', margin: 0 }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
                    <tr>
                      <th style={{ width: '40px' }}>#</th>
                      <th>Student Full Name</th>
                      <th>Phone (10 Digits)</th>
                      <th>Gender</th>
                      <th>District / Place</th>
                      <th>Import Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedStudents.slice(0, 50).map(s => (
                      <tr key={s.originalIndex} style={{ background: s.status === 'VALID' ? 'white' : '#fef2f2' }}>
                        <td style={{ color: '#94a3b8' }}>{s.originalIndex}</td>
                        <td>
                          <strong>{s.full_name}</strong>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                            {s.phone ? `+91 ${s.phone}` : '—'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${s.gender === 'FEMALE' ? 'badge-accent' : 'badge-neutral'}`} style={{ fontSize: '0.7rem' }}>
                            {s.gender}
                          </span>
                        </td>
                        <td style={{ color: '#64748b' }}>
                          {s.district} {s.place ? `(${s.place})` : ''}
                        </td>
                        <td>
                          {s.status === 'VALID' ? (
                            <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                              Ready to Enroll
                            </span>
                          ) : (
                            <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>
                              {s.issueMessage}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {processedStudents.length > 50 && (
                <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#64748b' }}>
                  Showing first 50 rows of {processedStudents.length} total rows. All {validStudentsToImport.length} valid students will be enrolled.
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: SUCCESS CELEBRATION */}
          {/* ========================================================================= */}
          {currentStep === 'SUCCESS' && importResult && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#dcfce7',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <CheckCircle size={36} />
              </div>

              <h3 style={{ margin: '0 0 0.5rem', color: 'var(--cpet-primary)', fontSize: '1.4rem' }}>
                {importResult.enrolledCount} Students Enrolled Successfully!
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                All student accounts and course admission numbers have been generated and synced to the cloud database for <strong>{importResult.courseTitle}</strong>.
              </p>

              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', maxWidth: '420px', margin: '0 auto 1.5rem', border: '1px solid #e2e8f0', textAlign: 'left', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ color: '#64748b' }}>Course:</span>
                  <strong>{importResult.courseTitle} ({importResult.courseCode})</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ color: '#64748b' }}>Enrolled Students:</span>
                  <strong style={{ color: '#16a34a' }}>{importResult.enrolledCount} Students</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Attendance Status:</span>
                  <span className="badge badge-success">Ready in Gate Desk & Directory</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ background: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0.6rem 1.25rem' }}
                  onClick={() => {
                    setVolunteerCourseTarget(importResult.targetCourseId);
                    setActiveRole('volunteer_desk');
                    onClose();
                  }}
                >
                  <UserCheck size={16} /> Open Gate Check-In Desk Now
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Done & Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {currentStep === 'MAP_COLUMNS' && (
          <div className="modal-footer" style={{ borderTop: '1px solid var(--cpet-border)', padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setCurrentStep('SELECT_INPUT')}
              disabled={isEnrolling}
            >
              Back
            </button>

            <button
              type="button"
              className="btn btn-primary"
              disabled={isEnrolling || validStudentsToImport.length === 0}
              onClick={handleExecuteImport}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#2563eb', padding: '0.55rem 1.25rem' }}
            >
              {isEnrolling ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Enrolling Students...
                </>
              ) : (
                <>
                  <Check size={16} /> Confirm & Enroll {validStudentsToImport.length} Students
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
