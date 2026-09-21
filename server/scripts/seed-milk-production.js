/*
 * Seeds one day of milk production for every active milking animal.
 *
 * Usage (from the project root):
 *   node server/scripts/seed-milk-production.js 2026-09-21
 *   node server/scripts/seed-milk-production.js 2026-09-01 2026-09-21   (a date range, inclusive)
 *   node server/scripts/seed-milk-production.js 2026-09-21 --force       (overwrite an already seeded day)
 *
 * A day that already has active entries is skipped unless --force is given, so the script
 * can never silently trample data the register screen recorded by hand.
 *
 * Rows are written with the same INSERT ... ON DUPLICATE KEY UPDATE the app's own
 * milk model uses, attributed to the branch incharge, and created_time is backdated to a
 * plausible evening recording time on the production date.
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

/* ---------------- realism model ---------------- */

// litres per milking session, by breed. buffalo yields sit below cows as a rule and the
// exotic cow breeds (HF, Jersey) sit above the indigenous ones. morning yields run a little
// higher than evening because the overnight interval is longer.
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

// fat and snf by type. buffalo milk carries roughly double the fat and a higher snf than
// cow milk, which is why it fetches a better price
const QUALITY_BY_TYPE = {
    Cow: { fat: [3.4, 4.8], snf: [8.2, 8.8] },
    Buffalo: { fat: [6.0, 8.5], snf: [9.0, 9.8] },
};

// an animal under treatment gives markedly less and occasionally none at all
const UNDER_TREATMENT_FACTOR = { min: 0.35, max: 0.6 };
const UNDER_TREATMENT_DRY_CHANCE = 0.15;

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

/* ---------------- helpers ---------------- */

const rand = (min, max) => min + Math.random() * (max - min);
const round2 = (n) => Math.round(n * 100) / 100;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const isoDate = (d) => d.toISOString().slice(0, 10);
const parseDate = (s) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error(`invalid date '${s}', expected YYYY-MM-DD`);
    const d = new Date(`${s}T00:00:00Z`);
    if (isNaN(d)) throw new Error(`invalid date '${s}'`);
    return d;
};

// the incharge fills the register after the evening milking: 18:40 to 20:15 local time
const recordedAt = (dateStr) => {
    const totalMinutes = 18 * 60 + 40 + Math.floor(Math.random() * 95);
    const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const mm = String(totalMinutes % 60).padStart(2, '0');
    const ss = String(Math.floor(Math.random() * 60)).padStart(2, '0');
    return `${dateStr} ${hh}:${mm}:${ss}`;
};

// generates one animal's row for the day, or null when it gives nothing that day
const generateEntry = (animal) => {
    const base = YIELD_BY_BREED[animal.breed_name] || YIELD_DEFAULT[animal.cattle_type_name] || YIELD_DEFAULT.Cow;
    const treated = /treat|sick|ill/i.test(animal.health_status || '');

    if (treated && Math.random() < UNDER_TREATMENT_DRY_CHANCE) return null;

    // each animal has its own day-level form so morning and evening move together
    let dayFactor = rand(0.9, 1.1);
    if (treated) dayFactor *= rand(UNDER_TREATMENT_FACTOR.min, UNDER_TREATMENT_FACTOR.max);
    else if (Math.random() < OFF_DAY_CHANCE) dayFactor *= rand(0.6, 0.8);

    const session = () => round2(rand(base.min, base.max) * dayFactor);
    let morning = session();
    let evening = round2(session() * rand(0.85, 0.97)); // evening trails the morning

    if (!treated && Math.random() < MISSED_SESSION_CHANCE) {
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
        remarks: treated ? 'Under treatment - reduced yield' : pick(REMARK_POOL),
    };
};

/* ---------------- main ---------------- */

(async () => {
    const args = process.argv.slice(2);
    const force = args.includes('--force');
    const dates = args.filter((a) => !a.startsWith('--'));
    if (!dates.length) {
        console.error('usage: node server/scripts/seed-milk-production.js <YYYY-MM-DD> [<YYYY-MM-DD>] [--force]');
        process.exit(1);
    }

    const from = parseDate(dates[0]);
    const to = parseDate(dates[1] || dates[0]);
    if (to < from) throw new Error('to-date is before from-date');
    if (to > new Date()) throw new Error('refusing to seed production for a future date');

    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.ADMIN_USER,
        password: process.env.ADMIN_PASSWORD,
        ssl: { rejectUnauthorized: false, ca: fs.readFileSync(path.join(__dirname, '../../certs/ca.pem')) },
    });

    // every active animal, with its type and breed for the yield model, and the branch's
    // incharge (falling back to the manager) as the recorder. bulls are excluded here:
    // a male never gets a production row
    const [herd] = await conn.query(`
        select c.cattle_id, c.branch_id, c.cattle_unique_code, c.health_status,
               t.cattle_type_name, br.breed_name, g.gender_nm,
               coalesce(
                 (select p.user_id from position_lst_t p where p.location_ref_id = c.branch_id and p.role_id = 14 and p.is_active = 1 limit 1),
                 (select p.user_id from position_lst_t p where p.location_ref_id = c.branch_id and p.role_id = 13 and p.is_active = 1 limit 1)
               ) as recorder_id
        from cattle_lst_t c
        join branches_lst_t b on b.branch_id = c.branch_id and b.is_active = 1
        join cattle_types_mstr_lst_t t on t.cattle_type_id = c.cattle_type_id
        join cattle_breeds_mstr_lst_t br on br.breed_id = c.breed_id
        left join gender_mstr_lst_t g on g.gender_id = c.gender_id
        where c.is_active = 1 and (g.gender_nm is null or g.gender_nm <> 'Male')
        order by c.branch_id, c.cattle_unique_code`);

    if (!herd.length) {
        console.log('no active milking animals found - nothing to do');
        await conn.end();
        return;
    }

    const summary = [];

    for (let d = new Date(from); d <= to; d.setUTCDate(d.getUTCDate() + 1)) {
        const dateStr = isoDate(d);

        const [[existing]] = await conn.query(
            'select count(*) as n from milk_production_lst_t where production_date = ? and is_active = 1', [dateStr]);
        if (existing.n && !force) {
            summary.push({ date: dateStr, status: `skipped (${existing.n} entries exist; use --force)`, animals: 0, dry: 0, litres: 0 });
            continue;
        }

        let written = 0, dry = 0, litres = 0;

        await conn.beginTransaction();
        try {
            for (const animal of herd) {
                const entry = generateEntry(animal);
                if (!entry) { dry++; continue; }

                await conn.query(
                    `insert into milk_production_lst_t
                        (branch_id, cattle_id, production_date, morning_quantity, evening_quantity,
                         fat_percentage, snf_percentage, remarks, recorded_by, created_time, updated_time)
                     values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                     on duplicate key update
                        branch_id = values(branch_id),
                        morning_quantity = values(morning_quantity),
                        evening_quantity = values(evening_quantity),
                        fat_percentage = values(fat_percentage),
                        snf_percentage = values(snf_percentage),
                        remarks = values(remarks),
                        updated_by = values(recorded_by),
                        is_active = 1, deleted_by = null, deleted_time = null`,
                    [animal.branch_id, animal.cattle_id, dateStr, entry.morning_quantity, entry.evening_quantity,
                     entry.fat_percentage, entry.snf_percentage, entry.remarks, animal.recorder_id,
                     recordedAt(dateStr), recordedAt(dateStr)]
                );
                written++;
                litres += (entry.morning_quantity || 0) + (entry.evening_quantity || 0);
            }
            await conn.commit();
            summary.push({ date: dateStr, status: force && existing.n ? 'overwritten' : 'seeded', animals: written, dry, litres: round2(litres) });
        } catch (error) {
            await conn.rollback();
            summary.push({ date: dateStr, status: `FAILED: ${error.message}`, animals: 0, dry: 0, litres: 0 });
        }
    }

    console.table(summary);
    console.log(`herd: ${herd.length} milking animals across ${new Set(herd.map((a) => a.branch_id)).size} branches`);
    await conn.end();
})().catch((e) => {
    console.error('FAILED:', e.message);
    process.exit(1);
});
