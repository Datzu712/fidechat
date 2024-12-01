import { createContext } from 'react';
import { IUser } from '../interfaces/user';

export const UserContext = createContext<IUser>(null as unknown as IUser);
