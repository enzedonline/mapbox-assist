import mapboxgl from 'mapbox-gl';
export type Map = mapboxgl.Map;

import merge from 'deepmerge';
const dontMerge = (_: Array<any>, source: Array<any>) => source;

import { MapStyles, defaultOptions, Options } from './Options';
import { RouteParameters } from './route/Route';

type MapParameters = {
    // Used if creating a new map
    // at least one of container or mapInstance must be defined
    token: string; // Mapbox access token
    container: HTMLElement | string | undefined; // map container object or id - ignored if mapInstance is defined
    mapInstance: Map | undefined; // Map instance to use - if not defined, a new map will be created
    initialStyle: string | undefined; // key to styles, will default to first style if not defined - ignored if mapInstance is defined
    pitch: number; // initial pitch (degrees)
    bearing: number; // initial bearing (degrees)
    relativePadding: { top: number; right: number; bottom: number; left: number; } | number; // percentage values (relative to map) - ignored if mapInstance is defined
    route: RouteParameters | undefined; // Optional route to display on load
    // center & radius are ignored if route is defined
    center: { longitude: number; latitude: number; } | undefined;
    radius: number | undefined; // kilometres
    styles: MapStyles | undefined; // if not defined, the default option styles will be used
}

export const defaultMapParameters: MapParameters = {
    token: '',
    container: undefined,
    mapInstance: undefined,
    initialStyle: Object.keys(defaultOptions.mapStyles)[0],
    pitch: 5,
    bearing: 0,
    relativePadding: 5, // percentage
    route: undefined,
    center: undefined,
    radius: 100,
    styles: undefined,
}

export default class MapboxAssist {
    map: Map | null = null;
    options: Options;
    mapParameters: MapParameters;
    mapStyles: MapStyles;
    customLayers: mapboxgl.Layer[] = [];
    container: HTMLElement;
    absolutePadding: { top: number; right: number; bottom: number; left: number; };

    constructor(mapParameters: Partial<MapParameters>, options: Partial<Options>) {
        this.options = merge(defaultOptions, options, { arrayMerge: dontMerge });
        this.mapParameters = merge(defaultMapParameters, mapParameters);
        this.validateParameters();
        this.mapStyles = mapParameters.styles ?? this.options.mapStyles;
        if (this.mapParameters.mapInstance) {
            this.map = this.mapParameters.mapInstance;
            this.container = this.map.getContainer();
        } else if (this.mapParameters.container instanceof HTMLElement) {
            this.container = this.mapParameters.container;
        } else {
            const container = document.getElementById(this.mapParameters.container as string);
            if (container) {
                this.container = container;
            } else {
                throw new Error(`Container ${this.mapParameters.container} not found`);
            }
        }
        const { top, right, bottom, left } =
            typeof this.mapParameters.relativePadding === "number"
                ? { top: this.mapParameters.relativePadding, right: this.mapParameters.relativePadding, bottom: this.mapParameters.relativePadding, left: this.mapParameters.relativePadding }
                : this.mapParameters.relativePadding;

        this.absolutePadding = {
            top: (this.container.offsetHeight * top) / 100,
            right: (this.container.offsetWidth * right) / 100,
            bottom: (this.container.offsetHeight * bottom) / 100,
            left: (this.container.offsetWidth * left) / 100
        };
    }

    validateParameters(): void {
        if (!this.mapParameters.token) {
            throw new Error('Mapbox access token is required');
        }
        if (!this.mapParameters.container && !this.mapParameters.mapInstance) {
            throw new Error('Either a container or map instance is required');
        }
    }



};
