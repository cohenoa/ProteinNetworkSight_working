

export const copySettings = (settings: GraphSettings, fullCopy: boolean = false): GraphSettings => {
    const layoutOptions = fullCopy? [...settings.Layout.options]: settings.Layout.options;
    return {
        ...baseDownloadAllGraphSetting,
        Layout: {
            ...settings.Layout,
            options: layoutOptions,
        },
        NodeSize: {...settings.NodeSize},
        Opacity: {...settings.Opacity},
        fileType: {...settings.fileType},
    };
}

export function getWindowSelectItem<T extends keyof typeof supportedSettings>(setting: T, key: keyof (typeof supportedSettings)[T]) {
    const allOptions = supportedSettings[setting];
    if (!(key in allOptions)) {
        throw new Error(`Invalid key: ${String(key)}`);
    }
    return {label: key, value: allOptions[key as keyof typeof allOptions]};
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
    }
} as const;

export type SupportedLayout = (typeof supportedSettings.layouts)[keyof typeof supportedSettings.layouts];
export type SupportedNodeSize = (typeof supportedSettings.nodeSizes)[keyof typeof supportedSettings.nodeSizes];
export type SupportedOpacity = (typeof supportedSettings.opacities)[keyof typeof supportedSettings.opacities];
export type SupportedFileType = (typeof supportedSettings.fileTypes)[keyof typeof supportedSettings.fileTypes];

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