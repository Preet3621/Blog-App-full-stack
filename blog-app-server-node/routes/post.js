import express from 'express';
import PostController from '../controllers/PostController.js';
import authMiddleware from '../middleware/auth.js';
import multer from 'multer';
import path from 'path'; // Add this import

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

const router = express.Router();

router.post('/', authMiddleware, upload.single('image'), PostController.createPost);
router.get('/', PostController.getPosts); // Public route to view all posts
router.get('/:id', PostController.getPostById);
router.put('/:id', authMiddleware, upload.single('image'), PostController.updatePost);
router.delete('/:id', authMiddleware, PostController.deletePost);
router.post('/:id/like', authMiddleware, PostController.likePost);
router.post('/:id/comment', authMiddleware, PostController.commentOnPost);

export default router;