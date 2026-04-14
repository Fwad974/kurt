/**
 * Site-wide configuration.
 * Edit values here to change content across the site without touching HTML.
 */
window.SITE_CONFIG = {
  /* ORCID identifiers for the lab's publications feed.
     Add one entry per author; duplicate papers (same DOI, or same
     title + year if a DOI is missing) are merged automatically so
     co-authored work isn't shown twice.
     Format: xxxx-xxxx-xxxx-xxxx */
  orcidIds: [
    "0000-0002-5155-9467", // Kurt Pfannkuche
    "0000-0002-4284-774X", // Sarkawt Hamad
  ],

  /* Only show publications from this year onwards. */
  publicationsSinceYear: 2018,

  /* Maximum number of publications to show on the Publications page.
     Set to 0 (or omit) to show every entry at or after publicationsSinceYear. */
  publicationsLimit: 0
};
