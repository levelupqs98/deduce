import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { DeduceType } from './Deduce';
import { BasePackItem, BaseRoomItem } from './Message';
import { WebSocketConfig, UserConfig } from './Config';

export interface Flags {
  init: boolean;
}

export interface PlayerInfo {
  id?: string;
  havePot: number;
  usedPot: number;
  remainPot: number;
}

export interface EntryInfo {
  [key: string]: number;
}

export interface DeduceInfo {
  type: keyof DeduceType;
  entry: string[];
}

export interface SocketInterface extends EventEmitter {
  options: WebSocketConfig;
  socket?: WebSocket;
  send(message: string): void;
}

export interface LoggerInterface {
  log(message: string): void;
  info(message: string): void;
  notice(message: string): void;
  warn(message: string): void;
  debug(message: string): void;
  error(message: string): void;
}

export interface DeduceInterface {
  flags: Flags;
  player: PlayerInfo;
  logger: LoggerInterface;
  userConfig: UserConfig;
  statuList: Set<string>;
  entryInfo: EntryInfo;
  deduceInfo: DeduceInfo;
  packItemList: Array<BasePackItem>;
  roomItemList: Array<BaseRoomItem>;
  socket?: SocketInterface;
}
