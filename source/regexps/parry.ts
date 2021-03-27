import { DeduceParry } from '../types/Deduce';
import dodge from './dodge';

export default {
  ...dodge,
  练习效率: /^练习效率%$/,
  学习效率: /^学习效率%$/,
  打坐效率: /^打坐效率%$/,
  反击: /^招架成功后顺势反击敌人，对敌人造成%伤害\(移花\)$/,
  乾坤: /^当你招架后增加%伤害减免，招架成功叠加两层，最多叠加层\(乾坤\)$/,
  纵横: /^当你招架成功后增加%命中，可叠加层\(纵横\)$/,
} as DeduceParry;
