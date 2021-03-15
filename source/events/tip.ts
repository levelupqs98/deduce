import { DeduceInterface } from '../types/System';
import { Tip } from '../types/Message';
import { entryFormat, tipFormat } from '../utils/formatTool';
import { getTypeCodeByName, findNameByAttr } from '../utils/entryTool';

export default (deduce: DeduceInterface) => (data: Tip): void => {
  const msg: string = tipFormat(data.message);
  const { deduceConfig, logger, entryInfo, playerInfo } = deduce;

  if (!deduce.flags.begin) {
    return;
  }

  if (msg.includes('有了更深入的理解')) {
    deduce.socket?.send('score');
  }

  if (msg.includes('你身上的武道书不够')) {
    logger.error(`自创无${deduceConfig.type}位置，武道书不足无法增加位置，退出任务`);
  }

  if (msg.includes('本次消耗会累计到下次使用')) {
    deduce.socket?.send(`zc typelv ${getTypeCodeByName(deduceConfig.type)}`);
  }

  if (/你的.+?没有这种功能/.test(msg)) {
    [, playerInfo.bookName] = <RegExpMatchArray>msg.match(/你的(.+?)没有这种功能/);
    deduce.socket?.send(`zc typeadd ${getTypeCodeByName(deduceConfig.type)} ok`);
  }

  if (msg.includes('你的武功已经可以装备')) {
    const book = deduce.packItemList.find((item) =>
      item.name.includes(<string>playerInfo.bookName),
    );

    if (!book) {
      logger.error('未在包裹里找到自创秘籍。');
      process.exit();
    }
    deduce.socket?.send(`packitem zc2 ${book.id}`);
  }

  if (msg.includes('增加其它可装备类型')) {
    const deduceTypeInfo = msg
      .split('\n\n')
      .find((type) => type.includes(`可装备为${deduceConfig.type}`));
    if (!deduceTypeInfo) {
      logger.error('未找到推演位置信息。');
      process.exit();
    }

    deduceTypeInfo
      .split('\n')
      .filter((str) => str.includes('('))
      .forEach((attr) => {
        const attrName = findNameByAttr(deduce.deduceConfig.type, entryFormat(attr));
        const attrLevel = attr.match(/.+\((\d+)\)(?<=\))$/);
        if (!attrName || !attrLevel) {
          logger.error(`获取属性信息失败，属性为：${attr}。`);
        } else {
          entryInfo[attrName] = Number(attrLevel[1]);
        }
      });
    deduce.socket?.send(`zc typelv ${getTypeCodeByName(deduceConfig.type)}`);
  }

  if (msg.includes('属性获得提升')) {
    msg
      .split(/\n/)
      .filter((str: string) => str.includes('-->'))
      .forEach((attr: string) => {
        const attrName = findNameByAttr(
          deduce.deduceConfig.type,
          entryFormat(attr.split('-->')[0]),
        );
        const attrLevel = attr.match(/\((\d+)\)-->.+?\((\d+)\)(?<=\))$/);
        if (!attrName || !attrLevel || attrLevel.length < 3) {
          logger.error(`获取属性名失败，属性为：${attr.split('-->')[0]}。`);
        } else {
          const lastLevel = Number(attrLevel[1]);
          const nowLevel = Number(attrLevel[2]);
          const attrNum = attr.split('-->')[1].replace(/.+?：|\((\d+)\)(?<=\))$/g, '');
          entryInfo[attrName] = nowLevel;
          playerInfo.usedPot -=
            (((nowLevel + lastLevel - 1) * (nowLevel - lastLevel)) / 2) * 100000;
          playerInfo.usedPot = playerInfo.usedPot < 0 ? 0 : playerInfo.usedPot;
          logger.log(
            `${attrName}属性由${lastLevel}级升级到${nowLevel}级，当前属性值：${attrNum}，当前剩余潜能：${playerInfo.havePot}。`,
          );
        }
      });
    deduce.socket?.send(`zc typelv ${getTypeCodeByName(deduceConfig.type)}`);
  }

  if (msg.includes('你还有未使用的')) {
    const attrList = msg.split(/\n/);
    attrList.pop();
    attrList.shift();
    attrList.forEach((attr) => {
      const attrName = findNameByAttr(deduce.deduceConfig.type, entryFormat(attr));
      if (!attrName) {
        logger.error(`获取属性名失败，已放弃，属性为：${attr}。`);
        deduce.socket?.send(`zc prop ${getTypeCodeByName(deduceConfig.type)} ban`);
      } else {
        const isWant: boolean = deduceConfig.entrys.includes(attrName);
        if (isWant) {
          deduce.socket?.send(`zc prop ${getTypeCodeByName(deduceConfig.type)} add`);
          logger.log(`获得新属性，属性为所需，添加新属性：${attrName}。`);
          entryInfo[attrName] = 1;
        } else {
          deduce.socket?.send(`zc prop ${getTypeCodeByName(deduceConfig.type)} ban`);
          logger.log(`获得新属性，属性不需要，放弃新属性：${attrName}。`);
        }
      }
    });
    deduce.socket?.send(`zc typelv ${getTypeCodeByName(deduceConfig.type)}`);
  }
};
