import {Router} from 'express';
import localUserAuthenticated from '../middlewares/localUserAuthenticated';
import { getFollowingPosts, getForYouPosts } from '../controllers/recommendationController';
const router = Router();

router.get('/for-you', localUserAuthenticated, getForYouPosts);
router.get('/following', localUserAuthenticated, getFollowingPosts);

export default router;