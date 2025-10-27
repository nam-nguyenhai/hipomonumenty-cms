import { Media } from './media';

export interface SharedSeo {
  id?: number;
  metaTitle: string;
  metaDescription: string;
  shareImage?: Media | null;
};
