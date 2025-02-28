import { User } from '../types/user';
import createJWT from './createJWT';

export default function (user: User): string {
    return createJWT(user, 15);
}
