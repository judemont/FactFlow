import type { Gem, Topic } from './types';
import { daysSinceEpoch } from './utils';

export const TOPICS: { id: Topic; label: string; emoji: string }[] = [
  { id: 'science', label: 'Science', emoji: '🧪' },
  { id: 'history', label: 'History', emoji: '🏛️' },
  { id: 'crime', label: 'Crime & Mysteries', emoji: '🕵️' },
  { id: 'space', label: 'Space', emoji: '🚀' },
  { id: 'nature', label: 'Nature', emoji: '🌿' },
  { id: 'arts', label: 'Arts', emoji: '🎨' },
  { id: 'tech', label: 'Tech', emoji: '⚙️' },
];

export const topicSeeds: Record<Topic, string[]> = {
  science: [
    'Phineas Gage', 'Demon core', 'Henrietta Lacks', 'Tardigrade', 'Penicillin',
    'Rosalind Franklin', 'CRISPR', 'Placebo', 'Stanford prison experiment',
    'Havana syndrome', 'Project Azorian', 'Tuskegee syphilis study',
    'Herculaneum papyri', 'Clair Patterson', 'John Snow', 'Radithor',
    'Kuru (disease)',
  ],
  history: [
    'Dancing plague of 1518', 'Great Molasses Flood', 'Emu War',
    'Year Without a Summer', 'Halifax Explosion', 'Christmas truce',
    'Vasili Arkhipov', 'Stanislav Petrov', 'Tarrare', 'Great Stink',
    'Sultana (steamboat)', 'Centralia, Pennsylvania',
    'Green children of Woolpit', 'Cadaver Synod', 'Defenestration of Prague',
    'Radium Girls', 'London Beer Flood',
  ],
  crime: [
    'Dyatlov Pass incident', 'Mary Celeste', 'D. B. Cooper', 'Zodiac Killer',
    'Black Dahlia', 'Somerton Man', 'Voynich manuscript', 'Jack the Ripper',
    'Amelia Earhart', 'Princes in the Tower', 'Circleville letters',
    'Max Headroom broadcast signal intrusion',
    'Isabella Stewart Gardner Museum theft', 'Villisca axe murders',
    'Axeman of New Orleans',
  ],
  space: [
    'Tunguska event', 'Chelyabinsk meteor', 'Wow! signal', 'Carrington Event',
    'ʻOumuamua', 'Mars Climate Orbiter', 'Voyager 1', 'Sputnik 1', 'Laika',
    'Apollo 13', 'Betelgeuse', 'Cygnus X-1', 'Pioneer 10', 'Pale Blue Dot',
  ],
  nature: [
    'Tardigrade', 'Turritopsis dohrnii', 'Pando (tree)', 'Hyperion (tree)',
    'Lake Vostok', 'Dodo', 'Passenger pigeon', 'Axolotl', 'Mantis shrimp',
    'Cordyceps', 'Megalodon', 'Colossal squid', 'Greenland shark',
    'Bioluminescence', 'Coral bleaching',
  ],
  arts: [
    'Mona Lisa', 'Leonardo da Vinci', 'The Scream', 'Salvator Mundi',
    'Stradivarius', 'Banksy', 'Love is in the Bin', 'The Night Watch',
    'Fountain (Duchamp)', 'Vincent van Gogh', 'Herculaneum papyri',
    'Lascaux', 'Fabergé egg', 'Amarna art',
  ],
  tech: [
    'Antikythera mechanism', 'Therac-25', 'Stuxnet', 'Morris worm',
    'Knight Capital', 'Ariane 5 Flight 501', 'Colossus computer', 'Deep Blue',
    '2021 Facebook outage', 'Titanic', 'Transatlantic telegraph cable',
    'Mars Climate Orbiter', 'Enigma machine', 'DynaTAC',
  ],
};

export const curatedGems: Gem[] = [
  {
    id: 'curated-dancing-plague',
    title: 'Dancing plague of 1518',
    topic: 'history',
    hook: 'In 1518, hundreds of people danced themselves to death.',
    screens: [
      'It began in Strasbourg in July 1518, when a woman named Frau Troffea stepped into the street and started dancing.',
      'She could not stop. Within a month, around 400 people had joined her, dancing for days without rest.',
      'Authorities were baffled. Some victims danced until they collapsed, and contemporary accounts report deaths from heart attack, stroke, and exhaustion.',
    ],
    bonus: "The city's remedy? They hired musicians and built a stage. It made things worse.",
    articleUrl: 'https://en.wikipedia.org/wiki/Dancing_plague_of_1518',
  },
  {
    id: 'curated-molasses',
    title: 'Great Molasses Flood',
    topic: 'history',
    hook: 'In 1919, a wave of molasses 25 feet tall tore through Boston at 35 mph.',
    screens: [
      "A huge steel tank in Boston's North End had been leaking for years. Local residents even collected the syrup to use at home.",
      'On January 15, 1919, the tank burst. Two million gallons of molasses surged through the streets faster than a person could run.',
      'The wave crushed buildings, bent an elevated train track, and killed 21 people. Rescuers waded through waist-deep sludge for days.',
    ],
    bonus: 'For decades afterward, locals claimed the neighborhood still smelled sweet on hot days.',
    articleUrl: 'https://en.wikipedia.org/wiki/Great_Molasses_Flood',
  },
  {
    id: 'curated-emu-war',
    title: 'Emu War',
    topic: 'history',
    hook: 'Australia declared war on emus. The emus won.',
    screens: [
      "In 1932, flocks of emus began destroying Western Australia's wheat farms. The government sent soldiers armed with machine guns.",
      'The emus scattered into small groups and proved surprisingly hard to hit. After weeks and thousands of rounds, the operation was abandoned.',
      'Major G.P.W. Meredith compared the birds to Zulus, praising their maneuverability. The military withdrew.',
    ],
    bonus: 'A second attempt was authorized later that year. It also failed.',
    articleUrl: 'https://en.wikipedia.org/wiki/Emu_War',
  },
  {
    id: 'curated-mary-celeste',
    title: 'Mary Celeste',
    topic: 'crime',
    hook: 'In 1872, a ship was found sailing perfectly — with everyone on board gone.',
    screens: [
      'The Mary Celeste was spotted adrift in the Atlantic between the Azores and Portugal. Her sails were partly set and her cargo intact.',
      "The captain's log was there. So were six months of food and water. But the captain, his wife, their daughter, and all seven crew members had vanished.",
      'No sign of struggle. No lifeboat. No distress call. The last log entry was nine days before she was found.',
    ],
    bonus: 'Theories range from alcohol vapor explosions to waterspouts — none has ever been proven.',
    articleUrl: 'https://en.wikipedia.org/wiki/Mary_Celeste',
  },
  {
    id: 'curated-voynich',
    title: 'Voynich manuscript',
    topic: 'crime',
    hook: 'This 600-year-old book is written in a language no one on Earth can read.',
    screens: [
      'The Voynich manuscript is filled with drawings of unknown plants, astronomical charts, and figures bathing in green pools.',
      'Carbon dating places its vellum in the early 15th century. The script flows like a real language, but it matches no alphabet ever recorded.',
      'Codebreakers from both World Wars failed. Modern statistical and AI attempts have cracked nothing either.',
    ],
    bonus: 'Statistical analysis suggests the text carries real linguistic structure. It is not random gibberish.',
    articleUrl: 'https://en.wikipedia.org/wiki/Voynich_manuscript',
  },
  {
    id: 'curated-tarrare',
    title: 'Tarrare',
    topic: 'history',
    hook: 'This 18th-century Frenchman could eat a meal for 15 people — and stay starving.',
    screens: [
      'Tarrare was a French showman and soldier with an appetite doctors could not explain. He ate cats, snakes, and once a whole basket of apples in front of a crowd.',
      'Doctors tested him. He swallowed a meal intended for 15 people, then asked for more.',
      'When he fell ill, he was driven out of the hospital after a disappearance he was suspected in. He died a few years later, still unable to be fed enough.',
    ],
    bonus: 'Despite eating constantly, his weight barely changed. No one ever found out why.',
    articleUrl: 'https://en.wikipedia.org/wiki/Tarrare',
  },
  {
    id: 'curated-carrington',
    title: 'Carrington Event',
    topic: 'space',
    hook: 'In 1859, the sky turned blood-red at midnight — and telegraphs sparked on their own.',
    screens: [
      'The largest solar storm ever recorded slammed into Earth. Auroras blazed as far south as the Caribbean, so bright that birds started singing.',
      'Telegraph systems failed worldwide. Operators reported sparks leaping from the lines, and some machines kept sending messages after being unplugged.',
      'If a storm that size hit today, it could knock out power grids for months. A near miss occurred in 2012.',
    ],
    bonus: 'Ice cores show storms of comparable size hit Earth roughly every 500 years.',
    articleUrl: 'https://en.wikipedia.org/wiki/Carrington_Event',
  },
  {
    id: 'curated-gage',
    title: 'Phineas Gage',
    topic: 'science',
    hook: "An iron rod went straight through this man's head. He spoke minutes later.",
    screens: [
      "In 1848, a three-foot iron rod blasted through Phineas Gage's skull in a railroad accident, entering his cheek and exiting the top of his head.",
      "He did not lose consciousness. He walked to a cart, sat upright, and greeted the doctor with: 'Doctor, here is business enough for you.'",
      "He survived — but friends said 'Gage was no longer Gage.' His personality changed so much that his employers would not take him back.",
    ],
    bonus: 'His skull is still on display in a museum in Boston, next to the rod.',
    articleUrl: 'https://en.wikipedia.org/wiki/Phineas_Gage',
  },
  {
    id: 'curated-wow-signal',
    title: 'Wow! signal',
    topic: 'space',
    hook: 'In 1977, a radio telescope picked up a 72-second signal. It never came back.',
    screens: [
      'The signal was strong, narrowband, and coming from the direction of the constellation Sagittarius — exactly what an alien transmission might look like.',
      "Astronomer Jerry Ehman circled the printout and wrote one word: 'Wow!'",
      'Decades of follow-up searches have heard nothing. The signal has never been detected again.',
    ],
    bonus: 'One hypothesis blamed a comet. Most researchers have ruled even that out.',
    articleUrl: 'https://en.wikipedia.org/wiki/Wow!_signal',
  },
  {
    id: 'curated-immortal-jellyfish',
    title: 'Turritopsis dohrnii',
    topic: 'nature',
    hook: 'This jellyfish can reverse its own aging — and it may do it forever.',
    screens: [
      'When the immortal jellyfish is injured or starving, it does something no other animal can: it turns itself back into a juvenile.',
      'Its cells transform, its body rebuilds, and it starts life over — potentially in an endless loop.',
      'In theory, one jellyfish could do this indefinitely. In practice, most get eaten long before old age.',
    ],
    bonus: 'The mechanism is now a hot topic in research on aging and cancer.',
    articleUrl: 'https://en.wikipedia.org/wiki/Turritopsis_dohrnii',
  },
  {
    id: 'curated-centralia',
    title: 'Centralia, Pennsylvania',
    topic: 'history',
    hook: 'This town has been on fire underground since 1962.',
    screens: [
      'A fire ignited in the coal mines beneath Centralia, Pennsylvania. It has burned ever since, through tunnels stretching for miles.',
      'Roads cracked, gas seeped into basements, and the ground reached 90°C in places. Most residents were relocated in the 1980s.',
      'The fire may keep burning for another 250 years. The town ZIP code was revoked in 2002.',
    ],
    bonus: 'A section of highway through town became known as the Graffiti Highway — closed in 2020.',
    articleUrl: 'https://en.wikipedia.org/wiki/Centralia,_Pennsylvania',
  },
  {
    id: 'curated-max-headroom',
    title: 'Max Headroom broadcast signal intrusion',
    topic: 'crime',
    hook: 'In 1987, someone hijacked live TV in Chicago wearing a mask. They were never caught.',
    screens: [
      'During the sports news, the broadcast cut to a person in a Max Headroom mask, rocking and giggling in front of a swaying metal sheet.',
      'Later that night, the hijackers struck again — for 90 seconds on another station, with distorted audio and inside jokes, while engineers scrambled to stop it.',
      'The FCC and FBI investigated for years. No one was ever identified or charged.',
    ],
    bonus: 'The signal hijack required expensive equipment and close timing. That has never been explained either.',
    articleUrl: 'https://en.wikipedia.org/wiki/Max_Headroom_broadcast_signal_intrusion',
  },
  {
    id: 'curated-dyatlov',
    title: 'Dyatlov Pass incident',
    topic: 'crime',
    hook: 'Nine experienced hikers cut their way out of their own tent and ran into the night. Barefoot. In −25°C.',
    screens: [
      "It was February 1959 in the Ural Mountains. The hikers' tent was found still standing, with boots and coats left inside.",
      'Searchers found some bodies hundreds of meters away, poorly dressed. Several had unexplained internal injuries with no external wounds.',
      "Soviet investigators closed the case as 'a compelling natural force.' The full files stayed secret until the 1990s.",
    ],
    bonus: 'In 2021, scientists simulated the scene and found an avalanche slab could explain the injuries.',
    articleUrl: 'https://en.wikipedia.org/wiki/Dyatlov_Pass_incident',
  },
  {
    id: 'curated-antikythera',
    title: 'Antikythera mechanism',
    topic: 'tech',
    hook: 'Greeks built a computer 2,000 years ago. We only understood it this century.',
    screens: [
      'In 1901, divers salvaging a Roman-era shipwreck found a corroded bronze lump. Nobody knew what it was.',
      'X-ray and CT imaging revealed gear trains, dials, and inscriptions: a device that predicted eclipses and tracked the Sun and Moon.',
      'Nothing that complex appears again in the historical record for over 1,500 years. Modern reconstructions have been built — and they work.',
    ],
    bonus: 'It also tracked the four-year cycle of athletic games, like an ancient Olympic calendar.',
    articleUrl: 'https://en.wikipedia.org/wiki/Antikythera_mechanism',
  },
];

export function dailyGem(): Gem {
  const idx = daysSinceEpoch() % curatedGems.length;
  return { ...curatedGems[idx], rare: true };
}

export function fallbackGems(): Gem[] {
  return curatedGems.map((g) => ({ ...g }));
}
