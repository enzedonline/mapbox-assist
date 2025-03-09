export type Waypoint = {
    longitude: number;
    latitude: number;
    pinLabel: string | undefined;
    showPin: boolean;
};

export type WayPoints = Waypoint[];

export type RouteParameters = {
    routeType: "walking" | "biking" | "driving" | "driving-traffic" | "direct-line" | undefined;  // Define possible values for routeType
    waypoints: WayPoints;
    showSummary: boolean;
    showElevationProfile: boolean;
};