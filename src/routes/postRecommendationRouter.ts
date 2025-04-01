import {Router} from 'express';
import localUserAuthenticated from '../middlewares/localUserAuthenticated';
import { getForYouPosts } from '../controllers/recommendationController';
const router = Router();

router.get('/for-you', localUserAuthenticated, getForYouPosts);

export default router;