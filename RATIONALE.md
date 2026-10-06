# TAS Group: Design & Strategy Rationale

**Concept:** *Bridge to the World*
**Live site:** `index.html` · **Wireframes & flow:** `wireframes.html`

---

## 1. The brief, in one sentence

Take a 1978 port agency from Butterworth and make it read as a regional logistics group with global reach, without losing the credibility that comes from nearly fifty years on the same waterfront.

## 2. The idea

TAS's real advantage isn't scale. It's that their people physically board the ships. Big forwarders sell software and space. TAS sells being there. So the site's line is:

> **"We don't just book space on ships. We board them."**

"Bridge to the World" works on two levels. A ship's bridge is where decisions get made, and Butterworth is the bridge between Penang and the world's trade lanes. Every visual choice comes from three places a mariner would recognise:

| Source | Where it shows up |
|---|---|
| **Nautical charts** | Grid backgrounds, coordinates, the dotted world map, lane lines |
| **Shipping containers** | Corrugated textures, stencil codes, the four-company container stack |
| **The ship's bridge** | Monospaced readouts, radar pulse, the voyage HUD, "night watch" dark mode |

## 3. Brand strategy

### Colour

| Token | Hex | Why |
|---|---|---|
| Strait Navy | `#0B1F33` | Deep water. Authority without the generic corporate blue. |
| Signal Orange | `#FF5A1F` | International orange, used on lifeboats, buoys and cranes. It means "act here", so it's reserved for actions and the one accent per heading. |
| Chart Paper | `#F2EEE4` | Warm off-white of old Admiralty charts. It carries the 1978 heritage without sepia nostalgia. |
| Container Teal | `#2BB3A8` | Lanes and data. A cool counterweight to the orange. |
| Hull Steel / Oxide | `#5B6B7A` / `#9E3B26` | Industrial secondaries: steel plate and anti-fouling red. |

Orange text on paper is darkened to `#B93A0A` so small labels still pass contrast. Pure `#FF5A1F` is only used large or on navy.

### Typography

- **Big Shoulders Display** for headlines. It's condensed and heavy, and it was drawn from industrial signage. It reads like the lettering painted on a terminal gate. Set in uppercase, it feels loud and sure of itself.
- **IBM Plex Sans** for body text. It's engineered and neutral, with a slight mechanical character that suits a B2B audience reading on phones in port offices.
- **JetBrains Mono** for data: coordinates, LOCODEs, transit days, prices. Tabular figures line up the way a manifest does, and they signal precision.
- **Saira Stencil One**, used sparingly, only for container markings. It's a costume font, so it stays on the containers.

### Imagery

There's no stock photography. Generic port photos are exactly what every competitor uses. Instead:

- **A dot-matrix world map** built from Natural Earth data, with a finer coastline layer for the Malaysia–Thailand–Singapore road network.
- **Flat line illustrations** of ship, aircraft, truck and the Butterworth quay, built in SVG so they animate, theme and scale cleanly.
- **Real container codes.** `TASU 197801 9` uses a valid ISO 6346 check digit, and 1978 is the founding year. Shipping people notice details like this, and it earns their trust.

When TAS supplies archival photos, they slot into the heritage timeline and the "Who we are" section.

## 4. UX & motion

Every animation has to explain something. If it doesn't, it was cut.

| Interaction | What it does for the user |
|---|---|
| **Hero lanes + moving ships** | Shows global reach at a glance instead of claiming it in a paragraph. |
| **Radar pulse on Penang** | Puts the hub at the centre of every map. Reads as "always on watch". |
| **Voyage HUD** (bottom right) | Scrolling the page sails a ship from Penang to Rotterdam. Position, heading and speed update live, and speed drops to "drifting" when you stop. It's a small reward for scrolling and makes the 24/7 promise tangible. |
| **Mode explorer** | Ship, plane and truck swap with a slide. Five-segment meters compare speed, cost and carbon in one glance. A pulse travels the door-to-door chain to show the job doesn't end at the port. |
| **"A vessel calls at Penang"** | Port agency is invisible work, and most shippers can't describe it. A pinned, scroll-driven scene walks a ship through six stages: pre-arrival, pilotage, cargo ops (cranes work, boxes lift off and reload), husbandry (stores truck arrives), clearance (a "Cleared" stamp lands) and sailing. Scroll back and it reverses. |
| **Container doors** | Each group company is a container. Hover nudges the doors, and a click or tap swings them open to reveal what's inside. It turns an org chart into something people want to touch. |
| **Lane map** | Hover shows a tooltip and lights the lane. Selecting a port draws the lane in orange, sails a marker along it and fills the panel. Land mode zooms the map into the peninsula. "Price this lane" jumps straight to the calculator with the lane pre-filled. |
| **Quote calculator** | Each step gives live feedback: containers stack up, an LCL load fills a 20′ box, air shows actual vs volumetric weight side by side, and road fills pallet slots in a trailer. The result shows a price range, transit time, distance and a CO₂ comparison across modes. |
| **Tactile buttons** | Primary buttons have a hard shadow and press down 3px. It suits an industrial brand better than a soft glow. |
| **Signal flags** | The footer spells T-A-S in International Code of Signals flags. Hover reveals each flag's meaning. It's an easter egg for the mariners in the audience. |

**Respecting the user:**

- `prefers-reduced-motion` turns off all loops and shows end states.
- Light and dark themes are both designed ("chart paper" and "night watch"), and the site follows the system setting by default.
- Tabs and radio groups are real ARIA patterns with arrow-key support.
- Every map port is also a focusable button in a list.
- Layouts are tested from 375 px phones to wide desktop with no sideways scroll.

## 5. Information architecture

One scrolling page, ordered by the questions a buyer asks:

1. Where do you reach? (Hero)
2. Why trust you? (Who we are)
3. What can you move? (Services)
4. What does an agent actually do? (Port agency)
5. Who will I deal with? (The Group)
6. Do you go where I go? (Network)
7. What will it cost? (Estimate)
8. Will you be around? (Heritage)

Three journeys are mapped in `wireframes.html`. Each ends at a conversion point: **Request firm quote** for shippers, **Appoint TAS at Penang** for ship operators, and **Talk to the desk** for partners.

## 6. Client pitch value

- **It turns visitors into leads.** The calculator qualifies buyers by mode, lane and volume before sales ever speaks to them, and the enquiry arrives pre-filled with the estimate.
- **It sells the hard-to-explain service.** The port-call story does in thirty seconds of scrolling what a brochure can't. That matters for ship owners choosing an agent from abroad.
- **It reframes TAS as a group.** Four companies now read as one connected offer instead of four separate letterheads.
- **It makes the size feel right.** Lanes reaching Rotterdam, Jebel Ali, Busan and Sydney put TAS on the same map as much larger forwarders, while the "we board them" story keeps the personal service that larger players can't offer.
- **It's ready for ESG questions.** A CO₂ estimate on every quote answers what procurement teams are increasingly asking.
- **It helps recruitment.** A confident, modern brand helps hire the next generation of operations staff.
- **It's light to run.** Plain HTML, CSS and JS with no framework and no build step. It loads fast on port-office connections and costs nothing to host.

## 7. Before launch: what TAS needs to supply

This is a concept. These parts are placeholders and must be replaced with real data:

- **Rates and transit times** in `data/ports.js` are an illustrative tariff model, not TAS pricing.
- **Lane list**: confirm which ports TAS actually serves, by mode.
- **Heritage milestones**: only "1978, Butterworth" comes from the brief. The decade entries are narrative placeholders.
- **Company descriptions**: confirm the scope of TAS Maritime and TAS Management Holdings.
- **Contact details, office address, real photography and the logo** (the Plimsoll-mark logo is a proposal).
- **Enquiry form**: currently a demo that sends nothing. It needs connecting to a CRM or email service.
