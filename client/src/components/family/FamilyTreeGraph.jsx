import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Shield,
  FileText,
  Phone,
  Mail,
  HeartPulse,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Share2,
  X,
  Crown
} from 'lucide-react';

export default function FamilyTreeGraph({ members = [], family = {}, onMemberClick }) {
  const [selectedMember, setSelectedMember] = useState(null);

  // Group members by Generation and Role
  const grandparents = members.filter((m) =>
    ['Dada', 'Dadi', 'Grandfather', 'Grandmother'].includes(m.relationship)
  );

  const parentsAndUncles = members.filter((m) =>
    ['Father', 'Mother', 'Chacha', 'Chachi', 'Tauji', 'Taiji', 'Spouse'].includes(m.relationship) ||
    (m.role === 'ADMIN' && ['Father', 'Mother'].includes(m.relationship))
  );

  const childrenAndSelf = members.filter((m) =>
    ['Son', 'Daughter', 'Brother', 'Sister', 'Self', 'Kid', 'Child'].includes(m.relationship) ||
    (m.role === 'ADMIN' && !['Father', 'Mother', 'Dada', 'Dadi'].includes(m.relationship))
  );

  // Remaining members who don't fit strict nuclear slots
  const otherMembers = members.filter((m) =>
    !grandparents.includes(m) &&
    !parentsAndUncles.includes(m) &&
    !childrenAndSelf.includes(m)
  );

  // Find Father and Mother to draw the Spouse Bridge
  const fatherMember = members.find((m) => m.relationship === 'Father');
  const motherMember = members.find((m) => m.relationship === 'Mother');

  const handleNodeClick = (member) => {
    setSelectedMember(member);
    if (onMemberClick) onMemberClick(member);
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] p-4 sm:p-8">
      
      {/* Background Engineering Dot Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.07]"
        style={{
          backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top Header Bar */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 mb-6 border-b border-slate-200 dark:border-[#1E293B]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🌳 {family.name || 'Parivar'} Tree Graph</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20">
              {members.length} Members Linked
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Interactive Family Knowledge Graph • Node par tap karke documents & medical info dekhein
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Spouse Link</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <span>Parent-Child</span>
          </span>
        </div>
      </div>

      {/* ================= MAIN INTERACTIVE GRAPH CANVAS ================= */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-10 sm:space-y-12 py-4">
        
        {/* TIER 1: GRANDPARENTS (Dada / Dadi) */}
        {grandparents.length > 0 && (
          <div className="flex flex-col items-center">
            <div className="text-[10px] font-mono uppercase tracking-wider text-amber-500 dark:text-amber-400 mb-3 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
              Generation 1: Grandparents (Dada / Dadi)
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 relative">
              {grandparents.map((m) => (
                <MemberNode key={m._id || m.id} member={m} onClick={() => handleNodeClick(m)} />
              ))}
            </div>
            {/* Vertical connector line downward */}
            <div className="w-0.5 h-8 bg-gradient-to-b from-amber-400 to-sky-400 mt-2" />
          </div>
        )}

        {/* TIER 2: PARENTS & ELDERS (Papa, Mummy, Chacha, Chachi) */}
        <div className="flex flex-col items-center w-full">
          <div className="text-[10px] font-mono uppercase tracking-wider text-sky-500 dark:text-sky-400 mb-4 px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20">
            Generation 2: Parents & Elders
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16 relative">
            {/* If Father and Mother both exist, render them with a Spouse Bridge */}
            {fatherMember && motherMember ? (
              <div className="flex items-center gap-4 sm:gap-6 p-4 rounded-3xl bg-slate-100/70 dark:bg-[#121622]/80 border border-slate-200 dark:border-[#1E293B] shadow-sm relative">
                {/* Father Node */}
                <MemberNode member={fatherMember} onClick={() => handleNodeClick(fatherMember)} />

                {/* Horizontal Spouse Link Bridge */}
                <div className="flex flex-col items-center justify-center px-1">
                  <div className="w-8 sm:w-12 h-0.5 bg-gradient-to-r from-sky-400 via-pink-400 to-sky-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-pink-500 dark:text-pink-400 mt-1 flex items-center gap-0.5 whitespace-nowrap bg-pink-500/10 px-1.5 py-0.5 rounded-full border border-pink-500/20">
                    💍 Spouse
                  </span>
                  <div className="w-8 sm:w-12 h-0.5 bg-gradient-to-r from-sky-400 via-pink-400 to-sky-400 animate-pulse mt-1" />
                </div>

                {/* Mother Node */}
                <MemberNode member={motherMember} onClick={() => handleNodeClick(motherMember)} />
              </div>
            ) : null}

            {/* Other elders (Chacha, Chachi, Uncles) */}
            {parentsAndUncles
              .filter((m) => m._id !== fatherMember?._id && m._id !== motherMember?._id)
              .map((m) => (
                <MemberNode key={m._id || m.id} member={m} onClick={() => handleNodeClick(m)} />
              ))}
          </div>

          {/* Central Parent-to-Child Downward Flow Connector */}
          {childrenAndSelf.length > 0 && (
            <div className="flex flex-col items-center mt-3">
              <div className="w-0.5 h-8 sm:h-10 bg-gradient-to-b from-sky-400 to-emerald-400" />
              <div className="w-48 sm:w-80 h-0.5 bg-sky-400/50 rounded-full" />
            </div>
          )}
        </div>

        {/* TIER 3: CHILDREN & SIBLINGS (Beta, Beti, Self) */}
        {childrenAndSelf.length > 0 && (
          <div className="flex flex-col items-center w-full">
            <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-500 dark:text-emerald-400 mb-3 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              Generation 3: Children & Next Generation
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 relative">
              {childrenAndSelf.map((m) => (
                <MemberNode key={m._id || m.id} member={m} onClick={() => handleNodeClick(m)} isChild />
              ))}
            </div>
          </div>
        )}

        {/* OTHER MEMBERS (If any) */}
        {otherMembers.length > 0 && (
          <div className="flex flex-col items-center pt-4 border-t border-slate-200 dark:border-[#1E293B] w-full">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-3">
              Extended Family Members
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8">
              {otherMembers.map((m) => (
                <MemberNode key={m._id || m.id} member={m} onClick={() => handleNodeClick(m)} />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ================= INTERACTIVE MEMBER DETAILS MODAL ================= */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div
            className="absolute inset-0"
            onClick={() => setSelectedMember(null)}
          />

          <div className="relative w-full max-w-md bg-white dark:bg-[#0E131F] border border-slate-200 dark:border-[#1E293B] rounded-2xl shadow-2xl p-5 sm:p-6 text-slate-900 dark:text-white z-10 overflow-hidden">
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#161B26] hover:bg-slate-200 dark:hover:bg-[#1E2535] text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Profile Info Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-[#1E293B]">
              <div className="relative">
                {selectedMember.avatar ? (
                  <img
                    src={selectedMember.avatar}
                    alt={selectedMember.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextElementSibling) {
                        e.target.nextElementSibling.style.display = 'flex';
                      }
                    }}
                    className="w-16 h-16 rounded-full object-cover border-2 border-sky-400 ring-4 ring-sky-500/10 shadow-md"
                  />
                ) : null}
                <div
                  className="w-16 h-16 rounded-full bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center text-white font-bold text-xl shadow-md"
                  style={{ display: selectedMember.avatar ? 'none' : 'flex' }}
                >
                  {selectedMember.name ? selectedMember.name.slice(0, 2).toUpperCase() : 'FM'}
                </div>
                {selectedMember.role === 'ADMIN' && (
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs" title="Vault Admin">
                    <Crown className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {selectedMember.name}
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs font-semibold text-sky-500 dark:text-sky-400">
                    {selectedMember.relationship || 'Member'}
                  </span>
                  {selectedMember.role === 'ADMIN' && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      ADMIN
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Inferred Relationships & Attributes */}
            <div className="py-4 space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#121622] border border-slate-200 dark:border-[#1E293B] flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">🩸 Blood Group:</span>
                <span className="font-bold text-red-600 dark:text-red-400 font-mono">
                  {selectedMember.bloodGroup || 'Not specified'}
                </span>
              </div>

              {selectedMember.phone && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#121622] border border-slate-200 dark:border-[#1E293B] flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">📞 Phone:</span>
                  <a href={`tel:${selectedMember.phone}`} className="font-semibold text-sky-500 hover:underline">
                    {selectedMember.phone}
                  </a>
                </div>
              )}

              {/* Deductions (e.g. Spouse linkage) */}
              {selectedMember.relationship === 'Father' && motherMember && (
                <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-between">
                  <span className="text-pink-400 font-medium flex items-center gap-1.5">
                    💍 Spouse:
                  </span>
                  <strong className="text-white">{motherMember.name} (Mother)</strong>
                </div>
              )}

              {selectedMember.relationship === 'Mother' && fatherMember && (
                <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-between">
                  <span className="text-pink-400 font-medium flex items-center gap-1.5">
                    💍 Spouse:
                  </span>
                  <strong className="text-white">{fatherMember.name} (Father)</strong>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center gap-3">
              <Link
                to={`/vault?member=${encodeURIComponent(selectedMember._id || selectedMember.id)}`}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 text-center"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Documents</span>
              </Link>
              <button
                onClick={() => setSelectedMember(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-[#161B26] hover:bg-slate-200 dark:hover:bg-[#1E2535] text-slate-700 dark:text-slate-300 font-semibold text-xs border border-slate-200 dark:border-[#262F40] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Rounded Profile Node Component
function MemberNode({ member, onClick, isChild = false }) {
  const [imgFailed, setImgFailed] = useState(false);

  const getRelationBadge = (rel) => {
    switch (rel) {
      case 'Father': return { bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30', icon: '👨' };
      case 'Mother': return { bg: 'bg-pink-500/10 text-pink-400 border-pink-500/30', icon: '👩' };
      case 'Son': return { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: '👦' };
      case 'Daughter': return { bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30', icon: '👧' };
      case 'Chacha': return { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: '🧔' };
      case 'Chachi': return { bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30', icon: '🧕' };
      case 'Dada': return { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: '👴' };
      case 'Dadi': return { bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30', icon: '👵' };
      default: return { bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30', icon: '👤' };
    }
  };

  const badge = getRelationBadge(member.relationship);

  return (
    <div
      onClick={onClick}
      className="group flex flex-col items-center cursor-pointer transition-all duration-300 hover:-translate-y-1"
    >
      {/* Rounded Circular Profile Node */}
      <div className="relative">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 bg-white dark:bg-[#121622] border-2 border-slate-300 dark:border-[#1E293B] group-hover:border-sky-400 dark:group-hover:border-sky-400 shadow-md group-hover:shadow-sky-500/20 group-hover:shadow-lg transition-all overflow-hidden flex items-center justify-center">
          {member.avatar && !imgFailed ? (
            <img
              src={member.avatar}
              alt={member.name}
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center text-white font-bold text-base sm:text-lg">
              {member.name ? member.name.slice(0, 2).toUpperCase() : 'FM'}
            </div>
          )}
        </div>

        {/* Admin Crown Badge */}
        {member.role === 'ADMIN' && (
          <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-md ring-2 ring-white dark:ring-[#090A0F]" title="Vault Admin">
            <Crown className="w-3.5 h-3.5" />
          </span>
        )}

        {/* Blood Group Pill Indicator */}
        {member.bloodGroup && (
          <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold font-mono bg-red-500 text-white shadow-xs ring-2 ring-white dark:ring-[#090A0F]">
            {member.bloodGroup}
          </span>
        )}
      </div>

      {/* Name & Relation Labels */}
      <div className="mt-2.5 text-center max-w-[120px] sm:max-w-[140px]">
        <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors">
          {member.name}
        </div>
        <div className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg}`}>
          <span>{badge.icon}</span>
          <span className="truncate">{member.relationship || 'Member'}</span>
        </div>
      </div>
    </div>
  );
}
