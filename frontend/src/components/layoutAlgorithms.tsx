import { position, nodePositions } from "../@types/props";
import { ICustomGraphData, ICustomNode, ICustomLink } from "../@types/graphs";
import { assert } from "console";

export function layoutTester(graphData: ICustomGraphData): Array<position> {
    console.log(graphData);
    let newGraphData = preProcessing(graphData);
    let clusters: LayeredCluster[] = calcLayerdClusters(newGraphData);
    let positions: Array<position> = calcLayeredPosition(clusters);
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

function calcLayeredPosition(clusters: LayeredCluster[], outerSpacingFactor = 2, innerSpacingFactor = 20): Array<position> {
    let positions: Array<position> = [];
    let maxLayerRank = 0;

    console.log("finding maxLayerRank");
    for (let i = 0; i < clusters.length; i++) {
        if (clusters[i].maxLayerRank > maxLayerRank) {
            maxLayerRank = clusters[i].maxLayerRank;
        }
    }
    console.log("maxLayerRank: " + maxLayerRank);

    let innerRadius = (maxLayerRank * innerSpacingFactor);
    let outerRadius = (innerRadius + 1) * outerSpacingFactor;
    let centerPos = outerRadius + innerRadius + outerSpacingFactor;
    let center = { x: centerPos, y: centerPos };

    console.log("center: " + center);
    console.log("innerRadius: " + innerRadius);
    console.log("outerRadius: " + outerRadius);

    for (let i = 0; i < clusters.length; i++) {
        let clusterCenter = toCartezian(outerRadius, (2 * Math.PI * clusters[i].rank) / clusters.length);
        positions.concat(calcLayeredClusterLayout(clusters[i], clusterCenter, innerSpacingFactor));
        break;
    }

    return positions;
}

function toCartezian(r: number, theta: number): { x: number, y: number } {
    return { x: r * Math.cos(theta), y: r * Math.sin(theta) };
}

function toPolar(x: number, y: number): { r: number, theta: number } {
    return { r: Math.sqrt(x * x + y * y), theta: Math.atan2(y, x) };
}

function calcLayeredClusterLayout(cluster: LayeredCluster, center: { x: number, y: number }, spacingFactor = 50): nodePositions {
    let positions: nodePositions = {};
    console.log("calculating cluster layout");
    console.log("center: " + center);
    console.log("spacingFactor: " + spacingFactor);

    let centerNode = cluster.layers.get(0)?.nodes[0];
    if (centerNode === undefined || centerNode.id === undefined) {
        throw new Error("centerNode is undefined");
    }
    else{
        positions[centerNode.id] = {x: center.x, y: center.y} as position;
    }
    
    return positions;
}

function calcLayerdClusters(graphData: ILinkedGraphData) {
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

        console.log("organizing layers in cluster");
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
        clusters.push({layers: clusterLayers, rank: clusterRank, maxLayerRank: maxLayerRank});
        clusterRank++;

        console.log("deleting nodes from graphData");
        for (let i = 0; i < neighbors.length; i++) {
            graphData.nodes.delete(String(neighbors[i].id));
        }
        graphData.nodes.delete(String(head.id));
    }
    console.log(clusters);
    return clusters;
}

function getLayer(node: ICustomNode, head: ICustomNode, step: number): number {
    let layer = 1;
    console.log("getting layer for node: " + node.id);
    if (step === 0) {
        return 1;
    }

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
    console.log("getting neighbors");

    for (let i = 0; i < graphData.links.length; i++) {
        let link = graphData.links[i];
        if (link.source == node.id || link.target == node.id) {
            let otherNodeName = link.source == node.id ? link.target : link.source;
            let otherNode = graphData.nodes.get(String(otherNodeName));

            if (otherNode !== undefined) {
                neighbors.push(otherNode as ICustomNode);
            }

        }
    }
    return neighbors;
}

function getStatistics(nodes: ICustomNode[]): { avg: number, std: number } {
    let avg = 0;
    let std = 0;
    console.log("getting statistics");

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