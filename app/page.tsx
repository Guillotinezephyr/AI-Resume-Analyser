'use client';

import { useState, useRef } from 'react';
import styles from './page.module.css';

type AnalysisResult = {
  atsScore?: number;
  feedback?: string;
  keywords?: string[];
  error?: string;
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setLoading(true);
    setResult(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze resume');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const encodedKeywords = result?.keywords ? encodeURIComponent(result.keywords.join(' ')) : '';

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>AI Resume Analyser</h1>
        <p className={styles.subtitle}>
          Get an instant ATS score and tailored job search links. (No data is saved)
        </p>
      </header>

      <section className={styles.uploadSection}>
        <input
          type="file"
          accept=".pdf,.docx"
          ref={fileInputRef}
          onChange={handleFileChange}
          className={styles.fileInput}
        />
        <button
          className={styles.uploadButton}
          onClick={handleUploadClick}
          disabled={loading}
        >
          {file ? 'Change File' : 'Select Resume (.pdf, .docx)'}
        </button>
        {file && <div className={styles.fileName}>{file.name}</div>}
        {error && <div className={styles.error}>{error}</div>}

        {file && !loading && (
          <div style={{ marginTop: '20px' }}>
            <button className={styles.uploadButton} onClick={handleAnalyze}>
              Analyze Resume
            </button>
          </div>
        )}

        {loading && <div className={styles.loading}>Analyzing your resume... This might take a few seconds.</div>}
      </section>

      {result && !error && (
        <>
          <section className={styles.resultsSection}>
            <div className={styles.scoreContainer}>
              <div className={styles.scoreLabel}>ATS Score:</div>
              <div className={styles.scoreValue}>{result.atsScore}/10</div>
            </div>

            <div className={styles.feedbackTitle}>Feedback</div>
            <p className={styles.feedbackText}>{result.feedback}</p>

            <div className={styles.feedbackTitle}>Extracted Keywords</div>
            <div className={styles.keywordsContainer}>
              {result.keywords?.map((keyword, index) => (
                <span key={index} className={styles.keyword}>
                  {keyword}
                </span>
              ))}
            </div>
          </section>

          <section className={styles.actionsSection}>
            <div className={styles.actionCard}>
              <h2 className={styles.actionCardTitle}>Search Jobs</h2>
              <p style={{ marginBottom: '15px', color: '#666', fontSize: '0.9rem' }}>
                Search for jobs using your extracted keywords.
              </p>
              <a
                href={`https://www.linkedin.com/jobs/search/?keywords=${encodedKeywords}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.actionButton}
              >
                Search on LinkedIn
              </a>
              <a
                href={`https://www.indeed.com/jobs?q=${encodedKeywords}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.actionButton}
              >
                Search on Indeed
              </a>
              <a
                href={`https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodedKeywords}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.actionButton}
              >
                Search on Glassdoor
              </a>
            </div>

            <div className={styles.actionCard}>
              <h2 className={styles.actionCardTitle}>Update Profile</h2>
              <p style={{ marginBottom: '15px', color: '#666', fontSize: '0.9rem' }}>
                Update your resume directly on these job boards.
              </p>
              <a
                href="https://www.linkedin.com/in/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.actionButton}
              >
                LinkedIn Profile
              </a>
              <a
                href="https://profile.indeed.com/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.actionButton}
              >
                Indeed Profile
              </a>
              <a
                href="https://www.glassdoor.com/profile/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.actionButton}
              >
                Glassdoor Profile
              </a>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
