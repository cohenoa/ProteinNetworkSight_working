

// declare const cytoscapeSVG: cytoscape.Ext;

// export = cytoscapeSVG;
// export as namespace cytoscapeSVG;

declare module 'cytoscape-svg' {
    import cytoscape from 'cytoscape';

    const svg: cytoscape.Ext;
    export default svg;
}

declare namespace cytoscapeSVG {
    // import cytoscape = require("cytoscape");
    import cytoscape from 'cytoscape';
    interface CytoscapeSVGCore extends cytoscape.Core {
        svg(options?: any): string;
    }
}



















// import cytoscape = require("cytoscape");

// declare module 'cytoscape-svg' {
//   import cytoscape from 'cytoscape';

//   const svg: cytoscape.Ext;
//   export default svg;
// }

// declare module 'cytoscape' {
//   interface Core {
//       svg(options?: any): string;
//   }
// }