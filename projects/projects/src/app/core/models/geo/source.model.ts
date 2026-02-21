import { Landmark } from "./landmark.model";
import { Layer } from "./layer.model";

export interface Source {
    id: number;
    surveyId: number;
    dataType: string;
    name: string;
    link: string;
    priority: number;
    visibility: boolean;
    layers?: Layer[];

    // 🆕 2.5D / Topography support (from backend)
    topography?: boolean;
    enable25D?: boolean;
    extrusionLayer?: {
        layerName: string;
        heightAttribute: string;
    } | null;
}
