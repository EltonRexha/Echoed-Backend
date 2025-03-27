import { Router } from 'express';
import localUserAuthenticated from '../middlewares/localUserAuthenticated';
import {
  createPost,
  deletePost,
  getPost,
  likePost,
  savePost,
  uploadPostImage,
  uploadPostVideo,
} from '../controllers/postController';
import {
  postComment,
  likeComment,
  saveComment,
  getComments,
  uploadCommentImage,
  uploadCommentVideos,
  deleteComment,
} from '../controllers/commentController';

const router = Router();

router.post('/', localUserAuthenticated, createPost);
router.get('/', getPost);
router.delete('/:postId', localUserAuthenticated, deletePost);
router.delete('/comments/:commentId', localUserAuthenticated, deleteComment);
router.get('/comments', getComments);
router.post('/:postId/images', localUserAuthenticated, uploadPostImage);
router.post('/:postId/videos', localUserAuthenticated, uploadPostVideo);
router.post('/:postId/like', localUserAuthenticated, likePost);
router.post('/:postId/save', localUserAuthenticated, savePost);
router.post('/:postId/comments', localUserAuthenticated, postComment);
router.post('/comments/:commentId/like', localUserAuthenticated, likeComment);
router.post('/comments/:commentId/save', localUserAuthenticated, saveComment);
router.post(
  '/comments/:commentId/images',
  localUserAuthenticated,
  uploadCommentImage
);
router.post(
  '/comments/:commentId/videos',
  localUserAuthenticated,
  uploadCommentVideos
);

export default router;
