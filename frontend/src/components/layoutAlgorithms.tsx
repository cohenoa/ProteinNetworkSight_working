import { position } from "../@types/props";
import { ICustomGraphData, ICustomNode } from "../@types/graphs";
import { assert } from "console";

export function layoutTester(graphData: ICustomGraphData): Array<position> {

    layerdClusters(graphData);

    return [];
}

interface LayeredCluster {
    layers: ClusterLayer[];
    rank: number;
    maxLayerRank: number;
}

interface ClusterLayer {
    nodes: ICustomNode[];
    rank: number;
}

function layerdClusters(graphData: ICustomGraphData) {
    const clusters: LayeredCluster[] = [];
    let workData: ICustomGraphData = { nodes: [...graphData.nodes], links: [...graphData.links] };

    let clusterRank = 0;
    
    while (workData.nodes.length > 0) {
        const head = getHead(workData);
        const neighbors = getNeighbors(head, workData);
        let {avg, std} = getStatistics(neighbors);

        let clusterLayers: ClusterLayer[] = [];
        let maxLayerRank = 0;
        for (let i = 0; i < neighbors.length; i++) {
            
        }
        clusters.push({layers: [], rank: clusterRank, maxLayerRank: maxLayerRank = 0});
        
        clusterRank++;
    }
}

function getLayer(node: ICustomNode, head: ICustomNode, step: number): number {
    let layer = 1;
    if (node.linksWeights === undefined || head.linksWeights === undefined) {
        console.log("error: node.linksWeights or head.linksWeights is undefined");
        return 1;
    }
    while (node.linksWeights + step * layer < head.linksWeights){
        layer++;
    }
    return layer;
}

function getHead(graphData: ICustomGraphData): ICustomNode {
    let head = graphData.nodes[0];
    for (let i = 1; i < graphData.nodes.length; i++) {
        let node = graphData.nodes[i];
        if (head.linksWeights && node.linksWeights && node.linksWeights > head.linksWeights) {
            head = graphData.nodes[i];
        }
    }
    return head;
}

function getNeighbors(node: ICustomNode, graphData: ICustomGraphData): ICustomNode[] {
    let neighbors: ICustomNode[] = [];
    for (let i = 0; i < graphData.links.length; i++) {
        let link = graphData.links[i];
        if (link.source == node.id || link.target == node.id) {
            neighbors.push(graphData.nodes[link.target]);
        }
    }
    return neighbors;
}

function getStatistics(nodes: ICustomNode[]): { avg: number, std: number } {
    let avg = 0;
    let std = 0;

    for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i];
        if (node.linksWeights){
            avg += node.linksWeights;
        }
        else {
            console.log("error: node.linksWeights is undefined");
        }
    }

    avg /= nodes.length;
    
    for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i];
        if (node.linksWeights){
            std += (node.linksWeights - avg) ** 2;
        }
    }

    std = Math.sqrt(std / (nodes.length));

    return  { avg, std };
}