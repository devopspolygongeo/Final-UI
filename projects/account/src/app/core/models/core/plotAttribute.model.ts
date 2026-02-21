export interface PlotAttribute {
    id: number,
    name: string,
    displayName: string,
    iconStyle: string,
    default: string,
    priority: number,
}

// plotattributeid, plotattributedisplay, plotattribute, plotnovaluedisplay, iconlink, plotpriority

export interface DPlotAttribute {
    plotattributeid: number,
    plotattribute: string,
    plotattributedisplay: string,
    plotnovaluedisplay: string,
    iconlink: string,
    plotpriority: number,
}