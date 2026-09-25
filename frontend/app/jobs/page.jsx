'use client';

import { useState, useEffect, useMemo } from 'react';
import { Briefcase, MapPin, Clock, Calendar, Globe, Search, ArrowRight, ExternalLink, X } from 'lucide-react';
import { T } from '@/lib/lms-data';
import { useMediaQuery, isMobileMQ } from '@/lib/useMediaQuery';
import { getJobs } from '@/lib/frappe';
import PacmanPagination from '@/components/PacmanPagination';
import './jobs.css';

const PAGE_SIZE = 3;

export default function StudentJobsPage() {
  const isMobile = useMediaQuery(isMobileMQ);

  // States
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Selected Job for Detail Modal
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    async function loadJobs() {
      try {
        setLoading(true);
        const list = await getJobs();
        // Students only see open positions
        setJobs(list.filter(j => j.status === 'Open'));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, []);

  // Filter logic
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (job.description && job.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesMode = filterMode === 'All' || job.work_mode === filterMode;
      const matchesType = filterType === 'All' || job.type === filterType;

      return matchesSearch && matchesMode && matchesType;
    });
  }, [jobs, searchTerm, filterMode, filterType]);

  // Reset to page 1 on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterMode, filterType]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE));
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredJobs.slice(start, start + PAGE_SIZE);
  }, [filteredJobs, currentPage]);

  return (
    <div style={{
      height: 'calc(100vh - 54px)',
      maxHeight: 'calc(100vh - 54px)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      padding: isMobile ? '16px' : '24px 32px 16px 32px',
      maxWidth: 1320,
      margin: '0 auto',
      width: '100%',
      boxSizing: 'border-box',
      fontFamily: 'var(--font-outfit), sans-serif'
    }}>
      {/* Header */}
      <div style={{ marginBottom: 14, flexShrink: 0 }}>
        <h1 style={{ color: T.text, fontSize: isMobile ? 20 : 25, fontWeight: 700, margin: 0, letterSpacing: '-0.03em' }}>
          Career Opportunities
        </h1>
        <p style={{ color: T.muted, fontSize: 13, margin: '2px 0 0' }}>
          Explore full-time, part-time, and remote jobs posted by partner organizations.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        background: T.s1,
        border: `1px solid ${T.border}`,
        borderRadius: 12,
        padding: '10px 14px',
        marginBottom: 16,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'center',
        flexShrink: 0
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
            <Search size={15} color={T.muted} />
          </span>
          <input
            type="text"
            placeholder="Search job titles, skills, or companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              background: T.s2,
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              padding: '8px 12px 8px 36px',
              color: T.text,
              fontSize: 13,
              fontFamily: 'inherit',
              outline: 'none'
            }}
          />
        </div>

        {/* Work Mode Filter */}
        <select
          value={filterMode}
          onChange={(e) => setFilterMode(e.target.value)}
          style={{
            background: T.s2,
            border: `1px solid ${T.border}`,
            borderRadius: 8,
            padding: '8px 12px',
            color: T.text,
            fontSize: 13,
            outline: 'none',
            fontFamily: 'inherit',
            minWidth: 130
          }}
        >
          <option value="All">All Work Modes</option>
          <option value="Remote">Remote</option>
          <option value="Hybrid">Hybrid</option>
          <option value="On-site">On-site</option>
        </select>

        {/* Job Type Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{
            background: T.s2,
            border: `1px solid ${T.border}`,
            borderRadius: 8,
            padding: '8px 12px',
            color: T.text,
            fontSize: 13,
            outline: 'none',
            fontFamily: 'inherit',
            minWidth: 130
          }}
        >
          <option value="All">All Job Types</option>
          <option value="Full Time">Full Time</option>
          <option value="Part Time">Part Time</option>
          <option value="Contract">Contract</option>
          <option value="Freelance">Freelance</option>
        </select>
      </div>

      {/* Main List Area: 3 Jobs per row, no vertical scroll */}
      <div style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '2px solid rgba(91, 140, 248, 0.2)',
              borderTopColor: T.accent,
              animation: 'spin 1s linear infinite'
            }} />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div style={{
            background: T.s1,
            border: `1px solid ${T.border}`,
            borderRadius: 14,
            padding: '48px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center'
          }}>
            <Briefcase size={36} color={T.muted} style={{ marginBottom: 12 }} />
            <h3 style={{ color: T.text, fontSize: 16, margin: '0 0 6px 0' }}>No matching career openings</h3>
            <p style={{ color: T.muted, fontSize: 13, maxWidth: 300, margin: 0 }}>
              Try adjusting your keywords or filters to find other jobs.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: 18,
            alignItems: 'stretch',
            width: '100%'
          }}>
            {paginatedJobs.map((job) => {
              const isSelected = selectedJob?.id === job.id;
              return (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className={`animated-job-card ${isSelected ? 'is-selected' : ''}`}
                  style={{
                    background: T.s1,
                    border: `1px solid ${isSelected ? T.accent : T.border}`,
                    borderRadius: 14,
                    padding: '20px 22px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: 180,
                    gap: 16,
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                >
                  {/* Animated curved border beam that smoothly contours around 14px rounded corners */}
                  <div className="animated-curved-border-wrap" />

                  {/* Top content */}
                  <div>
                    <h3 style={{ color: T.text, fontSize: 16, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
                      {job.title}
                    </h3>
                    <div style={{ color: T.accent, fontSize: 13, fontWeight: 600, marginTop: 4, marginBottom: 12 }}>
                      {job.company}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: T.muted, background: T.s2, padding: '3px 8px', borderRadius: 4 }}>
                        <MapPin size={11} color={T.accent} /> {job.location}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: T.muted, background: T.s2, padding: '3px 8px', borderRadius: 4 }}>
                        <Clock size={11} color={T.green} /> {job.type}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: T.muted, background: T.s2, padding: '3px 8px', borderRadius: 4 }}>
                        <Globe size={11} color={T.amber} /> {job.work_mode}
                      </span>
                    </div>
                  </div>

                  {/* Bottom footer row */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: `1px solid ${T.border}`,
                    paddingTop: 12,
                    marginTop: 4
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: T.muted }}>
                      <Calendar size={12} />
                      <span>{job.date || 'Recently'}</span>
                    </div>

                    <span style={{
                      color: T.accent,
                      fontSize: 12,
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      View Details <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pacman Pagination Footer */}
      {!loading && filteredJobs.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: 12,
          paddingBottom: 6,
          flexShrink: 0
        }}>
          <PacmanPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}

      {/* Details Modal */}
      {selectedJob && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(7, 8, 15, 0.85)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16
        }}>
          <div style={{
            background: T.s1,
            border: `1px solid ${T.border}`,
            borderRadius: 16,
            width: '100%',
            maxWidth: 580,
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: `1px solid ${T.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 16
            }}>
              <div>
                <h2 style={{ margin: 0, color: T.text, fontSize: 18, fontWeight: 700, lineHeight: 1.3 }}>
                  {selectedJob.title}
                </h2>
                <div style={{ color: T.accent, fontSize: 14, fontWeight: 600, marginTop: 4 }}>
                  {selectedJob.company}
                </div>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.muted, padding: 0 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable details */}
            <div style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Meta details list */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                background: T.s2,
                padding: 14,
                borderRadius: 8,
                border: `1px solid ${T.border}`
              }}>
                <div style={{ fontSize: 12.5, color: T.muted }}>
                  Location: <strong style={{ color: T.text, marginLeft: 4 }}>{selectedJob.location}</strong>
                </div>
                <div style={{ fontSize: 12.5, color: T.muted }}>
                  Job Type: <strong style={{ color: T.text, marginLeft: 4 }}>{selectedJob.type}</strong>
                </div>
                <div style={{ fontSize: 12.5, color: T.muted }}>
                  Work Mode: <strong style={{ color: T.text, marginLeft: 4 }}>{selectedJob.work_mode}</strong>
                </div>
                <div style={{ fontSize: 12.5, color: T.muted }}>
                  Posted Date: <strong style={{ color: T.text, marginLeft: 4 }}>{selectedJob.date}</strong>
                </div>
              </div>

              {/* Description body */}
              <div>
                <h4 style={{ color: T.text, fontSize: 13.5, fontWeight: 700, margin: '0 0 8px 0' }}>Job Description</h4>
                <div
                  style={{
                    color: T.text,
                    fontSize: 13.5,
                    lineHeight: 1.6,
                    fontFamily: 'inherit'
                  }}
                  dangerouslySetInnerHTML={{ __html: selectedJob.description || '<p>No description provided for this job.</p>' }}
                />
              </div>
            </div>

            {/* Footer with actions */}
            <div style={{
              padding: '16px 24px',
              borderTop: `1px solid ${T.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                {selectedJob.company_website && (
                  <a
                    href={selectedJob.company_website}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: T.muted,
                      fontSize: 12,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    Visit company website <ExternalLink size={12} />
                  </a>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setSelectedJob(null)}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${T.border}`,
                    color: T.text,
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontSize: 12.5,
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
                <a
                  href={`mailto:careers@${selectedJob.company.toLowerCase().replace(/\s+/g, '')}.com?subject=Application for ${selectedJob.title}`}
                  style={{
                    background: T.accent,
                    color: '#fff',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  Apply Now
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
