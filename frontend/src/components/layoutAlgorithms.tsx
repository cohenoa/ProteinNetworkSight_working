import { position, nodePositions } from "../@types/props";
import { ICustomGraphData, ICustomNode, ICustomLink } from "../@types/graphs";

export function layoutTester(graphData: ICustomGraphData, method: AllMethods): nodePositions {
    let newGraphData = preProcessing(graphData);
    let clusters: LayeredCluster[] = calcLayerdClusters(newGraphData);
    let positions: nodePositions = calcLayeredPosition(clusters, 1, 60, method);
    return positions;
}

export enum AllMethods {
    spiral,
    no_overlap,
    simple,
    randomStart,
    random,
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

function calcLayeredPosition(clusters: LayeredCluster[], outerSpacingFactor: number = 1, innerSpacingFactor: number = 100, method: AllMethods): nodePositions {
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

function getClusterLevelPositions(cluster: LayeredCluster, center: position, spacingFactor: number, method: AllMethods): nodePositions {
    let positions: nodePositions = {};

    let centerNode = cluster.layers.get(0)?.nodes[0];
    if (centerNode === undefined || centerNode.id === undefined) {
        throw new Error("centerNode is undefined");
    }

    positions[centerNode.id] = {x: center.x, y: center.y} as position;

    if (method === AllMethods.spiral) {
        let allNodes: ICustomNode[] = [];

        cluster.layers.forEach((layer: ClusterLayer) => {
            if (layer.rank !== 0) {
                allNodes = allNodes.concat(layer.nodes);
            }
        });
        console.log("allNodes: ");
        console.log(allNodes);
        console.log(cluster.layers);

        cluster.layers.forEach((layer: ClusterLayer) => {
            let layerRadius = layer.rank * spacingFactor;
            layer.nodes.forEach((node: ICustomNode) => {
                if (layer.rank !== 0){
                    let theta = (2 * Math.PI * allNodes.indexOf(node)) / allNodes.length;
                    let relativePos = toCartezian(layerRadius, theta);
                    positions[String(node.id)] = { x: center.x + relativePos.x, y: center.y + relativePos.y };
                }
            })
        })
    }
    else if (method === AllMethods.no_overlap) {
        console.log("no overlap not implemented yet");
    }
    else {
        cluster.layers.forEach((layer: ClusterLayer) => {
            let layerRadius = layer.rank * spacingFactor;
            positions = {
                ...positions,
                ...getLayerLevelPositions(layer, center, layerRadius, method)
            }
        });
    }
    
    return positions;
}

function getLayerLevelPositions(layer: ClusterLayer, center: position, layerRadius: number, method: AllMethods): nodePositions {
    let positions: nodePositions = {};

    let theta = 0;
    let relativePos = { x: 0, y: 0 };

    if (method === AllMethods.randomStart){
        theta = Math.random() * 2 * Math.PI;
        layer.nodes.forEach((node: ICustomNode) => {
            theta = (theta + (2 * Math.PI * layer.nodes.indexOf(node))) / layer.nodes.length;
            relativePos = toCartezian(layerRadius, theta);
            positions[String(node.id)] = { x: center.x + relativePos.x, y: center.y + relativePos.y };
        });
    }
    else if (method === AllMethods.simple) {
        layer.nodes.forEach((node: ICustomNode) => {
            theta = (2 * Math.PI * layer.nodes.indexOf(node)) / layer.nodes.length;
            relativePos = toCartezian(layerRadius, theta);
            positions[String(node.id)] = { x: center.x + relativePos.x, y: center.y + relativePos.y };
        });
    }
    else {
        layer.nodes.forEach((node: ICustomNode) => {
            positions = {
                ...positions,
                ...getNodeLevelPosition(node, center, layerRadius, method)
            }
        });
    }

    return positions;
}

function getNodeLevelPosition(node: ICustomNode, center: position, layerRadius: number, method: AllMethods): nodePositions {
    let positions: nodePositions = {};
    let theta = 0;
    if (method === AllMethods.random) {
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
        const head = getHead(graphData);
        const neighbors = getNeighbors(head, graphData);
        let {avg, std} = getStatistics(neighbors);

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
        clusters.push({layers: clusterLayers, rank: clusterRank, maxLayerRank: maxLayerRank});
        clusterRank++;

        for (let i = 0; i < neighbors.length; i++) {
            graphData.nodes.delete(String(neighbors[i].id));
        }
        graphData.nodes.delete(String(head.id));
    }
    console.log(clusters);
    return clusters;
}

function getLayer(node: ICustomNode, head: ICustomNode, step: number): number {
    // get pair wise weights between node and head
    let layer = 1;
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