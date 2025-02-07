declare module 'cytoscape-svg' {
    import cytoscape from 'cytoscape';

    const svg: cytoscape.Ext;
    export default svg;
}

declare namespace cytoscapeSVG {
    import cytoscape from 'cytoscape';
    interface CytoscapeSVGCore extends cytoscape.Core {
        svg(options?: any): string;
    }
}