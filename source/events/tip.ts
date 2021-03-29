import { checkXluStatu } from '../utils/checkStatus';
import { DeduceInterface } from '../types/System';
import { Tip } from '../types/Message';
import { entryFormat, tipFormat } from '../utils/formatTool';
import { getTypeCodeByName, findNameByAttr } from '../utils/entryTool';

export default (deduce: DeduceInterface) => (data: Tip): void => {
  const msg: string = tipFormat(data.message);
  const { flags, deduceConfig, logger, entryInfo, playerInfo } = deduce;

  if (!deduce.flags.begin) {
    return;
  }

  if (msg.includes('已经没法点燃了')) {
    const xluIndex = deduce.packItemList.findIndex((item) =>
      /香炉|沉香木鼎|麝香铜鼎|龙涎香熏|龙脑古鼎/.test(item.name),
    );

    deduce.packItemList.splice(xluIndex, 1);
    checkXluStatu(deduce);
  }

  if (msg.includes('有了更深入的理解')) {
    deduce.socket?.send('score');
  }

  if (msg.includes('你身上的武道书不够')) {
    logger.error(`自创无${deduceConfig.type}位置，武道书不足无法增加位置，退出任务`);
  }

  if (/本次消耗会累计到下次使用|你的武功已经可以装备/.test(msg)) {
    deduce.socket?.send(`zc typelv ${getTypeCodeByName(deduceConfig.type)}`);
  }

  if (/你的.+?没有这种功能/.test(msg)) {
    [, playerInfo.bookName] = <RegExpMatchArray>msg.match(/你的(.+?)没有这种功能/);
    deduce.socket?.send(`zc typeadd ${getTypeCodeByName(deduceConfig.type)} ok`);
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
    const allLevelZero = deduceConfig.entrys.every((entry) => entry.level === 0);
    const allLevelOk = deduceConfig.entrys.every(
      (info) => info.entry in entryInfo && entryInfo[info.entry] >= info.level,
    );
    if (!allLevelZero && allLevelOk) {
      logger.log(`已达到停止条件：词条均达到指定等级。`);
      const roomXlu = deduce.roomItemList.find((item) =>
        /香炉|沉香木鼎|麝香铜鼎|龙涎香熏|龙脑古鼎/.test(item.name),
      );
      deduce.socket?.send('stopstate');
      if (roomXlu) {
        deduce.socket?.send(`get ${roomXlu.id}`);
      }
      deduce.socket?.send('xiulian');
      process.exit();
    }

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
    if (flags.firstLevelUp) {
      flags.firstLevelUp = false;
      const book = deduce.packItemList.find((item) =>
        item.name.includes(<string>playerInfo.bookName),
      );

      if (!book) {
        logger.warn('未在包裹里找到自创秘籍。');
        deduce.socket?.send(`zc typelv ${getTypeCodeByName(deduceConfig.type)}`);
      } else {
        deduce.socket?.send(`packitem zc2 ${book.id}`);
      }
    } else {
      deduce.socket?.send(`zc typelv ${getTypeCodeByName(deduceConfig.type)}`);
    }
    const allLevelZero = deduceConfig.entrys.every((entry) => entry.level === 0);
    const allLevelOk = deduceConfig.entrys.every(
      (info) => info.entry in entryInfo && entryInfo[info.entry] >= info.level,
    );

    if (!allLevelZero && allLevelOk) {
      logger.log(`已达到停止条件：词条均达到指定等级。`);
      const roomXlu = deduce.roomItemList.find((item) =>
        /香炉|沉香木鼎|麝香铜鼎|龙涎香熏|龙脑古鼎/.test(item.name),
      );
      deduce.socket?.send('stopstate');
      if (roomXlu) {
        deduce.socket?.send(`get ${roomXlu.id}`);
      }
      deduce.socket?.send('xiulian');
      process.exit();
    }
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
        const isWant: boolean = deduceConfig.entrys.some(({ entry }) => {
          if (entry !== attrName) {
            return false;
          }
          const allLevelOk = deduceConfig.entrys.every((info) =>
            deduceConfig.overEntry === info.entry
              ? true
              : info.entry in entryInfo && entryInfo[info.entry] >= info.level,
          );
          if (deduceConfig.overEntry === attrName) {
            return !!allLevelOk;
          }
          return true;
        });

        if (isWant) {
          deduce.socket?.send(`zc prop ${getTypeCodeByName(deduceConfig.type)} add`);
          logger.log(`获得新属性，属性为所需，添加新属性：${attrName}。`);
          entryInfo[attrName] = 1;
          if (deduceConfig.overEntry === attrName) {
            logger.log(`已达到停止条件：获得词条[${attrName}]。`);
            const roomXlu = deduce.roomItemList.find((item) =>
              /香炉|沉香木鼎|麝香铜鼎|龙涎香熏|龙脑古鼎/.test(item.name),
            );
            if (roomXlu) {
              deduce.socket?.send(`get ${roomXlu.id}`);
            }
            deduce.socket?.send('xiulian');
            process.exit();
          }
        } else {
          deduce.socket?.send(`zc prop ${getTypeCodeByName(deduceConfig.type)} ban`);
          logger.log(
            deduceConfig.overEntry === attrName
              ? `获得新属性，属性不需要(各词条未达到指定等级)，放弃新属性：${attrName}`
              : `获得新属性，属性不需要，放弃新属性：${attrName}。`,
          );
        }
      }
    });
    deduce.socket?.send(`zc typelv ${getTypeCodeByName(deduceConfig.type)}`);
  }
};
