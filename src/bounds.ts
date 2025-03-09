import mapboxgl from 'mapbox-gl';
import { MapOptions, Point } from 'mapbox-gl';
import { Waypoint, WayPoints } from './route/Route';

type ScreenBox = {
    vertices: {
        topLeft: Point;
        topRight: Point;
        bottomLeft: Point;
        bottomRight: Point;
    };
    center: Point;
};

type GeoBox = {
    vertices: {
        topLeft: mapboxgl.LngLat;
        topRight: mapboxgl.LngLat;
        bottomLeft: mapboxgl.LngLat;
        bottomRight: mapboxgl.LngLat;
    };
    bounds: mapboxgl.LngLatBounds;
};

type BoundingBox = {
    screen: ScreenBox;
    geo: GeoBox;
}

export default class FitBounds {
    map: mapboxgl.Map;
    points: [lng: number, lat: number][];
    screen: Screen | null = null;
    boundingBox: BoundingBox | null = null;
    debug: boolean = false;

    constructor(map: mapboxgl.Map, points: [lng: number, lat: number][] | mapboxgl.LngLat[] | WayPoints, debug: boolean = false) {
        if (!points || points.length < 2) {
            throw new Error(`At least 2 points are required to creating a bounding box. Received points: ${points}`)
        }
        this.map = map;
        this.points = this.getPointsArray(points);
        this.debug = debug;
    }

    private getPointsArray(points: [number, number][] | mapboxgl.LngLat[] | WayPoints): [lng: number, lat: number][] {
        // ensure points in an array of [lng, lat] values
        const isWaypointArray = (points: any): points is WayPoints => {
            return points.length > 0 && typeof points[0].longitude === 'number' && typeof points[0].latitude === 'number';
        }
        const isLngLatArray = (points: any): points is mapboxgl.LngLat[] => {
            return points.length > 0 && points[0] instanceof mapboxgl.LngLat;
        }

        if (isWaypointArray(points)) {
            // Waypoints array - convert to [lng, lat]
            return points.map(
                (waypoint: Waypoint) => [waypoint.longitude, waypoint.latitude]
            );
        } else if (isLngLatArray(points)) {
            // LngLat array - convert to [lng, lat]
            return points.map(
                (point: mapboxgl.LngLat) => point.toArray()
            );
        }
        return points;
    }

    public getAlignedBounds(points: [number, number][] | null = null): mapboxgl.LngLatBounds {
        // simplified method to find bounds, assumes bearing and pitch are zero
        if (!points) points = this.points;
        if (!points || points.length < 2) throw new Error("At least 2 points are required.");
        const { swX, neX, swY, neY } = (points).reduce(
            (acc, [x, y]) => ({
                swX: Math.min(acc.swX, x),
                neX: Math.max(acc.neX, x),
                swY: Math.min(acc.swY, y),
                neY: Math.max(acc.neY, y),
            }),
            { swX: Infinity, neX: -Infinity, swY: Infinity, neY: -Infinity }
        );
        return new mapboxgl.LngLatBounds([[swX, swY], [neX, neY]])
    }

    public fitAlignedBounds(points: [number, number][] | null = null, options: MapOptions['fitBoundsOptions'] = {}): mapboxgl.Map {
        if (points) this.points = points;
        if (!options.padding) options.padding = this.map.getPadding();
        const bbox: mapboxgl.LngLatBounds = this.getAlignedBounds(points);
        if (this.debug) {
            this.drawBounds(
                bbox.getNorthEast().toArray(),
                bbox.getNorthWest().toArray(),
                bbox.getSouthWest().toArray(),
                bbox.getSouthEast().toArray()
            )
        }
        this.map.stop();
        return this.map.fitBounds(bbox, options);
    }

    public getScreenBounds(points: [lng: number, lat: number][] | null): BoundingBox {
        if (!points) points = this.points;
        // Use to calculate min/max x/y values in screen space
        const { minX, maxX, minY, maxY }: { minX: number; maxX: number; minY: number; maxY: number } = points.reduce(
            (acc, point) => {
                const screenPos: Point = this.map.project([point[0], point[1]]);
                return {
                    minX: Math.min(acc.minX, screenPos.x),
                    maxX: Math.max(acc.maxX, screenPos.x),
                    minY: Math.min(acc.minY, screenPos.y),
                    maxY: Math.max(acc.maxY, screenPos.y),
                };
            },
            { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
        );
        // attributes in the screen space
        const screen: ScreenBox = {
            vertices: {
                topLeft: new Point(minX, minY),
                topRight: new Point(maxX, minY),
                bottomLeft: new Point(minX, maxY),
                bottomRight: new Point(maxX, maxY)
            },
            center: new Point((minX + maxX) / 2, (minY + maxY) / 2)
        };
        // geo coordinates for the screen values
        const coords: Record<string, mapboxgl.LngLat> = {
            topLeft: this.map.unproject(screen.vertices.topLeft),
            topRight: this.map.unproject(screen.vertices.topRight),
            bottomRight: this.map.unproject(screen.vertices.bottomRight),
            bottomLeft: this.map.unproject(screen.vertices.bottomLeft)
        }
        return {
            screen: screen,
            geo: {
                vertices: {
                    topLeft: coords.topLeft,
                    topRight: coords.topRight,
                    bottomRight: coords.bottomRight,
                    bottomLeft: coords.bottomLeft
                },
                // geo bounding box MapBox object
                bounds: new mapboxgl.LngLatBounds([
                    coords.bottomLeft,
                    coords.topRight
                ])
            }
        }
    }

    public fitScreenBounds(points: [number, number][] | null = null, options: MapOptions['fitBoundsOptions'] = {}): mapboxgl.Map {
        // method to replace faulty map.fitScreenCoordinates() which does not handle pitch and bearing correctly
        // additionally, the fit from that method is grossly underzoomed, tending to the central 1/9th of the map
        // see issue https://github.com/mapbox/mapbox-gl-js/issues/13347
        
        if (points) this.points = points;
        const bbox: BoundingBox = this.getScreenBounds(points);
        const toPadding = (padding: number | mapboxgl.PaddingOptions): mapboxgl.PaddingOptions =>
            typeof padding === "number"
                ? { top: padding, bottom: padding, left: padding, right: padding }
                : { top: padding.top ?? 0, bottom: padding.bottom ?? 0, left: padding.left ?? 0, right: padding.right ?? 0 };

        const padding: mapboxgl.PaddingOptions = toPadding(options.padding ?? this.map.getPadding() ?? 0);
        const pitch: number = options.pitch ?? this.map.getPitch();
        const mapContainer: HTMLElement = this.map.getContainer();
        const effectiveMapWidth: number = mapContainer.offsetWidth - (padding?.left ?? 0) - (padding?.right ?? 0);
        const effectiveMapHeight: number = mapContainer.offsetHeight - (padding?.top ?? 0) - (padding?.bottom ?? 0);
        const boundsWidth: number = bbox.screen.vertices.bottomRight.x - bbox.screen.vertices.bottomLeft.x;
        const boundsHeight: number = bbox.screen.vertices.bottomLeft.y - bbox.screen.vertices.topLeft.y;
        const mapAspectRatio: number = effectiveMapWidth / effectiveMapHeight;
        const boundsAspectRatio: number = boundsWidth / boundsHeight;

        const offset: [number, number] = [
            (padding.right ?? 0) - (padding.left ?? 0),
            (padding.bottom ?? 0) - (padding.top ?? 0)
        ];

        const optimisePitchedMap: () => void = () => {
            // iterative fine adjustment for a map with pitch value after initial fit
            // recalculate screen positions of bbox bottom vertices to fit to effective width
            const bboxLeft = this.map.project(bbox.geo.vertices.bottomLeft);
            const bboxRight = this.map.project(bbox.geo.vertices.bottomRight);
            if (bboxRight.x - bboxLeft.x > effectiveMapWidth) {
                this.map.easeTo(
                    { zoom: this.map.getZoom() - 0.1 }
                ).once(
                    'moveend', optimisePitchedMap
                );
            }
        }

        this.map.stop().easeTo({
            center: bbox.geo.bounds.getCenter(),
            pitch: pitch,
            offset: offset
        }).once('moveend', () => {
            let scale: number = 1;
            if (mapAspectRatio > boundsAspectRatio) {
                scale = effectiveMapHeight / boundsHeight;
            } else {
                scale = effectiveMapWidth / boundsWidth;
            }
            const zoomAdjustment: number = Math.log2(scale);
            const optimalZoom: number = this.map.getZoom() + zoomAdjustment;
            this.map.easeTo({
                zoom: optimalZoom
            }).once('moveend', () => {
                if (pitch) optimisePitchedMap();
            });
        });
        return this.map
    }

    public drawBounds(
        topLeft: [lng: number, lat: number],
        topRight: [lng: number, lat: number],
        bottomRight: [lng: number, lat: number],
        bottomLeft: [lng: number, lat: number]
    ): void {
        queueMicrotask(() => {
            this.map.addSource('bounds-box', {
                "type": "geojson",
                "data": {
                    "type": "FeatureCollection",
                    "features": [
                        {
                            "type": "Feature",
                            "geometry": {
                                "type": "LineString",
                                "coordinates": [
                                    topLeft,
                                    topRight,
                                    bottomRight,
                                    bottomLeft,
                                    topLeft
                                ]
                            },
                            properties: null
                        }
                    ]
                }
            });
            this.map.addLayer({
                "id": "screenBounds-box-layer",
                "type": "line",
                "source": "screenBounds-box",
                "layout": {
                    "line-join": "round",
                    "line-cap": "round"
                },
                "paint": {
                    "line-color": "#ff0000",
                    "line-width": 4
                }
            });
        });
    }
}