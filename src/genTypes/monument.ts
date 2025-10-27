

export interface Monument {
  id?: number;
  documentId?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  publishedAt?: Date | string;
  locale?: string | null;
  title: string;
  slug?: string;
  shortTitle?: string;
  address?: string;
  type?: "Socha" | "Sportovište" | "Budova" | "Freska" | "Reliéf";
  description?: string;
  latitude?: string;
  longitude?: string;
  phone?: string;
  website?: string;
  available?: boolean;
  availableDescription?: string;
};
