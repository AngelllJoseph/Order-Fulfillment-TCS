import { useState, useEffect } from 'react';
import { Brain, Save, RefreshCw, Info, ShieldCheck } from 'lucide-react';
import api from '../../services/api';

/**
 * ConfidenceSettingsPage — P3
 * Allows Program Managers to view and update the AI confidence threshold.
 *
 * Backend contract (expected):
 *   GET  /api/ai/settings/confidence-threshold/   → { auto_execute_threshold, hitl_threshold, notes }
 *   POST /api/ai/settings/confidence-threshold/   → { auto_execute_threshold, hitl_threshold }
 *
 * If the endpoint doesn't exist yet, the page degrades gracefully and shows
 * the current hardcoded defaults in read-only mode.
 */
const ConfidenceSettingsPage = ({ colors, darkMode }) => {
    const [loading, setLoading]       = useState(true);
    const [saving, setSaving]         = useState(false);
    const [readonly, setReadonly]     = useState(false);
    const [saved, setSaved]           = useState(false);
    const [error, setError]           = useState(null);

    // Threshold state
    const [autoExec, setAutoExec]     = useState(85);   // % above which AI auto-executes
    const [hitl, setHitl]             = useState(60);   // % below which HITL is required
    const [notes, setNotes]           = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await api.get('/ai/settings/confidence-threshold/');
            const d = res.data;
            setAutoExec(d.auto_execute_threshold ?? 85);
            setHitl(d.hitl_threshold ?? 60);
            setNotes(d.notes ?? '');
        } catch (err) {
            if (err?.response?.status === 404) {
                // Endpoint not yet implemented — treat as read-only defaults
                setReadonly(true);
            } else {
                setError('Failed to load confidence settings.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (readonly) return;
        setSaving(true);
        setSaved(false);
        setError(null);
        try {
            await api.post('/ai/settings/confidence-threshold/', {
                auto_execute_threshold: autoExec,
                hitl_threshold: hitl,
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            setError(err?.response?.data?.detail || 'Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    const ThresholdSlider = ({ label, description, value, onChange, min = 0, max = 100, color }) => (
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '1rem', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                    <div style={{ fontWeight: 700, color: colors.text, fontSize: '0.95rem' }}>{label}</div>
                    <div style={{ fontSize: '0.78rem', color: colors.textMuted, marginTop: '0.2rem' }}>{description}</div>
                </div>
                <div style={{
                    fontSize: '1.75rem', fontWeight: 900, color,
                    minWidth: '3.5rem', textAlign: 'right',
                    lineHeight: 1,
                }}>
                    {value}<span style={{ fontSize: '1rem' }}>%</span>
                </div>
            </div>
            <input
                type="range"
                min={min} max={max} step={1} value={value}
                disabled={readonly}
                onChange={e => onChange(Number(e.target.value))}
                style={{ width: '100%', accentColor: color, height: '6px', cursor: readonly ? 'not-allowed' : 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: colors.textMuted, marginTop: '0.4rem' }}>
                <span>{min}% (Lowest)</span>
                <span>{max}% (Highest)</span>
            </div>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '700px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                <div style={{ padding: '0.6rem', background: `${colors.primary}20`, borderRadius: '0.75rem', color: colors.primary }}>
                    <Brain size={22} />
                </div>
                <div>
                    <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', color: colors.text }}>AI Confidence Threshold Settings</h2>
                    <div style={{ fontSize: '0.8rem', color: colors.textMuted }}>
                        Configure when the AI auto-executes vs. routes to human review (HITL)
                    </div>
                </div>
            </div>

            {/* Info banner */}
            <div style={{
                display: 'flex', gap: '0.75rem', padding: '1rem 1.25rem',
                background: `${colors.primary}10`, border: `1px solid ${colors.primary}30`,
                borderRadius: '0.875rem', fontSize: '0.83rem', color: colors.text,
            }}>
                <Info size={18} color={colors.primary} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                <div>
                    <strong>How thresholds work:</strong> When AI confidence ≥ <strong>Auto-Execute Threshold</strong>, the decision is automatically executed without human review. When confidence &lt; <strong>HITL Threshold</strong>, the decision is always sent to the HITL Approval Center. Values in between are reviewed by the system's rule engine.
                    {readonly && <div style={{ marginTop: '0.5rem', color: '#f59e0b' }}>⚠ Settings endpoint not yet implemented on backend — showing current defaults in read-only mode.</div>}
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: colors.textMuted }}>Loading settings…</div>
            ) : (
                <>
                    {/* Flow diagram */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 1.5rem', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '160px' }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
                            <span style={{ fontSize: '0.8rem', color: colors.text }}><strong>≥ {autoExec}%</strong></span>
                            <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>Auto-execute</span>
                        </div>
                        <div style={{ color: colors.border }}>|</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '160px' }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#6366f1' }} />
                            <span style={{ fontSize: '0.8rem', color: colors.text }}><strong>{hitl}% – {autoExec - 1}%</strong></span>
                            <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>Rule engine review</span>
                        </div>
                        <div style={{ color: colors.border }}>|</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '160px' }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
                            <span style={{ fontSize: '0.8rem', color: colors.text }}><strong>&lt; {hitl}%</strong></span>
                            <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>Always HITL</span>
                        </div>
                    </div>

                    {/* Sliders */}
                    <ThresholdSlider
                        label="Auto-Execute Threshold"
                        description="AI decisions at or above this confidence level are automatically executed without human review."
                        value={autoExec}
                        onChange={v => setAutoExec(Math.max(v, hitl + 1))}
                        color="#10b981"
                    />
                    <ThresholdSlider
                        label="HITL Required Threshold"
                        description="AI decisions below this confidence level are always routed to the HITL Approval Center."
                        value={hitl}
                        onChange={v => setHitl(Math.min(v, autoExec - 1))}
                        color="#ef4444"
                    />

                    {/* Validation warning */}
                    {autoExec - hitl < 10 && (
                        <div style={{ padding: '0.75rem 1rem', background: '#f59e0b15', border: '1px solid #f59e0b40', borderRadius: '0.75rem', fontSize: '0.8rem', color: '#f59e0b' }}>
                            ⚠ Very narrow rule engine band ({autoExec - hitl}%). Consider a wider gap between both thresholds.
                        </div>
                    )}

                    {/* Action bar */}
                    {!readonly && (
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <button onClick={handleSave} disabled={saving}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.5rem', borderRadius: '0.75rem', background: colors.primary, color: '#fff', fontWeight: 700, fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}>
                                {saving ? <RefreshCw size={16} className="spin" /> : <Save size={16} />}
                                {saving ? 'Saving…' : 'Save Settings'}
                            </button>
                            <button onClick={fetchSettings}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1rem', borderRadius: '0.75rem', background: colors.surface, color: colors.text, fontWeight: 600, fontSize: '0.875rem', border: `1px solid ${colors.border}`, cursor: 'pointer' }}>
                                <RefreshCw size={15} /> Reset
                            </button>
                            {saved && <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.85rem' }}>✅ Saved successfully</span>}
                            {error && <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.85rem' }}>{error}</span>}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ConfidenceSettingsPage;
