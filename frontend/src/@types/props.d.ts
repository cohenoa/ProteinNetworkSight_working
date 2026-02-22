import { Font } from "three/examples/jsm/loaders/FontLoader";
import { IOthers } from "./forms";
import { threshMap } from "./global";
import { SupportedLayout, SupportedNodeColor, SupportedNodeSize, SupportedOpacity } from "../common/GraphSettings";
import { ICustomNode } from "./graphs";
/*
  This file define all the props interface - the argument for components.
*/

export interface nameStatus {
  accepted: boolean,
}

export interface replaceNameStatus extends nameStatus {
  string_name: string,
  string_id: int,
}

export interface formRef {
  getFormData: () => Record<string, string>;
}

export type downloadFileTypes = 'svg' | 'png' | 'json';

interface GraphExposedMethods extends HTMLDivElement {
  fetchData: () => void,
  applyLayout: (name: SupportedLayout, animate: boolean) => void,
  applyNodeSize: (size: SupportedNodeSize) => void,
  applyOpacity: (op: SupportedOpacity) => void,
  applyNodeColor: (type: 'pos' | 'neg', color: SupportedNodeColor) => void
  getGraphBlob: (type: downloadFileTypes) => Blob | null,
  layoutRender: () => void
}

export interface graphRef extends React.RefObject<HTMLDivElement>{
  current: GraphExposedMethods | null;
}

// Interface for props of Father and ButtonComponent that includes formRef
export interface formRefProps {
  formRef: RefObject<formRef>;
}

export interface IErrorInputTextProps {
  orgName: string;
  stringName: string;
}

export interface IStepProps {
  step: number;
  goNextStep: () => void;
}

export interface IPanelProps {
  node: ICustomNode | null;
  organism: OptionType;
  onClickClose: () => void;
}

export interface IGraphProps {
  graphData: ICustomGraphData;
  clickedVector: string;
  alertLoading: () => void;
}

export interface IStepsBarProps {
  step: number;
}

export interface IButtonsProps{
  formId: string;
  buttons: IButtonConfig[];
}

export interface IVectorsButtonsProp {
  vectorsValues: string[];
  setClickedVector: React.Dispatch<React.SetStateAction<string>>;
  clickedVector: string;
}

export interface IGraphBarProps {
  openTable: boolean;
  setOpenTable: React.Dispatch<React.SetStateAction<boolean>>;
  nodesNum: number;
  linksNum: number;
  missingNodes: {orgName: string; value: number}[];
  thresholds: threshMap;
  setThresholds: React.Dispatch<React.SetStateAction<threshMap>>;
}

export interface ISwitchableProps {
  setNamesStringMap: React.Dispatch<React.SetStateAction<INamesStringMap | undefined>>;
  orgName: string;
  suggestions: { [key: string]: number };
  selected: string;
}

interface MenuItem {
  label: string;
  icon: IconProp;
  onClick?: () => void;
  submenu?: MenuItem[];
}

interface ContextMenuProps {
  position: { x: number; y: number };
  depth: number;
  items: MenuItem[];
}

interface nodePositions {
  [key: string]: position;
}

interface position {
  x: number,
  y: number,
}

interface IButtonConfig {
  label: string;
  type: "button" | "submit";
  className: string;
  onClick: () => void;
}

//___________________________________________
// generic option types:
//___________________________________________
export enum LayoutOptions {
  random = 'random',
  grid = 'grid',
  circle = 'circle',
  fcose = 'fcose',
  elk = 'elk',
  cise = 'cise',
  preset = 'preset',
}
export enum FileTypeOptions {
  svg = 'svg',
  png = 'png',
  json = 'json',
}
export enum NodeSizeOptions {
  '0.1' = 0.1,
  '0.25' = 0.25,
  '0.5' = 0.5,
  '1' = 1,
  '1.5' = 1.5,
  '3' = 3,
  '5' = 5,
  '10' = 10,
}
export enum OpacityOptions {
  '0.05' = 0.05,
  '0.2' = 0.2,
  '0.35' = 0.35,
  '0.5' = 0.5,
  '0.75' = 0.75,
  '0.9' = 0.9,
}
// export type LayoutOptions = 'random' | 'grid' | 'circle' | 'fcose' | 'elk' | 'cise' | 'preset';
// export type FileTypeOptions = 'svg' | 'png' | 'json';
// export type NodeSizeOptions = 0.1 | 0.25 | 0.5 | 1 | 1.5 | 3 | 5 | 10;
// export type OpacityOptions = 0.05 | 0.2 | 0.35 | 0.5 | 0.75 | 0.9;

// export interface optionItem {
//   label: string;
//   value: any;
// }

// interface SettingItem {
//   title: string;
//   default: optionItem;
//   current: optionItem | null;
//   options: optionItem[];
// }

// export interface GraphSettings {
//   Layout: LayoutSettingItem;
//   NodeSize: NodeSizeSettingItem;
//   Opacity: OpacitySettingItem;
//   fileType: FileTypeSettingItem;
// }

// // export interface GraphSettings {
// //   Layout: SettingItem,
// //   NodeSize: SettingItem,
// //   Opacity: SettingItem,
// //   fileType: SettingItem,
// // }

// interface GraphsStatus {
//   [key: string]: GraphSettings;
// }

// // ____________________________________________
// // specific interfaces for each option
// // ____________________________________________

// // Layout option interfaces:
// interface LayoutOptionItem extends optionItem {
//   value: LayoutOptions;
// }

// interface LayoutSettingItem extends SettingItem {
//   options: LayoutOptionItem[];
// }

// // NodeSize option interfaces:
// interface NodeSizeOptionItem extends optionItem {
//   value: NodeSizeOptions;
// }

// interface NodeSizeSettingItem extends SettingItem {
//   options: NodeSizeOptionItem[];
// }

// // Opacity option interfaces:
// interface OpacityOptionItem extends optionItem {
//   value: OpacityOptions;
// }

// interface OpacitySettingItem extends SettingItem {
//   options: OpacityOptionItem[];
// }

// // FileType option interfaces:
// interface FileTypeOptionItem extends optionItem {
//   value: FileTypeOptions;
// }

// interface FileTypeSettingItem extends SettingItem {
//   options: FileTypeOptionItem[];
// }


