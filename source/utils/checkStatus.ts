import { DeduceInterface } from '../types/System';

export function checkFyStatu(deduce: DeduceInterface) {
  if (deduce.statuList.has('fy')) {
    return;
  }
  const { accessories } = deduce;
  const fy = deduce.packItemList.find((item) => item.name.includes('飞翼剑'));
  if (!fy) {
    accessories.fy = false;
    deduce.logger.warn('未找到飞翼剑，续飞翼剑已关闭。');
  } else if (!deduce.statuList.has('fy')) {
    deduce.socket?.send(`stopstate,use ${fy.id}`);
  }
}

export function checkFoodStatu(deduce: DeduceInterface) {
  if (deduce.statuList.has('food')) {
    return;
  }
  const { accessories } = deduce;
  const food = deduce.packItemList.find((item) => item.name.includes('冰心丹'));
  if (!food) {
    accessories.food = false;
    deduce.logger.warn('未找到冰心丹，续冰心丹已关闭。');
  } else if (!deduce.statuList.has('food')) {
    deduce.socket?.send(`stopstate,use ${food.id}`);
  }
}

export function checkXluStatu(deduce: DeduceInterface) {
  if (deduce.statuList.has('xlu')) {
    return;
  }
  const { accessories } = deduce;
  const roomXlu = deduce.roomItemList.find((item) =>
    /香炉|沉香木鼎|麝香铜鼎|龙涎香熏|龙脑古鼎/.test(item.name),
  );
  const xlu = deduce.packItemList.find((item) =>
    /香炉|沉香木鼎|麝香铜鼎|龙涎香熏|龙脑古鼎/.test(item.name),
  );
  if (!xlu) {
    accessories.xlu = false;
    deduce.logger.warn('未找到香炉，续香炉已关闭。');
  } else if (!deduce.statuList.has('xlu')) {
    if (roomXlu) {
      deduce.socket?.send(`get ${roomXlu.id},drop 1 ${roomXlu.id}`);
    }
    deduce.socket?.send(`stopstate,use ${xlu.id}`);
  }
}
