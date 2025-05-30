// function convertArrayToSvg(nodesData: any[]): string {
//     const svgContent = `
//       <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" fit="true">
//         ${nodesData.map(nodeData => convertNodeToSvg(nodeData)).join('\n')}
//       </svg>
//     `;
//     return svgContent;
// }
// function addEdgesToSVG(svgString:any, edgeArray:any[]) {
//     // Create a DOMParser
//     var parser = new DOMParser();

//     // Parse the SVG string into a DOM structure
//     var doc = parser.parseFromString(svgString, 'image/svg+xml');
//     // Iterate through each edge in the array
//     edgeArray.forEach(edgeData => {
//         // Get the positions of the source and target nodes
//         // node.id.split('_').join('')
//         var sourceNode = doc.getElementById(edgeData.data.source);
//         var targetNode =  doc.getElementById(edgeData.data.target);
//         var edgeColor = doc.getElementById(edgeData.data);
//         // console.log(sourceNode , targetNode);
//         var sourceX =  sourceNode?.getAttribute('cx');
//         var sourceY = sourceNode?.getAttribute('cy');
//         var targetX = targetNode?.getAttribute('cx');
//         var targetY = targetNode?.getAttribute('cy');

//         // Create a new line element (edge)
//         if(sourceNode != null&& typeof sourceX == 'string' && typeof sourceY == 'string'&& typeof targetX == 'string'&& typeof targetY == 'string'){
//           var line = doc.createElementNS('http://www.w3.org/2000/svg', 'line');
//           line.setAttribute('x1', sourceX);
//           line.setAttribute('y1', sourceY);
//           line.setAttribute('x2',targetX);
//           line.setAttribute('y2', targetY);
//           line.setAttribute('stroke', edgeData.data.color || 'black');
//           line.setAttribute('stroke-width', '2.5');

//           line.setAttribute('opacity', String(myStyle[1].style.opacity));

//           // Append the new line element to the SVG
//           doc.documentElement.insertBefore(line,sourceNode);
//           doc.documentElement.insertBefore(line,targetNode);
//         }
        
//     });

//     // Convert the modified DOM back to an SVG string
//     return new XMLSerializer().serializeToString(doc);
// }
// function convertNodeToSvg(nodeData: any): string {
//     return `
//       <!-- Circle representing the node -->
//       <circle id = "${nodeData.data.label}" cx="${nodeData.position.x+50}" cy="${nodeData.position.y+50}" r="${nodeData.data.size/1.8}"
//               fill="${nodeData.data.color}" z-index="10" stroke="black"/>
//       <!-- Text label -->
//       <text x="${nodeData.position.x+50}" y="${nodeData.position.y - nodeData.data.size +45}"
//             font-size="12" fill="black" text-anchor="middle">
//         ${nodeData.data.label}
//       </text>
//     `;
// }
  
// function saveAsSvg (jsonBlob: any): void{
//     var nodes = jsonBlob.elements.nodes;
//     var edges = jsonBlob.elements.edges;
//     var svgOutPut = convertArrayToSvg(nodes);
    
//     svgOutPut = addEdgesToSVG(svgOutPut, edges);
//     var a = document.createElement("a");
//     var file = new Blob([svgOutPut], {type: "image/svg+xml"});
//     a.href = URL.createObjectURL(file);
//     a.download =state.fileName.split('.')[0] + '_' + clickedVector + ".svg"
//     a.click();
// }