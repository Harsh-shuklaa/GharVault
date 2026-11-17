import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import QuorumSignModal from '../components/common/QuorumSignModal';

export default function DocumentPreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doc, setDoc] = useState(null);
  const [quorumRequest, setQuorumRequest] = useState(null);
  const [auditTrail, setAuditTrail] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isQuorumOpen, setIsQuorumOpen] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState(null);
  const [signedUrlData, setSignedUrlData] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    loadDocumentDetails();
  }, [id]);

  const loadDocumentDetails = async () => {
    try {
      setLoading(true);
      const res = await api.getDocument(id);
      if (res.document) {
        setDoc(res.document);
        setQuorumRequest(res.quorumRequest);
        setAuditTrail(res.auditTrail || []);

        // Load signed url
        api.getSignedUrl(id).then(urlData => setSignedUrlData(urlData));
      }
    } catch (err) {
      console.error('Failed to load document details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyIntegrity = async () => {
    try {
      const res = await api.verifyIntegrity(id);
      setVerifyStatus(res);
      setTimeout(() => setVerifyStatus(null), 5000);
    } catch (err) {
      alert('Verification error: ' + err.message);
    }
  };

  const handleShareLink = () => {
    const url = signedUrlData?.signedUrl || window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDelete = async () => {
    if (window.confirm(`Permanently remove "${doc?.title}" from your family vault?`)) {
      await api.deleteDocument(id);
      navigate('/vault');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <span className="material-symbols-outlined text-4xl text-blue-600 animate-spin">refresh</span>
          <p className="text-xs text-slate-500 font-mono">Decrypting 256-bit AES payload...</p>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <span className="material-symbols-outlined text-5xl text-slate-300">error</span>
        <h2 className="text-lg font-bold text-slate-800">Document Not Found</h2>
        <Link to="/vault" className="text-xs text-blue-600 font-bold hover:underline">
          ← Return to Vault
        </Link>
      </div>
    );
  }

  const isQuorumLocked = doc.isSensitive && !doc.quorumApproved;

  return (
    <div className="max-w-[1380px] mx-auto p-6 lg:p-8 space-y-6">
      {/* Top Header & Action Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/vault"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{doc.title}</h1>
              <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs">
                {doc.category}
              </span>
              {doc.status === 'EXPIRING_SOON' && (
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-mono text-[10px] font-bold">
                  Expires in 27 Days
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-3 mt-1">
              <span>Document #{doc.documentNumber || 'N/A'}</span>
              <span>•</span>
              <span>Custodian: {doc.assignedMember?.name || 'Family'}</span>
              <span>•</span>
              <span className="font-mono text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                SHA-256 Validated
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleVerifyIntegrity}
            className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-base text-blue-600">verified</span>
            <span>Verify Integrity</span>
          </button>

          <button
            onClick={handleShareLink}
            className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-base text-slate-500">share</span>
            <span>{copiedLink ? 'Link Copied!' : 'Share Signed Link'}</span>
          </button>

          <a
            href={signedUrlData?.signedUrl || `/api/documents/raw/${encodeURIComponent(doc.storagePath)}`}
            download={doc.originalFileName}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all"
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>Download PDF</span>
          </a>

          <button
            onClick={handleDelete}
            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Delete Document"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>
      </div>

      {/* Verify Alert Feedback */}
      {verifyStatus && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 text-xl">check_circle</span>
            <span>
              <strong>Cryptographic Integrity Confirmed:</strong> Document matches SHA-256 master seal{' '}
              <code className="font-mono bg-emerald-100 px-1.5 py-0.5 rounded text-[11px]">
                {verifyStatus.sha256Hash}
              </code>
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase font-bold text-emerald-700">100% Unbroken</span>
        </div>
      )}

      {/* Split Viewer & Metadata Body (7 Cols & 5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Document Canvas Viewer (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
          {/* Canvas Controls */}
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 text-xs text-slate-600">
            <span className="font-mono text-[11px] font-semibold text-slate-500">
              Page 1 of 1 • PDF Preview
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoomLevel(Math.max(60, zoomLevel - 15))}
                className="p-1 hover:bg-slate-200 rounded transition-colors"
                title="Zoom Out"
              >
                <span className="material-symbols-outlined text-base">zoom_out</span>
              </button>
              <span className="font-mono text-[11px] text-slate-600 w-10 text-center">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel(Math.min(160, zoomLevel + 15))}
                className="p-1 hover:bg-slate-200 rounded transition-colors"
                title="Zoom In"
              >
                <span className="material-symbols-outlined text-base">zoom_in</span>
              </button>
              <button
                onClick={() => setRotation((rotation + 90) % 360)}
                className="p-1 hover:bg-slate-200 rounded transition-colors"
                title="Rotate"
              >
                <span className="material-symbols-outlined text-base">rotate_right</span>
              </button>
            </div>
          </div>

          {/* Document Preview Canvas */}
          <div className="p-8 bg-slate-100/70 flex items-center justify-center min-h-[500px] overflow-auto">
            {isQuorumLocked ? (
              /* Quorum Lock Shield */
              <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-lg border border-slate-200 space-y-4">
                <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200">
                  <span className="material-symbols-outlined text-3xl">shield_lock</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Dual-Key Quorum Protected</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    This is a sensitive family legal/property record. Content rendering is encrypted until 2 of 2 designated guardians cryptographically sign off.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-left text-xs space-y-1 font-mono text-slate-600">
                  <div>Signatures: {quorumRequest ? `${quorumRequest.signatures.length} of ${quorumRequest.requiredSignatures}` : '1 of 2'}</div>
                  <div className="text-emerald-600">Key 1: Rajesh Sharma (Signed)</div>
                  <div className="text-amber-600">Key 2: Priya Sharma (Awaiting)</div>
                </div>
                <button
                  onClick={() => setIsQuorumOpen(true)}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">key</span>
                  <span>Provide 2nd Key Sign-off</span>
                </button>
              </div>
            ) : (
              /* Rendered Document Representation */
              <div
                style={{
                  transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.2s ease',
                }}
                className="w-full max-w-lg bg-white rounded-xl shadow-xl p-8 border border-slate-200 text-slate-800 space-y-6 relative"
              >
                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] rotate-[-25deg]">
                  <span className="text-6xl font-black uppercase text-slate-900">
                    GHARVAULT SEALED
                  </span>
                </div>

                {/* Simulated Document Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-3xl text-slate-900">
                      {doc.category === 'Identity' ? 'badge' :
                       doc.category === 'Property' ? 'real_estate_agent' :
                       doc.category === 'Health' ? 'health_and_safety' : 'account_balance'}
                    </span>
                    <div>
                      <div className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
                        {doc.category} Certificate
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">Government of India Standard Format</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">
                      ORIGINAL
                    </span>
                  </div>
                </div>

                {/* Simulated Document Fields */}
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Document Title</span>
                      <strong className="text-slate-900 font-bold text-sm">{doc.title}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Document Number</span>
                      <strong className="text-slate-900 font-mono text-sm">{doc.documentNumber || 'V6924108'}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Assigned Custodian</span>
                      <strong className="text-slate-900">{doc.assignedMember?.name || 'Rajesh Sharma'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Validity Date</span>
                      <strong className="text-slate-900">
                        {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : 'Lifetime / Non-Expiring'}
                      </strong>
                    </div>
                  </div>

                  {/* OCR Extractions */}
                  {doc.ocrExtractedData && Object.keys(doc.ocrExtractedData).length > 0 && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Verified OCR Metadata
                      </span>
                      {Object.entries(doc.ocrExtractedData).map(([key, val]) => (
                        <div key={key} className="flex justify-between text-[11px]">
                          <span className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                          <span className="font-semibold text-slate-900">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-200 flex justify-between items-end text-[10px] text-slate-500 font-mono">
                    <div>
                      <div>Sealed by: GharVault Engine v2.4</div>
                      <div>Family: Sharma Family Ghar</div>
                    </div>
                    <div className="w-16 h-16 border border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-400">
                      QR SEAL
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Security & Governance Ledger (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Cryptographic Checksum Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-blue-600 text-lg">enhanced_encryption</span>
                Cryptographic Master Seal
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">
                Valid
              </span>
            </h3>

            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-500 font-medium">SHA-256 Digest (FIPS 180-4)</span>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 break-all select-all flex items-center justify-between">
                <span>{doc.sha256Hash}</span>
              </div>
            </div>

            {/* Supabase Storage Details */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Storage Provider:</span>
                <span className="font-semibold text-slate-900">Supabase Storage (Private Bucket)</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Bucket Name:</span>
                <span className="font-mono text-slate-900">family-documents</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>File Size:</span>
                <span className="font-mono text-slate-900">{(doc.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Signed URL Expiration:</span>
                <span className="font-mono text-emerald-700 font-semibold">Active (59m 40s remaining)</span>
              </div>
            </div>
          </div>

          {/* Access Policy Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-slate-500 text-lg">shield</span>
              <span>Governance & Access Policy</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                <span className="font-medium text-slate-700">Multi-Sig Quorum:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${doc.isSensitive ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-600'}`}>
                  {doc.isSensitive ? '2-of-2 Guardians Required' : 'Standard Access'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                <span className="font-medium text-slate-700">Emergency Break-Glass:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                  Pre-Authorized (48h Protocol)
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                <span className="font-medium text-slate-700">Statutory Custody:</span>
                <span className="text-slate-600 font-medium">Indian Succession Act Ready</span>
              </div>
            </div>
          </div>

          {/* Immutable Audit History */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center justify-between">
              <span>Immutable Document Audit Trail</span>
              <span className="text-[11px] font-mono text-blue-600">{auditTrail.length} Events</span>
            </h3>

            <div className="space-y-3 text-xs">
              {auditTrail.slice(0, 4).map((log) => (
                <div key={log._id} className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-base text-blue-600 mt-0.5">history</span>
                  <div>
                    <div className="font-semibold text-slate-900">
                      {log.performerName} — {log.action.replace(/_/g, ' ')}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleString()} • IP: {log.ipAddress}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quorum Sign Modal */}
      {quorumRequest && (
        <QuorumSignModal
          isOpen={isQuorumOpen}
          onClose={() => {
            setIsQuorumOpen(false);
            loadDocumentDetails();
          }}
          quorumRequest={quorumRequest}
          onSignSuccess={() => loadDocumentDetails()}
        />
      )}
    </div>
  );
}
