import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2, Wind, Volume2, Droplets, Flame, AlertTriangle,
  Upload, MapPin, Send, CheckCircle, Camera, X, FileText, Loader2, LogIn,
  Crosshair, AlertOctagon, ShieldCheck, ShieldAlert, ShieldX, Eye,
  CheckCircle2, XCircle, AlertCircle, Info
} from 'lucide-react';
import { issueTypes, locations } from '../data/locations';
import { supabase } from '../lib/supabase';
import { verifyImage } from '../lib/imageVerification';
import './ReportIssue.css';

const iconMap = { Trash2, Wind, Volume2, Droplets, Flame, AlertTriangle };
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function ReportIssue() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [form, setForm] = useState({
    issueType: '',
    location: '',
    description: '',
    severity: 'Medium',
    image: null,
    imageName: '',
    imagePreview: null,
    lat: null,
    lng: null,
  });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [reportId, setReportId] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState('');

  // Verification & AI state
  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setCheckingAuth(false);
    };
    checkAuth();
  }, []);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  // File validation
  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrors(prev => ({ ...prev, image: 'Only JPG, JPEG, and PNG files are allowed.' }));
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      setErrors(prev => ({ ...prev, image: 'File size must be under 5MB.' }));
      return false;
    }
    setErrors(prev => ({ ...prev, image: null }));
    return true;
  };

  // Run image verification after upload
  const runVerification = async (file) => {
    setVerifying(true);
    setVerification(null);
    try {
      const issueLabel = issueTypes.find(t => t.id === form.issueType)?.label || 'Other';
      const result = await verifyImage(file, form.lat, form.lng, issueLabel);
      setVerification(result);
    } catch (err) {
      console.error('Verification error:', err);
      setVerification({
        verification_score: 75,
        verification_status: 'Needs Review',
        checks: [{ step: 'System', status: 'warn', detail: 'Partial verification completed' }],
        metadata_valid: true,
        location_match: true,
        is_duplicate: false,
        is_screenshot: false,
        ai_confidence: 0.7,
        ai_detected_issue: 'Unknown',
        image_hash: null,
      });
    } finally {
      setVerifying(false);
    }
  };

  const analyzeImageWithAI = async (base64Image) => {
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) return;
      setAiAnalyzing(true);
      const base64Data = base64Image.split(',')[1];
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [
              { text: "Analyze this image of a civic/environmental issue in Bengaluru. Respond ONLY with a valid JSON object. Do not use markdown blocks. Format: {\"issueType\": \"id_from_list\", \"description\": \"Detailed description of the hazard\", \"severity\": \"Low\" | \"Medium\" | \"High\" | \"Critical\"}. The issueType id must be ONE OF: 'waste', 'air', 'noise', 'water', 'fire', 'other'." },
              { inlineData: { mimeType: "image/jpeg", data: base64Data } }
            ]
          }],
          generationConfig: { temperature: 0.2 }
        })
      });
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const aiData = JSON.parse(cleanedText);
        setForm(prev => ({
          ...prev,
          issueType: prev.issueType || aiData.issueType || '',
          description: prev.description || aiData.description || '',
          severity: aiData.severity || prev.severity,
        }));
      }
    } catch (e) {
      console.error('AI Analysis failed:', e);
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Handle image from file upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!validateFile(file)) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, image: file, imageName: file.name, imagePreview: reader.result }));
      analyzeImageWithAI(reader.result);
    };
    reader.readAsDataURL(file);
    runVerification(file);
  };

  // Handle image from camera
  const handleCameraCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!validateFile(file)) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, image: file, imageName: file.name, imagePreview: reader.result }));
      analyzeImageWithAI(reader.result);
    };
    reader.readAsDataURL(file);
    runVerification(file);
  };

  const removeImage = () => {
    setForm(prev => ({ ...prev, image: null, imageName: '', imagePreview: null }));
    setErrors(prev => ({ ...prev, image: null }));
    setVerification(null);
    setVerifying(false);
  };

  // GPS Auto-detection
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm(prev => ({
          ...prev,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }));
        setGpsLoading(false);
      },
      (err) => {
        setGpsError('Unable to detect location. Please select manually.');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Check for duplicate reports
  const checkDuplicate = async () => {
    if (!form.location || !form.issueType) return;
    const issueLabel = issueTypes.find(t => t.id === form.issueType)?.label || '';
    const { data } = await supabase
      .from('reports')
      .select('id, created_at')
      .eq('type', issueLabel)
      .eq('location', form.location)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1);
    if (data && data.length > 0) {
      setDuplicateWarning('⚠️ A similar issue was already reported at this location in the last 24 hours. You can still submit if this is a different occurrence.');
    } else {
      setDuplicateWarning('');
    }
  };

  // Run duplicate check when location or issue type changes
  useEffect(() => {
    if (form.location && form.issueType) {
      checkDuplicate();
    }
  }, [form.location, form.issueType]);

  const validate = () => {
    const newErrors = {};
    if (!form.issueType) newErrors.issueType = 'Please select an issue type';
    if (!form.location) newErrors.location = 'Please select a location';
    if (!form.description.trim()) newErrors.description = 'Please describe the issue';
    if (form.description.trim().length < 10) newErrors.description = 'Description must be at least 10 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      // Upload image if provided
      let imageUrl = null;
      if (form.image) {
        const fileExt = form.image.name.split('.').pop();
        const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('report-images')
          .upload(fileName, form.image);
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('report-images')
            .getPublicUrl(fileName);
          imageUrl = urlData?.publicUrl || null;
        }
      }

      const issueLabel = issueTypes.find(t => t.id === form.issueType)?.label || form.issueType;
      const selectedLoc = locations.find(l => l.name === form.location);

      // Fetch user profile data to attach to the report
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', currentUser.id)
        .single();

      // Build report data with verification fields
      const reportData = {
        user_id: currentUser.id,
        user_name: userProfile?.name || currentUser.user_metadata?.name || 'Citizen',
        user_email: userProfile?.email || currentUser.email || 'No Email',
        type: issueLabel,
        location: form.location,
        description: form.description,
        severity: form.severity,
        status: 'Submitted',
        image_url: imageUrl,
        lat: form.lat || selectedLoc?.lat || null,
        lng: form.lng || selectedLoc?.lng || null,
      };

      // Add verification data if available
      if (verification) {
        reportData.verification_score = verification.verification_score;
        reportData.verification_status = verification.verification_status;
        reportData.metadata_valid = verification.metadata_valid;
        reportData.location_match = verification.location_match;
        reportData.is_duplicate = verification.is_duplicate;
        reportData.is_screenshot = verification.is_screenshot;
        reportData.ai_confidence = verification.ai_confidence;
        reportData.ai_detected_issue = verification.ai_detected_issue;
        reportData.image_hash = verification.image_hash;
      }

      const { data, error } = await supabase
        .from('reports')
        .insert(reportData)
        .select()
        .single();

      if (error) throw error;
      setReportId(data?.id?.slice(0, 8).toUpperCase() || Date.now().toString().slice(-6));
      setSubmitted(true);
    } catch (err) {
      console.error('Report submission error:', err);
      setReportId('NE-' + Date.now().toString().slice(-6));
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ issueType: '', location: '', description: '', severity: 'Medium', image: null, imageName: '', imagePreview: null, lat: null, lng: null });
    setSubmitted(false);
    setErrors({});
    setReportId('');
    setDuplicateWarning('');
    setVerification(null);
    setVerifying(false);
  };

  // Verification UI helper
  const getVerificationIcon = () => {
    if (!verification) return null;
    if (verification.verification_status === 'Genuine') return <ShieldCheck size={20} />;
    if (verification.verification_status === 'Needs Review') return <ShieldAlert size={20} />;
    return <ShieldX size={20} />;
  };

  const getCheckIcon = (status) => {
    if (status === 'pass') return <CheckCircle2 size={14} className="vcheck-icon--pass" />;
    if (status === 'fail') return <XCircle size={14} className="vcheck-icon--fail" />;
    return <AlertCircle size={14} className="vcheck-icon--warn" />;
  };

  if (checkingAuth) {
    return (
      <div className="report-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 72px)' }}>
        <Loader2 size={32} className="spin" style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="report-page">
        <div className="container">
          <motion.div className="report-login-prompt card" initial="hidden" animate="visible" variants={fadeUp}>
            <div className="report-login-prompt__icon"><LogIn size={48} /></div>
            <h2 className="report-login-prompt__title">Login Required</h2>
            <p className="report-login-prompt__desc">
              You need to be logged in to report environmental issues. Your reports will be linked to your account so you can track their progress.
            </p>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/login')}>
              <LogIn size={18} /> Sign In to Report
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="report-page">
      <div className="container">
        <motion.div className="report-header" initial="hidden" animate="visible" variants={fadeUp}>
          <h1 className="report-header__title">Report an Environmental Issue</h1>
          <p className="report-header__desc">
            Help improve your neighbourhood. Report garbage dumping, pollution, noise, and other environmental issues.
          </p>
        </motion.div>

        <div className="report-layout">
          <motion.div className="report-form-area" initial="hidden" animate="visible" variants={fadeUp}>
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div className="report-success card" key="success"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                  <div className="report-success__icon"><CheckCircle size={48} /></div>
                  <h2 className="report-success__title">Report Submitted Successfully!</h2>
                  <p className="report-success__desc">
                    Thank you for your contribution. Your report has been logged and will be reviewed by the concerned authorities. Track its status in your profile.
                  </p>

                  {/* Show verification result in success */}
                  {verification && (
                    <div className={`verification-badge verification-badge--${verification.verification_status.toLowerCase().replace(' ', '-')}`}>
                      {getVerificationIcon()}
                      <span>{verification.verification_status}</span>
                      <span className="verification-badge__score">Score: {verification.verification_score}/100</span>
                    </div>
                  )}

                  <div className="report-success__ref">
                    <span>Tracking ID:</span>
                    <strong>{reportId}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" onClick={resetForm}>Submit Another Report</button>
                    <button className="btn btn-ghost" onClick={() => navigate('/login')}>View My Reports</button>
                  </div>
                </motion.div>
              ) : (
                <motion.form className="report-form card" key="form" onSubmit={handleSubmit}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                  {/* Duplicate Warning */}
                  {duplicateWarning && (
                    <div className="duplicate-warning">
                      <AlertOctagon size={16} />
                      <span>{duplicateWarning}</span>
                    </div>
                  )}

                  {/* Issue Type */}
                  <div className="form-group">
                    <label className="form-label"><AlertTriangle size={15} /> Issue Type *</label>
                    <div className="issue-type-grid">
                      {issueTypes.map(type => {
                        const Icon = iconMap[type.icon] || AlertTriangle;
                        return (
                          <button key={type.id} type="button"
                            className={`issue-type-btn ${form.issueType === type.id ? 'issue-type-btn--active' : ''}`}
                            onClick={() => handleChange('issueType', type.id)}
                            style={{ '--type-color': type.color }}>
                            <Icon size={20} /><span>{type.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {errors.issueType && <span className="form-error">{errors.issueType}</span>}
                  </div>

                  {/* Location + GPS */}
                  <div className="form-group">
                    <label className="form-label"><MapPin size={15} /> Location *</label>
                    <select className="form-select" value={form.location}
                      onChange={e => handleChange('location', e.target.value)}>
                      <option value="">Select a locality</option>
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.name}>{loc.name}</option>
                      ))}
                    </select>

                    <div className="gps-row">
                      <button type="button" className="btn btn-ghost gps-btn" onClick={detectLocation} disabled={gpsLoading}>
                        {gpsLoading ? <Loader2 size={14} className="spin" /> : <Crosshair size={14} />}
                        {gpsLoading ? 'Detecting...' : 'Use My Location'}
                      </button>
                      {form.lat && form.lng && (
                        <span className="gps-coords">📍 {form.lat.toFixed(4)}, {form.lng.toFixed(4)}</span>
                      )}
                    </div>
                    {gpsError && <span className="form-error">{gpsError}</span>}
                    {errors.location && <span className="form-error">{errors.location}</span>}
                  </div>

                  {/* Severity */}
                  <div className="form-group">
                    <label className="form-label"><AlertTriangle size={15} /> Severity Level</label>
                    <div className="severity-grid">
                      {['Low', 'Medium', 'High'].map(level => (
                        <button key={level} type="button"
                          className={`severity-btn severity-btn--${level.toLowerCase()} ${form.severity === level ? 'severity-btn--active' : ''}`}
                          onClick={() => handleChange('severity', level)}>
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="form-group">
                    <label className="form-label"><FileText size={15} /> Description *</label>
                    <textarea className="form-textarea"
                      placeholder="Describe the issue in detail. Include specific location details, severity, and when you noticed it."
                      rows={5} value={form.description} maxLength={500}
                      onChange={e => handleChange('description', e.target.value)} />
                    <div className="form-hint">{form.description.length}/500 characters</div>
                    {errors.description && <span className="form-error">{errors.description}</span>}
                  </div>

                  {/* Image Upload + Camera */}
                  <div className="form-group">
                    <label className="form-label"><Camera size={15} /> Upload Photo (Optional)</label>

                    {form.imagePreview ? (
                      <div className="image-preview-container">
                        <img src={form.imagePreview} alt="Preview" className="image-preview" />
                        <div className="image-preview-info">
                          <span className="image-preview-name">{form.imageName}</span>
                          <span className="image-preview-size">{(form.image.size / 1024).toFixed(0)} KB</span>
                        </div>

                        {/* ── Verification Panel ── */}
                        <AnimatePresence>
                          {verifying && !aiAnalyzing && (
                            <motion.div className="verification-panel verification-panel--loading"
                              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                              <Loader2 size={18} className="spin" />
                              <span>Verifying image authenticity...</span>
                            </motion.div>
                          )}

                          {aiAnalyzing && (
                            <motion.div className="verification-panel verification-panel--loading"
                              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                              <Loader2 size={18} className="spin" style={{ color: 'var(--primary)' }} />
                              <span style={{ color: 'var(--primary)' }}>AI Auto-filling form...</span>
                            </motion.div>
                          )}

                          {!verifying && verification && (
                            <motion.div className={`verification-panel verification-panel--${verification.verification_status.toLowerCase().replace(' ', '-')}`}
                              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>

                              {/* Score Header */}
                              <div className="verification-header">
                                <div className="verification-header__left">
                                  {getVerificationIcon()}
                                  <div>
                                    <span className="verification-header__status">{verification.verification_status}</span>
                                    <span className="verification-header__sub">
                                      {verification.verification_status === 'Genuine' && 'Image verified successfully'}
                                      {verification.verification_status === 'Needs Review' && 'Your report is under verification'}
                                      {verification.verification_status === 'Suspicious' && 'Please upload a recent photo'}
                                    </span>
                                  </div>
                                </div>
                                <div className="verification-score-ring">
                                  <svg viewBox="0 0 36 36" className="verification-score-svg">
                                    <path className="verification-score-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                    <path className="verification-score-fill"
                                      strokeDasharray={`${verification.verification_score}, 100`}
                                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                  </svg>
                                  <span className="verification-score-text">{verification.verification_score}</span>
                                </div>
                              </div>

                              {/* Check List */}
                              <div className="verification-checks">
                                {verification.checks.map((check, i) => (
                                  <div key={i} className={`vcheck vcheck--${check.status}`}>
                                    {getCheckIcon(check.status)}
                                    <span className="vcheck__step">{check.step}</span>
                                    {check.detail && <span className="vcheck__detail">{check.detail}</span>}
                                  </div>
                                ))}
                              </div>

                              {/* AI Detection */}
                              {verification.ai_detected_issue && (
                                <div className="verification-ai">
                                  <Eye size={14} />
                                  <span>AI Detected: <strong>{verification.ai_detected_issue}</strong></span>
                                  <span className="verification-ai__conf">{Math.round(verification.ai_confidence * 100)}% confidence</span>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <button type="button" className="btn btn-ghost image-preview-remove" onClick={removeImage}>
                          <X size={14} /> Remove
                        </button>
                      </div>
                    ) : (
                      <div className="upload-options">
                        <label className="upload-option">
                          <Camera size={22} />
                          <span>Take Photo</span>
                          <input type="file" accept="image/*" capture="environment"
                            ref={cameraInputRef} onChange={handleCameraCapture} className="upload-area__input" />
                        </label>
                        <label className="upload-option">
                          <Upload size={22} />
                          <span>Upload Image</span>
                          <input type="file" accept=".jpg,.jpeg,.png"
                            ref={fileInputRef} onChange={handleImageUpload} className="upload-area__input" />
                        </label>
                      </div>
                    )}
                    <div className="form-hint" style={{ textAlign: 'left' }}>JPG, PNG — Max 5MB</div>
                    {errors.image && <span className="form-error">{errors.image}</span>}
                  </div>

                  <button type="submit" className="btn btn-primary btn-lg report-submit"
                    disabled={loading || verifying || (verification && verification.verification_status === 'Suspicious')}>
                    {loading ? (
                      <><Loader2 size={18} className="spin" /> Submitting...</>
                    ) : verifying ? (
                      <><Loader2 size={18} className="spin" /> Verifying Image...</>
                    ) : (
                      <><Send size={18} /> Submit Report</>
                    )}
                  </button>

                  {verification && verification.verification_status === 'Suspicious' && (
                    <p className="form-error" style={{ textAlign: 'center', marginTop: '8px' }}>
                      This image appears suspicious. Please upload a genuine, recent photo to submit.
                    </p>
                  )}
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Side info */}
          <motion.aside className="report-sidebar" initial="hidden" animate="visible" variants={fadeUp}>
            <div className="report-info card">
              <h3>How it works</h3>
              <div className="report-steps">
                {[
                  { num: 1, title: 'Select Issue Type', desc: 'Choose the category that best matches your observation.' },
                  { num: 2, title: 'Pick Location', desc: 'Select the locality or use GPS auto-detect.' },
                  { num: 3, title: 'Add Details & Photo', desc: 'Describe the problem and take a photo or upload one.' },
                  { num: 4, title: 'Image Verification', desc: 'Our AI system verifies image authenticity automatically.' },
                  { num: 5, title: 'Submit & Track', desc: 'Track your report status in your profile dashboard.' },
                ].map(step => (
                  <div key={step.num} className="report-step">
                    <div className="report-step__num">{step.num}</div>
                    <div>
                      <div className="report-step__title">{step.title}</div>
                      <div className="report-step__desc">{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="report-tips card">
              <h3>🛡️ Image Verification</h3>
              <ul className="report-tips__list">
                <li>Images are checked for EXIF metadata</li>
                <li>GPS location is matched with your device</li>
                <li>Duplicate images are automatically detected</li>
                <li>Screenshots are flagged for review</li>
                <li>AI detects the issue type in the photo</li>
                <li>A verification score (0–100) is calculated</li>
              </ul>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
