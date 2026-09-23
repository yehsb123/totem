export interface TourPlace {
  id: string;
  title: string;
  addr1: string;
  type: "hotel" | "restaurant" | "attraction" | "cafe" | "etc";
  mapY?: number;
  mapX?: number;
  // Add other properties as needed
}
