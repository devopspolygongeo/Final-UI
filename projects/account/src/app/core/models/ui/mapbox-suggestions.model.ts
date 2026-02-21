export interface MapboxSuggestionResponse {
    suggestions: MapboxSuggestion[]
}
export interface MapboxSuggestion {
    name: string,
    mapbox_id: string,
    feature_type: string,
    address: string,
    full_address: string,
    place_formatted: string,
    context: {
        country: {
            name: string,
            country_code: string,

        },
        postcode: {
            id: string,
            name: string
        },
        place: {
            id: string,
            name: string
        },
        locality: {
            id: string,
            name: string
        },
        neighborhood: {
            id: string,
            name: string
        },
        street: {
            name: string,

        }
    },
    language: string,
    maki: string,
    poi_category: string[],
    poi_category_ids: string[],
    external_ids: {
        foursquare: string
    },
    metadata: object
}