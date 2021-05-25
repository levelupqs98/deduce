import { DeduceInterface } from '../types/System';
import { Score } from '../types/Message';
import { checkFyStatu, checkXluStatu, checkFoodStatu } from '../utils/checkStatus';

export default (deduce: DeduceInterface) => (data: Score): void => {
  const { accessories, deduceConfig, entryInfo, playerInfo, flags } = deduce;
  if (!flags.init) {
    flags.init = true;
    playerInfo.havePot = data.pot;
    deduce.logger.log(`获取剩余潜能成功：${playerInfo.havePot}`);
    deduce.socket?.send('stopstate,pack');
    setTimeout(() => {
      flags.begin = true;
      if (accessories.fy) checkFyStatu(deduce);
      if (accessories.xlu) checkXluStatu(deduce);
      if (accessories.food) checkFoodStatu(deduce);
      deduce.socket?.send('zc typelv test');
    }, 5e3);
  } else {
    const entryInfoKeys = Object.keys(entryInfo);
    const priorEntrys = deduceConfig.entrys.filter((entry) => entry.prior);
    playerInfo.usedPot += playerInfo.havePot - data.pot;
    playerInfo.realUsedPot += playerInfo.havePot - data.pot;
    playerInfo.havePot = data.pot;
    if (
      priorEntrys.length > 0 && deduceConfig.type === '内功'
        ? entryInfoKeys.length >= 2
        : entryInfoKeys.length >= 1
    ) {
      if (
        entryInfoKeys.some((entryName) => {
          const isPrior = priorEntrys.some(({ entry }) => entry === entryName);
          const levelOk = isPrior && entryInfo[entryName] * 100000 <= playerInfo.usedPot;
          return levelOk;
        })
      ) {
        deduce.socket?.send('stopstate');
      }
      if (
        !priorEntrys.every((e) => entryInfoKeys.includes(e.entry) && entryInfo[e.entry] >= e.level)
      ) {
        return;
      }
    }

    if (entryInfoKeys.some((key) => entryInfo[key] * 100000 <= playerInfo.usedPot)) {
      deduce.socket?.send('stopstate');
    }
  }
};
