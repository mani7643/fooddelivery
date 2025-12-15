import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { driverService } from '../../services/driverService';

export default function UploadDocuments() {
    const navigate = useNavigate();
    const [files, setFiles] = useState({
        aadhaarFront: null,
        aadhaarBack: null,
        dlFront: null,
        dlBack: null,
        panCard: null
    });
    const [previews, setPreviews] = useState({});
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleFileChange = (e, fieldName) => {
        const file = e.target.files[0];

        if (!file) return;

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            setError(`${fieldName} file size must be less than 5MB`);
            return;
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            setError(`${fieldName} must be an image (JPG, PNG) or PDF`);
            return;
        }

        setFiles(prev => ({ ...prev, [fieldName]: file }));

        // Create preview for images
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews(prev => ({ ...prev, [fieldName]: reader.result }));
            };
            reader.readAsDataURL(file);
        } else {
            setPreviews(prev => ({ ...prev, [fieldName]: 'PDF' }));
        }

        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validate all files are uploaded
        const requiredFiles = ['aadhaarFront', 'aadhaarBack', 'dlFront', 'dlBack', 'panCard'];
        const missingFiles = requiredFiles.filter(field => !files[field]);

        if (missingFiles.length > 0) {
            setError(`Please upload all required documents: ${missingFiles.join(', ')}`);
            return;
        }

        setUploading(true);

        try {
            // Convert files to Base64
            const filePromises = Object.keys(files).map(key => {
                return new Promise((resolve, reject) => {
                    const file = files[key];
                    if (!file) {
                        resolve({ key, data: null });
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => resolve({ key, data: reader.result }); // reader.result is Data URL
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            });

            const results = await Promise.all(filePromises);
            const payload = results.reduce((acc, { key, data }) => {
                if (data) acc[key] = data;
                return acc;
            }, {});

            console.log('Sending Base64 Payload...'); // Debug

            // Use NEW Base64 Endpoint
            const response = await api.post('/driver/upload-documents-base64', payload);

            console.log('Upload successful, refreshing profile...');
            try {
                // Force verify status update
                await driverService.getProfile();
            } catch (e) {
                console.warn('Profile refresh failed, proceeding anyway:', e);
            }

            setSuccess('Documents uploaded successfully! Redirecting...');

            setTimeout(() => {
                navigate('/driver/verification-pending', { state: { justUploaded: true } });
            }, 2000);
        } catch (err) {
            console.error('Upload Error:', err);
            setError(err.response?.data?.message || 'Failed to upload documents. Request Rejected.');
        } finally {
            setUploading(false);
        }
    };

    const DocumentUploadCard = ({ title, fieldName, description }) => (
        <div className="glass" style={{
            padding: 'var(--space-6)',
            borderRadius: 'var(--radius-xl)',
            marginBottom: 'var(--space-4)'
        }}>
            <h3 style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--space-2)',
                color: 'var(--text-primary)'
            }}>
                {title}
            </h3>
            <p style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-tertiary)',
                marginBottom: 'var(--space-4)'
            }}>
                {description}
            </p>

            <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => handleFileChange(e, fieldName)}
                style={{ display: 'none' }}
                id={fieldName}
            />

            <label
                htmlFor={fieldName}
                style={{
                    display: 'block',
                    padding: 'var(--space-8)',
                    border: '2px dashed var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    background: previews[fieldName] ? 'var(--surface-raised)' : 'transparent'
                }}
            >
                {previews[fieldName] ? (
                    previews[fieldName] === 'PDF' ? (
                        <div>
                            <div style={{ fontSize: '48px', marginBottom: 'var(--space-2)' }}>📄</div>
                            <p style={{ color: 'var(--success-400)' }}>PDF Uploaded</p>
                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>
                                {files[fieldName]?.name}
                            </p>
                        </div>
                    ) : (
                        <div>
                            <img
                                src={previews[fieldName]}
                                alt="Preview"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '200px',
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: 'var(--space-2)'
                                }}
                            />
                            <p style={{ color: 'var(--success-400)', fontSize: 'var(--font-size-sm)' }}>
                                ✓ Uploaded
                            </p>
                        </div>
                    )
                ) : (
                    <div>
                        <div style={{ fontSize: '48px', marginBottom: 'var(--space-2)' }}>📤</div>
                        <p style={{ color: 'var(--text-secondary)' }}>Click to upload</p>
                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>
                            JPG, PNG or PDF (max 5MB)
                        </p>
                    </div>
                )}
            </label>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', padding: 'var(--space-6)', background: 'var(--bg-primary)' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: 'var(--space-8)', textAlign: 'center' }}>
                    <h1 className="text-4xl font-bold" style={{
                        background: 'var(--gradient-primary)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: 'var(--space-2)'
                    }}>
                        Document Verification
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-lg)' }}>
                        Upload your documents to complete verification
                    </p>
                </div>

                {/* Error/Success Messages */}
                {error && (
                    <div style={{
                        padding: 'var(--space-4)',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid var(--danger-500)',
                        borderRadius: 'var(--radius-lg)',
                        color: 'var(--danger-400)',
                        marginBottom: 'var(--space-6)'
                    }}>
                        {error}
                    </div>
                )}

                {success && (
                    <div style={{
                        padding: 'var(--space-4)',
                        background: 'rgba(34, 197, 94, 0.1)',
                        border: '1px solid var(--success-500)',
                        borderRadius: 'var(--radius-lg)',
                        color: 'var(--success-400)',
                        marginBottom: 'var(--space-6)'
                    }}>
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Aadhaar Card */}
                    <DocumentUploadCard
                        title="Aadhaar Card (Front)"
                        fieldName="aadhaarFront"
                        description="Upload clear photo of Aadhaar front side"
                    />

                    <DocumentUploadCard
                        title="Aadhaar Card (Back)"
                        fieldName="aadhaarBack"
                        description="Upload clear photo of Aadhaar back side"
                    />

                    {/* Driving License */}
                    <DocumentUploadCard
                        title="Driving License (Front)"
                        fieldName="dlFront"
                        description="Upload clear photo of DL front side"
                    />

                    <DocumentUploadCard
                        title="Driving License (Back)"
                        fieldName="dlBack"
                        description="Upload clear photo of DL back side"
                    />

                    {/* PAN Card */}
                    <DocumentUploadCard
                        title="PAN Card"
                        fieldName="panCard"
                        description="Upload clear photo of PAN card"
                    />

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={uploading || success}
                        style={{
                            width: '100%',
                            padding: 'var(--space-4)',
                            marginTop: 'var(--space-6)'
                        }}
                    >
                        {uploading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="animate-spin" style={{
                                    width: '20px',
                                    height: '20px',
                                    border: '2px solid rgba(255,255,255,0.3)',
                                    borderTop: '2px solid white',
                                    borderRadius: '50%'
                                }}></span>
                                Uploading Documents...
                            </span>
                        ) : (
                            'Submit for Verification'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
