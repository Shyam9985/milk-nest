/*
 * The model that invents a plausible day of milk for one animal.
 *
 * It lives here rather than in the seed script because two callers now need it - the CLI script
 * and the backfill screen - and two copies of these numbers would quietly drift apart.
 *
 * Nothing here touches the database. It takes an animal's type and breed and returns the figures
 * a register row would carry, so it can be unit tested and reasoned about on its own.
 */

// litres per milking session, by breed. buffalo yields sit below cows as a rule and the exotic
// cow breeds (HF, Jersey) sit above the indigenous ones. morning yields run a little higher than
// evening because the overnight interval is longer.
const YIELD_BY_BREED = {
    'Holstein Friesian': { min: 5.0, max: 7.0 },
    'Jersey': { min: 4.0, max: 6.0 },
    'Sahiwal': { min: 3.5, max: 5.5 },
    'Gir': { min: 3.5, max: 5.5 },
    'Red Sindhi': { min: 3.0, max: 5.0 },
    'Ongole': { min: 2.0, max: 3.5 },
    'Punganur': { min: 1.0, max: 2.0 },
    'Murrah': { min: 3.5, max: 5.5 },
    'Jaffarabadi': { min: 3.5, max: 5.5 },
    'Godavari': { min: 2.5, max: 4.0 },
    'Surti': { min: 2.5, max: 4.0 },
};

const YIELD_DEFAULT = { Cow: { min: 3.0, max: 5.5 }, Buffalo: { min: 2.5, max: 4.5 } };

// fat and snf by type. buffalo milk carries roughly double the fat and a higher snf than cow
// milk, which is why it fetches a better price
const QUALITY_BY_TYPE = {
    Cow: { fat: [3.4, 4.8], snf: [8.2, 8.8] },
    Buffalo: { fat: [6.0, 8.5], snf: [9.0, 9.8] },
};

// one healthy animal in twenty has an off day; one in forty is not milked at a session
const OFF_DAY_CHANCE = 0.05;
const MISSED_SESSION_CHANCE = 0.025;

const REMARK_POOL = [
    null, null, null, null, null, null, null, null, // most days need no remark
    'Fed extra green fodder',
    'Slightly restless during milking',
    'Milked late due to rain',
    'Good yield today',
    'Water intake was low',
];

const rand = (min, max) => min + Math.random() * (max - min);
const round2 = (n) => Math.round(n * 100) / 100;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**********************************************
* name : generateEntry
* description : one animal's figures for one day, or null when she gave nothing that day.
*               the day factor is drawn once and applied to both sessions, so morning and evening
*               move together the way a real animal's do rather than independently.
* input : ({ cattle_type_name, breed_name })
* output : { morning_quantity, evening_quantity, fat_percentage, snf_percentage, remarks } | null
************************************************/
const generateEntry = (animal) => {
    const base = YIELD_BY_BREED[animal.breed_name]
        || YIELD_DEFAULT[animal.cattle_type_name]
        || YIELD_DEFAULT.Cow;

    let dayFactor = rand(0.9, 1.1);
    if (Math.random() < OFF_DAY_CHANCE) dayFactor *= rand(0.6, 0.8);

    const session = () => round2(rand(base.min, base.max) * dayFactor);
    let morning = session();
    let evening = round2(session() * rand(0.85, 0.97));   // evening trails the morning

    if (Math.random() < MISSED_SESSION_CHANCE) {
        if (Math.random() < 0.5) morning = null; else evening = null;
    }
    if (morning == null && evening == null) return null;

    const q = QUALITY_BY_TYPE[animal.cattle_type_name] || QUALITY_BY_TYPE.Cow;
    // an animal giving less than usual tends to test slightly richer, so nudge fat up on low days
    const richness = dayFactor < 0.85 ? 1.05 : 1;

    return {
        morning_quantity: morning,
        evening_quantity: evening,
        fat_percentage: round2(rand(q.fat[0], q.fat[1]) * richness),
        snf_percentage: round2(rand(q.snf[0], q.snf[1])),
        remarks: pick(REMARK_POOL),
    };
};

module.exports = {
    YIELD_BY_BREED, YIELD_DEFAULT, QUALITY_BY_TYPE,
    OFF_DAY_CHANCE, MISSED_SESSION_CHANCE, REMARK_POOL,
    generateEntry, round2,
};
