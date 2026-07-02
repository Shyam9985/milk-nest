const scheduler = require('node-schedule');
const authMdl = require('../modules/models/authMdl');
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

    // unlocking the lockedusers
    const unlockJob = scheduler.scheduleJob('0 */60 * * * *', authMdl.unlockUsers);
    logUpcomingJobTime('Unlock users', unlockJob);

    console.log('\n', '=============== end of schedules registry ===============', '\n');

}