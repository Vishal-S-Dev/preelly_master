export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapCoordinate {
  latitude: number;
  longitude: number;
}

export interface MapController {
  animateToRegion: (region: MapRegion, duration?: number) => void;
}
