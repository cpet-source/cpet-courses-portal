import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BookOpen, MapPin, Calendar, Clock, DollarSign, ArrowRight, CheckCircle, Shield, Share2 } from 'lucide-react';

export const CourseCatalog = ({ onSelectCourse }) => {
  const { courses, showToast } = useApp();
  const [filterCategory, setFilterCategory] = useState('ALL');

  const normalizeCategory = (cat) => {
    if (cat === 'GENERAL_ONLINE') return 'ONLINE';
    if (cat === 'GENERAL_OFFLINE') return 'OFFLINE_WORKSHOP';
    return cat || 'MAHALLU';
  };

  const getCategoryLabel = (cat) => {
    const norm = normalizeCategory(cat);
    switch (norm) {
      case 'MAHALLU': return 'Mahallu Based';
      case 'ONLINE': return 'Online Course';
      case 'OFFLINE_WORKSHOP': return 'Workshop / Camp';
      case 'LANGUAGE_ACADEMY': return 'Language Academy';
      default: return (cat || '').replace(/_/g, ' ');
    }
  };

  const getCategoryBadgeClass = (cat) => {
    const norm = normalizeCategory(cat);
    switch (norm) {
      case 'MAHALLU': return 'badge-primary';
      case 'ONLINE': return 'badge-accent';
      case 'OFFLINE_WORKSHOP': return 'badge-warning';
      case 'LANGUAGE_ACADEMY': return 'badge-secondary';
      default: return 'badge-neutral';
    }
  };

  const filtered = courses.filter(c => {
    if (filterCategory === 'ALL') return true;
    return normalizeCategory(c.category) === filterCategory;
  });

  // Sort latest courses on top
  const sortedCourses = [...filtered].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (a.id ? parseInt(a.id.replace(/\D/g, '') || 0) : 0);
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (b.id ? parseInt(b.id.replace(/\D/g, '') || 0) : 0);
    return timeB - timeA;
  });

  return (
    <div>
      <div className="cpet-card-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 className="cpet-card-title">
            <BookOpen size={22} />
            Explore CPET Courses & Training Programs
          </h2>
          <p className="cpet-card-desc">
            Public programs offered across Kerala by the Centre for Public Education & Training (DHIU).
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="cpet-tabs" style={{ marginBottom: '1.5rem' }}>
        <button
          className={`tab-btn ${filterCategory === 'ALL' ? 'active' : ''}`}
          onClick={() => setFilterCategory('ALL')}
        >
          All Programs ({courses.length})
        </button>
        <button
          className={`tab-btn ${filterCategory === 'MAHALLU' ? 'active' : ''}`}
          onClick={() => setFilterCategory('MAHALLU')}
        >
          Mahallu Study Centres
        </button>
        <button
          className={`tab-btn ${filterCategory === 'ONLINE' ? 'active' : ''}`}
          onClick={() => setFilterCategory('ONLINE')}
        >
          Online Courses
        </button>
        <button
          className={`tab-btn ${filterCategory === 'OFFLINE_WORKSHOP' ? 'active' : ''}`}
          onClick={() => setFilterCategory('OFFLINE_WORKSHOP')}
        >
          Workshops & Camps
        </button>
        <button
          className={`tab-btn ${filterCategory === 'LANGUAGE_ACADEMY' ? 'active' : ''}`}
          onClick={() => setFilterCategory('LANGUAGE_ACADEMY')}
        >
          Language Academy
        </button>
      </div>

      {/* Course Cards or Empty State */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--cpet-border)' }}>
          <div style={{ width: '54px', height: '54px', background: 'var(--cpet-accent-soft)', color: 'var(--cpet-accent)', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <BookOpen size={28} />
          </div>
          <h3 style={{ color: 'var(--cpet-primary)', marginBottom: '0.4rem', fontSize: '1.2rem', fontWeight: 800 }}>
            {courses.length === 0 ? 'No Courses Published Yet' : 'No Courses In This Category'}
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.88rem', maxWidth: '440px', margin: '0 auto 1.25rem' }}>
            {courses.length === 0
              ? 'New intakes and admission programs are being scheduled by the CPET central office. Please check back shortly.'
              : 'Try viewing all categories to explore upcoming diplomas, Mahallu study centres, and residential camps.'}
          </p>
          {filterCategory !== 'ALL' && (
            <button className="btn btn-secondary btn-sm" onClick={() => setFilterCategory('ALL')}>
              View All Programs
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {sortedCourses.map(course => {
            const isClosed = course.registration_status === 'CLOSED';
            const isUpcoming = course.registration_status === 'UPCOMING';

            let daysRemaining = null;
            let isDeadlinePassed = false;
            if (course.registration_deadline) {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const deadline = new Date(course.registration_deadline);
              deadline.setHours(23, 59, 59, 999);
              const diffTime = deadline.getTime() - today.getTime();
              daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (daysRemaining < 0) {
                isDeadlinePassed = true;
              }
            }
            const isConcluded = course.status === 'COMPLETED';
            const isBlocked = isConcluded || isClosed || isUpcoming || isDeadlinePassed;

            return (
              <div key={course.id} className="cpet-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden', border: isBlocked ? '1px solid #e2e8f0' : undefined }}>
                <div>
                  {/* 800x1600 (2:1) Landscape Banner */}
                  {course.poster_url ? (
                    <div style={{
                      width: 'calc(100% + 3rem)',
                      margin: '-1.5rem -1.5rem 1rem -1.5rem',
                      aspectRatio: '2 / 1',
                      maxHeight: '180px',
                      overflow: 'hidden',
                      background: '#0f172a'
                    }}>
                      <img
                        src={course.poster_url}
                        alt={course.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                  ) : (
                    <div style={{
                      width: 'calc(100% + 3rem)',
                      margin: '-1.5rem -1.5rem 1rem -1.5rem',
                      height: '55px',
                      overflow: 'hidden',
                      background: (() => {
                        const norm = normalizeCategory(course.category);
                        if (norm === 'MAHALLU') return 'linear-gradient(135deg, #064e3b 0%, #047857 100%)';
                        if (norm === 'ONLINE') return 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)';
                        if (norm === 'LANGUAGE_ACADEMY') return 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)';
                        return 'linear-gradient(135deg, #78350f 0%, #d97706 100%)';
                      })(),
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 1.25rem'
                    }}>
                      <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em' }}>
                        CPET • {course.course_code}
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      <span className={`badge ${getCategoryBadgeClass(course.category)}`}>
                        {getCategoryLabel(course.category)}
                      </span>

                      {/* Status & Deadline Badges */}
                      {isConcluded ? (
                        <span className="badge badge-neutral" style={{ background: '#e2e8f0', color: '#475569', fontWeight: 600 }}>
                          🏁 Program Concluded
                        </span>
                      ) : (
                        <>
                          {isClosed && (
                            <span className="badge badge-danger">Registration Closed</span>
                          )}
                          {isUpcoming && (
                            <span className="badge badge-accent">Opening Soon</span>
                          )}
                          {!isClosed && !isUpcoming && isDeadlinePassed && (
                            <span className="badge badge-danger">Deadline Ended</span>
                          )}
                          {!isClosed && !isUpcoming && !isDeadlinePassed && daysRemaining !== null && (
                            <span className="badge" style={{ background: daysRemaining <= 3 ? '#fef3c7' : '#dcfce7', color: daysRemaining <= 3 ? '#92400e' : '#166534', fontWeight: 700 }}>
                              ⏳ {daysRemaining === 0 ? 'Last Day!' : `${daysRemaining} days left`}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {course.category !== 'MAHALLU' && (
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--cpet-primary)' }}>
                        {course.standard_fee > 0 ? `₹${course.standard_fee.toLocaleString('en-IN')}` : 'FREE'}
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: isBlocked ? '#475569' : 'var(--cpet-primary)', marginBottom: '0.4rem', lineHeight: 1.3 }}>
                    {course.title}
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: '#64748b', marginBottom: '1rem', lineHeight: 1.45 }}>
                    {course.description}
                  </p>

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.78rem', color: '#475569', marginBottom: '1rem', padding: '0.6rem 0.8rem', background: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
                    <span>📅 <strong>{course.total_planned_classes} Sessions</strong></span>
                    <span>🎓 <strong>{course.evaluation_type === 'NONE' ? 'No Exam / Open' : course.evaluation_type.replace('_', ' ')}</strong></span>
                    {course.category !== 'MAHALLU' && course.payment_policy && (
                      <span>💳 <strong>{course.payment_policy.replace(/_/g, ' ')}</strong></span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/?course=${course.slug || course.id}`;
                      navigator.clipboard.writeText(shareUrl);
                      showToast('Direct registration link copied to clipboard!');
                    }}
                    title="Share course registration link"
                    style={{ padding: '0.6rem 0.85rem' }}
                  >
                    <Share2 size={16} />
                  </button>

                  {isBlocked ? (
                    <button
                      className="btn btn-secondary"
                      style={{ flex: 1, opacity: 0.7, cursor: 'not-allowed' }}
                      disabled
                    >
                      {isConcluded ? 'Program Concluded' : isClosed ? 'Registration Closed' : isUpcoming ? 'Opening Soon' : 'Deadline Passed'}
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                      onClick={() => onSelectCourse(course)}
                    >
                      <span>Register for this Course</span>
                      <ArrowRight size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
