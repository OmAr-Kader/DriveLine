export interface GetShortVideosResponse {
  data: {
    videos: ShortVideo[];
  };
}

export interface ShortVideo {
  id: string;
  techId: string;
  title: string;
  description?: string;
  link?: string;
  thumbImageName?: string;
  durationSeconds?: number;
  tags?: number[];
  createdAt?: string;
  updatedAt?: string;
}
