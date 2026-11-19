import express from 'express';
import AuditLog from '../models/AuditLog.js';
import { isConnected } from '../config/db.js';
import { memoryStore } from '../config/seed.js';
import {
  recordAuditLog,
  verifyChainIntegrity,
  generateEvidenceManifest,
  GENESIS_HASH,
} from '../services/auditService.js';

const router = express.Router();

// GET /api/audit
router.get('/', async (req, res) => {
  try {
    const { action, limit = 100 } = req.query;
    const targetFamilyId = req.familyId || req.user?.familyId;

    if (!targetFamilyId) {
      return res.json({ logs: [], total: 0, headHash: GENESIS_HASH });
    }

    let logs = [];
    let total = 0;

    if (isConnected) {
      try {
        const query = { familyId: targetFamilyId };
        if (action && action !== 'ALL') {
          query.action = action;
        }

        logs = await AuditLog.find(query)
          .sort({ timestamp: -1, _id: -1 })
          .limit(parseInt(limit));
        total = await AuditLog.countDocuments({ familyId: targetFamilyId });
      } catch (dbErr) {
        console.warn('[Audit Routes] MongoDB query failed, falling back to memory store:', dbErr.message);
      }
    }

    // Fallback if no logs found in Mongo or Mongo not connected
    if (!logs.length && Array.isArray(memoryStore.auditLogs)) {
      let memLogs = memoryStore.auditLogs.filter(
        (l) => !l.familyId || l.familyId.toString() === targetFamilyId.toString()
      );
      if (action && action !== 'ALL') {
        memLogs = memLogs.filter((l) => l.action === action);
      }
      total = memLogs.length;
      logs = memLogs.slice(0, parseInt(limit));
    }

    const headHash = logs[0]?.sha256ChainHash || GENESIS_HASH;

    res.json({
      logs,
      total,
      headHash,
    });
  } catch (err) {
    console.error('[Audit Routes Error]', err);
    res.status(500).json({ error: 'Failed to retrieve audit ledger logs' });
  }
});

// GET /api/audit/manifest
router.get('/manifest', async (req, res) => {
  try {
    const targetFamilyId = req.familyId || req.user?.familyId;
    const manifest = await generateEvidenceManifest(targetFamilyId);
    res.json(manifest);
  } catch (err) {
    console.error('[Audit Manifest Error]', err);
    res.status(500).json({ error: 'Failed to generate cryptographic evidence manifest' });
  }
});

// POST /api/audit/verify
router.post('/verify', async (req, res) => {
  try {
    const targetFamilyId = req.familyId || req.user?.familyId;
    if (!targetFamilyId) {
      return res.status(400).json({ error: 'Family Vault ID required for verification' });
    }

    const result = await verifyChainIntegrity(targetFamilyId);

    if (result.isValid && result.totalBlocks > 0) {
      // Record verification event in ledger
      await recordAuditLog({
        familyId: targetFamilyId,
        action: 'INTEGRITY_CHECK_PASSED',
        performedBy: req.user?._id,
        performerName: req.user?.name || 'Family Custodian',
        details: {
          totalBlocks: result.totalBlocks,
          headHash: result.headHash,
          status: '100%_MATHEMATICALLY_VERIFIED',
        },
        req,
      });
    }

    res.json(result);
  } catch (err) {
    console.error('[Audit Verify Error]', err);
    res.status(500).json({ error: 'Failed to perform chain integrity verification' });
  }
});

export default router;
