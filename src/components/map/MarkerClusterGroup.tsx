import React from "react";
import L from "leaflet";
import { createLayerComponent, extendContext } from "@react-leaflet/core";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

export type MarkerClusterGroupProps = L.MarkerClusterGroupOptions & {
  children?: React.ReactNode;
};

// React-Leaflet v5 compatible MarkerClusterGroup wrapper
// Uses leaflet.markercluster under the hood.
const MarkerClusterGroup = createLayerComponent<L.MarkerClusterGroup, MarkerClusterGroupProps>(
  function createMarkerClusterGroup(props, ctx) {
    const { children, ...options } = props;

    const instance = L.markerClusterGroup(options);

    return {
      instance,
      context: extendContext(ctx, { layerContainer: instance }),
    };
  },
  function updateMarkerClusterGroup(instance, props, prevProps) {
    // Minimal update support: when any option changes, Leaflet doesn't support
    // updating most cluster options after init; keep the existing instance.
    // Children updates are handled by React-Leaflet via layerContainer context.
    void instance;
    void props;
    void prevProps;
  }
);

export default MarkerClusterGroup;
