import { FC, useCallback, useRef, useState,useEffect, forwardRef, useImperativeHandle } from "react";
import { ICustomLink, ICustomNode } from "../@types/graphs";
import { IGraphProps } from "../@types/props";
import "../styles/Graph.css";
import "../styles/Button.css";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from 'cytoscape';
import Panel from "./Panel";
import ContextMenu from "./ContextMenu";
import  { layoutTester }  from "./layoutAlgorithms";
import { write, utils } from "xlsx";
import { saveAs } from 'file-saver';
import { get, set, update } from 'idb-keyval';
import { useStateMachine } from "little-state-machine";
import { MenuItem } from "../@types/props";
import { updateIsLoading, updateShowError } from "../common/UpdateActions";
import { headers } from "../assets/DefualtFile";
import { faDiagramProject, faDownload, faPencil, faFloppyDisk, faSpinner} from '@fortawesome/free-solid-svg-icons';
import fcose from 'cytoscape-fcose';
// @ts-ignore
import cise from 'cytoscape-cise';
// @ts-ignore
import elk from 'cytoscape-elk';

cytoscape.use( fcose );
cytoscape.use( cise );
cytoscape.use( elk );

/**
 * The component create the graph, using cytoscape.js library.
 * The props are the graph data and the clikceed vector (for the files)
 */

// const CytoscapejsComponentself: FC<IGraphProps> = ({
//   graphData,
//   clickedVector,
//   thresholds,
// }) => {
const CytoscapejsComponentself = forwardRef(({graphData, clickedVector, thresholds, alertLoading}, ref) => {
  const { state, actions } = useStateMachine({});
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [selectedNode, setSelectedNode] = useState<ICustomNode | null>(null);
  const [openPanel, setOpenPanel] = useState(false);
  const [openContextMenu, setOpenContextMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [elements,setElements] = useState<Array<any>>([])
  const [curNodeSize, setCurNodeSize] = useState<number>(1);
  const [myStyle, setMyStyle] = useState([
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
        opacity: 0.35
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
    [graphData, clickedVector, state.fileName]
  );

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const val = await get(state.fileName);
      const clickedVectors = val['clicked_vectors'] || { positions: [],threshold:{},elements:[]};
      
      var elementsVector = clickedVectors.elements || [];
      if (clickedVector in clickedVectors && clickedVectors[clickedVector].threshold.pos === thresholds.pos && clickedVectors[clickedVector].threshold.neg === thresholds.neg && clickedVectors[clickedVector].positions.length === graphData.nodes.length) {

        elementsVector = clickedVectors[clickedVector].elements[0]
        const positions = clickedVectors[clickedVector].positions;

        if (positions != undefined) {
          setElements(elementsVector);

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
        // console.log()


        if (clickedVector in clickedVectors){
          delete val.clicked_vectors[clickedVector];
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
  };
  
  useEffect(() => {

    console.log(clickedVector);

    resetElements().then(() => fetchData());
    
    // fetchData();
    console.log("elements: \n", elements)

  }, [ graphData.nodes, graphData.links, state.fileName]);

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

  function convertArrayToSvg(nodesData: any[]): string {
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" fit="true">
        ${nodesData.map(nodeData => convertNodeToSvg(nodeData)).join('\n')}
      </svg>
    `;
    return svgContent;
  }
  function addEdgesToSVG(svgString:any, edgeArray:any[]) {
    // Create a DOMParser
    var parser = new DOMParser();

    // Parse the SVG string into a DOM structure
    var doc = parser.parseFromString(svgString, 'image/svg+xml');
    // Iterate through each edge in the array
    edgeArray.forEach(edgeData => {
        // Get the positions of the source and target nodes
        // node.id.split('_').join('')
        var sourceNode = doc.getElementById(edgeData.data.source);
        var targetNode =  doc.getElementById(edgeData.data.target);
        var edgeColor = doc.getElementById(edgeData.data);
        // console.log(sourceNode , targetNode);
        var sourceX =  sourceNode?.getAttribute('cx');
        var sourceY = sourceNode?.getAttribute('cy');
        var targetX = targetNode?.getAttribute('cx');
        var targetY = targetNode?.getAttribute('cy');

        // Create a new line element (edge)
        if(sourceNode != null&& typeof sourceX == 'string' && typeof sourceY == 'string'&& typeof targetX == 'string'&& typeof targetY == 'string'){
          var line = doc.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', sourceX);
          line.setAttribute('y1', sourceY);
          line.setAttribute('x2',targetX);
          line.setAttribute('y2', targetY);
          line.setAttribute('stroke', edgeData.data.color || 'black');
          line.setAttribute('stroke-width', '2.5');

          line.setAttribute('opacity', String(myStyle[1].style.opacity));

          // Append the new line element to the SVG
          doc.documentElement.insertBefore(line,sourceNode);
          doc.documentElement.insertBefore(line,targetNode);
        }
        
    });

    // Convert the modified DOM back to an SVG string
    return new XMLSerializer().serializeToString(doc);
}
  function convertNodeToSvg(nodeData: any): string {
    return `
      <!-- Circle representing the node -->
      <circle id = "${nodeData.data.label}" cx="${nodeData.position.x+50}" cy="${nodeData.position.y+50}" r="${nodeData.data.size/1.8}"
              fill="${nodeData.data.color}" z-index="10" stroke="black"/>
      <!-- Text label -->
      <text x="${nodeData.position.x+50}" y="${nodeData.position.y - nodeData.data.size +45}"
            font-size="12" fill="black" text-anchor="middle">
        ${nodeData.data.label}
      </text>
    `;
  }
  
  function saveAsSvg (jsonBlob: any): void{
    var nodes = jsonBlob.elements.nodes;
    var edges = jsonBlob.elements.edges;
    var svgOutPut = convertArrayToSvg(nodes);
    
    svgOutPut = addEdgesToSVG(svgOutPut, edges);
    var a = document.createElement("a");
    var file = new Blob([svgOutPut], {type: "image/svg+xml"});
    a.href = URL.createObjectURL(file);
    a.download =state.fileName.split('.')[0] + '_' + clickedVector + ".svg"
    a.click();
  }
  // The function handle a click on the close button on the panel
  const handleOnclickClosePanel = useCallback(() => {
    setOpenPanel(false);
  }, []);

  // The function create the nodes data for the elements array
  const createNodes = (elements: Array<any>, nodes: ICustomNode[]) => {
    nodes.forEach((node) => 
      elements.push({
        data: {
          id: node.id,
          label: node.id == undefined || typeof node.id === "number"? node.id: node.id,
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
  let strength = String(Math.round((1 - score.valueOf()) * 99));

  if (strength.length === 1) {
    strength = "0" + strength;
  }

  return "#" + strength + strength + strength;

  // if (score === 1994) return "white";
  // if (score.valueOf() >= 0.95) return "black";
  // if (score.valueOf() >= 0.9) return "#101010";
  // if (score.valueOf() >= 0.8) return "#282828";
  // if (score.valueOf() >= 0.7) return "#383838";
  // if (score.valueOf() >= 0.6) return "#484848";
  // if (score.valueOf() >= 0.5) return "#585858";
  // if (score.valueOf() >= 0.4) return "#696969";
  // if (score.valueOf() >= 0.3) return "#888888";
  // return "white";
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

const btnJsonClick = () => {
  const cy = cyRef.current;
  if (cy) {
    const jsonBlob = new Blob([JSON.stringify(cy.json())], { type: 'application/json' });
    saveAs(jsonBlob,state.fileName.split('.')[0] + '_' + clickedVector + '.json');
  }
}

  const btnPngClick = () =>{
    const cy = cyRef.current;
    if (cy) {
      const pngBlob = cy.png({ output: "base64uri", full: true });
      saveAs(pngBlob,state.fileName.split('.')[0] + '_' + clickedVector + '.png');
  }}

  const btnSVGExportClick = () => {
    const cy = cyRef.current;
    if (cy) {
      // const blob = new Blob([cy.svg({scale: 1, full: true})], {type: 'image/svg+xml'});
      // saveAs(blob, state.fileName.split('.')[0] + '_' + clickedVector + '.svg');

      const jsonData = cy.json();
      saveAsSvg(jsonData);
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
      if (positions != undefined) {
        if (positions != undefined) {
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

  useImperativeHandle(ref, () => ({
    fetchData,
    applyLayout,
    setOpacity,
    setNodeSize,
    btnSVGExportClick,
    btnPngClick,
    btnJsonClick,
  }));


  const applyLayout = async (name: string, animate: boolean) => {
    if (cyRef.current) {

      if (name === 'test'){
        layoutTester()
      }

      if (name === 'preset') {
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

  const downloadFile = (file_type: string) => {
    if (file_type === 'svg'){
      btnSVGExportClick();
    }
    else if (file_type === 'png'){
      btnPngClick();
    }
    else if (file_type === 'json'){
      btnJsonClick();
    }
    else{
      console.log("invalid file type");
    }
  }

// right click menu
const contextMenuItems: MenuItem[] = [
  {
    label: 'Download',
    icon: faDownload,
    submenu: [
      { label: '.svg', icon: faDownload, onClick: btnSVGExportClick },
      { label: '.png', icon: faDownload, onClick: btnPngClick },
      { label: '.json', icon: faDownload, onClick: btnJsonClick },
    ],
  },
  {
    label: 'Layout',
    icon: faDiagramProject,
    submenu: [
      {label: 'Circle', icon: faDiagramProject, onClick: () => {applyLayout('circle', true)}},
      {
        label: 'preset',
        icon: faDiagramProject,
        submenu: [
          {label: 'save', icon: faFloppyDisk, onClick: () => {savePositionsToIndexedDB()}},
          {label: 'load', icon: faSpinner, onClick: () => {applyLayout('preset', true)}},
        ]
      },
      {label: 'FCose', icon: faDiagramProject, onClick: () => {applyLayout('fcose', true)}},
      {label: 'grid', icon: faDiagramProject, onClick: () => {applyLayout('grid', true)}},
      {label: 'elk', icon: faDiagramProject, onClick: () => {applyLayout('elk', true)}},
      {label: 'cise', icon: faDiagramProject, onClick: () => {applyLayout('cise', true)}},
      {label: 'random', icon: faDiagramProject, onClick: () => {applyLayout('random', true)}},
      {label: 'test', icon: faDiagramProject, onClick: () => {applyLayout('test', true)}},
    ],
  },
  {
    label: 'Opacity',
    icon: faPencil,
    submenu: [
      { label: '0.05', icon: faPencil, onClick: () => {setOpacity(0.05)} },
      { label: '0.2', icon: faPencil, onClick: () => {setOpacity(0.2)} },
      { label: '0.35', icon: faPencil, onClick: () => {setOpacity(0.35)} },
      { label: '0.5', icon: faPencil, onClick: () => {setOpacity(0.5)} },
      { label: '0.75', icon: faPencil, onClick: () => {setOpacity(0.75)} },
      { label: '0.9', icon: faPencil, onClick: () => {setOpacity(0.9)} },
    ],
  },
  {
    label: 'Node Size',
    icon: faPencil,
    submenu: [
      // { label: '0.1', icon: faPencil, onClick: () => {setNodeSize(0.1)}},
      { label: '0.25', icon: faPencil, onClick: () => {setNodeSize(0.25)}},
      { label: '0.5', icon: faPencil, onClick: () => {setNodeSize(0.5)}},
      { label: '1', icon: faPencil, onClick: () => {setNodeSize(1)}},
      { label: '1.5', icon: faPencil, onClick: () => {setNodeSize(1.5)}},
      { label: '3', icon: faPencil, onClick: () => {setNodeSize(3)}},
      { label: '5', icon: faPencil, onClick: () => {setNodeSize(5)}},
      { label: '10', icon: faPencil, onClick: () => {setNodeSize(10)}},

    ],
  },
];
const setNodeSize = (size: number) => {
  // elements.forEach((element) => {
  //   element.data.size = element.data.size * size;
  //   setCurNodeSize(size);
  // });
  // setElements(elements);

  console.log("setting node size");

  cyRef.current?.nodes().forEach(function(node){
    console.log("inside setting");
    node.data('size', parseInt(node.data('size'))/curNodeSize*size); 
  });
  setCurNodeSize(size);
}
const setOpacity = (op: number) => {
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