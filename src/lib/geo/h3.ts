import { latLngToCell } from "h3-js";

export const H3_RES = 9;

export function cellFor(lat: number, lng: number, res = H3_RES) {
  return latLngToCell(lat, lng, res);
}

export function sameCell(lat1: number, lng1: number, lat2: number, lng2: number, res = H3_RES) {
  return cellFor(lat1, lng1, res) === cellFor(lat2, lng2, res);
}

export function bboxForRadiusKm(lat: number, lng: number, km: number) {
  const latDelta = km / 111.32;
  const lngDelta = km / (111.32 * Math.cos((lat * Math.PI) / 180));
  return {
    south: lat - latDelta,
    north: lat + latDelta,
    west: lng - lngDelta,
    east: lng + lngDelta,
  };
}
