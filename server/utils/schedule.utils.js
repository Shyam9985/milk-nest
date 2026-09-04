const scheduler = require('node-schedule');
const authMdl = require('../models/authMdl');
const dateFns = require('date-fns');
const { log, logBlock } = require('./log.utils');

// schedulers

if (process.env.SCHEDULE_RUN === 'true') {
    log('Schedule utilities module loaded!');
    registerJobs();
}

// schedule time logger 
function logUpcomingJobTime(jobName, job) {
    const nextRun = job.nextInvocation().toDate();

    log(`Scheduler : ${jobName}  || Next Run  : ${dateFns.format(nextRun, 'dd-MM-yyyy hh:mm:ss a')} || Remaining : ${dateFns.formatDistanceToNowStrict(nextRun)}`);
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

    log('\n', '=============== end of schedules registry ===============', '\n');

}