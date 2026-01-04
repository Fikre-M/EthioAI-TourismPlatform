import { api } from "@/api/axios.config";
import { TOUR_ENDPOINTS } from "@/api/endpoints";

export interface Tour {
  id: string;
  name: string;
  price: number;
  status: "available" | "booked" | "sold_out";
  description?: string;
  duration?: string;
  imageUrl?: string;
}

export const tourService = {
  async getTours(): Promise<Tour[]> {
    const response = await api.get(TOUR_ENDPOINTS.LIST);
    return response.data;
  },

  async getTourById(id: string): Promise<Tour> {
    const response = await api.get(TOUR_ENDPOINTS.DETAIL(id));
    return response.data;
  },

  async createTour(tourData: Omit<Tour, "id">): Promise<Tour> {
    const response = await api.post(TOUR_ENDPOINTS.LIST, tourData);
    return response.data;
  },

  async updateTour(id: string, tourData: Partial<Tour>): Promise<Tour> {
    const response = await api.put(TOUR_ENDPOINTS.DETAIL(id), tourData);
    return response.data;
  },

  async deleteTour(id: string): Promise<void> {
    await api.delete(TOUR_ENDPOINTS.DETAIL(id));
  },
};
