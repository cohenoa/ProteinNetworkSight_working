import { useCallback, useRef, useState,useEffect, forwardRef, useImperativeHandle } from "react";
import { ICustomLink, ICustomNode } from "../@types/graphs";
import { IGraphProps } from "../@types/props";
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
  const [curNodeSize, setCurNodeSize] = useState<number>(1);

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
    name: 'circle',
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

        // console.log('Node dropped:', event.target.id());
        // savePositionsToIndexedDB()
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

      // setFullyLoaded({layoutStop: fullyLoaded.Layout, positions: fullyLoaded.positions, cyref: true, notLoading: fullyLoaded.notLoading});
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
          // setNodePositions(positions);

          // Create a layout with saved positions
          console.log("positions: \n", positions)
          console.log("number_of_elements: \n",positions.length)
          layout.name = 'preset';
          layout.positions = positions.reduce((positionsObj: any, node: any) => {
            const nodeId = Object.keys(node)[0];
            const position = node[nodeId];
            positionsObj[nodeId] = position;
            return positionsObj;
          }, {});
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
    resetElements().then(() => fetchData());
  }, [ graphData.nodes, graphData.links, state.fileName, fetchData]);

  useEffect(() => {
    cyRef.current?.layout(layout).run();
  }, [layout, curNodeSize]);

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

  // The function create the nodes data for the elements arra
  
// // The function return the color of the node based on the size
// const getNodeColor = (size: number): string => {
//   if (size === 0) return "#B2E5FF"; // Light Blue for zero

//   // Darker warm colors for positive values, with doubled range
//   if (size > 0.9) return "#CC3700"; // Darker Orange Red
//   if (size > 0.7) return "#E5533A"; // Darker Tomato
//   if (size > 0.5) return "#CCAC00"; // Darker Gold
//   if (size > 0.3) return "#CC8400"; // Darker Orange
//   if (size > 0.1) return "#CC6F00"; // Darker Dark Orange

//   // Darker cool colors for negative values, with doubled range
//   if (size < -0.9) return "#1875CC"; // Darker Dodger Blue
//   if (size < -0.7) return "#0093CC"; // Darker Deep Sky Blue
//   if (size < -0.5) return "#009999"; // Darker Dark Turquoise
//   if (size < -0.3) return "#1A8C80"; // Darker Light Sea Green
//   if (size < -0.1) return "#4A7980"; // Darker Cadet Blue

//   return "#B2E5FF"; // Default light blue for any other values (just in case)
// };



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

const savePositionsToIndexedDB = async () => {

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
      
      const elementsVector = clickedVectors[clickedVector].elements|| []
      elementsVector.push(elements)
      // Add the positions to the array for the clickedVector
      clickedVectors[clickedVector].positions = [
        ...nodePositions,
      ];
      clickedVectors[clickedVector].threshold = thresholds;
      clickedVectors[clickedVector].id = Object.keys(clickedVectors).length - 1;
      clickedVectors[clickedVector].elements = elementsVector;
      clickedVectors[clickedVector].nodeSize = curNodeSize;
      clickedVectors[clickedVector].opacity = myStyle[1].style.opacity;

      
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
      let content = '';
      let contentType = '';
      if (type === supportedSettings.fileTypes.SVG) {
        content = cy.svg();
        contentType = "image/svg+xml;charset=utf-8";
      } else if (type === supportedSettings.fileTypes.PNG) {
        content = cy.png();
        contentType = "image/png";
      } else if (type === supportedSettings.fileTypes.JSON) {
        content = JSON.stringify(cy.json());
        contentType = "application/json";
      }
      else{
        console.log("type not supported");
        return;
      }

      const blob = new Blob([content], { type: contentType });
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
        if (positions !== undefined) {
          setElements(elementsVector);
          // setNodePositions(positions);
          setNodeSize(clickedVectors[clickedVector].nodeSize);
          setOpacity(clickedVectors[clickedVector].opacity);

          layout.positions = positions.reduce((positionsObj: any, node: any) => {
            const nodeId = Object.keys(node)[0];
            const position = node[nodeId];
            positionsObj[nodeId] = position;
            return positionsObj;
          }, {});

          console.log("position setting successfull");
          return true;
        }
      }
    }
    return false;
  }

  {/* @ts-ignore */}
  useImperativeHandle(ref, () => ({
    fetchData,
    applyLayout,
    setOpacity,
    setNodeSize,
    downloadGraph
  }));


  const applyLayout = async (name: SupportedLayout, animate: boolean) => {
    if (cyRef.current) {

      if (name === supportedSettings.layouts.PRESET) {
        if (!await applySavedGraph()) {
          alert("there is no saved layout. to save a layout:\n1. right click to open the submenu\n2. go to layouts -> preset\n3. click 'save layout'");
          return;
        }
      }

      const newLayout = {
        ...layout,
        name: name,
        animate: animate,
      };

      setLayout(newLayout);
    }
  };

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
              {label: 'save', icon: faFloppyDisk, onClick: () => {savePositionsToIndexedDB()}},
              {label: 'load', icon: faSpinner, onClick: () => {applyLayout('preset', true)}},
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
    submenu: Object.entries(supportedSettings.opacities).map(([key, value]) => ({ label: key, icon: faPencil, onClick: () => {setOpacity(value)}}))
  },
  {
    label: 'Node Size',
    icon: faPencil,
    submenu: Object.entries(supportedSettings.nodeSizes).map(([key, value]) => ({ label: key, icon: faPencil, onClick: () => {setNodeSize(value)}}))
  },
  {
    label: 'Node Color',
    icon: faBrush,
    submenu: [
      {
        label: 'positive',
        icon: faPlus,
        submenu: Object.entries(supportedSettings.nodeColors).map(([key, value]) => ({ label: key, icon: faBrush, onClick: () => {setNodeColor('pos', value)}}))
      },
      {
        label: 'negetive',
        icon: faMinus,
        submenu: Object.entries(supportedSettings.nodeColors).map(([key, value]) => ({ label: key, icon: faBrush, onClick: () => {setNodeColor('neg', value)}}))
      },
    ]
  },
];

const setNodeColor = (nodeType: 'pos' | 'neg', color: SupportedNodeColor) => {
  console.log("setting node color");
  (graphData.nodes as ICustomNode[]).forEach((node) => {
    if (node.size !== undefined) {
      if ((node.size > 0) === (nodeType === 'pos')) {
        node.color = color;
      }
    }
    else{
      console.log("node size undefined");
    }
  })

  let newElements: any[] = [];
  createNodes(newElements, graphData.nodes);

  newElements.forEach((element) => {
    element.data.size *= curNodeSize;
  });

  createLinks(newElements, graphData.links);
  
  setElements(newElements);
  cyRef.current?.style(myStyle);
  console.log(elements);
}
const setNodeSize = (size: SupportedNodeSize) => {
  console.log("setting node size");

  cyRef.current?.nodes().forEach(function(node){
    console.log("inside setting");
    node.data('size', parseInt(node.data('size'))/curNodeSize*size); 
  });
  setCurNodeSize(size);
}
const setOpacity = (op: SupportedOpacity) => {
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