const express = require('express');
const {
  createActionItem,
  getActionItems,
  getActionItemById,
  updateActionItem,
  deleteActionItem,
} = require('../controllers/actionItemController');
const validate = require('../middleware/validate');
const authMiddleware = require('../middleware/auth');
const {
  createActionItemSchema,
  updateActionItemSchema,
} = require('../schemas/actionItemSchemas');

const router = express.Router();

// All action item endpoints require authentication
router.use(authMiddleware);

router.post('/', validate(createActionItemSchema), createActionItem);
router.get('/', getActionItems);
router.get('/:id', getActionItemById);
router.put('/:id', validate(updateActionItemSchema), updateActionItem);
router.delete('/:id', deleteActionItem);

module.exports = router;
