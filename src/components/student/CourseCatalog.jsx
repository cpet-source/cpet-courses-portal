import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BookOpen, MapPin, Calendar, Clock, DollarSign, ArrowRight, CheckCircle, Shield } from 'lucide-react';

export const CourseCatalog = ({ onSelectCourse }) => {
  const { courses } = useApp();
  const [filterCategory, setFilterCategory] = useState('ALL');

  const filtered = courses.filter(c => {
    if (filterCategory === 'ALL') return true;
    return c.category === filterCategory;
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
          className={`tab-btn ${filterCategory === 'GENERAL_ONLINE' ? 'active' : ''}`}
          onClick={() => setFilterCategory('GENERAL_ONLINE')}
        >
          Online Diplomas
        </button>
        <button
          className={`tab-btn ${filterCategory === 'GENERAL_OFFLINE' ? 'active' : ''}`}
          onClick={() => setFilterCategory('GENERAL_OFFLINE')}
        >
          Workshops & Camps
        </button>
      </div>

      {/* Course Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {filtered.map(course => (
          <div key={course.id} className="cpet-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span className={`badge ${
                  course.category === 'MAHALLU' ? 'badge-primary' :
                  course.category === 'GENERAL_ONLINE' ? 'badge-accent' : 'badge-warning'
                }`}>
                  {course.category.replace('_', ' ')}
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--cpet-primary)' }}>
                  {course.standard_fee > 0 ? `₹${course.standard_fee.toLocaleString('en-IN')}` : 'FREE'}
                </span>
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--cpet-primary)', marginBottom: '0.4rem', lineHeight: 1.3 }}>
                {course.title}
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#64748b', marginBottom: '1rem', lineHeight: 1.45 }}>
                {course.description}
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.78rem', color: '#475569', marginBottom: '1rem', padding: '0.6rem 0.8rem', background: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
                <span>📅 <strong>{course.total_planned_classes} Sessions</strong></span>
                <span>🎓 <strong>{course.evaluation_type.replace('_', ' ')}</strong></span>
                {course.payment_policy && (
                  <span>💳 <strong>{course.payment_policy.replace(/_/g, ' ')}</strong></span>
                )}
              </div>
            </div>

            <button
              className="btn btn-primary btn-block"
              onClick={() => onSelectCourse(course)}
            >
              <span>Register for this Course</span>
              <ArrowRight size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
