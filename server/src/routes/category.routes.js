import express from 'express';
import { memoryStore } from '../config/seed.js';

const router = express.Router();

// GET /api/categories
router.get('/', (req, res) => {
  const categories = memoryStore.categories.map(cat => {
    const docs = memoryStore.documents.filter(d => d.category.toLowerCase() === cat.name.toLowerCase());
    return {
      ...cat,
      documentCount: docs.length,
    };
  });
  res.json({ categories });
});

// POST /api/categories
router.post('/', (req, res) => {
  const { name, icon, color, description } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const exists = memoryStore.categories.some(c => c.slug === slug);
  if (exists) {
    return res.status(400).json({ error: 'A category with this name already exists' });
  }

  const newCat = {
    _id: 'cat_' + Date.now(),
    name,
    slug,
    icon: icon || 'folder',
    color: color || '#2563EB',
    description: description || '',
    familyId: memoryStore.families[0]._id,
    documentCount: 0,
    createdAt: new Date(),
  };

  memoryStore.categories.push(newCat);

  res.status(201).json({
    success: true,
    category: newCat,
    message: `Category "${name}" created successfully.`,
  });
});

export default router;
