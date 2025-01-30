import { position, nodePositions } from "../@types/props";
import { ICustomGraphData, ICustomNode, ICustomLink } from "../@types/graphs";
import { assert } from "console";

export function layoutTester(graphData: ICustomGraphData): nodePositions {
    console.log(graphData);
    let newGraphData = preProcessing(graphData);
    let clusters: LayeredCluster[] = calcLayerdClusters(newGraphData);
    let positions: nodePositions = calcLayeredPosition(clusters, 1, 100, AllClusterMethods.linear);
    return positions;
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

function calcLayeredPosition(clusters: LayeredCluster[], outerSpacingFactor: number = 1, innerSpacingFactor: number = 100, method: ClusterLevelMethods): nodePositions {
    let positions: nodePositions = {};
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
        positions = {
            ...positions,
            ...getClusterLevelPositions(clusters[i], clusterCenter, innerSpacingFactor, method)
        } as nodePositions;
    }

    console.log(positions);

    return positions;
}

function toCartezian(r: number, theta: number): position {
    return { x: r * Math.cos(theta), y: r * Math.sin(theta) };
}


enum AllClusterMethods {
    linear = 'linear',
    no_overlap = 'no_overlap',
}
enum AllLayerMethods {
    simple = 'simple',
    randomStart = 'randomStart',
}
enum AllNodeMethods {
    random = 'random',
}

type ClusterLevelMethods = AllClusterMethods | AllLayerMethods | AllNodeMethods;
type LayerLevelMethods = AllLayerMethods | AllNodeMethods;
type NodeLevelMethods = AllNodeMethods;

function getClusterLevelPositions(cluster: LayeredCluster, center: position, spacingFactor: number, method: ClusterLevelMethods): nodePositions {
    console.log("getting cluster level positions");
    let positions: nodePositions = {};
    let allNodes: ICustomNode[] = [];

    let centerNode = cluster.layers.get(0)?.nodes[0];
    if (centerNode === undefined || centerNode.id === undefined) {
        throw new Error("centerNode is undefined");
    }

    positions[centerNode.id] = {x: center.x, y: center.y} as position;

    if (method === 'linear') {
        console.log("cluster layout method: linear");
        cluster.layers.forEach((layer: ClusterLayer) => {
            if (layer.rank !== 0) {
                allNodes.concat(layer.nodes);
            }
        });

        cluster.layers.forEach((layer: ClusterLayer) => {
            let layerRadius = layer.rank * spacingFactor;
            layer.nodes.forEach((node: ICustomNode) => {
                let theta = (2 * Math.PI * allNodes.indexOf(node)) / allNodes.length;
                let relativePos = toCartezian(layerRadius, theta);
                positions[String(node.id)] = { x: center.x + relativePos.x, y: center.y + relativePos.y };
            })
        })
    }
    else if (method === 'no_overlap') {
        console.log("cluster layout method: no overlap");
        console.log("no overlap not implemented yet");
    }
    else if (!(method in AllClusterMethods)){

        cluster.layers.forEach((layer: ClusterLayer) => {
            let layerRadius = layer.rank * spacingFactor;
            positions = {
                ...positions,
                ...getLayerLevelPositions(layer, center, layerRadius, method as LayerLevelMethods)
            }
        });
    }
    
    return positions;
}

function getLayerLevelPositions(layer: ClusterLayer, center: position, layerRadius: number, method: LayerLevelMethods): nodePositions {
    let positions: nodePositions = {};

    let theta = 0;
    let relativePos = { x: 0, y: 0 };

    if (method === AllLayerMethods.randomStart){
        console.log("cluster layout method: randomStart");
        theta = Math.random() * 2 * Math.PI;
        layer.nodes.forEach((node: ICustomNode) => {
            theta = (theta + (2 * Math.PI * layer.nodes.indexOf(node))) / layer.nodes.length;
            relativePos = toCartezian(layerRadius, theta);
            positions[String(node.id)] = { x: center.x + relativePos.x, y: center.y + relativePos.y };
        });
    }
    else if (method === AllLayerMethods.simple) {
        console.log("cluster layout method: simple");
        layer.nodes.forEach((node: ICustomNode) => {
            theta = (2 * Math.PI * layer.nodes.indexOf(node)) / layer.nodes.length;
            relativePos = toCartezian(layerRadius, theta);
            positions[String(node.id)] = { x: center.x + relativePos.x, y: center.y + relativePos.y };
        });
    }
    else if (!(method in AllLayerMethods)){
        layer.nodes.forEach((node: ICustomNode) => {
            positions = {
                ...positions,
                ...getNodeLevelPosition(node, center, layerRadius, method as NodeLevelMethods)
            }
        });
    }
    else {
        console.log("unknown method");
    }

    return positions;
}

function getNodeLevelPosition(node: ICustomNode, center: position, layerRadius: number, method: NodeLevelMethods): nodePositions {
    let positions: nodePositions = {};
    let theta = 0;
    if (method === 'random') {
        theta = Math.random() * 2 * Math.PI;
    }
    else {
        console.log("unknown method");
    }
    let relativePos = toCartezian(layerRadius, theta);
    positions[String(node.id)] = { x: center.x + relativePos.x, y: center.y + relativePos.y };
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