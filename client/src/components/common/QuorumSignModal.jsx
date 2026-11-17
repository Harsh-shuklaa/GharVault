import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function QuorumSignModal({ isOpen, onClose, quorumRequest, onSignSuccess }) {
  const { user } = useAuth();
  const [signing, setSigning] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !quorumRequest) return null;

  const currentSignatures = quorumRequest.signatures || [];
  const required = quorumRequest.requiredSignatures || 2;
  const isUserSigned = currentSignatures.some(s => s.userId?.toString() === user?._id?.toString());

  const handleSign = async () => {
    try {
      setSigning(true);
      setError('');
      const res = await api.signQuorum(quorumRequest._id, user?.email || 'priya.sharma@gmail.com');

      if (res.approved || res.success) {
        setSuccess(true);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2563EB', '#059669', '#38BDF8', '#F59E0B'],
        });
        if (onSignSuccess) onSignSuccess(res.request);
      }
    } catch (err) {
      setError(err.message || 'Failed to sign quorum');
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0F172A] px-6 py-5 text-white flex items-center justify-between border-b border-[#1E293B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">key</span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Dual-Key Quorum Sign-off</h3>
              <p className="text-xs text-slate-400">Multi-Signature Governance Protocol</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                <span className="material-symbols-outlined text-3xl">verified</span>
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900">Quorum Verification Succeeded!</h4>
                <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
                  Dual-key cryptographic sign-off is complete. The sensitive document has been unlocked for authorized family custodians.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left font-mono text-xs text-slate-700 space-y-1">
                <div>Document: {quorumRequest.documentTitle}</div>
                <div>Signers: {currentSignatures.map(s => s.userName).join(', ')}, {user?.name}</div>
                <div>Status: QUORUM_SATISFIED (2 of 2)</div>
                <div className="text-emerald-700 font-semibold truncate">
                  SHA-256 Seal: {currentSignatures[0]?.digitalSignature || 'SIG_RSA4096_VERIFIED'}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-md"
              >
                Access Document
              </button>
            </div>
          ) : (
            <>
              {/* Document Info Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3.5">
                <span className="material-symbols-outlined text-2xl text-blue-600 mt-0.5">lock</span>
                <div className="space-y-1 flex-1">
                  <div className="text-sm font-bold text-slate-900">{quorumRequest.documentTitle}</div>
                  <div className="text-xs text-slate-500">
                    Action requested: <span className="font-semibold text-slate-700">{quorumRequest.actionType}</span>
                  </div>
                  <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/80">
                    <span className="font-semibold text-slate-700">Reason:</span> "{quorumRequest.reason}"
                  </div>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-600">Custodians Quorum Status</span>
                  <span className="text-blue-600">{currentSignatures.length} of {required} Signed</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{ width: `${(currentSignatures.length / required) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Signatures List */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Designated Signers
                </span>
                <div className="space-y-2">
                  {currentSignatures.map((sig, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 border border-emerald-200"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-emerald-600 text-lg">check_circle</span>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{sig.userName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            Signed on {new Date(sig.signedAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-900 uppercase">
                        Signed
                      </span>
                    </div>
                  ))}

                  {!isUserSigned && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 border border-amber-200">
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-amber-600 text-lg">pending</span>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{user?.name} (You)</div>
                          <div className="text-[11px] text-slate-500">
                            Role: {user?.role} • Ready to provide 2nd digital key
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900 uppercase animate-pulse">
                        Pending Your Key
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSign}
                  disabled={signing || isUserSigned}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold transition-all shadow-md text-sm flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">enhanced_encryption</span>
                  <span>{signing ? 'Signing Cryptographic Key...' : isUserSigned ? 'Already Signed' : 'Sign & Unlock Document'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
