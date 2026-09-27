const scheduler = require('node-schedule');
const authMdl = require('../models/authMdl');
const milkEligibilityService = require('../services/milkEligibilityService');
const { formatDistanceToNowStrict } = require('date-fns');
const { displayDateTime } = require('./date.utils');
const { log, logBlock } = require('./log.utils');

// schedulers

if (process.env.SCHEDULE_RUN === 'true') {
    log('Schedule utilities module loaded!');
    registerJobs();
}

// schedule time logger 
function logUpcomingJobTime(jobName, job) {
    const nextRun = job.nextInvocation().toDate();

    log(`Scheduler : ${jobName}  || Next Run  : ${displayDateTime(nextRun)} || Remaining : ${formatDistanceToNowStrict(nextRun)}`);
}

//schedulers rigistry
function registerJobs() {
    log('\n', '=============== in schedules registry ===============', '\n');

    // unlocking the lockedusers (guarded so a db failure never crashes the server)
    const unlockJob = scheduler.scheduleJob('0 */60 * * * *', async () => {
        try {
            const response = await authMdl.unlockUsers();
            logBlock('[unlock users job] completed successfully - affected rows:', response?.affectedRows);
        } catch (error) {
            console.error('Unlock users job failed:', error.message);
        }
    });
    logUpcomingJobTime('Unlock users', unlockJob);

    // nightly milk eligibility catch-up. action-triggered recalculation covers sales, dry-offs
    // and treatments, but two rules turn on a DATE rather than on anything a user does: a calf
    // reaching milking age, and a withdrawal period expiring. without this the cached
    // can_produce_milk flag would quietly lag behind reality. runs as ONE set-based statement.
    const eligibilityJob = scheduler.scheduleJob('0 30 1 * * *', async () => {
        try {
            const response = await milkEligibilityService.recalculateHerdEligibilitySrvc();
            logBlock('[milk eligibility job] completed - rows matched / changed:', `${response.affected_rows} / ${response.changed_rows}`);
        } catch (error) {
            console.error('Milk eligibility job failed:', error.message);
        }
    });
    logUpcomingJobTime('Milk eligibility recalculation', eligibilityJob);

    log('\n', '=============== end of schedules registry ===============', '\n');

}