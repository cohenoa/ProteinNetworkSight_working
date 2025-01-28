import { Font } from "three/examples/jsm/loaders/FontLoader";
import { IOthers } from "./forms";
import { threshMap } from "./global";
/*
  This file define all the props interface - the argument for components.
*/

export interface nameStatus {
  accepted: boolean,
}

export interface replaceNameStatus extends nameStatus {
  string_name: string,
  string_id: string,
}

export interface formRef {
  getFormData: () => Record<string, string>;
}

export interface graphRef extends React.RefObject<HTMLDivElement>{
  applyLayout: (name: string, animate: boolean) => void,
  setOpacity: (op: number) => void,
  setNodeSize: (size: number) => void,
  fetchData: () => void,
  btnSVGExportClick: () => void,
  btnPngClick: () => void,
  btnJsonClick: () => void,
}

// Interface for props of Father and ButtonComponent that includes formRef
export interface formRefProps {
  formRef: RefObject<formRef>;
}

export interface IErrorInputTextProps {
  orgName: string;
}

export interface IStepProps {
  step: number;
  goNextStep: () => void;
}

export interface IPanelProps {
  node: true | ICustomNode;
  onClickClose: () => void;
}

export interface IGraphProps {
  graphData: ICustomGraphData;
  clickedVector: string;
  thresholds: threshMap;
  // font: Font;
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
  clickedVector: string;
  thresholds: threshMap;
  setThresholds: React.Dispatch<React.SetStateAction<threshMap>>;
}

export interface ISwitchableProps {
  setNamesStringMap: React.Dispatch<
    React.SetStateAction<INamesStringMap | undefined>
  >;
  orgName: string;
  suggestions: { [key: string]: string };
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

export interface optionItem {
  label: string;
  value: string | number,
}

export interface SettingItem {
  title: string;
  default: optionItem;
  current: optionItem | null;
  options: optionItem[];
}

export interface GraphSettings {
  Layout: SettingItem,
  NodeSize: SettingItem,
  Opacity: SettingItem,
  fileType: SettingItem,
}

export interface GraphsStatus {
  [key: string]: GraphSettings;
}