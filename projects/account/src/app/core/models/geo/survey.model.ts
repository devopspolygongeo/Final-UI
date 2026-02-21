export interface Survey {
    id: number,
    name: string,
    projectId: number,
    latitude: number,
    longitude: number,
    surveyDate: string,
    progress: number,
    zoom: number,
    zoomMin: number,
    zoomMax: number,
    threed: string,
    plotView: boolean
}
