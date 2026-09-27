import type { RegionColor } from '../types/game';

export const DEFAULT_COLORS: RegionColor[] = [
  { id: 0, name: '青翠綠', hex: '#98c87b', bgHex: '#98c87b', borderHex: '#7fa865' },
  { id: 1, name: '深松綠', hex: '#487a55', bgHex: '#487a55', borderHex: '#3b6546' },
  { id: 2, name: '湖水青', hex: '#4ea1b8', bgHex: '#4ea1b8', borderHex: '#3c8498' },
  { id: 3, name: '霧霾藍', hex: '#537198', bgHex: '#537198', borderHex: '#405979' },
  { id: 4, name: '丁香紫', hex: '#7a76c8', bgHex: '#7a76c8', borderHex: '#635fa5' },
  { id: 5, name: '櫻花粉', hex: '#e49acb', bgHex: '#e49acb', borderHex: '#be7aa6' },
  { id: 6, name: '玫瑰豆沙', hex: '#b36a81', bgHex: '#b36a81', borderHex: '#945369' },
  { id: 7, name: '栗子棕', hex: '#8a6048', bgHex: '#8a6048', borderHex: '#704c38' },
  { id: 8, name: '暖暖黃', hex: '#f2cc81', bgHex: '#f2cc81', borderHex: '#caa966' },
  { id: 9, name: '芥末金', hex: '#bf9b37', bgHex: '#bf9b37', borderHex: '#9e7f2b' },
  { id: 10, name: '焦糖橘', hex: '#d97d43', bgHex: '#d97d43', borderHex: '#b46331' },
  { id: 11, name: '珊瑚紅', hex: '#ce5757', bgHex: '#ce5757', borderHex: '#a94141' },
  { id: 12, name: '晴空藍', hex: '#58a4e8', bgHex: '#58a4e8', borderHex: '#4184c1' },
  { id: 13, name: '薰衣草', hex: '#9d7ad2', bgHex: '#9d7ad2', borderHex: '#805fb3' },
  { id: 14, name: '薄荷綠', hex: '#52c4a2', bgHex: '#52c4a2', borderHex: '#3da587' },
  { id: 15, name: '蜜桃橙', hex: '#f59876', bgHex: '#f59876', borderHex: '#cb7555' },
  { id: 16, name: '摩卡咖', hex: '#a67d65', bgHex: '#a67d65', borderHex: '#855f4a' },
  { id: 17, name: '紫羅蘭', hex: '#8f4f78', bgHex: '#8f4f78', borderHex: '#743b60' },
  { id: 18, name: '鼠尾草', hex: '#779e7e', bgHex: '#779e7e', borderHex: '#5c8063' },
  { id: 19, name: '石板灰', hex: '#688291', bgHex: '#688291', borderHex: '#506774' },
];

// 預設 10×10 初始盤面
export const DEFAULT_INITIAL_GRID: number[][] = [
  [1, 1, 1, 1, 9, 9, 9, 9, 9, 9],
  [0, 0, 0, 1, 1, 7, 9, 9, 9, 9],
  [6, 6, 0, 1, 1, 7, 7, 7, 7, 7],
  [6, 6, 0, 0, 0, 3, 7, 7, 5, 5],
  [6, 6, 2, 2, 0, 3, 3, 3, 5, 5],
  [6, 6, 2, 2, 0, 8, 3, 5, 5, 5],
  [6, 6, 2, 2, 0, 8, 8, 8, 8, 8],
  [2, 6, 2, 2, 0, 4, 4, 4, 4, 8],
  [2, 6, 2, 2, 0, 0, 0, 4, 4, 0],
  [2, 2, 2, 2, 2, 2, 0, 0, 0, 0],
];

