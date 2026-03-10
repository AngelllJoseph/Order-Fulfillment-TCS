// Placeholder for Profile
import React from 'react';

const Profile = ({ colors }) => {
    return (
        <div style={{ padding: '2rem', background: colors.cardBg, borderRadius: '1rem', border: `1px solid ${colors.border}` }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>My Profile</h2>
            <p style={{ color: colors.textMuted }}>User profile and settings.</p>
        </div>
    );
};

export default Profile;
