import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2, Wind, Volume2, Droplets, Flame, AlertTriangle,
  Upload, MapPin, Send, CheckCircle, Camera, X, FileText
} from 'lucide-react';
import { issueTypes, locations } from '../data/locations';
import './ReportIssue.css';

const iconMap = { Trash2, Wind, Volume2, Droplets, Flame, AlertTriangle };

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function ReportIssue() {
  const [form, setForm] = useState({
    issueType: '',
    location: '',
    description: '',
    image: null,
    imageName: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      setSubmitted(true);
    }
  };

  const resetForm = () => {
    setForm({ issueType: '', location: '', description: '', image: null, imageName: '' });
    setSubmitted(false);
    setErrors({});
  };

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
                    Thank you for your contribution. Your report has been logged and will be reviewed by the concerned authorities. You will receive updates on the progress.
                  </p>
                  <div className="report-success__ref">
                    <span>Reference ID:</span>
                    <strong>NE-{Date.now().toString().slice(-6)}</strong>
                  </div>
                  <button className="btn btn-primary" onClick={resetForm}>
                    Submit Another Report
                  </button>
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

                  <button type="submit" className="btn btn-primary btn-lg report-submit">
                    <Send size={18} />
                    Submit Report
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
