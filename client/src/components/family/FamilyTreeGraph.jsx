import React, { useState, useMemo } from 'react';
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
  Crown,
  UserPlus,
  GitFork,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Heart,
  Droplet
} from 'lucide-react';

// Name matching helper (handles honorifics, casing, first name & partial matches)
function matchName(nameA, nameB) {
  if (!nameA || !nameB) return false;
  const a = nameA.toLowerCase().trim().replace(/^(mr|mrs|shri|smt|dr|er)\.?\s+/i, '');
  const b = nameB.toLowerCase().trim().replace(/^(mr|mrs|shri|smt|dr|er)\.?\s+/i, '');
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  const partsA = a.split(/\s+/).filter(Boolean);
  const partsB = b.split(/\s+/).filter(Boolean);
  if (partsA[0] && partsB[0] && partsA[0] === partsB[0]) return true;
  if (partsA[partsA.length - 1] && partsB[partsB.length - 1] && partsA[partsA.length - 1] === partsB[partsB.length - 1] && partsA[partsA.length - 1].length > 3) return true;
  return false;
}

// Deep Spouse Link Detection
function areSpouses(personA, personB) {
  if (!personA || !personB) return false;
  const idA = (personA._id || personA.id)?.toString();
  const idB = (personB._id || personB.id)?.toString();
  if (idA && idB && idA === idB) return false;

  const relA = (personA.relationship || '').trim();
  const relB = (personB.relationship || '').trim();
  const nameA = (personA.name || '').trim();
  const nameB = (personB.name || '').trim();
  const spouseA = (personA.spouseName || personA.fatherOrSpouseName || '').trim();
  const spouseB = (personB.spouseName || personB.fatherOrSpouseName || '').trim();

  // 1. Direct spouseName matching (Full, first name, or contains)
  if (spouseA && (matchName(spouseA, nameB) || nameB.toLowerCase().includes(spouseA.toLowerCase()) || spouseA.toLowerCase().includes(nameB.toLowerCase()))) return true;
  if (spouseB && (matchName(spouseB, nameA) || nameA.toLowerCase().includes(spouseB.toLowerCase()) || spouseB.toLowerCase().includes(nameA.toLowerCase()))) return true;

  // 2. RelativeTo pointer between spouses
  if (personA.relativeTo?.toString() === idB) return true;
  if (personB.relativeTo?.toString() === idA) return true;

  // 3. Spouse written as relationship e.g. "Chacha", "Uncle", "Tauji", "Husband"
  if (spouseA && (matchName(spouseA, relB) || relB.toLowerCase().includes(spouseA.toLowerCase()) || spouseA.toLowerCase().includes(relB.toLowerCase()))) return true;
  if (spouseB && (matchName(spouseB, relA) || relA.toLowerCase().includes(spouseB.toLowerCase()) || spouseB.toLowerCase().includes(relA.toLowerCase()))) return true;

  // 4. Natural Kinship Pairings (Uncle + Aunt, Chacha + Chachi, Tauji + Taiji, Father + Mother)
  const isUncleA = ['Chacha', 'Tauji', 'Uncle'].includes(relA);
  const isAuntA = ['Chachi', 'Taiji', 'Aunt', 'Spouse', 'Wife'].includes(relA);
  const isUncleB = ['Chacha', 'Tauji', 'Uncle'].includes(relB);
  const isAuntB = ['Chachi', 'Taiji', 'Aunt', 'Spouse', 'Wife'].includes(relB);

  if (isUncleA && isAuntB) return true;
  if (isAuntA && isUncleB) return true;

  if ((relA === 'Father' && relB === 'Mother') || (relA === 'Mother' && relB === 'Father')) return true;

  return false;
}

export default function FamilyTreeGraph({ members = [], family = {}, onMemberClick, onAddMember }) {
  const [selectedMember, setSelectedMember] = useState(null);
  const [viewMode, setViewMode] = useState('tree'); // 'tree' | 'medical'

  // 1. High Performance: O(1) Hash Map for Relational Lookups
  const membersById = useMemo(() => {
    const map = new Map();
    members.forEach((m) => {
      const id = (m._id || m.id)?.toString();
      if (id) map.set(id, m);
    });
    return map;
  }, [members]);

  // 2. AI Rishta Engine: Calculate Natural Indian Kinship relative to Admin / Self
  const kinshipMap = useMemo(() => {
    const map = new Map();
    const selfAdmin = members.find((m) => m.role === 'ADMIN' || m.relationship === 'Self') || members[0];
    const father = members.find((m) => m.relationship === 'Father');
    const mother = members.find((m) => m.relationship === 'Mother' || matchName(m.spouseName || m.fatherOrSpouseName, father?.name));

    members.forEach((m) => {
      const id = (m._id || m.id)?.toString();
      if (!id) return;

      const rel = (m.relationship || '').trim();

      // Direct Grandparents
      if (['Dada', 'Grandfather'].includes(rel)) {
        map.set(id, { title: 'Dada ji', category: 'Grandparent', icon: '👴' });
        return;
      }
      if (['Dadi', 'Grandmother'].includes(rel)) {
        map.set(id, { title: 'Dadi ji', category: 'Grandparent', icon: '👵' });
        return;
      }

      // Direct Parents
      if (m._id === father?._id || rel === 'Father') {
        map.set(id, { title: 'Papa / Pita ji', category: 'Parent', icon: '👨' });
        return;
      }
      if (m._id === mother?._id || rel === 'Mother') {
        map.set(id, { title: 'Mummy / Mata ji', category: 'Parent', icon: '👩' });
        return;
      }

      // Self
      if (m._id === selfAdmin?._id) {
        map.set(id, { title: 'Self (You)', category: 'Self', icon: '🧑' });
        return;
      }

      // Uncles (Chacha vs Tauji based on Age or explicit relationship)
      if (['Chacha', 'Tauji', 'Uncle'].includes(rel)) {
        const isOlder = rel === 'Tauji' || (m.dateOfBirth && father?.dateOfBirth && new Date(m.dateOfBirth) < new Date(father.dateOfBirth));
        map.set(id, {
          title: isOlder ? 'Tauji (Bade Papa)' : 'Chacha ji',
          category: 'Elder',
          icon: '🧔',
        });
        return;
      }

      // Aunts (Chachi vs Taiji)
      if (['Chachi', 'Taiji', 'Aunt'].includes(rel)) {
        const isTaiji = rel === 'Taiji' || matchName(m.spouseName, 'Tauji');
        map.set(id, {
          title: isTaiji ? 'Taiji (Badi Mummy)' : 'Chachi ji',
          category: 'Elder',
          icon: '🧕',
        });
        return;
      }

      // Children & Cousins
      const mFatherName = m.fatherOrSpouseName || '';
      const mParentId = m.relativeTo?.toString();

      // Check if child belongs to an Uncle (Cousin)
      const uncleParent = members.find((u) => ['Chacha', 'Tauji', 'Uncle'].includes(u.relationship) && (u._id?.toString() === mParentId || matchName(u.name, mFatherName)));
      if (uncleParent) {
        const isTaujiKid = uncleParent.relationship === 'Tauji';
        const isMale = rel === 'Son' || rel === 'Brother' || rel === 'Kid';
        if (isTaujiKid) {
          map.set(id, {
            title: isMale ? 'Tauka Bhai (Cousin)' : 'Tauki Behan (Cousin)',
            category: 'Cousin',
            icon: isMale ? '👦' : '👧',
            parentName: uncleParent.name,
          });
        } else {
          map.set(id, {
            title: isMale ? 'Chachera Bhai (Cousin)' : 'Chacheri Behan (Cousin)',
            category: 'Cousin',
            icon: isMale ? '👦' : '👧',
            parentName: uncleParent.name,
          });
        }
        return;
      }

      // Direct Siblings (Same Father as Self)
      if (rel === 'Brother') {
        map.set(id, { title: 'Sage Bhai (Brother)', category: 'Sibling', icon: '👦' });
        return;
      }
      if (rel === 'Sister') {
        map.set(id, { title: 'Sagi Behan (Sister)', category: 'Sibling', icon: '👧' });
        return;
      }

      // Default fallback
      map.set(id, { title: rel || 'Family Member', category: 'Member', icon: '👤' });
    });

    return map;
  }, [members]);

  // 3. Family Units & Branching Structure
  const {
    grandparents,
    nuclearUnit,
    uncleUnits,
    unassignedMembers,
  } = useMemo(() => {
    const gp = [];
    const usedIds = new Set();

    // 1. Grandparents
    members.forEach((m) => {
      if (['Dada', 'Dadi', 'Grandfather', 'Grandmother'].includes(m.relationship)) {
        gp.push(m);
        usedIds.add(m._id?.toString() || m.id?.toString());
      }
    });

    // 2. Nuclear Couple (Papa & Mummy)
    const father = members.find((m) => m.relationship === 'Father');
    const mother = members.find(
      (m) =>
        m.relationship === 'Mother' ||
        (father && areSpouses(m, father))
    );

    if (father) usedIds.add(father._id?.toString() || father.id?.toString());
    if (mother) usedIds.add(mother._id?.toString() || mother.id?.toString());

    // 3. Uncle & Extended Family Units (Chacha + Chachi, Tauji + Taiji, or any member who has a spouse)
    const uUnits = [];

    // Find all couple candidates (anyone with Chacha, Chachi, Tauji, Taiji, Uncle, Aunt, Spouse, or someone who has spouseName filled)
    const coupleCandidates = members.filter((m) => {
      const id = (m._id || m.id)?.toString();
      if (usedIds.has(id)) return false;
      const rel = (m.relationship || '').trim();
      return (
        ['Chacha', 'Tauji', 'Chachi', 'Taiji', 'Uncle', 'Aunt', 'Spouse', 'Wife'].includes(rel) ||
        Boolean(m.spouseName?.trim())
      );
    });

    coupleCandidates.forEach((cand) => {
      const candId = (cand._id || cand.id)?.toString();
      if (usedIds.has(candId)) return; // Already paired into another unit

      // Find partner in the family
      const partner = members.find((other) => {
        const otherId = (other._id || other.id)?.toString();
        if (usedIds.has(otherId) || otherId === candId) return false;
        return areSpouses(cand, other);
      });

      usedIds.add(candId);
      if (partner) {
        usedIds.add((partner._id || partner.id)?.toString());
      }

      // Determine who is Husband and who is Wife
      let husband = null;
      let wife = null;

      const isCandWife = ['Chachi', 'Taiji', 'Aunt', 'Spouse', 'Wife', 'Mother'].includes(cand.relationship) ||
                         Boolean(cand.spouseName && partner && !['Chacha', 'Tauji', 'Uncle', 'Father'].includes(cand.relationship));

      if (isCandWife) {
        wife = cand;
        husband = partner || null;
      } else {
        husband = cand;
        wife = partner || null;
      }

      // Final sanity checks on roles
      if (!wife && partner && ['Chachi', 'Taiji', 'Aunt', 'Spouse', 'Wife', 'Mother'].includes(partner.relationship)) {
        wife = partner;
      }
      if (!husband && partner && ['Chacha', 'Tauji', 'Uncle', 'Father'].includes(partner.relationship)) {
        husband = partner;
      }

      const husbandId = (husband?._id || husband?.id)?.toString();
      const wifeId = (wife?._id || wife?.id)?.toString();

      // Find Children whose father is this husband or wife
      const kids = members.filter((m) => {
        const mId = (m._id || m.id)?.toString();
        if (usedIds.has(mId)) return false;

        const matchesParentId = (husbandId && m.relativeTo?.toString() === husbandId) ||
                                (wifeId && m.relativeTo?.toString() === wifeId);

        const matchesFather = (husband && matchName(m.fatherOrSpouseName, husband.name)) ||
                              (wife && matchName(m.fatherOrSpouseName, wife.name)) ||
                              (husband && matchName(m.fatherOrSpouseName, husband.relationship)) ||
                              (husband && matchName(m.fatherOrSpouseName, husband.spouseName));

        const isCousin = m.relationship === 'Cousin' && !matchesParentId && !matchesFather;

        return matchesParentId || matchesFather;
      });

      kids.forEach((k) => usedIds.add((k._id || k.id)?.toString()));

      const isTaujiUnit = (husband?.relationship === 'Tauji') || (wife?.relationship === 'Taiji');
      const unitLabel = isTaujiUnit ? "Tauji's Family Branch" : "Chacha's Family Branch";

      uUnits.push({
        id: husbandId || wifeId || candId,
        label: unitLabel,
        husband,
        wife,
        children: kids,
      });
    });

    // 4. Nuclear Children (Kids belonging to Papa / Self)
    const fatherId = father?._id?.toString() || father?.id?.toString();
    const nuclearKids = members.filter((m) => {
      const id = m._id?.toString() || m.id?.toString();
      if (usedIds.has(id)) return false;
      const isNuclearRole =
        ['Son', 'Daughter', 'Brother', 'Sister', 'Self', 'Kid', 'Child'].includes(m.relationship) ||
        m.role === 'ADMIN';

      if (!isNuclearRole) return false;

      // Belongs to father if matching fatherId or fatherName or no specific other parent
      const matchesFather = !m.relativeTo || m.relativeTo.toString() === fatherId || matchName(m.fatherOrSpouseName, father?.name);
      return matchesFather;
    });

    nuclearKids.forEach((k) => usedIds.add(k._id?.toString() || k.id?.toString()));

    // 5. Remaining / Unlinked
    const remaining = members.filter((m) => !usedIds.has(m._id?.toString() || m.id?.toString()));

    return {
      grandparents: gp,
      nuclearUnit: {
        label: "Papa's Family (Direct Branch)",
        husband: father || null,
        wife: mother || null,
        children: nuclearKids,
      },
      uncleUnits: uUnits,
      unassignedMembers: remaining,
    };
  }, [members]);

  const handleNodeClick = (member) => {
    setSelectedMember(member);
    if (onMemberClick) onMemberClick(member);
  };

  const handleAddClick = (defaultRel, defaultFatherName = '') => {
    if (onAddMember) {
      onAddMember(defaultRel, defaultFatherName);
    }
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] p-4 sm:p-8">
      
      {/* Background Engineering Dot Grid */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity ${
          viewMode === 'medical' ? 'opacity-[0.06] text-rose-500' : 'opacity-[0.03] dark:opacity-[0.07] text-sky-500'
        }`}
        style={{
          backgroundImage: 'radial-gradient(currentColor 1.2px, transparent 1.2px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top Header Bar */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-200 dark:border-[#1E293B]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{viewMode === 'medical' ? '🩸 Parivar Medical & Bloodline Radar' : `🌳 ${family.name || 'Parivar'} Tree Graph`}</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20">
              {members.length} Members Connected
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              AI Rishta Engine Active
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {viewMode === 'medical'
              ? 'Emergency blood group compatibility, donor matching & health insurance status'
              : 'Interactive Family Branches • Har couple aur unke bachhe unki apni branch me organized hain'}
          </p>
        </div>

        {/* View Switcher Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-slate-200/70 dark:bg-[#121622] p-1 rounded-xl border border-slate-300/70 dark:border-[#1E293B]">
          <button
            type="button"
            onClick={() => setViewMode('tree')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'tree'
                ? 'bg-white dark:bg-[#1E293B] text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>🌳 Family View</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('medical')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'medical'
                ? 'bg-rose-500 text-white shadow-xs shadow-rose-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <HeartPulse size={13} className={viewMode === 'medical' ? 'animate-pulse' : ''} />
            <span>🩸 Medical Radar</span>
          </button>
        </div>
      </div>

      {/* ================= MAIN INTERACTIVE GRAPH CANVAS ================= */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-12 sm:space-y-16 py-4">
        
        {/* TIER 1: GRANDPARENTS (Dada / Dadi) */}
        {grandparents.length > 0 && (
          <div className="flex flex-col items-center">
            <div className="text-[10px] font-mono uppercase tracking-wider text-amber-500 dark:text-amber-400 mb-3 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              Generation 1: Grandparents (Dada / Dadi Root)
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 relative">
              {grandparents.map((m) => (
                <MemberNode
                  key={m._id || m.id}
                  member={m}
                  kinship={kinshipMap.get(m._id?.toString() || m.id?.toString())}
                  viewMode={viewMode}
                  onClick={() => handleNodeClick(m)}
                />
              ))}
            </div>
            {/* Trunk connector line downward to all family branches */}
            <div className="w-0.5 h-10 bg-gradient-to-b from-amber-400 via-sky-400 to-sky-400 mt-3" />
            <div className="w-64 sm:w-96 max-w-full h-0.5 bg-sky-400/50 rounded-full" />
          </div>
        )}

        {/* TIER 2 & 3: FAMILY UNITS (Papa's Branch + Chacha's Branch + Tauji's Branch) */}
        <div className="w-full flex flex-col items-center">
          <div className="text-[10px] font-mono uppercase tracking-wider text-sky-500 dark:text-sky-400 mb-6 px-3 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20">
            Generation 2 & 3: Family Units & Lineage Branches
          </div>

          <div className="flex flex-wrap items-start justify-center gap-10 sm:gap-14 w-full">
            
            {/* BRANCH 1: PAPA'S FAMILY UNIT */}
            <FamilyUnitCard
              title={nuclearUnit.label}
              husband={nuclearUnit.husband}
              wife={nuclearUnit.wife}
              children={nuclearUnit.children}
              kinshipMap={kinshipMap}
              viewMode={viewMode}
              onNodeClick={handleNodeClick}
              onAddHusband={() => handleAddClick('Father')}
              onAddWife={() => handleAddClick('Mother', nuclearUnit.husband?.name || '')}
              onAddChild={() => handleAddClick('Son', nuclearUnit.husband?.name || '')}
              childButtonLabel="+ Add Sibling / Child"
            />

            {/* BRANCH 2..N: UNCLE FAMILY UNITS (Chacha + Chachi, Tauji + Taiji) */}
            {uncleUnits.map((unit) => (
              <FamilyUnitCard
                key={unit.id}
                title={unit.label}
                husband={unit.husband}
                wife={unit.wife}
                children={unit.children}
                kinshipMap={kinshipMap}
                viewMode={viewMode}
                onNodeClick={handleNodeClick}
                onAddHusband={() => handleAddClick(unit.label.includes('Tauji') ? 'Tauji' : 'Chacha', unit.wife?.spouseName || '')}
                onAddWife={() => handleAddClick(unit.label.includes('Tauji') ? 'Taiji' : 'Chachi', unit.husband?.name || '')}
                onAddChild={() => handleAddClick('Son', unit.husband?.name || unit.wife?.spouseName || '')}
                childButtonLabel="+ Add Cousin (Bachha)"
              />
            ))}

            {/* 1-Tap Add Another Family Branch (e.g. Add Chacha) */}
            <div className="flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-dashed border-slate-300 dark:border-[#1E293B] hover:border-sky-400 dark:hover:border-sky-400 bg-white/40 dark:bg-[#121622]/40 transition-all cursor-pointer group min-w-[240px] self-stretch"
                 onClick={() => handleAddClick('Chacha')}>
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 group-hover:bg-sky-500/20 text-sky-500 flex items-center justify-center transition-all group-hover:scale-110">
                <UserPlus size={22} />
              </div>
              <span className="font-bold text-xs text-slate-800 dark:text-white mt-3 group-hover:text-sky-500 transition-colors">
                + Add Another Family Branch
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 text-center">
                Chacha ji, Tauji, ya Bua ji ka parivar jodein
              </span>
            </div>

          </div>
        </div>

        {/* UNASSIGNED / EXTENDED MEMBERS */}
        {unassignedMembers.length > 0 && (
          <div className="flex flex-col items-center pt-6 border-t border-slate-200 dark:border-[#1E293B] w-full">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-3">
              Extended Family Members
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8">
              {unassignedMembers.map((m) => (
                <MemberNode
                  key={m._id || m.id}
                  member={m}
                  kinship={kinshipMap.get(m._id?.toString() || m.id?.toString())}
                  viewMode={viewMode}
                  onClick={() => handleNodeClick(m)}
                />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ================= INTERACTIVE MEMBER DETAILS MODAL ================= */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setSelectedMember(null)} />

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
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-sky-400 ring-4 ring-sky-500/10 shadow-md"
                  />
                ) : null}
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-md"
                  style={{ display: selectedMember.avatar ? 'none' : 'flex' }}
                >
                  {selectedMember.name ? selectedMember.name.slice(0, 2).toUpperCase() : 'FM'}
                </div>
                {selectedMember.role === 'ADMIN' && (
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs" title="Vault Admin">
                    <Crown className="w-3 h-3" />
                  </span>
                )}
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {selectedMember.name}
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs font-semibold text-sky-500 dark:text-sky-400">
                    {kinshipMap.get(selectedMember._id?.toString() || selectedMember.id?.toString())?.title || selectedMember.relationship || 'Member'}
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
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Droplet size={14} className="text-rose-500" />
                  <span>Blood Group:</span>
                </span>
                <span className="font-bold text-red-600 dark:text-red-400 font-mono text-sm">
                  {selectedMember.bloodGroup || 'Not specified'}
                </span>
              </div>

              {/* Health Insurance Status */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#121622] border border-slate-200 dark:border-[#1E293B] flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Shield size={14} className="text-emerald-500" />
                  <span>Health Insurance:</span>
                </span>
                <span className={`font-semibold ${selectedMember.healthInsurancePolicy ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {selectedMember.healthInsurancePolicy || 'Policy not added'}
                </span>
              </div>

              {selectedMember.phone && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#121622] border border-slate-200 dark:border-[#1E293B] flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Phone size={14} className="text-sky-500" />
                    <span>Phone:</span>
                  </span>
                  <a href={`tel:${selectedMember.phone}`} className="font-semibold text-sky-500 hover:underline">
                    {selectedMember.phone}
                  </a>
                </div>
              )}

              {/* Document Recorded Father */}
              {selectedMember.fatherOrSpouseName && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#121622] border border-slate-200 dark:border-[#1E293B] flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <FileText size={14} className="text-amber-500" />
                    <span>Document Parent:</span>
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedMember.fatherOrSpouseName}
                  </span>
                </div>
              )}

              {/* Document Recorded Spouse */}
              {selectedMember.spouseName && (
                <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-between">
                  <span className="text-pink-400 font-medium flex items-center gap-1.5">
                    <span>💍 Spouse:</span>
                  </span>
                  <strong className="text-slate-900 dark:text-white">{selectedMember.spouseName}</strong>
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

// ================= FAMILY UNIT CARD (Couple + Their Respective Children) =================
function FamilyUnitCard({
  title,
  husband,
  wife,
  children = [],
  kinshipMap,
  viewMode,
  onNodeClick,
  onAddHusband,
  onAddWife,
  onAddChild,
  childButtonLabel = '+ Add Child',
}) {
  return (
    <div className="flex flex-col items-center p-5 sm:p-6 rounded-3xl bg-slate-100/80 dark:bg-[#121622]/80 border border-slate-200 dark:border-[#1E293B] shadow-sm relative min-w-[300px] max-w-xl">
      
      {/* Unit Header Badge */}
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-4 px-3 py-0.5 rounded-full bg-slate-200 dark:bg-[#1A202C] border border-slate-300 dark:border-[#2D3748]">
        {title}
      </div>

      {/* Couple Bridge (Husband + Spouse Bridge + Wife) */}
      <div className="flex items-center gap-4 sm:gap-6 relative">
        {husband ? (
          <MemberNode
            member={husband}
            kinship={kinshipMap.get(husband._id?.toString() || husband.id?.toString())}
            viewMode={viewMode}
            onClick={() => onNodeClick(husband)}
          />
        ) : (
          <GhostMemberNode
            title={title.includes('Papa') ? '+ Add Papa' : title.includes('Tauji') ? '+ Add Tauji' : '+ Add Chacha'}
            roleLabel={title.includes('Tauji') ? 'Tauji' : 'Chacha'}
            icon="👨"
            onClick={onAddHusband}
          />
        )}

        {/* Spouse Link Bridge */}
        <div className="flex flex-col items-center justify-center px-1">
          <div className="w-8 sm:w-12 h-0.5 bg-gradient-to-r from-sky-400 via-pink-400 to-sky-400 animate-pulse" />
          <span className="text-[10px] font-bold text-pink-500 dark:text-pink-400 mt-1 flex items-center gap-0.5 whitespace-nowrap bg-pink-500/10 px-1.5 py-0.5 rounded-full border border-pink-500/20">
            💍 Spouse
          </span>
          <div className="w-8 sm:w-12 h-0.5 bg-gradient-to-r from-sky-400 via-pink-400 to-sky-400 animate-pulse mt-1" />
        </div>

        {wife ? (
          <MemberNode
            member={wife}
            kinship={kinshipMap.get(wife._id?.toString() || wife.id?.toString())}
            viewMode={viewMode}
            onClick={() => onNodeClick(wife)}
          />
        ) : (
          <GhostMemberNode
            title={title.includes('Papa') ? '+ Add Mummy' : title.includes('Tauji') ? '+ Add Taiji' : '+ Add Chachi'}
            roleLabel={title.includes('Tauji') ? 'Taiji' : 'Chachi'}
            icon="👩"
            onClick={onAddWife}
          />
        )}
      </div>

      {/* Vertical Branch Downward to this Couple's Children */}
      <div className="flex flex-col items-center mt-4">
        <div className="w-0.5 h-6 bg-gradient-to-b from-sky-400 to-emerald-400" />
        <div className="w-36 sm:w-56 h-0.5 bg-sky-400/40 rounded-full" />
      </div>

      {/* Children of this Couple */}
      <div className="flex flex-wrap items-center justify-center gap-6 mt-4">
        {children.map((child) => (
          <MemberNode
            key={child._id || child.id}
            member={child}
            kinship={kinshipMap.get(child._id?.toString() || child.id?.toString())}
            viewMode={viewMode}
            onClick={() => onNodeClick(child)}
            isChild
          />
        ))}

        {/* 1-Tap Add Child directly under this specific Couple */}
        <button
          type="button"
          onClick={onAddChild}
          className="group flex flex-col items-center cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
          title={`Add child under ${husband?.name || 'this family unit'}`}
        >
          <div className="w-12 h-12 rounded-full border border-dashed border-emerald-400/50 hover:border-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 flex items-center justify-center text-emerald-500 transition-all">
            <span className="text-lg group-hover:scale-110 transition-transform">➕</span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1.5 whitespace-nowrap">
            {childButtonLabel}
          </span>
        </button>
      </div>

    </div>
  );
}

// Rounded Profile Node Component (Adaptive for Tree & Medical Radar Views)
function MemberNode({ member, kinship, viewMode = 'tree', onClick, isChild = false }) {
  const [imgFailed, setImgFailed] = useState(false);

  const displayName = kinship?.title || member.relationship || 'Member';
  const displayIcon = kinship?.icon || '👤';

  return (
    <div
      onClick={onClick}
      className="group flex flex-col items-center cursor-pointer transition-all duration-300 hover:-translate-y-1"
    >
      {/* Rounded Circular Profile Node */}
      <div className="relative">
        <div
          className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full p-1 bg-white dark:bg-[#121622] border-2 shadow-md transition-all overflow-hidden flex items-center justify-center ${
            viewMode === 'medical'
              ? member.bloodGroup
                ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-rose-500/20'
                : 'border-slate-300 dark:border-slate-700'
              : 'border-slate-300 dark:border-[#1E293B] group-hover:border-sky-400 shadow-sky-500/10'
          }`}
        >
          {member.avatar && !imgFailed ? (
            <img
              src={member.avatar}
              alt={member.name}
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center text-white font-bold text-xs sm:text-sm md:text-base">
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

        {/* Medical Blood Badge (Glowing in Medical Mode) */}
        {member.bloodGroup && (
          <span
            className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold font-mono text-white shadow-xs ring-2 ring-white dark:ring-[#090A0F] ${
              viewMode === 'medical' ? 'bg-rose-600 animate-pulse scale-110' : 'bg-red-500'
            }`}
          >
            {member.bloodGroup}
          </span>
        )}
      </div>

      {/* Name & Relation Labels */}
      <div className="mt-2.5 text-center max-w-[120px] sm:max-w-[140px]">
        <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors">
          {member.name}
        </div>
        
        {viewMode === 'medical' ? (
          <div className="mt-1 flex items-center justify-center gap-1">
            {member.healthInsurancePolicy ? (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                🛡️ Insured
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                No Policy
              </span>
            )}
          </div>
        ) : (
          <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-sky-500/10 text-sky-400 border-sky-500/20 max-w-[130px] truncate">
            <span>{displayIcon}</span>
            <span className="truncate">{displayName}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// 1-Tap Ghost Placeholder Node for Empty Family Slots
function GhostMemberNode({ title, roleLabel, icon = '➕', onClick }) {
  return (
    <div
      onClick={onClick}
      className="group flex flex-col items-center cursor-pointer transition-all duration-300 hover:-translate-y-1"
      title={`Click to add ${roleLabel}`}
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 bg-white/40 dark:bg-[#121622]/40 border-2 border-dashed border-sky-400/40 group-hover:border-sky-400 group-hover:bg-sky-500/10 shadow-xs group-hover:shadow-sky-500/20 group-hover:shadow-md transition-all flex flex-col items-center justify-center text-sky-500">
        <span className="text-xl sm:text-2xl group-hover:scale-110 transition-transform">
          {icon}
        </span>
      </div>

      <div className="mt-2.5 text-center max-w-[120px] sm:max-w-[140px]">
        <div className="font-semibold text-xs text-sky-600 dark:text-sky-400 group-hover:underline transition-colors flex items-center justify-center gap-1">
          <span>{title}</span>
        </div>
        <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-sky-500/20 bg-sky-500/5 text-sky-500 dark:text-sky-400">
          <span>Slot Empty</span>
        </div>
      </div>
    </div>
  );
}
