# TPID Kota Batu

Design read, revised 15 October 2026: a civic-data workspace for TPID staff and a weekly price report for the public. ENERGY 1 / RHYTHM 1 / MOTION 1. The owner's latest revision asks feature panels to follow one another vertically, without empty columns beneath shorter panels. The supplied Ronas IT CRM reference still informs the light sidebar, neutral controls and cream reporting band: https://dribbble.com/shots/25742359-CRM-Dashboard-App-Design. Existing BPS identity, price data and blue dark mode remain specific to this service.

The earlier reference supplies the scale and spacing of the typography. Its fantasy artwork does not represent this service. No new identity, photographs, testimonials, or statistics are invented.

- Public Sans replaces IBM Plex Sans: the more neutral letterforms and substantial medium weight suit short Indonesian labels, long commodity names and tabular figures. It is self-hosted, with its SIL license in `public/fonts/Public-Sans-OFL.txt`. Primary reference: https://digital.gov/resources/an-introduction-to-typography.
- Off-white paper, white work surfaces and a pale cream reporting band follow the supplied CRM reference. Charcoal actions keep the interface calm; green is reserved for price charts, selection and successful states. Amber and red communicate actual warnings and failures.
- Navy paper and blue-grey surfaces preserve the owner's requested blue dark mode. Chart colours, inputs, overlays, body text and focus outlines use the same theme tokens.
- A light navigation rail reduces the large colour block of the previous version. Task labels, existing groups and a short selected-state marker preserve orientation. The rail becomes an accessible drawer on mobile and remains blue in dark mode.
- The public page starts with the reporting subject and one public-dashboard action, followed by one continuous data strip. The actual IPH, annual trend and commodity contributions establish the service's purpose without marketing copy.
- The dashboard presents current IPH, annual trend, commodity contribution, frequency and the weekly archive in sequence. Each section follows the preceding section's actual height instead of sharing a row with a different-length list.
- Line charts fit their container, show actual weekly points with straight segments, retain the zero reference, and provide point details. Frequency is a horizontal count comparison so long commodity names stay readable. Primary reference: https://service-manual.ons.gov.uk/data-visualisation.
- Page titles describe the task; primary actions sit at the top or at the end of their form. Redundant breadcrumbs, pseudo form codes, role emblems, and repeated stat cards have been removed.
- The IPH form uses one sheet with period, IPH, contribution and fluctuation sections in vertical order, followed by its catalogue and submit actions. Short related inputs may share a row. The catalogue opens on demand so managing reference data does not displace the primary input task.
- The rekap data filters, table and pagination share one surface. Category buttons wrap instead of disappearing into a narrow strip, and wide tables have a mobile scroll hint and keyboard-focusable region.
- Dialog action rows wrap with consistent gaps and touch targets. Profile editing gives its title and save/cancel controls separate rows when their combined width does not fit.
- The meeting form places schedule fields before participant assignment at all widths. Real counts use one compact summary line; the agenda remains a table with all existing actions.
- The siaran workbench places recipients above the draft at all widths. This removes the empty area beneath a short recipient list next to a long draft and matches DOM and keyboard order. Copy and edit actions remain above the message; public links keep the selected period.
- The monitoring page places the reminder form directly above delivery history at all widths. Date and meeting inputs can share a row, while whole features remain stacked. Status filters, retries and the manual per-contact disclosure remain available.
- Trend evaluation panels and profile panels follow the same vertical flow, so the next feature does not wait for a taller neighbouring column. The public landing's report sections also stack; introductory text and short form fields retain their own readable layouts.
- Controls use an 8 px radius, report panels 12 to 14 px, and overlays 16 px. Shadows mark overlays only. Separators and spacing group data without adding decorative icons or illustrations.
- Controls retain 44 px touch targets. Mobile inputs use 16 px text to avoid automatic browser zoom. Focus, Escape, keyboard scrolling and 200% zoom are part of review.
- Page modules load when opened, so the public landing no longer imports all administrative pages and the chart library. Loading has visible feedback and does not change API permissions.

The design's quality is assessed through browser review and task checks. Automatic accessibility checks supplement human review and do not establish complete accessibility certification.
