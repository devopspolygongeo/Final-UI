import { Topography } from "../core"
import { Group } from "./group.model"

export interface Layer {
    id: number,
    sourceId: number,
    topoId: number,
    groupId: number,
    attribute: string,
    name: string,
    displayName: string,
    visibility: boolean,
    priority: number
    topography?: Topography,
    group?: Group,
    color?: string
}
