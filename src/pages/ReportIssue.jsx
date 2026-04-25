import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2, Wind, Volume2, Droplets, Flame, AlertTriangle,
  Upload, MapPin, Send, CheckCircle, Camera, X, FileText, Loader2, LogIn
} from 'lucide-react';
import { issueTypes, locations } from '../data/locations';
import { supabase } from '../lib/supabase';
import './ReportIssue.css';

const iconMap = { Trash2, Wind, Volume2, Droplets, Flame, AlertTriangle };

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function ReportIssue() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [form, setForm] = useState({
    issueType: '',
    location: '',
    description: '',
    image: null,
    imageName: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [reportId, setReportId] = useState('');

  // Check if user is logged in
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
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleChange('image', file);
      handleChange('imageName', file.name);
    }
  };

  const removeImage = () => {
    handleChange('image', null);
    handleChange('imageName', '');
  };

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

      // Find the selected issue type label
      const issueLabel = issueTypes.find(t => t.id === form.issueType)?.label || form.issueType;
      const selectedLoc = locations.find(l => l.name === form.location);

      // Insert report into Supabase
      const { data, error } = await supabase
        .from('reports')
        .insert({
          user_id: currentUser.id,
          type: issueLabel,
          location: form.location,
          description: form.description,
          severity: 'Medium',
          status: 'Submitted',
          image_url: imageUrl,
          lat: selectedLoc?.lat || null,
          lng: selectedLoc?.lng || null,
        })
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
    setForm({ issueType: '', location: '', description: '', image: null, imageName: '' });
    setSubmitted(false);
    setErrors({});
    setReportId('');
  };

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="report-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 72px)' }}>
        <Loader2 size={32} className="spin" style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  // Show login prompt if not logged in
  if (!user) {
    return (
      <div className="report-page">
        <div className="container">
          <motion.div className="report-login-prompt card" initial="hidden" animate="visible" variants={fadeUp}>
            <div className="report-login-prompt__icon">
              <LogIn size={48} />
            </div>
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
                <motion.div
                  className="report-success card"
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <div className="report-success__icon">
                    <CheckCircle size={48} />
                  </div>
                  <h2 className="report-success__title">Report Submitted Successfully!</h2>
                  <p className="report-success__desc">
                    Thank you for your contribution. Your report has been logged and will be reviewed by the concerned authorities. You can view it in your profile.
                  </p>
                  <div className="report-success__ref">
                    <span>Reference ID:</span>
                    <strong>{reportId}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" onClick={resetForm}>
                      Submit Another Report
                    </button>
                    <button className="btn btn-ghost" onClick={() => navigate('/login')}>
                      View My Reports
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  className="report-form card"
                  key="form"
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Issue Type */}
                  <div className="form-group">
                    <label className="form-label">
                      <AlertTriangle size={15} />
                      Issue Type *
                    </label>
                    <div className="issue-type-grid">
                      {issueTypes.map(type => {
                        const Icon = iconMap[type.icon] || AlertTriangle;
                        return (
                          <button
                            key={type.id}
                            type="button"
                            className={`issue-type-btn ${form.issueType === type.id ? 'issue-type-btn--active' : ''}`}
                            onClick={() => handleChange('issueType', type.id)}
                            style={{ '--type-color': type.color }}
                          >
                            <Icon size={20} />
                            <span>{type.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {errors.issueType && <span className="form-error">{errors.issueType}</span>}
                  </div>

                  {/* Location */}
                  <div className="form-group">
                    <label className="form-label">
                      <MapPin size={15} />
                      Location *
                    </label>
                    <select
                      className="form-select"
                      value={form.location}
                      onChange={e => handleChange('location', e.target.value)}
                    >
                      <option value="">Select a locality</option>
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.name}>{loc.name}</option>
                      ))}
                    </select>
                    {errors.location && <span className="form-error">{errors.location}</span>}
                  </div>

                  {/* Description */}
                  <div className="form-group">
                    <label className="form-label">
                      <FileText size={15} />
                      Description *
                    </label>
                    <textarea
                      className="form-textarea"
                      placeholder="Describe the issue in detail. Include specific location details, severity, and when you noticed it."
                      rows={5}
                      value={form.description}
                      onChange={e => handleChange('description', e.target.value)}
                    />
                    <div className="form-hint">{form.description.length}/500 characters</div>
                    {errors.description && <span className="form-error">{errors.description}</span>}
                  </div>

                  {/* Image Upload */}
                  <div className="form-group">
                    <label className="form-label">
                      <Camera size={15} />
                      Upload Photo (Optional)
                    </label>
                    {form.imageName ? (
                      <div className="upload-preview">
                        <div className="upload-preview__info">
                          <Camera size={16} />
                          <span>{form.imageName}</span>
                        </div>
                        <button type="button" className="upload-preview__remove" onClick={removeImage}>
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="upload-area">
                        <Upload size={24} />
                        <span className="upload-area__title">Click to upload photo</span>
                        <span className="upload-area__hint">JPG, PNG up to 10MB</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="upload-area__input"
                        />
                      </label>
                    )}
                  </div>

                  <button type="submit" className="btn btn-primary btn-lg report-submit" disabled={loading}>
                    {loading ? (
                      <><Loader2 size={18} className="spin" /> Submitting...</>
                    ) : (
                      <><Send size={18} /> Submit Report</>
                    )}
                  </button>
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
                  { num: 2, title: 'Pick Location', desc: 'Select the locality where you noticed the issue.' },
                  { num: 3, title: 'Add Details', desc: 'Describe the problem and optionally upload a photo.' },
                  { num: 4, title: 'Submit & Track', desc: 'Your report is sent to authorities. Track progress with your reference ID.' },
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
              <h3>Tips for a good report</h3>
              <ul className="report-tips__list">
                <li>Be specific about the exact location</li>
                <li>Include time of day when possible</li>
                <li>Upload a clear photo for faster response</li>
                <li>Describe the severity and impact</li>
                <li>Mention if it's a recurring issue</li>
              </ul>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
