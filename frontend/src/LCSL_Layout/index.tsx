import type cyFunc from 'cytoscape';
import { CyLayout } from './cy_layout';

export default function register(cytoscape: typeof cyFunc) {
    cytoscape("layout", "lcsl", CyLayout);
}

if (typeof window.cytoscape !== "undefined") {
    register(window.cytoscape);
}
