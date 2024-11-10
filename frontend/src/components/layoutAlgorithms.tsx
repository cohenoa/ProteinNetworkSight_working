import { position } from "../@types/props";
import { ICustomGraphData, ICustomNode } from "../@types/graphs";

export function layoutTester(graphData: ICustomGraphData): Array<position> {

    layerdClusters(graphData);

    return [];
}

interface LayeredCluster {
    nodes: ICustomNode[];
    nextLayer: LayeredCluster | null;
}

function layerdClusters(graphData: ICustomGraphData): Object {

    const layers: LayeredCluster = { nodes: [], nextLayer: null };

    
    let head = graphData.nodes[0];

    let avg = head.linksWeights? head.linksWeights : 0;

    for (let i = 1; i < graphData.nodes.length; i++) {
        let node = graphData.nodes[i];
        if (node.linksWeights && head.linksWeights){
            if (node.linksWeights > head.linksWeights) {
                head = graphData.nodes[i];
            }
            avg += node.linksWeights;
        }
    }

    avg /= graphData.nodes.length;
    let std = 0;

    for (let i = 0; i < graphData.nodes.length; i++) {
        let node = graphData.nodes[i];
        if (node.linksWeights){
            std += (node.linksWeights - avg) ** 2;
        }
    }

    std = Math.sqrt(std / (graphData.nodes.length));

    console.log("head: ", head);
    console.log("avg: ", avg);
    console.log("std: ", std);

    return []; 
}