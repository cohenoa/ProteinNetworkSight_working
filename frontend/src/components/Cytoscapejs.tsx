import { useCallback, useRef, useState,useEffect, forwardRef, useImperativeHandle } from "react";
import { ICustomLink, ICustomNode } from "../@types/graphs";
import { graphRef, IGraphProps } from "../@types/props";
import "../styles/Graph.css";
import "../styles/Button.css";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from 'cytoscape';
import Panel from "./Panel";
import ContextMenu from "./ContextMenu";
import { saveAs } from 'file-saver';
import { get, set, keys } from 'idb-keyval';
import { useStateMachine } from "little-state-machine";
import { MenuItem } from "../@types/props";
import { supportedSettings, SupportedFileType, SupportedLayout, SupportedNodeSize, SupportedOpacity, SupportedNodeColor } from "../common/GraphSettings";
import { faDiagramProject, faDownload, faPencil, faFloppyDisk, faSpinner, faBrush, faPlus , faMinus, faUpRightAndDownLeftFromCenter, faDownLeftAndUpRightToCenter, faExpand } from '@fortawesome/free-solid-svg-icons';
import svg from "cytoscape-svg";
import fcose from 'cytoscape-fcose';
// @ts-ignore
import cise from 'cytoscape-cise';
// @ts-ignore
import elk from 'cytoscape-elk';
import lcsl from '../LCSL_Layout/index';

cytoscape.use(lcsl);
cytoscape.use( fcose );
cytoscape.use( cise );
cytoscape.use( elk );
cytoscape.use( svg );

interface CytoscapeStyle {
  selector: string;
  style: {
    "background-color"?: string;
    label?: string;
    width?: string;
    height?: string;
    "background-image"?: string;
    "line-color"?: string;
    opacity?: number;
  };
}

/**
 * The component create the graph, using cytoscape.js library.
 * The props are the graph data and the clikceed vector (for the files)
 */
const CytoscapejsComponentself = forwardRef<HTMLDivElement, IGraphProps>(({graphData, clickedVector, alertLoading}, ref) => {
  const { state } = useStateMachine({});
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [selectedNode, setSelectedNode] = useState<ICustomNode | null>(null);
  const [openPanel, setOpenPanel] = useState(false);
  const [openContextMenu, setOpenContextMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [elements, setElements] = useState<Array<any>>([])
  const [curNodeSize, setCurNodeSize] = useState<SupportedNodeSize>(supportedSettings.nodeSizes.NORMAL);
  const [curNodeColor, setCurNodeColor] = useState<{pos: SupportedNodeColor, neg: SupportedNodeColor}>({pos: supportedSettings.nodeColors.blue, neg: supportedSettings.nodeColors.red});
  const [curLayout, setCurLayout] = useState<SupportedLayout>(supportedSettings.layouts.CIRCLE);

  const [myStyle, setMyStyle] = useState<CytoscapeStyle[]>([
    {
      selector: "node",
      style: {
        "background-color": "data(color)",
        label: "data(label)",
        width: "data(size)",
        height: "data(size)",
        "background-image": '#FFFFFF', 
      },
    },
    {
      selector: "edge",
      style: {
        "line-color": "data(color)",
        "background-image": '#FFFFFF',
        opacity: supportedSettings.opacities.NORMAL
      },
    },
  ]);
  
  const [layout, setLayout] = useState<any>({
    name: supportedSettings.layouts.CIRCLE,
    fit: true, // whether to fit the viewport to the graph
    padding: 30, // padding used on fit
    avoidOverlap: true, // prevents node overlap, may overflow boundingBox if not enough space
    avoidOverlapPadding: 50 * curNodeSize, // extra spacing around nodes when avoidOverlap: true
    nodeDimensionsIncludeLabels: false, // Excludes the label when calculating node bounding boxes for the layout algorithm
    condense: true, // uses all available space on false, uses minimal space on true
    animate: false,
    positions: false,
    stop: async function() {
      setLayoutStop(true);
      alertLoading();
    }
  });

  const [layoutStop, setLayoutStop] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  //Create a ref to the cy core, and an on click function for the nodes
  const handleCyInit = useCallback(
    async (cy: cytoscape.Core) => {
      cyRef.current = cy;

      cy.on("cxttap", (event) => {
        event.stopImmediatePropagation();
        event.stopPropagation();
        event.preventDefault();
      
        setTimeout(() => {
          setOpenContextMenu(false);
          setOpenContextMenu(true);
      
          const Xpos = event.originalEvent.x;
          const Ypos = event.originalEvent.y;
          setMenuPosition({ x: Xpos, y: Ypos });
        }, 0.0001);
      });
      
      
      cy.on('free', 'node', (event) => {
        // node dropped
        setCurLayout(supportedSettings.layouts.PRESET);
      });
      window.addEventListener("click", (event) => {
        setOpenContextMenu(false);
      });

      cyRef.current.on("click", "node", (event) => {
        const node = event.target;
        console.log("clicked node", node.id());
        console.log("graph data nodes", graphData.nodes);
        const clickedNode = (graphData.nodes as ICustomNode[]).find((n: ICustomNode) => n.id === node.id());
        console.log("clicked node", clickedNode);
        setSelectedNode({...clickedNode} as ICustomNode);
        setOpenPanel(true);
      });
    },
    [graphData,clickedVector, state.fileName]
  );

  const createNodes = (elements: Array<any>, nodes: ICustomNode[]) => {
    nodes.forEach((node) => 
      elements.push({
        data: {
          id: node.id,
          label: node.id === undefined || typeof node.id === "number"? node.id: node.id,
          color: node.color,
          size: Math.abs(node.size === undefined ? 0 : node.size) * 110,  // set the size of the node to be bigger so it will be shown in the graph.
          positive: node.size === undefined || node.size > 0 ? true : false,
          linksWeights: node.linksWeights === undefined ? 0 : node.linksWeights
        },
      })
    );
    // setElements(elements)
  };

  // The function create the links data for the elements array
  const createLinks = (elements: Array<any>, links: ICustomLink[]) => {
    links.forEach((link) =>
      elements.push({
        data: {
          source: link.source,
          target: link.target,
          label: `Edge from ${link.source} to ${link.target} `,
          color: getLinkColor(link.score === undefined ? 1994 : link.score),
          weight: link.score === undefined ? 1994 : link.score,
        },
      })
    );
    // setElements(elements)
  };

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      const newElements: any[] = [];
      createNodes(newElements, graphData.nodes);
      createLinks(newElements, graphData.links);
      
      setElements(newElements);

      if ((await keys()).includes(clickedVector + "_layout")) {
        applySavedGraph();
      }      
      else {
        console.log("Setting the elements for the first time");

        // if (clickedVector in clickedVectors){
        //   delete  val.clicked_vectors[clickedVector];
        //   await set(state.fileName,val);
        //   console.log(val.clicked_vectors)
        // }
        // const newElements: any[] = [];
        // createNodes(newElements, graphData.nodes);
        // createLinks(newElements, graphData.links);
        
        // setElements(newElements);
      }
    } catch (error) {
      console.error("Error loading graph data", error);
    }
    finally {
      // Set loading to false when the operation is complete
      setIsLoading(false);
      setDataLoaded(true);
    }
  }, []);
  
  useEffect(() => {
    fetchData();
    // resetElements().then(() => {
    //   console.log("fetching data after reset");
    //   fetchData();
    // });
  }, [ graphData.nodes, graphData.links, state.fileName, fetchData]);

  const layoutRender = () => {
    console.log("applying layout");
    cyRef.current?.layout(layout).run();
  }

  useEffect(() => {
    layoutRender();
    // console.log("applying layout");
    // cyRef.current?.layout(layout).run();
  }, [layout, curNodeSize, elements]);

  // useEffect(() => {
  //   if (layoutStop && dataLoaded) {
  //     setTimeout(() => {

  //     }, 2000);
      
  //   }
  //   else{
  //     console.log(layoutStop, dataLoaded);
  //   }
  // }, [layoutStop, dataLoaded])

  
  // The function handle a click on the close button on the panel
  const handleOnclickClosePanel = useCallback(() => {
    setOpenPanel(false);
  }, []);



  //The function return the color of the link, based on the score
  const getLinkColor = (score: Number) => {
    if (score === 1994) return "white";
    if (score.valueOf() >= 0.95) return "black";
    if (score.valueOf() >= 0.9) return "#101010";
    if (score.valueOf() >= 0.8) return "#282828";
    if (score.valueOf() >= 0.7) return "#383838";
    if (score.valueOf() >= 0.6) return "#484848";
    if (score.valueOf() >= 0.5) return "#585858";
    if (score.valueOf() >= 0.4) return "#696969";
    if (score.valueOf() >= 0.3) return "#888888";
    return "white";
  };

  const saveGraph = async () => {
    try {

      const nodePositions = curLayout === supportedSettings.layouts.PRESET ? cyRef.current?.nodes().map((node) => {
        let positionObj = node.position();
        return {[node.id()]: {x: positionObj.x, y: positionObj.y}};
      }) : [];

      if (nodePositions === undefined) {
        console.log("nodePositions is undefined");
        return false
      };

      const graphLayout = {
        positions: [...nodePositions],
        elements: elements,
        layout: curLayout,
        nodeSize: curNodeSize,
        opacity: myStyle[1].style.opacity,
        color: curNodeColor
      }
      console.log(graphLayout);
      set(clickedVector + "_layout", graphLayout);
      return true;
    } catch (error) {
      console.error("Error saving node positions to IndexedDB", error);
    }
    return false;
  };

  const applySavedGraph = async () => {
    console.log("applySavedGraph");
    get(clickedVector + "_layout").then((graphLayout: any) => {
      if (graphLayout) {
        console.log(graphLayout);
        console.log("graphLayout found in local storage, applying it");
        
        applyOpacity(graphLayout.opacity);
        applyNodeSize(graphLayout.nodeSize);
        applyNodeColor('pos', graphLayout.color.pos);
        applyNodeColor('neg', graphLayout.color.neg);
        setCurNodeSize(graphLayout.nodeSize);

        let layoutName = graphLayout.layout;

        setCurLayout(layoutName as SupportedLayout);
        let newLayout = {
          ...layout,
          name: layoutName,
          animate: true,
          fit: true,
        };

        if (layoutName === supportedSettings.layouts.PRESET) {
          newLayout.positions = graphLayout.positions.reduce((positionsObj: any, node: any) => {
            const nodeId = Object.keys(node)[0];
            positionsObj[nodeId] = node[nodeId];
            return positionsObj;
          }, {});
        }
        setLayout(newLayout);
        return true;
      }
    })
    return false;
  }

  const getGraphBlob = (type: SupportedFileType) => {
    const cy = cyRef.current;
    if (cy){
      let blob: Blob;
      switch (type) {
        case supportedSettings.fileTypes.SVG:
          blob = new Blob([cy.svg()], { type: "image/svg+xml;charset=utf-8" });
          break;
        case supportedSettings.fileTypes.PNG:
          blob = cy.png({ output: "blob", full: true });
          break;
        case supportedSettings.fileTypes.JSON:
          blob = new Blob([JSON.stringify(cy.json())], { type: "application/json" });
          break;
        default:
          console.log("type not supported");
          return null;
      }
      return blob;
    }
    else{
      console.log("no cy");
    }
    return null;
  }

  const downloadGraph = async (type: SupportedFileType) => {
    const cy = cyRef.current;
    if (cy){
      let blob: Blob;
      if (type === supportedSettings.fileTypes.SVG) {
        blob = new Blob([cy.svg()], { type: "image/svg+xml;charset=utf-8" });
      } else if (type === supportedSettings.fileTypes.PNG) {
        blob = cy.png({ output: "blob", full: true });
      } else if (type === supportedSettings.fileTypes.JSON) {
        blob = new Blob([JSON.stringify(cy.json())], { type: "application/json" });
      }
      else{
        console.log("type not supported");
        return;
      }
      saveAs(blob, state.fileName.split('.')[0] + '_' + clickedVector + '.' + type);
    }
    else{
      console.log("no cy");
    }
  };
  
  {/* @ts-ignore */}
  useImperativeHandle(ref, () => ({
    fetchData,
    applyLayout,
    applyNodeSize,
    applyOpacity,
    applyNodeColor,
    getGraphBlob,
    layoutRender,
    // downloadGraph
  }));

  // right click menu
  const contextMenuItems: MenuItem[] = [
    {
      label: 'Layout',
      icon: faDiagramProject,
      submenu: Object.values(supportedSettings.layouts).filter(option => option !== supportedSettings.layouts.PRESET).map((option) => ({ label: option, icon: faDiagramProject, onClick: () => {applyLayout(option, true)}}))
    },
    {
      label: 'Link Opacity',
      icon: faPencil,
      submenu: Object.entries(supportedSettings.opacities).map(([key, value]) => ({ label: key, icon: faPencil, onClick: () => {applyOpacity(value)}}))
    },
    {
      label: 'Node Size',
      icon: faUpRightAndDownLeftFromCenter,
      submenu: Object.entries(supportedSettings.nodeSizes).map(([key, value]) => ({ label: key, icon: value > 1 ? faUpRightAndDownLeftFromCenter: value < 1 ? faDownLeftAndUpRightToCenter : faExpand, onClick: () => {applyNodeSize(value)}}))
    },
    {
      label: 'Node Color',
      icon: faBrush,
      submenu: [
        {
          label: 'positive',
          icon: faPlus,
          submenu: Object.entries(supportedSettings.nodeColors).map(([key, value]) => ({ label: key, icon: faBrush, onClick: () => {applyNodeColor('pos', value)}}))
        },
        {
          label: 'negetive',
          icon: faMinus,
          submenu: Object.entries(supportedSettings.nodeColors).map(([key, value]) => ({ label: key, icon: faBrush, onClick: () => {applyNodeColor('neg', value)}}))
        },
      ]
    },
    {
      label: 'Download',
      icon: faDownload,
      submenu: Object.values(supportedSettings.fileTypes).map((option) => ({ label: option, icon: faDownload, onClick: () => downloadGraph(option)}))
    },
    {label: 'save', icon: faFloppyDisk, onClick: () => {saveGraph()}},
    {label: 'load', icon: faSpinner, onClick: () => {applyLayout(supportedSettings.layouts.PRESET, true)}},
  ];

  const applyLayout = async (name: SupportedLayout, animate: boolean) => {
    if (cyRef.current) {
      if (name === supportedSettings.layouts.PRESET) {
        if (!await applySavedGraph()) {
          alert("there is no saved layout. \nto save a layout open the submenu and click 'save'");
          return;
        }
      }
      else{
        setCurLayout(name);
        setLayout({
          ...layout,
          name: name,
          animate: animate,
          fit: true,
        });
      }
    }
  };

const applyNodeColor = (nodeType: 'pos' | 'neg', color: SupportedNodeColor) => {
  console.log("setting node color");

  cyRef.current?.nodes().forEach(function(node){
    node.data('color', (node.data('positive') !== (nodeType === 'pos')) ? node.data('color') : color);
  });

  const posNodes = cyRef.current?.nodes().filter(function(node){return node.data('positive')})
  const negNodes = cyRef.current?.nodes().filter(function(node){return !node.data('positive')})

  const newNodeColors = {
    pos: posNodes ? posNodes[0].data('color') : color,
    neg: negNodes ? negNodes[0].data('color') : color
  };

  console.log(newNodeColors);

  setCurNodeColor(newNodeColors);
}
const applyNodeSize = (size: SupportedNodeSize) => {
  console.log("setting node size");
  cyRef.current?.nodes().forEach(function(node){
    node.data('size', (parseInt(node.data('size')) / curNodeSize) * size);
  });
  setCurNodeSize(size);
}
const applyOpacity = (op: SupportedOpacity) => {
  console.log("setting opacity");
  const newStyle = [myStyle[0], {...(myStyle[1])}];
  newStyle[1].style.opacity = op;
  setMyStyle(newStyle);
}

return (
  <div className="graph-container">
    {isLoading ? (
      <div>Loading...</div>
    ) : (
      <>
        {openPanel && (
          <Panel node={selectedNode} organism={state.organism} onClickClose={handleOnclickClosePanel} />
        )}
        {openContextMenu && (
          <ContextMenu
            position={menuPosition}
            depth={0}
            items={contextMenuItems}
          />
        )}
        <CytoscapeComponent
          elements={elements}
          layout={layout}
          style={{ width: "100%", height: "100%" }}
          stylesheet={myStyle}
          cy={handleCyInit}
          wheelSensitivity={0.1}
        />
      </>
    )}
  </div>
);
});


export default CytoscapejsComponentself;