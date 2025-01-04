export interface NodeData {
  key: string;
  label: string;
  tag: string;
  URL: string;
  cluster: string;
  x: number;
  y: number;
}

export interface Type {
  key: string;
  color: string;
  typeLabel: string;
}

export interface Domain {
  key: string;
  color: string;
  domainLabel: string;
}

export interface Tag {
  key: string;
  image: string;
}



export interface CrawlerEntry {
  id: string,
  source: string,
  createdAt: number,
  parent: {
    id?: string,
    source?: string,
  },
  depth: number,
  localDepth: number,
  pdf: string,
  title: string,
  filename?: string;
  type: string
}

export interface FiltersState {
  types: Record<string, boolean>;
  domains: Record<string, boolean>;
  // tags: Record<string, boolean>;
}

export type Dataset = {
  types: Type[],
  domains: Domain[],
  data: CrawlerEntry[]
}