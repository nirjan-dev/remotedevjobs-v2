export const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
}

export const benefitsParser = (text: string) => {
  const termsToCheck = [
    'flexible',
    'work from home',
    'work from anywhere',
    '4 day work week',
    'visa sponsorship',
    'relocation',
    'unlimited pto',
    'childcare',
    'gym',
    'stock options',
    'equity',
    'pension',
    'health insurance',
    'dental',
    'wellness programs',
    'employee discount',
    'pet friendly',
  ]

  const benefits = termsToCheck
    .filter(term => text.toLowerCase().includes(term))
    .map(benefit => ({
      name: benefit,
      slug: slugify(benefit),
    }))

  return benefits
}
