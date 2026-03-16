
export interface SharedMedia {
  id?: number;
  file?: Media | null;
};

export interface SharedOpenGraph {
  id?: number;
  ogTitle: string;
  ogDescription: string;
  ogImage?: Media | null;
  ogUrl?: string;
  ogType?: string;
};

export interface SharedQuote {
  id?: number;
  title?: string;
  body?: string;
};

export interface SharedRichText {
  id?: number;
  body?: string;
};

export interface SharedSeo {
  id?: number;
  metaTitle: string;
  metaDescription: string;
  metaImage?: Media | null;
  openGraph?: SharedOpenGraph | null;
  keywords?: string;
  metaRobots?: string;
  metaViewport?: string;
  canonicalURL?: string;
  structuredData?: Record<string, any>;
};

export interface SharedSlider {
  id?: number;
  files?: Media[] | null;
};

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
  type?: "Socha" | "Sportoviště" | "Budova" | "Freska" | "Reliéf";
  description?: string;
  latitude?: string;
  longitude?: string;
  phone?: string;
  website?: string;
  available?: boolean;
  availableDescription?: string;
  image?: Media | null;
  carousel?: SharedSlider | null;
  content?: any;
  seo?: SharedSeo | null;
};

export interface RecommendedMonument {
  id?: number;
  documentId?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  publishedAt?: Date | string;
  locale?: string | null;
  monuments?: Monument[] | null;
};

export interface Media {
  id: number;
  name: string;
  alternativeText: string;
  caption: string;
  width: number;
  height: number;
  formats: { thumbnail: MediaFormat; small: MediaFormat; medium: MediaFormat; large: MediaFormat; };
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl: string;
  provider: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaFormat {
  name: string;
  hash: string;
  ext: string;
  mime: string;
  width: number;
  height: number;
  size: number;
  path: string;
  url: string;
}

export interface User {
  id?: number;
  username: string;
  email: string;
  provider?: string;
  confirmed?: boolean;
  blocked?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  role: Role | null | number;
};

export interface Role {
  id?: number;
  documentId?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  name: string;
  description: string;
  type: string;
};

export interface FindOne<T> {
  data: T;
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    }
  };
};

export interface FindMany<T> {
  data: T[];
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    }
  };
};
