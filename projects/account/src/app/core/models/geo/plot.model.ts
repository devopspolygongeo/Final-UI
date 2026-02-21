export interface Plot {
    id: number,
    no: string,
    layoutId: number,
    area: string,
    east: string,
    west: string,
    north: string,
    south: string,
    facing: string,
    saleStatus: string,
    ownerName: string,
    ownerAddress: string,
    development: string
}

export interface PlotDetails {
    area: string,
    east: string,
    west: string,
    north: string,
    south: string,
    facing: string,
    layer: string,
    plot_no: string,
    salestatus: string
}
