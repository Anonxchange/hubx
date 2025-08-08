import React, { useState, useEffect } from 'react';

const AGE_GATE_KEY = 'hubx_age_verified';

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
    padding: '1rem',
    color: '#fff',
  },
  modal: {
    backgroundColor: '#222',
    padding: '2rem',
    borderRadius: '8px',
    maxWidth: '600px',
    textAlign: 'center' as const,
  },
  logo: {
    width: 120,
    marginBottom: 20,
    objectFit: 'contain' as const,
  },
  acceptBtn: {
    backgroundColor: '#4caf50',
    color: '#fff',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  rejectBtn: {
    backgroundColor: '#f44336',
    color: '#fff',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  buttonsContainer: {
    marginTop: 20,
    display: 'flex',
    justifyContent: 'space-between',
  },
};

function AgeVerificationModal({
  onAccept,
  onReject,
}: {
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <img
          src="/your-logo.png" // replace with your logo path
          alt="HubX Logo"
          style={styles.logo}
        />

        <h2>18+ Age Verification</h2>
        <p>
          This website contains age-restricted materials including nudity and explicit
          depictions of sexual activity. By entering, you affirm that you are at least 18
          years of age or the age of majority in your jurisdiction and consent to viewing
          sexually explicit content.
        </p>
        <p>
          Our Terms are changing. These changes will or have come into effect on 30 June
          2025. To see the updated changes, please see our{' '}
          <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#4caf50' }}>
            New Terms of Service
          </a>
          .
        </p>
        <p>
          Our parental controls page explains how you can easily block access to this site.
        </p>
        <p>© Hubxvideo.com, 2025</p>
        <div style={styles.buttonsContainer}>
          <button onClick={onReject} style={styles.rejectBtn}>
            I am under 18
          </button>
          <button onClick={onAccept} style={styles.acceptBtn}>
            I am 18 or older — Enter
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AgeGateWrapper({ children }: { children: React.ReactNode }) {
  const [ageVerified, setAgeVerified] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(AGE_GATE_KEY);
    if (stored === 'true') {
      setAgeVerified(true);
    } else {
      setAgeVerified(false);
    }
  }, []);

  function handleAccept() {
    localStorage.setItem(AGE_GATE_KEY, 'true');
    setAgeVerified(true);
  }

  function handleReject() {
    // Redirect under 18 users away
    window.location.href = 'https://www.google.com';
  }

  if (ageVerified === null) {
    // Can show spinner or null while loading
    return null;
  }

  if (!ageVerified) {
    return <AgeVerificationModal onAccept={handleAccept} onReject={handleReject} />;
  }

  return <>{children}</>;
}
