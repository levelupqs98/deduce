import { DeduceInterface } from '../types/System';
import { MessageMap } from '../types/Message';

export default (deduce: DeduceInterface) => (data: MessageMap['login']): void => {
  const { player } = deduce;
  deduce.socket?.send('score');
  player.id = data.id;
  deduce.logger.log(`登陆成功，角色id：${data.id}。`);
};
