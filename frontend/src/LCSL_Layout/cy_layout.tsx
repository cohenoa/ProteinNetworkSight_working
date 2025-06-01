import type { NodeSingular, EdgeSingular, Css, LayoutPositionOptions, Position } from "cytoscape";

interface nodePositions {
  [key: string]: Position;
}

interface LayeredCluster {
    layers: Map<number, ClusterLayer>;
    rank: number;
    maxLayerRank: number;
    allNodesSorted: NodeSingular[];
}

interface ClusterLayer {
    nodes: NodeSingular[];
    rank: number;
}

interface LCSLLayoutOptions {
    name: "LCSL"
}

class DefaultOptions implements LCSLLayoutOptions {

    //** Needed to for the layout to be called from cytoscape */
    name: "LCSL" = "LCSL" as const;

    fit: boolean = true;   // if true, fits the viewport to the graph

    animate: boolean = true;         // animate the layout`s changes
    animationDuration: number = 500;  // duration of the animation in ms
    animationEasing: Css.TransitionTimingFunction | undefined = undefined;  // easing of animation

    nodeDimensionsIncludeLabels: boolean = true;  // if overflowing labels shoud count in the width or height of the node
}

export function CyLayout(this: CyLayout, options: LayoutPositionOptions) {
    this.options = {
        ...new DefaultOptions(),
        ...options,
        // animate: options.animate,
        // fit: options.fit,
        // eles: options.eles,
    };
}

declare type CyLayout = {
    options: LayoutPositionOptions;
    getHead(nodes: NodeSingular[]): NodeSingular;
    getNeighbors(this: CyLayout, node: NodeSingular, addedNodes: Map<String, boolean>): NodeSingular[]
    getStatistics(nodes: NodeSingular[]): { avg: number, std: number };
    getLayer(node: NodeSingular, head: NodeSingular, step: number): number
    calcLayerdClusters(): LayeredCluster[];
    getSpacingFactors(clusters: LayeredCluster[]): { outerSpacingFactor: number, innerSpacingFactors: Map<number, number> };
    getPositions(clusters: LayeredCluster[], center: Position, outerSpacingFactor: number, innerSpacingFactors: Map<number, number>): nodePositions
    run(): void;
};



CyLayout.prototype.run = function (this: CyLayout): void {
    // let params = this.options;
    // let options = params;

    // let eles = options.eles;
    // let nodes = eles.nodes().not( ':parent' );

    // @ts-ignore
    // this.options.eles.nodes().layoutPositions(this, this.options, (ele, i) => positions[String(ele.id())]);

    // this.options.eles.nodes().layoutPositions(this, options, (ele, i) => ({ x: 0, y: 0 }));

    console.log("running layout");

    console.log(this.options);

    let clusters = this.calcLayerdClusters();
    console.log("clusters: ", clusters);

    let {outerSpacingFactor, innerSpacingFactors} = this.getSpacingFactors(clusters);
    console.log("outerSpacingFactor: ", outerSpacingFactor);
    console.log("innerSpacingFactor: ", innerSpacingFactors);

    let positions = this.getPositions(clusters, { x: 0, y: 0 }, outerSpacingFactor, innerSpacingFactors);
    console.log("positions: ", positions);

    // this.options.eles.nodes().positions((ele, i) => positions[String(ele.id())]);
    // @ts-ignore
    this.options.eles.nodes().layoutPositions(this, this.options, (ele, i) => positions[String(ele.id())]);

    // (this.options.eles as any)._private.cy.emit("layoutstop");
};

CyLayout.prototype.getPositions = function getPositions(clusters: LayeredCluster[], center: Position, outerSpacingFactor: number, innerSpacingFactors: Map<number, number>): nodePositions {
    let allNodePositions: nodePositions = {};
    
    for (let i = 0; i < clusters.length; i++) {
        let cluster = clusters[i];

        let clusterCenter = toCartezian(outerSpacingFactor, (2 * Math.PI * cluster.rank) / clusters.length);
        clusterCenter = { x: center.x + clusterCenter.x, y: center.y + clusterCenter.y };



        cluster.layers.forEach((layer: ClusterLayer) => {
            let innerSpacingFactor = innerSpacingFactors.get(cluster.rank);
            innerSpacingFactor = innerSpacingFactor !== undefined ? innerSpacingFactor : 1;
            let layerRadius = layer.rank * innerSpacingFactor;
            layer.nodes.forEach((node: NodeSingular) => {
                let nodePos: Position = {...clusterCenter};

                if (layer.rank !== 0){
                    let index = cluster.allNodesSorted.findIndex(element => element.id() === node.id()) - 1;
                    let theta = (2 * Math.PI * index) / (cluster.allNodesSorted.length - 1);
                    let relativePos = toCartezian(layerRadius, theta);
                    nodePos = { x: nodePos.x + relativePos.x, y: nodePos.y + relativePos.y };
                }

                allNodePositions[String(node.id())] = nodePos;
            })
        })
    }
    return allNodePositions;
}

CyLayout.prototype.getSpacingFactors = function getSpacingFactors(this: CyLayout, clusters: LayeredCluster[]): { outerSpacingFactor: number, innerSpacingFactors: Map<number, number> } {
    let innerSpacingFactors: Map<number, number> = new Map<number, number>();
    let outerSpacingFactor = 1;

    for (let i = 0; i < clusters.length; i++) {
        let cluster = clusters[i];
        
        let maxNodeSize = 0;
        for (let i = 0; i < cluster.allNodesSorted.length; i++) {
            let node = cluster.allNodesSorted[i];
            let nodeSize = node.data("size");
            if (nodeSize > maxNodeSize) {
                maxNodeSize = nodeSize;
            }
        }

        let clusterInnerSpacing = maxNodeSize * 1.5;
        
        innerSpacingFactors.set(cluster.rank, clusterInnerSpacing);
        outerSpacingFactor = Math.max(outerSpacingFactor, clusterInnerSpacing * cluster.maxLayerRank * 1.2);
    }
    return {outerSpacingFactor: outerSpacingFactor, innerSpacingFactors: innerSpacingFactors};
}


CyLayout.prototype.calcLayerdClusters = function calcLayerdClusters(this: CyLayout): LayeredCluster[] {
    const clusters: LayeredCluster[] = [];

    let nodes = this.options.eles.nodes().copy().toArray() as NodeSingular[];
    let addedNodes: Map<String, boolean> = new Map<String, boolean>(
        nodes.map(node => [node.id(), false])
    );

    let clusterRank = 0;
    
    while (nodes.length > 0) {
        const head = this.getHead(nodes);
        const neighbors = this.getNeighbors(head, addedNodes);
        console.log(neighbors);
        let {avg, std} = this.getStatistics(neighbors);

        let maxLayerRank = 0;
        let clusterLayers = new Map<number, ClusterLayer>();

        clusterLayers.set(0, {nodes: [head], rank: 0});

        for (let i = 0; i < neighbors.length; i++) {
            let layer = this.getLayer(neighbors[i], head, std);
            if (layer > maxLayerRank) {
                maxLayerRank = layer;
            }
            if (!clusterLayers.has(layer)) {
                clusterLayers.set(layer, {nodes: [], rank: layer});
            }
            clusterLayers.get(layer)?.nodes.push(neighbors[i]);
        }


        let removedNodes = nodes.filter(node => neighbors.some(neighbor => neighbor.id() === node.id()) || node.id() === head.id());
        nodes = nodes.filter(node => !removedNodes.some(removedNode => removedNode.id() === node.id()));

        clusters.push({layers: clusterLayers, rank: clusterRank, maxLayerRank: maxLayerRank, allNodesSorted: removedNodes.sort((nodeA, nodeB) => nodeB.data("linksWeights") - nodeA.data("linksWeights"))});
        clusterRank++;

    }
    console.log(clusters);
    return clusters;
}


// ---------- helper functions ----------------
CyLayout.prototype.getLayer = function getLayer(node: NodeSingular, head: NodeSingular, step: number): number {
    // get pair wise weights between node and head
    let layer = 1;
    if (step === 0) {
        return 1;
    }

    if (node.data("linksWeights") === undefined || head.data("linksWeights") === undefined) {
        console.log("error: node.linksWeights or head.linksWeights is undefined");
        return 1;
    }
    while (node.data("linksWeights") + step * layer < head.data("linksWeights")){
        layer++;
    }
    return layer;
}

CyLayout.prototype.getHead = function (nodes: NodeSingular[]): NodeSingular {
    let head: NodeSingular = nodes[0];

    for (let i = 1; i < nodes.length; i++) {
        let node = nodes[i];
        if (node.data("linksWeights") > head.data("linksWeights")) {
            head = node;
        }
    }
    return head;
}

CyLayout.prototype.getNeighbors = function getNeighbors(this: CyLayout, node: NodeSingular, addedNodes: Map<String, boolean>): NodeSingular[] {
    let neighbors: NodeSingular[] = [];
    let links = this.options.eles.edges().toArray() as EdgeSingular[];

    for (let i = 0; i < links.length; i++) {
        let link = links[i];
        if (link.source().id() == node.id() || link.target().id() == node.id()) {
            let otherNode = link.source().id() == node.id() ? link.target() : link.source();
            if (!addedNodes.get(String(otherNode.id()))) {
                neighbors.push(otherNode);
                addedNodes.set(String(otherNode.id()), true);
            }
        }
    }
    return neighbors;
}


CyLayout.prototype.getStatistics = function getStatistics(this: CyLayout, nodes: NodeSingular[]): { avg: number, std: number } {
    let avg = 0;
    let std = 0;

    if (nodes.length === 0) {
        // return now to avoid divide by 0
        return { avg, std };
    }

    for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i];
        if (node.data("linksWeights")){
            avg += node.data("linksWeights");
        }
        else {
            console.log("error: node.linksWeights is undefined");
        }
    }

    avg /= nodes.length;
    
    for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i];
        if (node.data("linksWeights")){
            std += (node.data("linksWeights") - avg) ** 2;
        }
    }

    std = Math.sqrt(std / (nodes.length));

    return  { avg, std };
}

function toCartezian(r: number, theta: number): Position {
    return { x: r * Math.cos(theta), y: r * Math.sin(theta) };
}