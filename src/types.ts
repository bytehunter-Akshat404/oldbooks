export type UserRole = 'seller' | 'buyer';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

export interface BookImages {
  front: string;
  back: string;
  side: string;
  open: string;
}

export interface BookListing {
  id: string;
  sellerId: string;
  title: string;
  author: string;
  price: number;
  category: string;
  board?: string;
  class?: string;
  images: BookImages;
  status: 'available' | 'sold' | 'pending';
  isDonation: boolean;
  pdfUrl?: string;
  createdAt: string;
}

export interface Offer {
  id: string;
  bookId: string;
  buyerId: string;
  sellerId: string;
  offeredPrice: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}
