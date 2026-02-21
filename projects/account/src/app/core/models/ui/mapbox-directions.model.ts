export interface MapBoxDirections {
    code: string
    uuid: string
    waypoints: {
        distance: number
        name: string
        location: number[]
    }[]
    routes: {
        distance: number
        duration: number
        geometry: {
            coordinates: number[][]
            type: string
        }
        legs: {
            admins: {
                iso_3166_1: string
                iso_3166_1_alpha3: string
            }[]
            distance: number
            duration: number
            steps: []
            summary: string
            weight: number
        }[]
        weight: number
        weight_name: string
    }[]
}