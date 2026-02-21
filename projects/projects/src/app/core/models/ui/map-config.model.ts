import { Landmark, Source } from "../geo";

export interface MapConfig {
    streetUrl: string,
    satelliteUrl: string,
    latitude: number,
    longitude: number,
    zoom: number,
    minZoom: number,
    maxZoom: number,
    sources: Source[],
    landmarks?: Landmark[]
    enableHighlight: boolean
    extrusionTilesetId?: string;
  extrusionSourceLayer?: string;
  
    
    
}