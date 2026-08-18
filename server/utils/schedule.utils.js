const scheduler = require('node-schedule');
const authMdl = require('../models/authMdl');
const dateFns = require('date-fns');

// schedulers

if (process.env.SCHEDULE_RUN === 'true') {
    console.log('Schedule utilities module loaded!');
    registerJobs();
}

// schedule time logger 
function logUpcomingJobTime(jobName, job) {
    const nextRun = job.nextInvocation().toDate();

    console.log(`Scheduler : ${jobName}  || Next Run  : ${dateFns.format(nextRun, 'dd-MM-yyyy hh:mm:ss a')} || Remaining : ${dateFns.formatDistanceToNowStrict(nextRun)}`);
}

//schedulers rigistry
function registerJobs() {
    console.log('\n', '=============== in schedules registry ===============', '\n');

    // unlocking the lockedusers (guarded so a db failure never crashes the server)
    const unlockJob = scheduler.scheduleJob('0 */60 * * * *', async () => {
        try {
            const response = await authMdl.unlockUsers();
            console.log('Unlock users job completed successfully:', response?.affectedRows);
        } catch (error) {
            console.error('Unlock users job failed:', error.message);
        }
    });
    logUpcomingJobTime('Unlock users', unlockJob);

    console.log('\n', '=============== end of schedules registry ===============', '\n');

}