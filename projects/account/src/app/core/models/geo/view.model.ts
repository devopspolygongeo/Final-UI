import { Category, Deliverable, GroupColor, GroupType, LayoutAttribute, MapStyle, PlotAttribute, Topography } from "../core";

export interface View {
    mapStyles: MapStyle[],
    categories: Category[],
    deliverables: Deliverable[],
    groupTypes: GroupType[],
    groupColors: GroupColor[],
    topographies: Topography[],
    layoutAttributes: LayoutAttribute[],
    plotAttributes: PlotAttribute[]
}