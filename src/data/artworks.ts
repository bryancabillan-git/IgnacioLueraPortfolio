export interface Artwork {
  slug: string;
  title: string;
  image: string;
  alt: string;
  medium: string;
  year: string;
  dimensions?: string;
  collection: string;
  description: string;
  featured: boolean;
}

export const artworks: Artwork[] = [
  {
    slug: 'memory-in-blue',
    title: 'Artwork Placeholder I',
    image: '/art/placeholder-blue.svg',
    alt: 'Decorative blue circular motif marking where Ignacio’s artwork will appear',
    medium: 'Medium to be provided',
    year: 'Year',
    collection: 'Selected Work',
    description: 'This placeholder will be replaced with an approved artwork image and description.',
    featured: true,
  },
  {
    slug: 'roots-and-lines',
    title: 'Artwork Placeholder II',
    image: '/art/placeholder-rust.svg',
    alt: 'Decorative rust and cream linework marking where Ignacio’s artwork will appear',
    medium: 'Medium to be provided',
    year: 'Year',
    collection: 'Selected Work',
    description: 'This placeholder will be replaced with an approved artwork image and description.',
    featured: true,
  },
  {
    slug: 'night-study',
    title: 'Artwork Placeholder III',
    image: '/art/placeholder-night.svg',
    alt: 'Decorative dark geometric motif marking where Ignacio’s artwork will appear',
    medium: 'Medium to be provided',
    year: 'Year',
    collection: 'Selected Work',
    description: 'This placeholder will be replaced with an approved artwork image and description.',
    featured: true,
  },
  {
    slug: 'sun-form',
    title: 'Artwork Placeholder IV',
    image: '/art/placeholder-sun.svg',
    alt: 'Decorative cream and cobalt sun motif marking where Ignacio’s artwork will appear',
    medium: 'Medium to be provided',
    year: 'Year',
    collection: 'Studies',
    description: 'This placeholder will be replaced with an approved artwork image and description.',
    featured: false,
  },
  {
    slug: 'woven-memory',
    title: 'Artwork Placeholder V',
    image: '/art/placeholder-woven.svg',
    alt: 'Decorative woven blue pattern marking where Ignacio’s artwork will appear',
    medium: 'Medium to be provided',
    year: 'Year',
    collection: 'Studies',
    description: 'This placeholder will be replaced with an approved artwork image and description.',
    featured: false,
  },
  {
    slug: 'red-earth',
    title: 'Artwork Placeholder VI',
    image: '/art/placeholder-earth.svg',
    alt: 'Decorative red earth motif marking where Ignacio’s artwork will appear',
    medium: 'Medium to be provided',
    year: 'Year',
    collection: 'Studies',
    description: 'This placeholder will be replaced with an approved artwork image and description.',
    featured: false,
  },
];

export const featuredArtworks = artworks.filter((artwork) => artwork.featured).slice(0, 3);
