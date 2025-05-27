

export const copySettings = (settings: GraphSettings, fullCopy: boolean = false): GraphSettings => {
    const layoutOptions = fullCopy? [...settings.Layout.options]: settings.Layout.options;
    const newSettings: GraphSettings = {...baseDownloadAllGraphSetting};

    for (const key in settings) {
        if (key === 'Layout') {
            newSettings[key as keyof GraphSettings] = {
                ...settings[key as keyof GraphSettings],
                options: layoutOptions,
            } as SettingItem;
        }
        newSettings[key as keyof GraphSettings] = {...settings[key as keyof GraphSettings]} as SettingItem;
    }
    return newSettings;
}

export function getWindowSelectItem<T extends keyof typeof supportedSettings>(setting: T, key: keyof (typeof supportedSettings)[T]) {
    const allOptions = supportedSettings[setting];
    if (!(key in allOptions)) {
        throw new Error(`Invalid key: ${String(key)}`);
    }
    return {label: key, value: allOptions[key as keyof typeof allOptions]};
}

export function getWindowSelectItemByValue<T extends keyof typeof supportedSettings>(setting: T, value: (typeof supportedSettings)[T][keyof (typeof supportedSettings)[T]]): optionItem | undefined {
    const allOptions = supportedSettings[setting];
    for (const key in allOptions) {
        if (allOptions[key] === value) {
            return {label: key, value: allOptions[key as keyof typeof allOptions]};
        }
    }
}


export const supportedSettings = {
    layouts: {
        CIRCLE: 'circle',
        PRESET: 'preset',
        FCOSE: 'fcose',
        GRID: 'grid',
        ELK: 'elk',
        CISE: 'cise',
        RANDOM: 'random'
    },
    nodeSizes: {
        SMALL: 0.25,
        MEDIUM: 0.5,
        NORMAL: 1,
        LARGE: 1.5,
        XLARGE: 3,
        XXLARGE: 5,
        HUGE: 10
    },
    opacities: {
        LOWEST: 0.05,
        LOW: 0.2,
        NORMAL: 0.35,
        MEDIUM: 0.5,
        HIGH: 0.75,
        HIGHEST: 0.9
    },
    fileTypes: {
        SVG: 'svg',
        PNG: 'png',
        JSON: 'json'
    },
    nodeColors: {
        red: '#ff0000',
        green: '#2b7442',
        blue: '#0047AB',
        orange: '#f9931f',
        black: '#000000',
        grey: '#808080',
    }
} as const;

export type SupportedLayout = (typeof supportedSettings.layouts)[keyof typeof supportedSettings.layouts];
export type SupportedNodeSize = (typeof supportedSettings.nodeSizes)[keyof typeof supportedSettings.nodeSizes];
export type SupportedOpacity = (typeof supportedSettings.opacities)[keyof typeof supportedSettings.opacities];
export type SupportedFileType = (typeof supportedSettings.fileTypes)[keyof typeof supportedSettings.fileTypes];
export type SupportedNodeColor = (typeof supportedSettings.nodeColors)[keyof typeof supportedSettings.nodeColors];

interface optionItem {
    label: string;
    value: any;
}
  
interface SettingItem {
    title: string;
    default: optionItem;
    current: optionItem | null;
    options: optionItem[];
}
  
export interface GraphSettings {
    Layout: LayoutSettingItem;
    NodeSize: NodeSizeSettingItem;
    PosNodeColor: NodeColorSettingItem;
    NegNodeColor: NodeColorSettingItem;
    Opacity: OpacitySettingItem;
    fileType: FileTypeSettingItem;
}
  
export interface GraphsStatus {
    [key: string]: GraphSettings;
}
  
// ____________________________________________
// specific interfaces for each option
// ____________________________________________
  
// Layout option interfaces:
interface LayoutOptionItem extends optionItem {
    value: SupportedLayout;
}
  
interface LayoutSettingItem extends SettingItem {
    options: LayoutOptionItem[];
}
  
// NodeSize option interfaces:
interface NodeSizeOptionItem extends optionItem {
    value: SupportedNodeSize;
}
  
interface NodeSizeSettingItem extends SettingItem {
    options: NodeSizeOptionItem[];
}
  
// Opacity option interfaces:
interface OpacityOptionItem extends optionItem {
    value: SupportedOpacity;
}
  
interface OpacitySettingItem extends SettingItem {
    options: OpacityOptionItem[];
}
  
// FileType option interfaces:
interface FileTypeOptionItem extends optionItem {
    value: SupportedFileType;
}
  
interface FileTypeSettingItem extends SettingItem {
    options: FileTypeOptionItem[];
}

interface NodeColorOptionItem extends optionItem {
    value: SupportedNodeColor;
}
  
interface NodeColorSettingItem extends SettingItem {
    options: NodeColorOptionItem[];
}

export const baseDownloadAllGraphSetting: GraphSettings = {
    Layout: {
        title: "Layout",
        default: getWindowSelectItem('layouts', 'CIRCLE'),
        current: null,
        options: Object.values(supportedSettings.layouts).filter(opt => opt !== 'preset').map(opt => ({label: opt, value: opt })),
    },
    NodeSize: {
        title: "Node Size",
        default: getWindowSelectItem('nodeSizes', 'NORMAL'),
        current: null,
        options: Object.entries(supportedSettings.nodeSizes).map(([key, opt]) => ({ label: key, value: opt }))
    },
    PosNodeColor: {
        title: "Positive Node Color",
        default: getWindowSelectItem('nodeColors', 'blue'),
        current: null,
        options: Object.entries(supportedSettings.nodeColors).map(([key, opt]) => ({ label: key, value: opt }))
    },
    NegNodeColor: {
        title: "Negative Node Color",
        default: getWindowSelectItem('nodeColors', 'red'),
        current: null,
        options: Object.entries(supportedSettings.nodeColors).map(([key, opt]) => ({ label: key, value: opt }))
    },
    Opacity: {
        title: "Opacity",
        default: getWindowSelectItem('opacities', 'NORMAL'),
        current: null,
        options: Object.entries(supportedSettings.opacities).map(([key, opt]) => ({ label: key, value: opt }))
    },
    fileType: {
        title: "File Type",
        default: getWindowSelectItem('fileTypes', 'PNG'),
        current: null,
        options: Object.values(supportedSettings.fileTypes).map(opt => ({ label: opt, value: opt })),
    }
}