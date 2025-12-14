export interface RemotiveJob {
  id: number
  url: string
  title: string
  company_name: string
  company_logo: string
  category: string
  tags: string[]
  job_type: string
  publication_date: string
  candidate_required_location: string
  salary: string
  description: string
  company_logo_url: string
}

export interface WorkingNomadsJob {
  url: string
  title: string
  description: string
  company_name: string
  category_name: string
  tags: string
  location: string
  pub_date: string
}

export interface FourDayWeekJob {
  title_original: string
  title: string
  description: string
  is_remote: boolean
  location_original: string
  location_country: string
  location_continent: string
  posted: number
  reduced_hours: string
  category: string
  role: string
  filters: {
    label: string
    value: string
  }[]
  company_name: string
  hours: number
  url: string
  slug: string
  company_id: number
  id_str: number
  company: {
    id_str: number
    url: string
    name: string
    category: string
    short_description?: string
    description?: string
    slug: string
    country: string
    employees: number
    logo_url: string
    company_url: string
    reduced_hours: string
    four_day_reference_text: string
    images: string[]
    remote_level: string
  }
}

export interface RemoteOkJob {
  slug: string
  id: string
  epoch: number
  date: Date
  company: string
  company_logo: string
  position: string
  tags: string[]
  logo: string
  description: string
  location: string
  salary_min: number
  salary_max: number
  original?: boolean
  url: string
  apply_url: string
}

export interface HimalayasJob {
  title: string
  excerpt: string
  image: string
  companyName: string
  companyLogo: string
  locationRestrictions: unknown[]
  timezoneRestrictions: number[]
  categories: string[]
  description: string
  pubDate: number
  expiryDate: number
  applicationLink: string
  guid: string
}

type Seniority = 'NOT_STATED'
export type PostitionType = 'CONTRACT' | 'FULL_TIME'
type ScrapedLocation = 'Worldwide' | 'Anywhere'

export interface DevRemoteJob {
  id: string
  createdAt: string
  slug: string
  title: string
  location: Seniority[]
  scrapedLocation: ScrapedLocation | null
  company: string
  companyLogo: string
  seniority: Seniority
  industry: unknown[]
  featured: boolean
  tags: string[]
  stack: string[]
  hours: null | string
  flexibleHours: boolean
  postitionType: PostitionType | null
  description: string
  techStack: string[]
  salary: number | null
  salaryLower: number
  salaryUpper: number
  applicationLink: string
  scrapedJob: boolean
  isLive: boolean | null
  paymentDate: null
  noSalary: boolean | null
}

type Hide = 'no'
type CompanyRegions = 'Africa, Asia, Latin America, Europe, North America, Oceania' | 'North America' | 'Europe, Middle East, Africa, Asia, Latin America'
type IsOld = 'Old'
type RoleCategory = 'Development'

export interface TrulyRemoteFields {
  listingID: number
  role: string
  companyID: string[]
  roleApplyURL: string
  roleCategory: RoleCategory[]
  companyName: string[]
  companyIndustry: string[]
  companyLogoURL: string[]
  createdOn: Date
  Hide: Hide
  companyRegions: CompanyRegions
  useListingRegions: string
  test: number
  test2: number
  test3: number
  testSearch: number
  roleLower: string
  companyIDLower: string
  expirationDate: Date
  listingRegions?: string[]
  isOld?: IsOld
}

export interface TrulyRemoteRecord {
  id: string
  fields: TrulyRemoteFields
}

export interface JobFromAPIs {
  // Job fields
  title: string
  description: string
  slug: string
  link: string
  salary: string
  postedAt: Date

  // Relations
  company: {
    name: string
    description: string
    slug: string
    logo: string
  }

  locations: {
    name: string
    slug: string
  }[]

  duration: {
    name: string
    slug: string
  }

  experienceLevel: {
    name: string
    slug: string
  }

  role: {
    name: string
    slug: string
  }

  tags: {
    name: string
    slug: string
  }[]

  benefits: {
    name: string
    slug: string
  }[]
}
