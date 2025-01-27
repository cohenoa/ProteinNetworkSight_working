import { position } from "../@types/props";
import { ICustomGraphData, ICustomNode, ICustomLink } from "../@types/graphs";
import { assert } from "console";

export function layoutTester(graphData: ICustomGraphData): Array<position> {
    console.log(graphData);
    let newGraphData = preProcessing(graphData);
    layerdClusters(newGraphData);
    return [];
}

interface LayeredCluster {
    layers: Map<number, ClusterLayer>;
    rank: number;
    maxLayerRank: number;
}

interface ClusterLayer {
    nodes: ICustomNode[];
    rank: number;
}

interface ILinkedGraphData{
    nodes: Map<String, ICustomNode>;
    links: ICustomLinkedLink[];
}

interface ICustomLinkedLink extends ICustomLink {
    sourceNode: ICustomNode;
    targetNode: ICustomNode;
}

function preProcessing(graphData: ICustomGraphData): ILinkedGraphData {
    const nodes = graphData.nodes;
    const links = graphData.links;

    let nodeMap = new Map<String, ICustomNode>();
    for (let i = 0; i < nodes.length; i++) {
        nodeMap.set(String(nodes[i].id), nodes[i]);
    }

    let newGraphData = { nodes: nodeMap, links: [...links] } as ILinkedGraphData;

    console.log(newGraphData);

    return newGraphData;
}

function layerdClusters(graphData: ILinkedGraphData) {
    const clusters: LayeredCluster[] = [];

    let clusterRank = 0;
    
    while (graphData.nodes.size > 0) {
        console.log(graphData);
        const head = getHead(graphData);
        console.log(head);
        const neighbors = getNeighbors(head, graphData);
        console.log(neighbors);
        let {avg, std} = getStatistics(neighbors);
        console.log(avg, std);

        let maxLayerRank = 0;
        let clusterLayers = new Map<number, ClusterLayer>();

        clusterLayers.set(0, {nodes: [head], rank: 0});

        for (let i = 0; i < neighbors.length; i++) {
            let layer = getLayer(neighbors[i], head, std);
            if (layer > maxLayerRank) {
                maxLayerRank = layer;
            }
            if (!clusterLayers.has(layer)) {
                clusterLayers.set(layer, {nodes: [], rank: layer});
            }
            clusterLayers.get(layer)?.nodes.push(neighbors[i]);
        }
        clusters.push({layers: clusterLayers, rank: clusterRank, maxLayerRank: maxLayerRank = 0});
        clusterRank++;

        for (let i = 0; i < neighbors.length; i++) {
            graphData.nodes.delete(String(neighbors[i].id));
        }
        graphData.nodes.delete(String(head.id));

        // break;
    }
    console.log(clusters);
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

function getHead(graphData: ILinkedGraphData): ICustomNode {
    let head: ICustomNode | undefined = undefined;
    console.log("getting head");

    graphData.nodes.forEach((node: ICustomNode) => {
        console.log(node)
        if (head === undefined) {
            head = node;
            return;
        }
        else if (head.linksWeights === undefined || node.linksWeights === undefined) {
            console.log("error: head.linksWeights or node.linksWeights is undefined");
            return;
        }
        if (node.linksWeights > head.linksWeights) {
            head = node;
        }
    });

    if (head === undefined) {
        throw new Error("No head node found in graph data");
    }

    return head;
}


function getNeighbors(node: ICustomNode, graphData: ILinkedGraphData): ICustomNode[] {
    let neighbors: ICustomNode[] = [];

    for (let i = 0; i < graphData.links.length; i++) {
        let link = graphData.links[i];
        if (link.source == node.id || link.target == node.id) {
            let otherNode = link.source == node.id ? link.target : link.source;
            neighbors.push(graphData.nodes.get(String(otherNode)) as ICustomNode);
        }
    }
    return neighbors;
}

function getStatistics(nodes: ICustomNode[]): { avg: number, std: number } {
    let avg = 0;
    let std = 0;

    if (nodes.length === 0) {
        console.log("error: nodes is empty");
        return { avg, std };
    }

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