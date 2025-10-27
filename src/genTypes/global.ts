import { Media } from './media';
import { SharedSeo } from './sharedSeo';

export interface Global {
  id?: number;
  documentId?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  publishedAt?: Date | string;
  locale?: string | null;
  siteName: string;
  favicon?: Media | null;
  siteDescription: string;
  defaultSeo?: SharedSeo | null;
};
