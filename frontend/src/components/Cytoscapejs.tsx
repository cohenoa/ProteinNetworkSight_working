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
import { get, set } from 'idb-keyval';
import { useStateMachine } from "little-state-machine";
import { MenuItem } from "../@types/props";
import { supportedSettings, SupportedFileType, SupportedLayout, SupportedNodeSize, SupportedOpacity, SupportedNodeColor } from "../common/GraphSettings";
import { faDiagramProject, faDownload, faPencil, faFloppyDisk, faSpinner, faBrush, faPlus , faMinus } from '@fortawesome/free-solid-svg-icons';
import svg from "cytoscape-svg";
import fcose from 'cytoscape-fcose';
// @ts-ignore
import cise from 'cytoscape-cise';
// @ts-ignore
import elk from 'cytoscape-elk';

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
const CytoscapejsComponentself = forwardRef<HTMLDivElement, IGraphProps>(({graphData, clickedVector, thresholds, alertLoading}, ref) => {
  const { state } = useStateMachine({});
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [selectedNode, setSelectedNode] = useState<ICustomNode | null>(null);
  const [openPanel, setOpenPanel] = useState(false);
  const [openContextMenu, setOpenContextMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [elements, setElements] = useState<Array<any>>([])
  const [curNodeSize, setCurNodeSize] = useState<SupportedNodeSize>(supportedSettings.nodeSizes.NORMAL);
  const [curNodeColor, setCurNodeColor] = useState<{pos: SupportedNodeColor, neg: SupportedNodeColor}>({pos: supportedSettings.nodeColors.blue, neg: supportedSettings.nodeColors.red});

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

  const resetElements = async () => {
    setElements(() => {
      return [];
    });
  };
  
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
    stop: function() {
      setLayoutStop(true);
    }
  });

  const [layoutStop, setLayoutStop] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  //Create a ref to the cy core, and an on click function for the nodes
  const handleCyInit = useCallback(
    async (cy: cytoscape.Core) => {
      // document.addEventListener('contextmenu', function (event) {
      //   event.preventDefault();
      // })
      cyRef.current = cy;
      // cy.on('cxttapstart', (event) => {
      //   // Check if the right mouse button is pressed (event.originalEvent.button === 2)
      //   event.preventDefault();
      // });
      // cy.on('cxttapend', (event) => {
      //   // Check if the right mouse button is pressed (event.originalEvent.button === 2)
      //     // Prevent the default context menu only for right-clicks on the Cytoscape container
      //     event.preventDefault();
      // });

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
        // setIsPreset(true);
        setLayout({
          ...layout,
          name: supportedSettings.layouts.PRESET,
          fit: false
        })
      });
      window.addEventListener("click", (event) => {
        setOpenContextMenu(false);
      });
      // window.addEventListener('contextmenu', (event) => {
      //   console.log(event)
      // })

      cyRef.current.on("click", "node", (event) => {
        const node = event.target;
        const clickedNode = graphData.nodes.find(
          (n: ICustomNode) => n.id === node.id()
        );
        setOpenPanel(true);
        setSelectedNode(clickedNode);
      });

      try {
        const val = await get(state.fileName);
  
        if (val) {
          const clickedVectors = val.clicked_vectors || {};
  
          if (clickedVector in clickedVectors) {
            const positions = clickedVectors[clickedVector].positions;
  
            if (positions && positions.length > 0) {
              // Set the preset layout using the saved positions
              cyRef.current.nodes().positions((node, i) => positions[i]);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data from IndexedDB", error);
      }
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
        },
      })
    );
    // setElements(elements)
  };

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const val = await get(state.fileName);
      const clickedVectors = val['clicked_vectors'] || { positions: [],threshold:{},elements:[]};
      
      var elementsVector = clickedVectors.elements || [];
      if (clickedVector in clickedVectors && clickedVectors[clickedVector].threshold.pos === thresholds.pos && clickedVectors[clickedVector].threshold.neg === thresholds.neg) {

        elementsVector = clickedVectors[clickedVector].elements[0]
        const positions = clickedVectors[clickedVector].positions;
        if (positions !== undefined) {
          setElements(elementsVector);
          applyOpacity(clickedVectors[clickedVector].opacity);
          setCurNodeColor(clickedVectors[clickedVector].color);
          setCurNodeSize(clickedVectors[clickedVector].nodeSize);

          layout.name = clickedVectors[clickedVector].layout;
          if (clickedVectors[clickedVector].layout === supportedSettings.layouts.PRESET) {
            layout.positions = positions.reduce((positionsObj: any, node: any) => {
              const nodeId = Object.keys(node)[0];
              const position = node[nodeId];
              positionsObj[nodeId] = position;
              return positionsObj;
            }, {});
          }
        }
      } else {
        console.log("Setting the elements for the first time");

        if (clickedVector in clickedVectors){
          delete  val.clicked_vectors[clickedVector];
          await set(state.fileName,val);
          console.log(val.clicked_vectors)
         
        }
        createNodes(elements, graphData.nodes);
        createLinks(elements, graphData.links);
        
        setElements(elements);
      }

      cyRef.current?.layout(layout).run();
      
    } catch (error) {
      console.error("Error fetching data from IndexedDB", error);
    }
    finally {
      // Set loading to false when the operation is complete
      setIsLoading(false);
      setDataLoaded(true);
    }
  }, []);
  
  useEffect(() => {
    resetElements().then(() => {
      fetchData().then(() => {
        console.log("HERE NODE SIZE: " + curNodeSize)
      });
    });
  }, [ graphData.nodes, graphData.links, state.fileName, fetchData]);

  useEffect(() => {
    cyRef.current?.layout(layout).run();
  }, [layout, curNodeSize, elements]);

  useEffect(() => {
    if (layoutStop && dataLoaded) {
      setTimeout(() => {
        alertLoading();
      }, 1000);
      
    }
    else{
      console.log(layoutStop, dataLoaded);
    }
  }, [layoutStop, dataLoaded])

  
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

  const nodePositions = cyRef.current?.nodes().map((node) => {
    let positionObj = node.position();
    return {[node.id()]: {x: positionObj.x, y: positionObj.y}};
  });

  if (nodePositions && nodePositions.length > 0) {
    try {
      const val = await get(state.fileName);

      const clickedVectors = val.clicked_vectors || {};
      console.log(clickedVectors)
      if (!(clickedVector in clickedVectors)) {
        // If clickedVector is not in clickedVectors, create a new entry
        clickedVectors[clickedVector] = { positions: [],threshold:{},elements:[] };
      }
      
      const elementsVector = clickedVectors[clickedVector].elements || [];
      elementsVector.push(elements);
      clickedVectors[clickedVector].id = Object.keys(clickedVectors).length - 1;
      clickedVectors[clickedVector].threshold = thresholds;
      clickedVectors[clickedVector].positions = [...nodePositions];
      clickedVectors[clickedVector].elements = elementsVector;
      clickedVectors[clickedVector].layout = layout.name;
      clickedVectors[clickedVector].nodeSize = curNodeSize;
      clickedVectors[clickedVector].opacity = myStyle[1].style.opacity;
      clickedVectors[clickedVector].color = curNodeColor;

      
      // Update the clicked_vectors and nodePositions in the existing data
      console.log(clickedVectors) 

      val.clicked_vectors = clickedVectors;
      set(state.fileName, val);
    } catch (error) {
      console.error("Error saving node positions to IndexedDB", error);
    }
  }
};

  const downloadGraph = (type: SupportedFileType) => {
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

  const applySavedGraph = async () => {
    const val = await get(state.fileName);
    const clickedVectors = val['clicked_vectors'] || {};

    if (clickedVector in clickedVectors && clickedVectors[clickedVector].threshold.pos === thresholds.pos && clickedVectors[clickedVector].threshold.neg === thresholds.neg) {
      const elementsVector = clickedVectors[clickedVector].elements[0]
      const positions = clickedVectors[clickedVector].positions;
      if (positions !== undefined) {
        setElements(elementsVector);
        applyOpacity(clickedVectors[clickedVector].opacity);
        setCurNodeColor(clickedVectors[clickedVector].color);
        setCurNodeSize(clickedVectors[clickedVector].nodeSize);

        layout.name = clickedVectors[clickedVector].layout;
        if (clickedVectors[clickedVector].layout === supportedSettings.layouts.PRESET) {
          layout.positions = positions.reduce((positionsObj: any, node: any) => {
            const nodeId = Object.keys(node)[0];
            const position = node[nodeId];
            positionsObj[nodeId] = position;
            return positionsObj;
          }, {});
        }
      }
      return true;
    }
    return false;
  }
  
  {/* @ts-ignore */}
  useImperativeHandle(ref, () => ({
    fetchData,
    applyLayout,
    applyNodeSize,
    applyOpacity,
    applyNodeColor,
    downloadGraph
  }));

  // right click menu
  const contextMenuItems: MenuItem[] = [
    {
      label: 'Download',
      icon: faDownload,
      submenu: Object.values(supportedSettings.fileTypes).map((option) => ({ label: option, icon: faDownload, onClick: () => downloadGraph(option)}))
    },
    {
      label: 'Layout',
      icon: faDiagramProject,
      submenu: Object.values(supportedSettings.layouts).map((option) => {
          if (option === supportedSettings.layouts.PRESET){
            return {
              label: option,
              icon: faDiagramProject,
              submenu: [
                {label: 'save', icon: faFloppyDisk, onClick: () => {saveGraph()}},
                {label: 'load', icon: faSpinner, onClick: () => {applyLayout(supportedSettings.layouts.PRESET, true)}},
              ]
            }
          }
          return {
            label: option,
            icon: faDiagramProject,
            onClick: () => {applyLayout(option, true)},
          }
      })
    },
    {
      label: 'Link Opacity',
      icon: faPencil,
      submenu: Object.entries(supportedSettings.opacities).map(([key, value]) => ({ label: key, icon: faPencil, onClick: () => {applyOpacity(value)}}))
    },
    {
      label: 'Node Size',
      icon: faPencil,
      submenu: Object.entries(supportedSettings.nodeSizes).map(([key, value]) => ({ label: key, icon: faPencil, onClick: () => {applyNodeSize(value)}}))
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
  ];

  const applyLayout = async (name: SupportedLayout, animate: boolean) => {
    if (cyRef.current) {

      if (name === supportedSettings.layouts.PRESET) {
        if (!await applySavedGraph()) {
          alert("there is no saved layout. to save a layout:\n1. right click to open the submenu\n2. go to layouts -> preset\n3. click 'save layout'");
          return;
        }
      }

      setLayout({
        ...layout,
        name: name,
        animate: animate,
        fit: true,
      });
    }
  };

const applyNodeColor = (nodeType: 'pos' | 'neg', color: SupportedNodeColor) => {
  console.log("setting node color");
  const newNodeColors = {...curNodeColor, [nodeType]: color};

  cyRef.current?.nodes().forEach(function(node){
    node.data('color', node.data('positive') ? newNodeColors.pos : newNodeColors.neg);
  });

  setCurNodeColor(newNodeColors);
}
const applyNodeSize = (size: SupportedNodeSize) => {
  cyRef.current?.nodes().forEach(function(node){
    console.log("inside setting");
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
          <Panel node={selectedNode} onClickClose={handleOnclickClosePanel} />
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