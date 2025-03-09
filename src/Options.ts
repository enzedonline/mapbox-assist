export type MapStyle = {
    title: string; // Displayed in the style selector
    source: string | JSON; // Mapbox style URL or valid style JSON (see https://docs.mapbox.com/help/glossary/style/)
    tileImageUrl: string; // href value for a static image of the map style
};

export type MapStyles = Record<string, MapStyle>

type ElevationProfileOptions = {
    labels: {
        elevation: string;
        elevationUnits: string;
        distance: string;
        distanceUnits: string;
        defaultStart: string;
        defaultEnd: string;
    },
    styles: {
        profileLineColour: string;
        profileLineWidth: number;
        profileBackgroundColour: string; 
        dropLineColour: string;
        dropLineWidth: number;
        titleFontFamily: string;
        bodyFontFamily: string;
    }
    containerClassList: string;
    placeholder: {
        label: string;
        classList: string;
    }
}

export type RouteOptions = {
    directionsAPIurl: string;
    summary: {
        heading: string;
        ascentHTML: string;
        descentHTML: string | undefined;
        tableClassList: string;
        columnHeaderClassList: string;
        rowHeaderClassList: string;
        cellClassList: string;
        footerCellClassList: string;
    };
    elevationProfile: ElevationProfileOptions;
};

export type Options = {
    mapStyles: MapStyles;
    mapStyleContainerClassList: string;
    captionHTML: string | undefined;
    route: RouteOptions;
    featureLayers: [string] | undefined; // Feature layers to query on click
    apiKeys: Record<string, string> | undefined; // API keys for various services
    urls: Record<string, string> | undefined;    // URLs for various resources
    staticText: Record<string, string> | undefined; // Static text for various elements
}

export const defaultOptions: Options = {
    mapStyles: {
        "terrain": {
            title: 'Terrain',
            source: 'mapbox://styles/mapbox/outdoors-v12',
            tileImageUrl: 'https://docs.mapbox.com/mapbox-gl-js/assets/ideal-img/beta-maps-guides-outdoors.998a61c.480.png',
        },
        "satellite": {
            title: 'Satellite',
            source: 'mapbox://styles/mapbox/satellite-v12',
            tileImageUrl: 'https://docs.mapbox.com/mapbox-gl-js/assets/ideal-img/beta-maps-guides-3d-terrain.5761278.480.png',
        },
    },
    mapStyleContainerClassList: 'mapbox-style-tile-container',
    captionHTML: undefined,
    route: {
        directionsAPIurl: 'https://api.mapbox.com/directions/v5/mapbox/',
        summary: {
            heading: 'Route Summary',
            ascentHTML: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" id="elevation-increase"><path d="M384 160c-17.7 0-32-14.3-32-32s14.3-32 32-32l160 0c17.7 0 32 14.3 32 32l0 160c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-82.7L342.6 374.6c-12.5 12.5-32.8 12.5-45.3 0L192 269.3 54.6 406.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l160-160c12.5-12.5 32.8-12.5 45.3 0L320 306.7 466.7 160 384 160z"/></svg>`,
            descentHTML: undefined,
            tableClassList: 'table table-sm table-hover route-summary-table',
            columnHeaderClassList: 'text-end',
            rowHeaderClassList: 'fw-normal',
            cellClassList: 'route-distance-cell',
            footerCellClassList: 'route-distance-cell',
        },
        elevationProfile: {
            labels: {
                elevation: 'Elevation',
                elevationUnits: 'm',
                distance: 'Distance',
                distanceUnits: 'km',
                defaultStart: 'Start',
                defaultEnd: 'End',
            },
            styles: {
                profileLineColour: '',
                profileLineWidth: 0,
                profileBackgroundColour: '',
                dropLineColour: '#96B578',
                dropLineWidth: 1,
                titleFontFamily: 'system-ui, Arial, sans-serif',
                bodyFontFamily: 'system-ui, Arial, sans-serif',
            },
            containerClassList: 'elevation-profile-container',
            placeholder: {
                label: 'Loading elevation profile ...',
                classList: 'd-flex mt-2 justify-content-center align-items-center border border-secondary-subtle rounded-3'
            }
        }
    },
    featureLayers: undefined,
    apiKeys: undefined,
    urls: undefined,
    staticText: undefined,
}


