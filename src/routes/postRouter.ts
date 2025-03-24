import { Router } from 'express';
import localUserAuthenticated from '../middlewares/localUserAuthenticated';
import {
  createPost,
  getPost,
  likePost,
  uploadPostImage,
  uploadPostVideo,
} from '../controllers/postController';
import { commentPost, likeComment, saveComment } from '../controllers/commentController';

const router = Router();

router.post('/', localUserAuthenticated, createPost);
router.get('/', getPost);
router.post('/:postId/images', localUserAuthenticated, uploadPostImage);
router.post('/:postId/videos', localUserAuthenticated, uploadPostVideo);
router.post('/:postId/like', localUserAuthenticated, likePost);
router.post('/:postId/comment', localUserAuthenticated, commentPost);
router.post('/comment/:commentId/like', localUserAuthenticated, likeComment);
router.post('/comment/:commentId/save', localUserAuthenticated, saveComment);

export default router;
