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
    "0000-0002-5155-9467",
    // "0000-0000-0000-0000", // add more here
  ],

  /* Maximum number of publications to show on the Publications page. */
  publicationsLimit: 20,

  /* External profile links (used by buttons on the Publications page). */
  googleScholarUrl: "",
  orcidUrl: "https://orcid.org/0000-0002-5155-9467"
};
