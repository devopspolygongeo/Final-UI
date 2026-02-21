import { Landmark } from "./landmark.model";
import { Layer } from "./layer.model";

export interface Source {
    id: number,
    surveyId: number,
    dataType: string,
    name: string,
    link: string,
    priority: number,   
    visibility: boolean,
    layers?: Layer[]
}
