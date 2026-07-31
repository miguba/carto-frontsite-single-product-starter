import { Lang } from '../config/lang.config';

export const i18n = (msg: string, defaultCom?: any, vars?: any) => {
  const com = Lang[msg] || defaultCom;

  if (!com) return msg;

  if (typeof com === 'string') return com;

  if (typeof com === 'function' && !vars) return com;

  if (typeof com === 'function') return com({ ...vars });

  return com;
};
