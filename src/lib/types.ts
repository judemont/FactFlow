export type Topic =
  | 'science'
  | 'history'
  | 'crime'
  | 'space'
  | 'nature'
  | 'arts'
  | 'tech';

export type Mode = 'foryou' | 'onthisday' | 'topics' | 'nearby';

export interface Gem {
  id: string;
  title: string;
  hook: string;
  screens: string[];
  bonus?: string;
  image?: string;
  articleUrl: string;
  topic: Topic;
  rare?: boolean;
}
